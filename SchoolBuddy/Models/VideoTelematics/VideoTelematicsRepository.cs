using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using SchoolBuddy.Models.ApiTemplate;

namespace SchoolBuddy.Models.VideoTelematics
{
    /// <summary>
    /// Talks to the two Trackofy backends used by the Video Telematics module:
    ///   1. Trackofy v6 PHP API  - POST {core}/*.php, JSON body { "method": ... }, Authorization: Bearer token
    ///   2. CMSV6 Standard API   - GET {cms}/StandardApiAction_*.action?...&amp;jsession=...
    /// Both are logged in with the School Buddy username / password kept in session,
    /// exactly as the Trackofy web app logs in (token.php + StandardApiAction_login).
    /// </summary>
    public class VideoTelematicsRepository : IVideoTelematics
    {
        /// <summary>Session flag "1" / "0" read by the layout to show or hide the Video Telematics menu.</summary>
        public const string MdvrEnabledSessionKey = "vt_mdvr_enabled";
        private const string MdvrCountSessionKey = "vt_mdvr_count";
        private const string MdvrCheckedAtSessionKey = "vt_mdvr_checked_at";
        private static readonly TimeSpan MdvrCacheTime = TimeSpan.FromMinutes(10);
        private static readonly TimeSpan MdvrFailureCacheTime = TimeSpan.FromMinutes(2);

        private const string CoreTokenKey = "vt_core_token";
        private const string CmsSessionKey = "vt_cms_jsession";
        private const string DeviceIdKey = "vt_device_id";

        // CMSV6 login results that mean the jsession is gone (4 = user expired, 5 = session does not exist).
        private static readonly HashSet<int> CmsSessionErrors = new() { 4, 5 };

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly Iapitemplate _apitemplate;
        private readonly IConfiguration _config;
        private readonly ILogger<VideoTelematicsRepository> _logger;

        public VideoTelematicsRepository(
            IHttpClientFactory httpClientFactory,
            Iapitemplate apitemplate,
            IConfiguration config,
            ILogger<VideoTelematicsRepository> logger)
        {
            _httpClientFactory = httpClientFactory;
            _apitemplate = apitemplate;
            _config = config;
            _logger = logger;
        }

        /// <summary>CMSV6 / 808GPS video server ("Standard API" and web player).</summary>
        public string CmsBaseUrl => (_config.GetSection("trackofy_vt_cms_url").Value ?? "https://cctv.trackofy.com").TrimEnd('/');

        /// <summary>Trackofy v6 PHP API (token.php, adas_api.php, user.php, caladdress.php).</summary>
        private string CoreBaseUrl => (_config.GetSection("trackofy_vt_core_url").Value ?? "https://v6.trackofy.com/core").TrimEnd('/');

        /// <summary>domain_id sent to token.php, as the School Buddy login does. Leave the key empty to omit it.</summary>
        private int? TokenDomainId => int.TryParse(_config.GetSection("trackofy_vt_domain_id").Value, out int id) ? id : null;

        private int TimeoutSeconds => int.TryParse(_config.GetSection("trackofy_vt_timeout_seconds").Value, out int s) && s > 0 ? s : 30;

        public async Task<VtConnectionState> EnsureConnectedAsync(ISession session, CancellationToken cancellationToken)
        {
            bool coreReady = false, cmsReady = false;
            var messages = new List<string>();

            try
            {
                await GetCoreTokenAsync(session, forceRefresh: false, cancellationToken);
                coreReady = true;
            }
            catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "Video Telematics: Trackofy API login failed.");
                messages.Add("Trackofy API login failed: " + ex.Message);
            }

