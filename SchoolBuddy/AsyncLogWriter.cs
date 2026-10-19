using System.Collections.Concurrent;

namespace SchoolBuddy
{
    /// <summary>
    /// Writes log lines on a single background thread so requests never wait on the disk.
    /// Same writer as GPSTrackerListeners.AIS_16140.
    /// </summary>
    internal static class AsyncLogWriter
    {
        private struct LogItem
        {
            public string FullPath;
            public string Text;
            public bool Append;
        }

        // Lines beyond this are dropped so a slow / full disk cannot exhaust memory
        private const int MaxQueuedItems = 100000;

        private static readonly ConcurrentQueue<LogItem> _queue = new ConcurrentQueue<LogItem>();
        private static readonly AutoResetEvent _signal = new AutoResetEvent(false);
        private static Thread? _worker;
        private static volatile bool _started;
        private static volatile bool _stop;
        private static readonly object _startLock = new object();

        public static void EnsureStarted()
        {
            if (_started) return;
            lock (_startLock)
            {
                if (_started) return;

                _worker = new Thread(WorkerLoop)
                {
                    IsBackground = true,
                    Name = "AsyncLogWriter"
                };
                _worker.Start();
                _started = true;
            }
        }

        public static void Enqueue(string fullPath, string text, bool append)
        {
            if (!_started) EnsureStarted();

            if (_queue.Count >= MaxQueuedItems) return;

            _queue.Enqueue(new LogItem
            {
                FullPath = fullPath,
                Text = text,
                Append = append
            });

            _signal.Set();
        }

        /// <summary>
        /// Flushes the remaining lines; called when the application stops.
        /// </summary>
        public static void Stop()
        {
            _stop = true;
            _signal.Set();
            _worker?.Join(TimeSpan.FromSeconds(5));
        }

        private static void WorkerLoop()
        {
            while (!_stop)
            {
                _signal.WaitOne(200);
                ProcessQueue();
            }

            // Flush remaining items on stop
            ProcessQueue();
        }

        private static void ProcessQueue()
        {
            if (_queue.IsEmpty) return;

            // Group queued items by FullPath to minimize file handle creation
            var batch = new Dictionary<string, List<LogItem>>(StringComparer.OrdinalIgnoreCase);

            while (_queue.TryDequeue(out var item))
            {
                if (!batch.TryGetValue(item.FullPath, out var list))
                {
                    list = new List<LogItem>();
                    batch[item.FullPath] = list;
                }
                list.Add(item);
            }

            // Write all lines grouped by file in a single file-open session
            foreach (var kvp in batch)
            {
                var filePath = kvp.Key;
                var items = kvp.Value;

                try
                {
                    var dir = Path.GetDirectoryName(filePath);
                    if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                        Directory.CreateDirectory(dir);

                    using (var sw = new StreamWriter(filePath, items[0].Append))
                    {
                        for (int i = 0; i < items.Count; i++)
                        {
                            sw.WriteLine(items[i].Text);
                        }
                    }
                }
                catch
                {
                    // Fail gracefully without interrupting worker loop
                }
            }
        }
    }
}
