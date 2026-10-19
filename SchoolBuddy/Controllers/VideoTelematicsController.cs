using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using SchoolBuddy.Models.VideoTelematics;

namespace SchoolBuddy.Controllers
{
    /// <summary>
    /// Video Telematics module: Dashboard, Alert, Playback and Report pages, plus the JSON
    /// endpoints their scripts call. The endpoints forward the same requests the Trackofy
    /// v6 web app sends (see docs/VIDEO_TELEMATICS.md), adding the Trackofy token on the
    /// server so it never reaches the browser.
    /// </summary>
    public class VideoTelematicsController : BaseController
    {
        private const string ViewRoot = "/Views/Home/VideoTelematics/";
        private const string AdasApi = "adas_api.php";
        private const string UserApi = "user.php";

        private static readonly Regex ImeiPattern = new("^[0-9A-Za-z_-]{1,32}$", RegexOptions.Compiled);
        // Trackofy's Create Video Alert offers Critical / Warning / Moderate.
        private static readonly HashSet<string> Priorities = new(StringComparer.Ordinal) { "Critical", "Warning", "Moderate" };
        private static readonly HashSet<string> DeliveryModes = new(StringComparer.Ordinal) { "REALTIME", "INTERVAL" };
        private static readonly HashSet<string> NotifyStates = new(StringComparer.Ordinal) { "SENT", "PENDING", "FAILED", "SKIPPED" };
        private static readonly HashSet<int> LiveWindowCounts = new() { 1, 4, 6, 9 };

        private readonly IVideoTelematics _videoTelematics;
        private readonly ILogger<VideoTelematicsController> _logger;

        public VideoTelematicsController(IVideoTelematics videoTelematics, ILogger<VideoTelematicsController> logger)
        {
            _videoTelematics = videoTelematics;
            _logger = logger;
        }

        // =====================================================
        // PAGES
        // =====================================================

        [HttpGet]
        public IActionResult Index() => RedirectToAction(nameof(Dashboard));

        [HttpGet]
        public Task<IActionResult> Dashboard(CancellationToken cancellationToken) => PageAsync("Dashboard", cancellationToken);

        [HttpGet]
        public Task<IActionResult> Alert(CancellationToken cancellationToken) => PageAsync("Alert", cancellationToken);

        [HttpGet]
        public Task<IActionResult> Playback(CancellationToken cancellationToken) => PageAsync("Playback", cancellationToken);

        [HttpGet]
        public Task<IActionResult> Report(CancellationToken cancellationToken) => PageAsync("Report", cancellationToken);

        private async Task<IActionResult> PageAsync(string page, CancellationToken cancellationToken)
        {
            // Video Telematics is only available when the account has MDVR vehicles.
            VtMdvrStatus mdvr = await _videoTelematics.GetMdvrStatusAsync(HttpContext.Session, forceRefresh: false, cancellationToken);
            if (!mdvr.Enabled)
            {
                ViewData["Title"] = "Video Telematics";
                return View($"{ViewRoot}NotEnabled.cshtml", mdvr);
            }

            // Log in to both Trackofy servers before the page's scripts fire their parallel calls.
            VtConnectionState state = await _videoTelematics.EnsureConnectedAsync(HttpContext.Session, cancellationToken);

            ViewData["Title"] = page == "Dashboard" ? "Video Telematics" : $"Video Telematics - {page}";
            ViewData["VtPage"] = page;
            ViewData["VtCmsBaseUrl"] = _videoTelematics.CmsBaseUrl;
            ViewData["VtConnection"] = state;

            return View($"{ViewRoot}{page}.cshtml");
        }

        // =====================================================
        // MDVR STATUS  (is Video Telematics enabled for this account?)
        // =====================================================

