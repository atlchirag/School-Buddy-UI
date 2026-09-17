using Newtonsoft.Json;
using SchoolBuddy.Models.ApiTemplate;
using System.Net.Http.Headers;
using System.Text;
using System.Globalization;

namespace SchoolBuddy.Models.Report
{
    public class ReportRepository : MockReportRepository
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ReportRepository> _logger;
        private readonly IHttpClientFactory _httpClientFactory;

        public ReportRepository(
            Iapitemplate apitemplate,
            IConfiguration configuration,
            ILogger<ReportRepository> logger,
            IHttpClientFactory httpClientFactory) : base(apitemplate)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        public override async Task<string> GenerateTrackofyReportAsync(TrackofyReportRequest request, string token)
        {
            var endpointKeys = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["fleet-summary"] = "trackofy_fleet_summary",
                ["distance-chart"] = "trackofy_distance_chart",
                ["cumulative-distance"] = "trackofy_cummulative_distacnce",
                ["vehicle-summary"] = "trackofy_vehicle_summary",
                ["max-speed-chart"] = "trackofy_max_speed_chart",
                ["stoppage-summary"] = "trackofy_api_stoppage_summary",
                ["running-summary"] = "trackofy_api_running_summary",
                ["alerts"] = "trackofy_api_alerts",
                ["alert-summary"] = "trackofy_api_alert_summary_report",
                ["engine-hour-report"] = "trackofy_api_engine_hour_report"
            };
            if (string.IsNullOrWhiteSpace(request.ReportType) || !endpointKeys.TryGetValue(request.ReportType, out var endpointKey))
                throw new ArgumentException("Unsupported Trackofy report type.");

            var url = _configuration[endpointKey];
            if (string.IsNullOrWhiteSpace(url))
                throw new InvalidOperationException("The selected report is not configured.");

            //var form = new Dictionary<string, string>
            //{
            //    ["columns"] = request.Columns ?? string.Empty,
            //    ["page"] = request.Page ?? "1",
            //    ["per_page"] = request.PerPage ?? "10",
            //    ["timezoneDiff"] = request.TimezoneDiff ?? "0",
            //    ["vehicleList"] = request.VehicleList ?? string.Empty
            //};
            //if (request.ReportType != "fleet-summary")
            //{
            //    form["start_date"] = request.StartDate ?? string.Empty;
            //    form["end_date"] = request.EndDate ?? string.Empty;
            //}
            //if (request.ReportType == "distance-chart")
            //{
            //    form["min_distance"] = request.MinDistance ?? string.Empty;
            //    form["max_distance"] = request.MaxDistance ?? string.Empty;
            //}
            var payload = new Dictionary<string, object?>
            {
                ["page"] = request.Page ?? "1",
                ["per_page"] = request.PerPage ?? "10",
                ["vehicleList"] = request.VehicleList ?? string.Empty
            };

            if (request.ReportType.Equals("alert-summary", StringComparison.OrdinalIgnoreCase))
            {
                payload["alert_id"] = request.AlertId ?? string.Empty;
                payload["start_date"] = request.StartDate ?? string.Empty;
                payload["end_date"] = request.EndDate ?? string.Empty;
            }
            else
            {
                payload["columns"] = request.Columns ?? string.Empty;
                payload["timezoneDiff"] = request.TimezoneDiff ?? "0";
                if (!request.ReportType.Equals("fleet-summary", StringComparison.OrdinalIgnoreCase))
                {
                    payload["start_date"] = request.StartDate ?? string.Empty;
                    payload["end_date"] = request.EndDate ?? string.Empty;
                }

                if (request.ReportType.Equals("distance-chart", StringComparison.OrdinalIgnoreCase))
                {
                    payload["min_distance"] = request.MinDistance ?? string.Empty;
                    payload["max_distance"] = request.MaxDistance ?? string.Empty;
                }
            }

