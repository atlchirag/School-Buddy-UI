namespace SchoolBuddy
{
    public class General
    {
        public delegate T RetryOpenDelegate<T>();

        public static T RetryOpen<T>(RetryOpenDelegate<T> action)
        {

            while (true)
            {

                try
                {

                    return action();

                }

                catch (IOException)
                {

                    System.Threading.Thread.Sleep(50);

                }

            }

        }

        public static void WriteToLogFile(string msg, string folderPath, string logFile, bool isAppend = true, bool isDateTime = true)
        {
            try
            {
                // same daily folder as before: <folderPath>\ddMMyyyy\<logFile>
                string dir = Path.Combine(folderPath, DateTime.Now.ToString("ddMMyyyy"));
                string fullPath = Path.Combine(dir, logFile);

                string line = isDateTime
                    ? (DateTime.Now + Environment.NewLine + msg)
                    : msg;

                // async write: the folder is created by AsyncLogWriter
                AsyncLogWriter.Enqueue(fullPath, line, isAppend);
            }
            catch
            {
                // never let logging break the request
            }
        }

        // ================= LOGGING =================
        // Folder structure: <LogRootPath>\ddMMyyyy\<uid (sys_user_id)>\exception_<Controller>.log
        //                   <LogRootPath>\ddMMyyyy\<uid (sys_user_id)>\login.log
        public static string LogRootPath = @"E:\SchoolBuddy\SchoolBuddyUI";
        private const string UnknownFolder = "_unknown";
        private static IHttpContextAccessor? _httpContextAccessor;

        /// <summary>
        /// Called once from Program.cs. Falls back to a Logs folder next to the app if the log drive is not available.
        /// </summary>
        public static void ConfigureLogging(IServiceProvider services, IConfiguration config)
        {
            _httpContextAccessor = services.GetService<IHttpContextAccessor>();
            LogRootPath = config["LogRootPath"] ?? LogRootPath;

            try
            {
                Directory.CreateDirectory(LogRootPath);
            }
            catch
            {
                LogRootPath = Path.Combine(AppContext.BaseDirectory, "Logs");
            }

            AsyncLogWriter.EnsureStarted();
        }

        /// <summary>
        /// Logs an exception into the folder of the logged-in school (Session "uid"), one file per controller.
        /// </summary>
        public static void LogException(Exception ex, string? extra = null)
        {
            try
            {
                HttpContext? ctx = _httpContextAccessor?.HttpContext;
                string controller = CleanFolderName(ctx?.GetRouteValue("controller")?.ToString(), "General");
                string action = ctx?.GetRouteValue("action")?.ToString() ?? "";
                string? uid = GetSessionValue(ctx, "uid");
                string? username = GetSessionValue(ctx, "username");

                string msg = $"{ctx?.Request.Method} {ctx?.Request.Path}  action={action}  username={username}  trace={ctx?.TraceIdentifier}"
                    + Environment.NewLine
                    + (string.IsNullOrEmpty(extra) ? "" : extra + Environment.NewLine)
                    + ex + Environment.NewLine
                    + "--------------------------------------------------";

                WriteToLogFile(msg, LogRootPath, Path.Combine(CleanFolderName(uid, UnknownFolder), $"exception_{controller}.log"));
            }
            catch
            {
                // never let logging break the request
            }
        }

        /// <summary>
        /// Logs a login attempt. Without a uid (failed login) it goes to _unknown\login_failed.log.
        /// </summary>
        public static void LogLogin(string? uid, string msg)
        {
            string folder = CleanFolderName(uid, UnknownFolder);
            string file = folder == UnknownFolder ? "login_failed.log" : "login.log";
            WriteToLogFile(msg, LogRootPath, Path.Combine(folder, file));
        }

        private static string? GetSessionValue(HttpContext? ctx, string key)
        {
            try
            {
                return ctx?.Session.GetString(key);
            }
            catch
            {
                // session not available for this request (e.g. static files)
                return null;
            }
        }

        // Keeps only letters, digits, '-' and '_' so a value can never point outside the log folder
        private static string CleanFolderName(string? value, string fallback)
        {
            if (string.IsNullOrWhiteSpace(value)) return fallback;
            string clean = new string(value.Where(c => char.IsLetterOrDigit(c) || c == '-' || c == '_').ToArray());
            return clean.Length == 0 || clean == "0" || clean == "-1" ? fallback : clean;
        }



    }
}