        /// <summary>
        /// GET /VideoTelematics/MdvrStatus[?refresh=true]
        /// { status: 1, isMdvrEnabled: true|false, mdvrVehicleCount: n, checked: true|false, message }
        /// Backed by SchoolBuddy_APIs api/VideoTelematics/IsMdvrEnabled (tbl_services.is_mdvr = 1).
        /// The layout uses it to show or hide the Video Telematics menu.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> MdvrStatus(bool refresh = false, CancellationToken cancellationToken = default)
        {
            VtMdvrStatus mdvr = await _videoTelematics.GetMdvrStatusAsync(HttpContext.Session, refresh, cancellationToken);
            return Json(new
            {
                status = 1,
                isMdvrEnabled = mdvr.Enabled,
                mdvrVehicleCount = mdvr.VehicleCount,
                @checked = mdvr.Checked,
                message = mdvr.Message
            });
        }

        // =====================================================
        // DASHBOARD  (get_adas_kpi_header, getAdasVehicleList, live video URL)
        // =====================================================

        [HttpGet]
        public Task<IActionResult> KpiHeader(CancellationToken cancellationToken) =>
            CoreAsync(AdasApi, new Dictionary<string, object?> { ["method"] = "get_adas_kpi_header" }, cancellationToken);

        [HttpGet]
        public Task<IActionResult> Vehicles(CancellationToken cancellationToken) =>
            CoreAsync(UserApi, new Dictionary<string, object?> { ["method"] = "getAdasVehicleList" }, cancellationToken);

        /// <summary>808GPS web player URL for the live video iframe (same parameters as Trackofy).</summary>
        [HttpGet]
        public async Task<IActionResult> LiveVideoUrl(string imei, int channel = 1, CancellationToken cancellationToken = default)
        {
            if (!IsValidImei(imei))
                return BadRequest(new { status = 0, msg = "Select a valid vehicle." });
            if (!LiveWindowCounts.Contains(channel))
                return BadRequest(new { status = 0, msg = "Channel view must be 1, 4, 6 or 9." });

            try
            {
                string jsession = await _videoTelematics.GetCmsSessionAsync(HttpContext.Session, cancellationToken);
                string query = string.Join("&", new[]
                {
                    "lang=en",
                    "devIdno=" + Uri.EscapeDataString(imei),
                    "jsession=" + Uri.EscapeDataString(jsession),
                    "channel=" + channel.ToString(CultureInfo.InvariantCulture),
                    "_ts=" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString(CultureInfo.InvariantCulture)
                });

                return Json(new { status = 1, url = $"{_videoTelematics.CmsBaseUrl}/808gps/open/player/video.html?{query}" });
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                return UpstreamError(ex, "live video URL");
            }
        }

        // =====================================================
        // ALERT HISTORY  (Dashboard feed + Report)
        // =====================================================

        [HttpPost]
        [ValidateAntiForgeryToken]
        public Task<IActionResult> AlertHistory([FromBody] VtAlertHistoryRequest? request, CancellationToken cancellationToken)
        {
            if (request == null)
                return Task.FromResult<IActionResult>(BadRequest(new { status = 0, msg = "Request body is required." }));
            if (request.Page < 1 || request.Limit < 1 || request.Limit > 500)
                return Task.FromResult<IActionResult>(BadRequest(new { status = 0, msg = "Invalid page or page size." }));
            if (!IsValidDate(request.From) || !IsValidDate(request.To))
                return Task.FromResult<IActionResult>(BadRequest(new { status = 0, msg = "Please select a valid From and To date." }));
            if (string.CompareOrdinal(request.From, request.To) > 0)
                return Task.FromResult<IActionResult>(BadRequest(new { status = 0, msg = "From date must be on or before To date." }));
            if (request.DeviceImei != null && request.DeviceImei.Any(i => !IsValidImei(i)))
                return Task.FromResult<IActionResult>(BadRequest(new { status = 0, msg = "Invalid vehicle selection." }));
            if (!string.IsNullOrEmpty(request.NotifyState) && !NotifyStates.Contains(request.NotifyState))
                return Task.FromResult<IActionResult>(BadRequest(new { status = 0, msg = "Invalid notification state." }));

            var payload = new Dictionary<string, object?>
            {
                ["method"] = "get_adas_alert_history",
                ["page"] = request.Page,
                ["limit"] = request.Limit,
                ["from"] = request.From,
                ["to"] = request.To
            };
            if (!string.IsNullOrWhiteSpace(request.Scope)) payload["scope"] = request.Scope;
            if (!string.IsNullOrWhiteSpace(request.Filter)) payload["filter"] = request.Filter;
            if (request.DeviceImei is { Count: > 0 }) payload["device_imei"] = request.DeviceImei;
            if (!string.IsNullOrWhiteSpace(request.NotifyState)) payload["notify_state"] = request.NotifyState;
            if (request.AlarmCode is { Count: > 0 }) payload["alarm_code"] = request.AlarmCode;

            return CoreAsync(AdasApi, payload, cancellationToken);
        }