            try
            {
                await GetCmsSessionAsync(session, cancellationToken);
                cmsReady = true;
            }
            catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "Video Telematics: video server login failed.");
                messages.Add("Video server login failed: " + ex.Message);
            }

            return new VtConnectionState(coreReady, cmsReady, messages.Count == 0 ? null : string.Join(" ", messages));
        }

        // =====================================================
        // Trackofy v6 PHP API
        // =====================================================

        public async Task<VtApiResponse> CallCoreAsync(
            ISession session, string file, IDictionary<string, object?> payload, CancellationToken cancellationToken)
        {
            string token = await GetCoreTokenAsync(session, forceRefresh: false, cancellationToken);
            VtApiResponse response = await PostCoreAsync(file, payload, token, cancellationToken);

            if (IsCoreAuthFailure(response))
            {
                // Token expired or was revoked: log in again once and retry.
                token = await GetCoreTokenAsync(session, forceRefresh: true, cancellationToken);
                response = await PostCoreAsync(file, payload, token, cancellationToken);
            }

            return response;
        }

        public async Task<VtApiResponse> GetAddressAsync(
            double latitude, double longitude, string id, CancellationToken cancellationToken)
        {
            string url = $"{CoreBaseUrl}/caladdress.php" +
                         $"?latitude={Uri.EscapeDataString(latitude.ToString(System.Globalization.CultureInfo.InvariantCulture))}" +
                         $"&longitude={Uri.EscapeDataString(longitude.ToString(System.Globalization.CultureInfo.InvariantCulture))}" +
                         $"&id={Uri.EscapeDataString(id)}";

            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent("{}", Encoding.UTF8, "application/json")
            };

            return await SendAsync(request, cancellationToken);
        }

        private async Task<VtApiResponse> PostCoreAsync(
            string file, IDictionary<string, object?> payload, string token, CancellationToken cancellationToken)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, $"{CoreBaseUrl}/{file}")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            return await SendAsync(request, cancellationToken);
        }

        private async Task<string> GetCoreTokenAsync(ISession session, bool forceRefresh, CancellationToken cancellationToken)
        {
            string? cached = session.GetString(CoreTokenKey);
            if (!forceRefresh && !string.IsNullOrWhiteSpace(cached))
            {
                return cached;
            }

            var (username, password) = GetCredentials(session);

            var payload = new Dictionary<string, object?>
            {
                ["device_id"] = GetDeviceId(session),
                ["username"] = username,
                ["password"] = password
            };
            if (TokenDomainId.HasValue)
            {
                payload["domain_id"] = TokenDomainId.Value;
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{CoreBaseUrl}/token.php")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };

            VtApiResponse response = await SendAsync(request, cancellationToken);
            string? token = TryReadString(response.Body, "token");

            if (string.IsNullOrWhiteSpace(token))
            {
                session.Remove(CoreTokenKey);
                throw new VideoTelematicsAuthException(
                    TryReadString(response.Body, "msg") ??
                    TryReadString(response.Body, "message") ??
                    $"token.php returned HTTP {response.StatusCode} without a token.");
            }

            session.SetString(CoreTokenKey, token);
            return token;
        }

        private static bool IsCoreAuthFailure(VtApiResponse response)
        {
            if (response.StatusCode is (int)HttpStatusCode.Unauthorized or (int)HttpStatusCode.Forbidden)
            {
                return true;
            }

            try
            {
                using JsonDocument doc = JsonDocument.Parse(response.Body);
                JsonElement root = doc.RootElement;
                if (root.ValueKind != JsonValueKind.Object)
                {
                    return false;
                }

                bool failed = root.TryGetProperty("status", out JsonElement status) &&
                              (status.ValueKind == JsonValueKind.False ||
                               (status.ValueKind == JsonValueKind.Number && status.GetDouble() == 0));
                if (!failed)
                {
                    return false;
                }

                string message = (TryReadString(response.Body, "msg") ?? TryReadString(response.Body, "message") ?? string.Empty)
                    .ToLowerInvariant();
                return message.Contains("token") || message.Contains("unauthori") || message.Contains("expired");
            }
            catch (JsonException)
            {
                return false;
            }
        }

        // =====================================================
        // MDVR enabled check
        // =====================================================

        public async Task<VtMdvrStatus> GetMdvrStatusAsync(ISession session, bool forceRefresh, CancellationToken cancellationToken)
        {
            if (!forceRefresh && TryGetCachedMdvrStatus(session, out VtMdvrStatus? cached))
            {
                return cached!;
            }

            try
            {
                string? userId = session.GetString("uid");
                if (string.IsNullOrWhiteSpace(userId))
                {
                    throw new VideoTelematicsAuthException("Session expired. Please log in again.");
                }

                // SchoolBuddy_APIs: POST api/VideoTelematics/IsMdvrEnabled (tbl_services.is_mdvr = 1).
                string body = await _apitemplate.PostApiTemplate(
                    JsonSerializer.Serialize(new { user_id = userId, database = session.GetString("database") }),
                    "VideoTelematics/IsMdvrEnabled");

                using JsonDocument doc = JsonDocument.Parse(body);
                JsonElement root = doc.RootElement;
                if (root.ValueKind != JsonValueKind.Object ||
                    !root.TryGetProperty("isMdvrEnabled", out JsonElement enabledElement))
                {
                    throw new HttpRequestException("IsMdvrEnabled returned an unexpected response.");
                }

                bool enabled = enabledElement.ValueKind == JsonValueKind.True;
                int count = root.TryGetProperty("mdvrVehicleCount", out JsonElement countElement) &&
                            countElement.TryGetInt32(out int parsed) ? parsed : 0;

                var status = new VtMdvrStatus(enabled, count, true,
                    enabled ? null : "No MDVR vehicles are linked to this school.");
                CacheMdvrStatus(session, status);
                return status;
            }
            catch (JsonException ex)
            {
                // PostApiTemplate returns "something went wrong" (not JSON) when the API fails.
                _logger.LogWarning(ex, "Video Telematics: MDVR check returned a non-JSON response.");
                var status = new VtMdvrStatus(false, 0, false, "Unable to check MDVR status. Please try again.");
                CacheMdvrStatus(session, status);
                return status;
            }
            catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "Video Telematics: MDVR check failed.");
                var status = new VtMdvrStatus(false, 0, false,
                    ex is VideoTelematicsAuthException ? ex.Message : "Unable to check MDVR status. Please try again.");
                CacheMdvrStatus(session, status);
                return status;
            }
        }

        private static bool TryGetCachedMdvrStatus(ISession session, out VtMdvrStatus? status)
        {
            status = null;
            string? enabled = session.GetString(MdvrEnabledSessionKey);
            string? checkedAt = session.GetString(MdvrCheckedAtSessionKey);
            if (enabled == null || !long.TryParse(checkedAt, out long ticks))
            {
                return false;
            }

            bool ok = enabled == "1";
            int.TryParse(session.GetString(MdvrCountSessionKey), out int count);
            bool checkedOk = count >= 0;
            TimeSpan age = DateTime.UtcNow - new DateTime(ticks, DateTimeKind.Utc);
            if (age > (checkedOk ? MdvrCacheTime : MdvrFailureCacheTime))
            {
                return false;
            }

            status = new VtMdvrStatus(ok, Math.Max(count, 0), checkedOk,
                ok ? null : checkedOk ? "No MDVR vehicles are linked to this account." : "Unable to check MDVR status. Please try again.");
            return true;
        }

        private static void CacheMdvrStatus(ISession session, VtMdvrStatus status)
        {
            session.SetString(MdvrEnabledSessionKey, status.Enabled ? "1" : "0");
            // -1 marks a failed check, which is cached for a shorter time.
            session.SetString(MdvrCountSessionKey, (status.Checked ? status.VehicleCount : -1).ToString(System.Globalization.CultureInfo.InvariantCulture));
            session.SetString(MdvrCheckedAtSessionKey, DateTime.UtcNow.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }

        // =====================================================
        // CMSV6 Standard API (cctv server)
        // =====================================================

        public async Task<VtApiResponse> CallCmsAsync(
            ISession session, string action, IEnumerable<KeyValuePair<string, string>> query, CancellationToken cancellationToken)
        {
            var parameters = query.ToList();

            string jsession = await GetCmsSessionAsync(session, cancellationToken);
            VtApiResponse response = await GetCmsAsync(action, parameters, jsession, cancellationToken);

            if (CmsSessionErrors.Contains(TryReadInt(response.Body, "result") ?? 0))
            {
                jsession = await LoginCmsAsync(session, cancellationToken);
                response = await GetCmsAsync(action, parameters, jsession, cancellationToken);
            }

            return response;
        }

        public async Task<string> GetCmsSessionAsync(ISession session, CancellationToken cancellationToken)
        {
            string? cached = session.GetString(CmsSessionKey);
            return !string.IsNullOrWhiteSpace(cached) ? cached : await LoginCmsAsync(session, cancellationToken);
        }

        private async Task<VtApiResponse> GetCmsAsync(
            string action, List<KeyValuePair<string, string>> parameters, string jsession, CancellationToken cancellationToken)
        {
            var all = new List<KeyValuePair<string, string>>(parameters)
            {
                new("jsession", jsession)
            };

            string url = $"{CmsBaseUrl}/StandardApiAction_{action}.action?{BuildQuery(all)}";
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            return await SendAsync(request, cancellationToken);
        }

        private async Task<string> LoginCmsAsync(ISession session, CancellationToken cancellationToken)
        {
            var (username, password) = GetCredentials(session);

            string url = $"{CmsBaseUrl}/StandardApiAction_login.action?" + BuildQuery(new[]
            {
                new KeyValuePair<string, string>("account", username),
                new KeyValuePair<string, string>("password", password)
            });

            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(string.Empty)
            };

            VtApiResponse response = await SendAsync(request, cancellationToken);
            int? result = TryReadInt(response.Body, "result");
            string? jsession = TryReadString(response.Body, "jsession");

            if (result != 0 || string.IsNullOrWhiteSpace(jsession))
            {
                session.Remove(CmsSessionKey);
                throw new VideoTelematicsAuthException(
                    TryReadString(response.Body, "message") ??
                    $"StandardApiAction_login returned result {result?.ToString() ?? "?"}.");
            }

            session.SetString(CmsSessionKey, jsession);
            return jsession;
        }

        // =====================================================
        // Helpers
        // =====================================================

        private async Task<VtApiResponse> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            HttpClient client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(TimeoutSeconds);
            using HttpResponseMessage response = await client.SendAsync(request, cancellationToken);
            string body = await response.Content.ReadAsStringAsync(cancellationToken);
            return new VtApiResponse((int)response.StatusCode, body);
        }

        private static (string Username, string Password) GetCredentials(ISession session)
        {
            string? username = session.GetString("username");
            string? password = session.GetString("password");

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                throw new VideoTelematicsAuthException("Session expired. Please log in again.");
            }

            return (username, password);
        }

        private static string GetDeviceId(ISession session)
        {
            // The Trackofy web app keeps a random UUID per browser; School Buddy keeps one per session.
            string? deviceId = session.GetString(DeviceIdKey);
            if (string.IsNullOrWhiteSpace(deviceId))
            {
                deviceId = Guid.NewGuid().ToString();
                session.SetString(DeviceIdKey, deviceId);
            }

            return deviceId;
        }

        private static string BuildQuery(IEnumerable<KeyValuePair<string, string>> parameters) =>
            string.Join("&", parameters.Select(p => $"{Uri.EscapeDataString(p.Key)}={Uri.EscapeDataString(p.Value)}"));

        private static string? TryReadString(string json, string property)
        {
            try
            {
                using JsonDocument doc = JsonDocument.Parse(json);
                if (doc.RootElement.ValueKind == JsonValueKind.Object &&
                    doc.RootElement.TryGetProperty(property, out JsonElement value))
                {
                    return value.ValueKind == JsonValueKind.String ? value.GetString() : value.ToString();
                }
            }
            catch (JsonException)
            {
            }

            return null;
        }

        private static int? TryReadInt(string json, string property)
        {
            string? raw = TryReadString(json, property);
            return int.TryParse(raw, out int number) ? number : null;
        }
    }
}
