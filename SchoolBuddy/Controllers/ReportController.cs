using Microsoft.AspNetCore.Mvc;
using Microsoft.CodeAnalysis.Elfie.Model.Strings;
using Microsoft.DotNet.MSIdentity.Shared;
using Newtonsoft.Json;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using SchoolBuddy.Models.Report;
using SchoolBuddy.Models.Students;
using SchoolBuddy.Models.Tracking;
using System.Drawing;
using System.Globalization;

namespace SchoolBuddy.Controllers
{
    [Route("{controller}/{action}")]
    public class ReportController : BaseController
    {
        private static readonly HashSet<string> AllowedTemperatureColumns = new(StringComparer.OrdinalIgnoreCase)
        {
            "Date", "Min Temperature(°C)", "Min Temp Lat/Long", "Min Temp Status",
            "Avg Temperature(°C)", "Max Temperature(°C)", "Max Temp Lat/Long", "Max Temp Status"
        };
        private readonly IReportRepository _report;
        private readonly ILogger<ReportController> _logger;
        private readonly ITracking _tracking;
        public ReportController(IReportRepository report, ILogger<ReportController> logger, ITracking tracking) 
        {
            _report = report;
            _logger = logger;
            _tracking = tracking;
        }

        [HttpGet]
        public IActionResult Index()
        {
            return View("~/Views/Home/Report/Report.cshtml");
        }

        [HttpGet]
        public IActionResult Legacy()
        {
            return View("~/Views/Home/Report/Report1.cshtml");
        }

        [HttpGet]
        public async Task<IActionResult> GetTrackofyVehicles()
        { 


            string token = HttpContext.Session.GetString("token");
        var username = HttpContext.Session.GetString("username");
            var password = HttpContext.Session.GetString("password");
            var database = HttpContext.Session.GetString("database");
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(database))
                return Unauthorized(new { status = false, message = "Session expired." });

            var vehicles = await _tracking.GetVehiclesAsync(
     username,
     password,
     "atltracking",
     token
 );