        /// <summary>Street address for an alert row (caladdress.php; response is [["address"]]).</summary>
        [HttpGet]
        public async Task<IActionResult> Address(double lat, double lng, string? id, CancellationToken cancellationToken)
        {
            if (lat is < -90 or > 90 || lng is < -180 or > 180)
                return BadRequest(new { status = 0, msg = "Invalid coordinates." });

            try
            {
                VtApiResponse response = await _videoTelematics.GetAddressAsync(lat, lng, id ?? "0", cancellationToken);
                return Passthrough(response);
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                return UpstreamError(ex, "address lookup");
            }
        }

        // =====================================================
        // ALERT CONFIGURATION
        // =====================================================

        [HttpGet]
        public Task<IActionResult> AlertConfig(CancellationToken cancellationToken) =>
            CoreAsync(AdasApi, new Dictionary<string, object?> { ["method"] = "get_adas_alert_config" }, cancellationToken);

        [HttpGet]
        public Task<IActionResult> AlertMaster(CancellationToken cancellationToken) =>
            CoreAsync(AdasApi, new Dictionary<string, object?> { ["method"] = "get_adas_alert_master" }, cancellationToken);

        [HttpPost]
        [ValidateAntiForgeryToken]
        public Task<IActionResult> SaveAlertConfig([FromBody] VtSaveAlertConfigRequest? request, CancellationToken cancellationToken)
        {
            string? error = ValidateSave(request);
            if (error != null)
                return Task.FromResult<IActionResult>(BadRequest(new { status = 0, msg = error }));

            bool interval = request!.DeliveryMode == "INTERVAL";
            var payload = new Dictionary<string, object?>
            {
                ["method"] = "save_adas_alert_config",
                ["alert_master_ids"] = request.AlertMasterIds,
                ["device_imeis"] = request.DeviceImeis!.Select(i => i.Trim()).ToList(),
                ["priority"] = request.Priority,
                ["whatsapp_enabled"] = request.WhatsappEnabled,
                ["email_enabled"] = request.EmailEnabled,
                ["delivery_mode"] = request.DeliveryMode,
                ["interval_minutes"] = interval ? request.IntervalMinutes : null,
                ["cooldown_minutes"] = request.CooldownMinutes,
                ["is_active"] = request.IsActive
            };

            return CoreAsync(AdasApi, payload, cancellationToken);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public Task<IActionResult> UpdateAlertConfig([FromBody] VtUpdateAlertConfigRequest? request, CancellationToken cancellationToken)
        {
            if (request == null || request.Id <= 0)
                return Task.FromResult<IActionResult>(BadRequest(new { status = 0, msg = "Unable to identify this alert configuration." }));
            if (request.CooldownMinutes < 0)
                return Task.FromResult<IActionResult>(BadRequest(new { status = 0, msg = "Please enter a valid cooldown value." }));

            return CoreAsync(AdasApi, new Dictionary<string, object?>
            {
                ["method"] = "update_adas_alert_config",
                ["id"] = request.Id,
                ["cooldown_minutes"] = request.CooldownMinutes
            }, cancellationToken);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public Task<IActionResult> ToggleAlertConfig([FromBody] VtToggleAlertConfigRequest? request, CancellationToken cancellationToken)
        {
            if (request == null || request.Id <= 0)
                return Task.FromResult<IActionResult>(BadRequest(new { status = 0, msg = "Unable to identify this alert configuration." }));

            return CoreAsync(AdasApi, new Dictionary<string, object?>
            {
                ["method"] = "toggle_adas_alert_config",
                ["id"] = request.Id,
                ["is_active"] = request.IsActive
            }, cancellationToken);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public Task<IActionResult> DeleteAlertConfig([FromBody] VtDeleteAlertConfigRequest? request, CancellationToken cancellationToken)
        {
            if (request?.Ids == null || request.Ids.Count == 0 || request.Ids.Any(id => id <= 0))
                return Task.FromResult<IActionResult>(BadRequest(new { status = 0, msg = "Select an alert configuration to delete." }));

            return CoreAsync(AdasApi, new Dictionary<string, object?>
            {
                ["method"] = "delete_adas_alert_config",
                ["ids"] = request.Ids
            }, cancellationToken);
        }

        private static string? ValidateSave(VtSaveAlertConfigRequest? request)
        {
            if (request == null) return "Request body is required.";
            if (request.DeviceImeis == null || request.DeviceImeis.Count == 0) return "Please select at least one vehicle.";
            if (request.AlertMasterIds == null || request.AlertMasterIds.Count == 0) return "Please select at least one alert.";
            if (request.AlertMasterIds.Any(id => id <= 0)) return "Invalid alert selection.";
            if (request.DeviceImeis.Any(i => !IsValidImei(i?.Trim()))) return "Invalid vehicle selection.";
            if (request.Priority == null || !Priorities.Contains(request.Priority)) return "Please select a priority.";
            if (request.DeliveryMode == null || !DeliveryModes.Contains(request.DeliveryMode)) return "Please select a delivery mode.";
            if (request.DeliveryMode == "INTERVAL" && (request.IntervalMinutes is null or < 1))
                return "Please enter a valid interval in minutes.";
            if (request.CooldownMinutes < 0) return "Please enter a valid cooldown value.";
            return null;
        }

        // =====================================================
        // PLAYBACK  (CMSV6 Standard API)
        // =====================================================

        /// <summary>Recorded files on the MDVR (StandardApiAction_getVideoFileInfo), same parameters as Trackofy.</summary>
        [HttpGet]
        public async Task<IActionResult> PlaybackFiles(
            string imei, int channel, string date, string from, string to, CancellationToken cancellationToken)
        {
            if (!IsValidImei(imei))
                return BadRequest(new { result = -1, message = "Select a valid vehicle." });
            if (channel < -1 || channel > 63)
                return BadRequest(new { result = -1, message = "Invalid channel." });
            if (!DateTime.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime day))
                return BadRequest(new { result = -1, message = "Please select a valid date." });
            if (!TryParseSeconds(from, out int begSec) || !TryParseSeconds(to, out int endSec))
                return BadRequest(new { result = -1, message = "Please enter valid From and To times." });

            if (endSec < begSec)
            {
                (begSec, endSec) = (endSec, begSec);
            }
            if (endSec == begSec)
            {
                endSec = Math.Min(begSec + 1, 86399);
            }

            string year = day.Year.ToString(CultureInfo.InvariantCulture);
            string month = day.Month.ToString(CultureInfo.InvariantCulture);
            string dayOfMonth = day.Day.ToString(CultureInfo.InvariantCulture);

            var query = new List<KeyValuePair<string, string>>
            {
                new("DownType", "8"),
                new("DevIDNO", imei),
                new("LOC", "1"),
                new("CHN", channel.ToString(CultureInfo.InvariantCulture)),
                new("YEAR", year),
                new("MON", month),
                new("DAY", dayOfMonth),
                new("RECTYPE", "-1"),
                new("FILEATTR", "2"),
                new("BEG", begSec.ToString(CultureInfo.InvariantCulture)),
                new("END", endSec.ToString(CultureInfo.InvariantCulture)),
                new("ARM1", "0"),
                new("ARM2", "0"),
                new("RES", "0"),
                new("STREAM", "-1"),
                new("STORE", "0"),
                new("YEARE", year),
                new("MONE", month),
                new("DAYE", dayOfMonth)
            };

            return await CmsAsync("getVideoFileInfo", query, cancellationToken);
        }

        /// <summary>MDVR online status (StandardApiAction_getDeviceOlStatus).</summary>
        [HttpGet]
        public Task<IActionResult> DeviceStatus(string imei, CancellationToken cancellationToken)
        {
            if (!IsValidImei(imei))
                return Task.FromResult<IActionResult>(BadRequest(new { result = -1, message = "Select a valid vehicle." }));

            return CmsAsync("getDeviceOlStatus", new[] { new KeyValuePair<string, string>("devIdno", imei) }, cancellationToken);
        }

        // =====================================================
        // HELPERS
        // =====================================================

        private async Task<IActionResult> CoreAsync(string file, IDictionary<string, object?> payload, CancellationToken cancellationToken)
        {
            try
            {
                return Passthrough(await _videoTelematics.CallCoreAsync(HttpContext.Session, file, payload, cancellationToken));
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                return UpstreamError(ex, payload.TryGetValue("method", out object? method) ? method?.ToString() ?? file : file);
            }
        }

        private async Task<IActionResult> CmsAsync(
            string action, IEnumerable<KeyValuePair<string, string>> query, CancellationToken cancellationToken)
        {
            try
            {
                //json parsing
                return Passthrough(await _videoTelematics.CallCmsAsync(HttpContext.Session, action, query, cancellationToken));
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                return UpstreamError(ex, action);
            }
        }

        /// <summary>Returns the Trackofy JSON unchanged, or a JSON error if Trackofy did not send JSON.</summary>
        private IActionResult Passthrough(VtApiResponse response)
        {
            try
            {
                using (JsonDocument.Parse(response.Body)) { }
            }
            catch (JsonException ex)
            {
                General.LogException(ex);
                _logger.LogWarning("Video Telematics: non-JSON response (HTTP {Status}).", response.StatusCode);
                return StatusCode(StatusCodes.Status502BadGateway,
                    new { status = 0, result = -1, msg = "Unexpected response from Trackofy.", message = "Unexpected response from Trackofy." });
            }

            int status = response.StatusCode is >= 200 and < 300 ? StatusCodes.Status200OK : StatusCodes.Status502BadGateway;
            return new ContentResult { Content = response.Body, ContentType = "application/json", StatusCode = status };
        }

        private IActionResult UpstreamError(Exception ex, string operation)
        {
            if (ex is OperationCanceledException && HttpContext.RequestAborted.IsCancellationRequested)
            {
                return new EmptyResult();
            }

            string message = ex switch
            {
                VideoTelematicsAuthException auth => auth.Message,
                TaskCanceledException => "Trackofy did not respond in time. Please try again.",
                HttpRequestException => "Unable to reach Trackofy. Please try again.",
                _ => "Something went wrong. Please try again."
            };

            _logger.LogError(ex, "Video Telematics: {Operation} failed.", operation);
            return StatusCode(StatusCodes.Status502BadGateway, new { status = 0, result = -1, msg = message, message });
        }

        private static bool IsValidImei(string? imei) => !string.IsNullOrWhiteSpace(imei) && ImeiPattern.IsMatch(imei);

        private static bool IsValidDate(string? value) =>
            DateTime.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _);

        /// <summary>"HH:mm" or "HH:mm:ss" to seconds from midnight, clamped to 0..86399 like Trackofy.</summary>
        private static bool TryParseSeconds(string? value, out int seconds)
        {
            seconds = 0;
            if (string.IsNullOrWhiteSpace(value)) return false;

            string[] parts = value.Split(':');
            if (parts.Length is < 2 or > 3) return false;

            int[] numbers = new int[3];
            for (int i = 0; i < parts.Length; i++)
            {
                if (!int.TryParse(parts[i], NumberStyles.None, CultureInfo.InvariantCulture, out numbers[i])) return false;
            }

            int hours = Math.Clamp(numbers[0], 0, 23);
            int minutes = Math.Clamp(numbers[1], 0, 59);
            int secs = Math.Clamp(numbers[2], 0, 59);
            seconds = Math.Min(hours * 3600 + minutes * 60 + secs, 86399);
            return true;
        }
    }
}