            string jsonPayload = JsonConvert.SerializeObject(payload);
            var content = new StringContent(
                    jsonPayload,
                    Encoding.UTF8,
                    "application/json"
                );
            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromMinutes(10);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            using var response = await client.PostAsync(url, content);
            var resp = await response.Content.ReadAsStringAsync();
            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                throw new UnauthorizedAccessException("The Trackofy authentication token was rejected.");
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Trackofy report {ReportType} returned HTTP {StatusCode}.", request.ReportType, (int)response.StatusCode);
                throw new HttpRequestException("Trackofy report request failed.");
            }
            return resp;
        }

        public override async Task<string> GetDriverPerformanceReportAsync(
            DriverPerformanceReportRequest request,
            string token)
        {
            string? url = _configuration["trackofy_driver_performance_report"];
            if (string.IsNullOrWhiteSpace(url))
            {
                throw new InvalidOperationException("The Driver Performance Report API URL is not configured.");
            }

            request.Page = string.IsNullOrWhiteSpace(request.Page) ? "1" : request.Page;
            request.PerPage = string.IsNullOrWhiteSpace(request.PerPage) ? "10" : request.PerPage;
            request.TimezoneDiff = "330";

            return await PostTrackofyFormAsync(url, new Dictionary<string, string>
            {
                ["columns"] = request.Columns ?? string.Empty,
                ["start_date"] = request.StartDate ?? string.Empty,
                ["end_date"] = request.EndDate ?? string.Empty,
                ["timezoneDiff"] = request.TimezoneDiff ?? "330",
                ["page"] = request.Page,
                ["per_page"] = request.PerPage
            }, token, "Driver Performance Report");
        }

        public override async Task<string> GetVehicleSummaryReportAsync(VehicleSummaryReportRequest request, string token)
        {
            var url = _configuration["trackofy_api_vehicle_summary"];
            if (string.IsNullOrWhiteSpace(url))
                throw new InvalidOperationException("The Vehicle Summary Report API URL is not configured.");

            return await PostTrackofyFormAsync(url, new Dictionary<string, string>
            {
                ["columns"] = request.Columns ?? string.Empty,
                ["start_date"] = request.StartDate ?? string.Empty,
                ["end_date"] = request.EndDate ?? string.Empty,
                ["vehicleList"] = request.VehicleList ?? string.Empty,
                ["timezoneDiff"] = "330",
                ["page"] = "1",
                ["per_page"] = "1000"
            }, token, "Vehicle Summary Report");
        }

        public override async Task<string> GetTemperatureReportAsync(TemperatureReportRequest request, string token)
        {
            var url = _configuration["trackofy_api_temperature"];
            if (string.IsNullOrWhiteSpace(url))
                throw new InvalidOperationException("The Temperature Report API URL is not configured.");

            var payload = new TrackofyTemperatureRequest
            {
                Columns = request.Columns,
                StartDate = request.StartDate ?? string.Empty,
                EndDate = request.EndDate ?? string.Empty,
                Page = Math.Max(request.Page, 1).ToString(CultureInfo.InvariantCulture),
                PerPage = Math.Max(request.PerPage, 1).ToString(CultureInfo.InvariantCulture),
                timezoneDiff = "330",
                VehicleList = request.VehicleList?.Trim() ?? string.Empty
            };

            var jsonPayload = JsonConvert.SerializeObject(payload);

            using var client = _httpClientFactory.CreateClient();

            client.Timeout = TimeSpan.FromSeconds(30);

            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            using var content = new StringContent(
                jsonPayload,
                Encoding.UTF8,
                "application/json");

            using var response = await client.PostAsync(url, content);
            var responseContent = await response.Content.ReadAsStringAsync();
            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                throw new UnauthorizedAccessException("The Trackofy authentication token was rejected.");
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Temperature Report API returned HTTP {StatusCode}.", (int)response.StatusCode);
                throw new HttpRequestException("The Temperature Report request failed.");
            }
            return responseContent;
        }

        public override async Task<string> GetIdleSummaryReportAsync(TrackofyIdleSummaryRequest request, string token)
        {
            var url = _configuration["trackofy_api_idle_summary"];
            if (string.IsNullOrWhiteSpace(url))
                throw new InvalidOperationException("The Idle Summary Report API URL is not configured.");

            var payload = new Dictionary<string, string>
            {
                ["start_date"] = request.StartDate ?? string.Empty,
                ["end_date"] = request.EndDate ?? string.Empty,
                ["page"] = request.Page ?? "1",
                ["per_page"] = request.PerPage ?? "10",
                ["timezoneDiff"] = "330",
                ["vehicleList"] = request.VehicleList ?? string.Empty
            };

            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            using var response = await client.PostAsync(url, new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json"));
            var responseContent = await response.Content.ReadAsStringAsync();
            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                throw new UnauthorizedAccessException("The Trackofy authentication token was rejected.");
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Idle Summary Report API returned HTTP {StatusCode}.", (int)response.StatusCode);
                throw new HttpRequestException("The Idle Summary Report request failed.");
            }
            return responseContent;
        }

        private async Task<string> PostTrackofyFormAsync(string url, Dictionary<string, string> values, string token, string reportName)
        {
            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromMinutes(10);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            using var response = await client.PostAsync(url, new FormUrlEncodedContent(values));
            var responseContent = await response.Content.ReadAsStringAsync();
            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                _logger.LogWarning("{ReportName} API rejected the Trackofy token.", reportName);
                throw new UnauthorizedAccessException("The Trackofy authentication token was rejected.");
            }
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("{ReportName} API returned HTTP {StatusCode}.", reportName, (int)response.StatusCode);
                throw new HttpRequestException("The Trackofy report request failed.");
            }
            return responseContent;
        }
    }
}