            return Json(new
            {
                status = true,
                data = vehicles
                    .Where(v => v.Id > 0)
                    .Select(v => new
                    {
                        id = v.Id,
                        text = !string.IsNullOrWhiteSpace(v.Name)
                            ? v.Name
                            : v.Id.ToString()
                    })
                    .OrderBy(v => v.text)
                    .ToList()
            });
        }  

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> GenerateTrackofyReport([FromBody] TrackofyReportRequest? request)
        {
            if (!TryValidateTrackofyRequest(request, out var validationMessage))
                return BadRequest(new { status = false, message = validationMessage });
            var token = HttpContext.Session.GetString("token");
            if (string.IsNullOrWhiteSpace(token))
                return Unauthorized(new { status = false, message = "Session expired. Please log in again." });
            try
            {
                return Content(await _report.GenerateTrackofyReportAsync(request!, token), "application/json");
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { status = false, message = "Session expired. Please log in again." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unable to generate Trackofy report {ReportType}.", request?.ReportType);
                return StatusCode(StatusCodes.Status500InternalServerError, new { status = false, message = "Unable to generate the selected report. Please try again." });
            }
        }

        private static bool TryValidateTrackofyRequest(TrackofyReportRequest? request, out string message)
        {
            message = "Invalid report request.";
            if (request == null || string.IsNullOrWhiteSpace(request.ReportType) || string.IsNullOrWhiteSpace(request.VehicleList)) return false;
            var definitions = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                ["fleet-summary"] = new[] { "Vehicle No", "Distance", "Max Idle", "Total Engine Hours", "Max Halt", "Max Speed", "Current Speed", "Battery Voltage", "Battery Percent", "Last Contact", "GPS Validity", "Ignition", "Door Status", "Average Load", "Initial Load", "Final Load", "Total Alerts", "Group", "Odometer Reading", "Location Lat/Long", "Utilization %" },
                ["distance-chart"] = new[] { "Units", "Total(km)", "Dates" },
                ["cumulative-distance"] = new[] { "Unit", "Start Date", "End Date", "Total Distance(KM)" },
                ["vehicle-summary"] = new[] { "Vehicle", "Driver", "IMEI", "Start Location", "Total Distance", "Total Running Time", "Total Idle Time", "Total Halt Time", "Max Idle Time", "Max Idle Location", "Idle Duration(HH:MM:SS)", "Max Halt", "Max Halt Location", "Halt Duration(HH:MM:SS)", "No of Idle", "Avg Speed", "Max Speed", "No of Overspeed", "Alerts", "End Location", "Playback" },
                ["max-speed-chart"] = new[] { "Units", "Dates" },
                ["stoppage-summary"] = new[] { "Unit", "Driver", "IMEI", "Total halt", "Max halt", "Max Halt Location", "Halt duration", "Total distance", "Total running", "Total idle", "Initial weight", "Final weight", "Avg speed", "Max speed", "Alerts count", "Playback" },
                ["running-summary"] = new[] { "Unit", "Total running time", "Total halt time", "Max Halt duration", "Max Halt Location", "Total distance", "Total idle time", "Max idle duration" },
                ["alerts"] = new[] { "Unit", "Alert Name", "Count" },
                ["engine-hour-report"] = new[] { "Unit", "Date Time", "Start Location", "End Location", "Total time /engine duration", "Total Distance", "Total idle duration", "Total running duration", "Status" },
                ["alert-summary"] = Array.Empty<string>()
            };
            if (!definitions.TryGetValue(request.ReportType, out var allowedColumns)) return false;
            var selectedColumns = (request.Columns ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (request.ReportType.Equals("alert-summary", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(request.AlertId)) return false;
            }
            else if (selectedColumns.Length == 0 || selectedColumns.Any(c => !allowedColumns.Contains(c, StringComparer.Ordinal))) return false;
            if (request.VehicleList.Split(',', StringSplitOptions.RemoveEmptyEntries).Any(id => !System.Text.RegularExpressions.Regex.IsMatch(id.Trim(), "^[A-Za-z0-9_-]+$"))) return false;
            if (!int.TryParse(request.Page ?? "1", out var page) || page < 1 || !int.TryParse(request.PerPage ?? "10", out var perPage) || perPage < 1 || perPage > 200) return false;
            if (request.ReportType != "fleet-summary" && (!DateTime.TryParseExact(request.StartDate, "yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var start) || !DateTime.TryParseExact(request.EndDate, "yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var end) || end < start)) return false;
            if (request.ReportType == "distance-chart" && (!decimal.TryParse(request.MinDistance, CultureInfo.InvariantCulture, out var min) || !decimal.TryParse(request.MaxDistance, CultureInfo.InvariantCulture, out var max) || max < min)) return false;
            message = string.Empty;
            return true;
        }

        [HttpPost]
        public async Task<IActionResult> DriverPerformanceReport([FromForm] DriverPerformanceReportRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.StartDate) || string.IsNullOrWhiteSpace(request.EndDate))
                return BadRequest(new { status = false, message = "Start date and end date are required." });
            if (!int.TryParse(request.Page, out var page) || page < 1 ||
                !int.TryParse(request.PerPage, out var perPage) || perPage < 1 || perPage > 200)
                return BadRequest(new { status = false, message = "Invalid report page or page size." });
            return await ExecuteDashboardTrackofyReport(() => _report.GetDriverPerformanceReportAsync(request, HttpContext.Session.GetString("token")));
        }

        [HttpPost]
        public async Task<IActionResult> VehicleSummaryReport([FromForm] VehicleSummaryReportRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.VehicleList) || string.IsNullOrWhiteSpace(request.Columns) || string.IsNullOrWhiteSpace(request.StartDate) || string.IsNullOrWhiteSpace(request.EndDate))
                return BadRequest(new { status = false, message = "Vehicles, columns, start date and end date are required." });
            return await ExecuteDashboardTrackofyReport(() => _report.GetVehicleSummaryReportAsync(request, HttpContext.Session.GetString("token")));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> TemperatureReport([FromBody] TemperatureReportRequest? request)
        {
            const string dateFormat = "yyyy-MM-dd HH:mm";
            if (request == null)
                return BadRequest(new { success = false, message = "Invalid temperature report request.", data = Array.Empty<object>(), meta = (object?)null });
            if (string.IsNullOrWhiteSpace(request.VehicleList))
                return BadRequest(new { success = false, message = "Please select a vehicle.", data = Array.Empty<object>(), meta = (object?)null });
            var selectedColumns = (request.Columns ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            if (selectedColumns.Count == 0 || selectedColumns.Any(column => !AllowedTemperatureColumns.Contains(column)))
                return BadRequest(new { success = false, message = "One or more selected columns are invalid.", data = Array.Empty<object>(), meta = (object?)null });
            if (!DateTime.TryParseExact(request.StartDate, dateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var start))
                return BadRequest(new { success = false, message = "Start date and time are required.", data = Array.Empty<object>(), meta = (object?)null });
            if (!DateTime.TryParseExact(request.EndDate, dateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var end))
                return BadRequest(new { success = false, message = "End date and time are required.", data = Array.Empty<object>(), meta = (object?)null });
            if (start > end)
                return BadRequest(new { success = false, message = "Start date and time cannot be later than the end date and time.", data = Array.Empty<object>(), meta = (object?)null });
            if (request.Page < 1 || request.PerPage < 1 || request.PerPage > 200)
                return BadRequest(new { success = false, message = "Invalid page size.", data = Array.Empty<object>(), meta = (object?)null });

            var token = HttpContext.Session.GetString("token");
            if (string.IsNullOrWhiteSpace(token))
                return Unauthorized(new { success = false, message = "Session expired. Please log in again.", data = Array.Empty<object>(), meta = (object?)null });

            try
            {
                request.Columns = string.Join(", ", selectedColumns);
                var raw = await _report.GetTemperatureReportAsync(request, token);
                var apiResponse = JsonConvert.DeserializeObject<TrackofyTemperatureResponse>(raw ?? string.Empty);
                if (apiResponse == null)
                {
                    _logger.LogWarning("Temperature Report API returned an unsuccessful response.");
                    return Json(new { success = false, message = "Unable to load the temperature report.", data = Array.Empty<object>(), meta = (object?)null });
                }

                if (!apiResponse.Status)
                {
                    var message = string.IsNullOrWhiteSpace(apiResponse.Message)
                        ? "Unable to load the temperature report."
                        : apiResponse.Message;
                    if (message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                    {
                        return Json(new { success = true, message = "Data not found", data = Array.Empty<object>(), meta = new { page = request.Page, per_page = request.PerPage, total = 0, last_page = 1, count = 0 } });
                    }

                    return Json(new { success = false, message, data = Array.Empty<object>(), meta = (object?)null });
                }

                var rows = apiResponse.Data?.Response ?? new List<TrackofyTemperatureRow>();
                var meta = apiResponse.Data?.Meta ?? new TrackofyTemperatureMeta
                {
                    Page = request.Page,
                    PerPage = request.PerPage,
                    Total = 0,
                    LastPage = 1,
                    Count = 0
                };
                var data = rows.Select(row => new Dictionary<string, object?>
                {
                    ["Date"] = row.Date,
                    ["Min Temperature(°C)"] = row.MinTemperature,
                    ["Min Temp Lat/Long"] = row.MinTemperatureLatLong,
                    ["Min Temp Status"] = row.MinTemperatureStatus,
                    ["Avg Temperature(°C)"] = row.AverageTemperature,
                    ["Max Temperature(°C)"] = row.MaxTemperature,
                    ["Max Temp Lat/Long"] = row.MaxTemperatureLatLong,
                    ["Max Temp Status"] = row.MaxTemperatureStatus
                }).ToList();
                var metaPayload = new
                {
                    page = meta.Page,
                    per_page = meta.PerPage,
                    total = meta.Total,
                    last_page = meta.LastPage,
                    count = meta.Count
                };
                return Json(new { success = true, message = "Temperature report loaded successfully.", data, meta = metaPayload });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { success = false, message = "Session expired. Please log in again.", data = Array.Empty<object>(), meta = (object?)null });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unable to load Temperature Report.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, message = "Unable to load the temperature report.", data = Array.Empty<object>(), meta = (object?)null });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> IdleSummaryReport([FromBody] TrackofyIdleSummaryRequest? request)
        {
            const string dateFormat = "yyyy-MM-dd HH:mm";
            if (request == null || string.IsNullOrWhiteSpace(request.VehicleList) ||
                !System.Text.RegularExpressions.Regex.IsMatch(request.VehicleList.Trim(), "^[0-9]+(,[0-9]+)*$"))
                return BadRequest(new { success = false, message = "Please select at least one vehicle.", data = Array.Empty<object>(), meta = (object?)null });
            if (!DateTime.TryParseExact(request.StartDate, dateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var start))
                return BadRequest(new { success = false, message = "Start date and time are required.", data = Array.Empty<object>(), meta = (object?)null });
            if (!DateTime.TryParseExact(request.EndDate, dateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var end))
                return BadRequest(new { success = false, message = "End date and time are required.", data = Array.Empty<object>(), meta = (object?)null });
            if (start > end)
                return BadRequest(new { success = false, message = "Start date and time cannot be later than the end date and time.", data = Array.Empty<object>(), meta = (object?)null });
            if (!int.TryParse(request.Page, NumberStyles.Integer, CultureInfo.InvariantCulture, out var page) || page < 1 ||
                !int.TryParse(request.PerPage, NumberStyles.Integer, CultureInfo.InvariantCulture, out var perPage) || perPage < 1 || perPage > 200)
                return BadRequest(new { success = false, message = "Invalid page size.", data = Array.Empty<object>(), meta = (object?)null });

            var token = HttpContext.Session.GetString("token");
            if (string.IsNullOrWhiteSpace(token))
                return Unauthorized(new { success = false, message = "Session expired. Please log in again.", data = Array.Empty<object>(), meta = (object?)null });

            try
            {
                request.TimezoneDifference = "330";
                request.Page = page.ToString(CultureInfo.InvariantCulture);
                request.PerPage = perPage.ToString(CultureInfo.InvariantCulture);
                var raw = await _report.GetIdleSummaryReportAsync(request, token);
                var apiResponse = JsonConvert.DeserializeObject<TrackofyIdleSummaryResponse>(raw ?? string.Empty);
                if (apiResponse == null || !apiResponse.Status)
                {
                    _logger.LogWarning("Idle Summary Report API returned an unsuccessful response.");
                    return Json(new { success = false, message = "Unable to load the idle summary report.", data = Array.Empty<object>(), meta = (object?)null });
                }

                var rows = (apiResponse.Data?.Response ?? new List<TrackofyIdleSummaryRow>()).Select(row =>
                {
                    var isError = !string.IsNullOrWhiteSpace(row.Error);
                    if (isError)
                    {
                        return (object)new Dictionary<string, object?>
                        {
                            ["sys_service_id"] = row.ErrorServiceId,
                            ["vehiclename"] = row.ErrorVehicleName,
                            ["error"] = SanitizeIdleSummaryError(row.Error)
                        };
                    }
                    return new Dictionary<string, object?>
                    {
                        ["service_id"] = row.ServiceId,
                        ["Unit"] = row.Unit,
                        ["Total Idle Time"] = row.TotalIdleTime,
                        ["Total Halt Time"] = row.TotalHaltTime,
                        ["Max Idle"] = row.MaximumIdleTime,
                        ["idle_latitude"] = row.IdleLatitude,
                        ["idle_longitude"] = row.IdleLongitude,
                        ["Start Time"] = row.StartTime,
                        ["End Time"] = row.EndTime,
                        ["Total Distance"] = row.TotalDistance,
                        ["Total Running Time"] = row.TotalRunningTime,
                        ["Max Idle Location"] = row.MaximumIdleLocation
                    };
                }).ToList();
                var meta = apiResponse.Data?.Meta ?? new TrackofyPaginationMeta { Page = page, PerPage = perPage, LastPage = 1 };
                return Json(new
                {
                    success = true,
                    message = "Idle summary loaded successfully.",
                    data = rows,
                    meta = new { page = meta.Page, per_page = meta.PerPage, total = meta.Total, last_page = meta.LastPage, count = meta.Count }
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { success = false, message = "Session expired. Please log in again.", data = Array.Empty<object>(), meta = (object?)null });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unable to load Idle Summary Report.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, message = "Unable to load the idle summary report.", data = Array.Empty<object>(), meta = (object?)null });
            }
        }

        private static string SanitizeIdleSummaryError(string? error)
        {
            var text = error ?? string.Empty;
            if (text.Contains("timeout", StringComparison.OrdinalIgnoreCase)) return "Request timeout";
            if (text.Contains("unauthorized", StringComparison.OrdinalIgnoreCase)) return "Unauthorized request";
            if (text.Contains("not found", StringComparison.OrdinalIgnoreCase)) return "Data not found";
            return "Unable to fetch vehicle data";
        }

        private async Task<IActionResult> ExecuteDashboardTrackofyReport(Func<Task<string>> request)
        {
            var token = HttpContext.Session.GetString("token");
            if (string.IsNullOrWhiteSpace(token))
                return Unauthorized(new { status = false, message = "Session expired. Please log in again." });
            try
            {
                return Content(await request(), "application/json");
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { status = false, message = "Session expired. Please log in again." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dashboard Trackofy report request failed.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { status = false, message = "Unable to generate the selected report." });
            }
        }
      

        [HttpPost]
        public async Task<IActionResult> Index(string fdate)
        {
            string? school_id = HttpContext.Session.GetString("uid");
            string database = HttpContext.Session.GetString("database");
            var model = await _report.GetNotification(school_id, fdate, database);
            return Json(model);
        }

        //[HttpPost]

        //    if (request == null ||
        //        string.IsNullOrWhiteSpace(request.VehicleList) ||
        //        string.IsNullOrWhiteSpace(request.Columns) ||
        //        !DateTime.TryParseExact(request.StartDate, reportDateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out _) ||
        //        !DateTime.TryParseExact(request.EndDate, reportDateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
        //    {
        //        return BadRequest(new { status = false, message = "Start date, end date, vehicle and column selections are required." });
        //    }

        //    string token = HttpContext.Session.GetString("token");
        //    if (string.IsNullOrWhiteSpace(token))
        //    {
        //        return Unauthorized(new { status = false, message = "Session expired." });
        //    }

        //    try
        //    {
        //        var response = await _report.GetVehicleSummaryReportAsync(request, token);
        //        return Content(response, "application/json");
        //    }
        //    catch (UnauthorizedAccessException ex)
        //    {
        //        _logger.LogWarning(ex, "Vehicle Summary Report token is unavailable.");
        //        return Unauthorized(new { status = false, message = "Session expired." });
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Unable to generate Vehicle Summary Report.");
        //        return StatusCode(StatusCodes.Status500InternalServerError,
        //            new { status = false, message = "Unable to generate Vehicle Summary Report." });
        //    }
        //}

        [HttpGet]
        public async Task<IActionResult> Boarding(string from, string to)
        {
            string? school_id = HttpContext.Session.GetString("uid");
            string? database = HttpContext.Session.GetString("database");

            if (string.IsNullOrWhiteSpace(school_id) ||
                string.IsNullOrWhiteSpace(database))
            {
                return Unauthorized("Session expired.");
            }
            if (string.IsNullOrWhiteSpace(from) ||
           string.IsNullOrWhiteSpace(to))
            {
                return BadRequest(new
                {
                    status = false,
                    data = Array.Empty<object>()
                });
            }
            var model = await _report.Boarding(school_id, database, from, to);

   

            if (model == null)
            {
                return Json(new
                {
                    status = false,

                    data = Array.Empty<object>()
                });
            }

            return Json(new
            {
                status = true,

                data = model
            });
        }
            [HttpGet]
        public async Task<IActionResult> Attandence( string from, string to)
        {
            string? school_id = HttpContext.Session.GetString("uid");
            string? database = HttpContext.Session.GetString("database");

            if (string.IsNullOrWhiteSpace(school_id) ||
                string.IsNullOrWhiteSpace(database))
            {
                return Unauthorized("Session expired.");
            }
            if (string.IsNullOrWhiteSpace(from) ||
           string.IsNullOrWhiteSpace(to))
            {
                return BadRequest(new
                {
                    status = false,
                    data = Array.Empty<object>()
                });
            }
            var model = await _report.Attandence(school_id, database,from,to);


            var attendanceData =
    JsonConvert.DeserializeObject<object>(
        model.ToString()
    );

            if (model == null)
            {
                return Json(new
                {
                    status = false,
              
                    data = Array.Empty<object>()
                });
            }

            return Json(new
            {
                status = true,
           
                data = model
            });
            //List<AttendanceExcelModel> attendanceList;

            //try
            //{
            //    attendanceList = JsonConvert.DeserializeObject<List<AttendanceExcelModel>>(model)
            //                     ?? new List<AttendanceExcelModel>();
            //}
            //catch
            //{
            //    attendanceList = new List<AttendanceExcelModel>();
            //}
            //if (model == null)
            //{
            //    return NotFound("No attendance data found.");
            //}

            //ExcelPackage.LicenseContext =
            //    OfficeOpenXml.LicenseContext.NonCommercial;

            //using (var package = new ExcelPackage())
            //{
            //    var sheet =
            //        package.Workbook.Worksheets.Add("Attendance Report");

            //    // Headers
            //    sheet.Cells[1, 1].Value = "S.No";
            //    sheet.Cells[1, 2].Value = "Student Name";
            //    sheet.Cells[1, 3].Value = "Admission No";
            //    sheet.Cells[1, 4].Value = "Class";
            //    sheet.Cells[1, 5].Value = "Section";
            //    sheet.Cells[1, 6].Value = "Father Name";
            //    sheet.Cells[1, 7].Value = "Mobile Number";
            //    sheet.Cells[1, 8].Value = "RFID";
            //    sheet.Cells[1, 9].Value = "Attendance Time";

            //    int row = 2;
            //    int serialNumber = 1;

            //    foreach (var item in attendanceList)
            //    {
            //        sheet.Cells[row, 1].Value = serialNumber++;

            //        // Replace these properties with your actual model properties
            //        sheet.Cells[row, 2].Value = item.student_name ?? "N/A";
            //        sheet.Cells[row, 3].Value = item.admission_no ?? "N/A";
            //        sheet.Cells[row, 4].Value = item.class_name ?? "N/A";
            //        sheet.Cells[row, 5].Value = item.section ?? "N/A";
            //        sheet.Cells[row, 6].Value = item.father_name ?? "N/A";
            //        sheet.Cells[row, 7].Value = item.mobile_no1 ?? "N/A";
            //        sheet.Cells[row, 8].Value = item.rfid ?? "N/A";
            //        sheet.Cells[row, 9].Value = item.AttendanceTime ?? "N/A";

            //        row++;
            //    }

            //    // Header styling
            //    using (var header = sheet.Cells[1, 1, 1, 9])
            //    {
            //        header.Style.Font.Bold = true;
            //        header.Style.Font.Color.SetColor(Color.White);
            //        header.Style.Fill.PatternType =
            //            ExcelFillStyle.Solid;
            //        header.Style.Fill.BackgroundColor.SetColor(
            //            Color.MidnightBlue
            //        );

            //        header.Style.HorizontalAlignment =
            //            ExcelHorizontalAlignment.Center;

            //        header.Style.VerticalAlignment =
            //            ExcelVerticalAlignment.Center;
            //    }

            //    // Borders
            //    if (row > 2)
            //    {
            //        using (var dataRange =
            //               sheet.Cells[1, 1, row - 1, 8])
            //        {
            //            dataRange.Style.Border.Top.Style =
            //                ExcelBorderStyle.Thin;
            //            dataRange.Style.Border.Bottom.Style =
            //                ExcelBorderStyle.Thin;
            //            dataRange.Style.Border.Left.Style =
            //                ExcelBorderStyle.Thin;
            //            dataRange.Style.Border.Right.Style =
            //                ExcelBorderStyle.Thin;
            //        }
            //    }

            //    // Freeze header
            //    sheet.View.FreezePanes(2, 1);

            //    // Auto-fit columns
            //    if (sheet.Dimension != null)
            //    {
            //        sheet.Cells[sheet.Dimension.Address]
            //            .AutoFitColumns();
            //    }

            //    // Optional minimum column widths
            //    sheet.Column(1).Width = 8;
            //    sheet.Column(2).Width = Math.Max(
            //        sheet.Column(2).Width, 20
            //    );
            //    sheet.Column(5).Width = Math.Max(
            //        sheet.Column(5).Width, 20
            //    );

            //    var stream = new MemoryStream();

            //    await package.SaveAsAsync(stream);

            //    stream.Position = 0;

            //    string fileName =
            //        $"Attendance_Report_{DateTime.Now:dd_MM_yyyy_HH_mm}.xlsx";

            //    return File(
            //        stream,
            //        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            //        fileName
            //    );
            //}
        }

        public async Task<String> GetAllStudents()
        {
            string? uid = HttpContext.Session.GetString("uid");
            var model = await _report.GetAllStudents(uid);
            return model;
        }

        public async Task<String> GetAllRoutes(string uid)
        {
            var model = await _report.GetAllRoutes(uid);
            return model;
        }
        public async Task<String> GetNoGps()
        {
            string? uid = HttpContext.Session.GetString("uid");
            var model = await _report.GetNoGps(uid);

            //List<dynamic> nogps = JsonConvert.DeserializeObject<dynamic>(model);
            //ViewBag.nogps = nogps;
            return model;
        }

        public async Task<String> GetLoginReport(string fdate)
        {
            //var model = await _report.GetLoginReport("uid",fdate);

            ////List<dynamic> nogps = JsonConvert.DeserializeObject<dynamic>(model);
            ////ViewBag.nogps = nogps;
            //return model;

            string? school_id = HttpContext.Session.GetString("uid");
          //  string database = HttpContext.Session.GetString("database");
            var model = await _report.GetLoginReport(school_id, fdate);
            return model;
        }


        public async Task<String> GetRFIDReport(string fdate)
        {
            string? school_id = HttpContext.Session.GetString("uid");
            string database = HttpContext.Session.GetString("database");
            var model = await _report.GetRFIDReport(school_id, fdate,database);

            //List<dynamic> nogps = JsonConvert.DeserializeObject<dynamic>(model);
            //ViewBag.nogps = nogps;
            return model;
        }

        [HttpPost]
        public async Task<String> GetStudentReport([FromBody] FormDataModel model)
        {
            string? uid = HttpContext.Session.GetString("uid");
            
            var selectedValues = model.SelectedValues ?? new List<string>();
            string students = selectedValues.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value)) ?? string.Empty;
            var fromDate = model.from;
            var toDate = model.to;
            var modal = await _report.GetStudentNotificationReport(uid, fromDate, toDate, students);

            //List<dynamic> nogps = JsonConvert.DeserializeObject<dynamic>(model);
            //ViewBag.nogps = nogps;
            return modal;
        }



        [HttpPost]
        public async Task<String> GetAlertReport([FromBody] FormDataModel model)
        {
            string? uid = HttpContext.Session.GetString("uid");

            var selectedValues = model.SelectedValues;
            string routes = selectedValues.Aggregate((a, b) => a + "," + b);
            var fromDate = model.from;
            var modal = await _report.GetAlertNotificationReport(uid, fromDate, routes);

            //List<dynamic> nogps = JsonConvert.DeserializeObject<dynamic>(model);
            //ViewBag.nogps = nogps;
            return modal;
        }

    }
}
