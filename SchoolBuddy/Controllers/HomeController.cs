using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using OfficeOpenXml;
using SchoolBuddy.Models;
using SchoolBuddy.Models.ApiTemplate;
using SchoolBuddy.Models.Dashboard;
using SchoolBuddy.Models.Driver;
using SchoolBuddy.Models.Holidays;
using SchoolBuddy.Models.Login;
using SchoolBuddy.Models.Report;
using SchoolBuddy.Models.Students;
using SchoolBuddy.Models.Tracking;
using System.Data;
using System.Diagnostics;
using System.Text;
using System.Text.Json;



namespace SchoolBuddy.Controllers
{
    //[Route("{Controller}/{action}")]
    public class HomeController : BaseController
    {

        private readonly ILogger _logger;
        private readonly ILoginRepository _loginapi;
        private readonly IDashboardRepository _dashboardRepository;
        private readonly IStudentsRepository _students;
        private readonly IHoliday _holiday;
        private readonly IConfiguration _configure;
        private readonly HttpClient _httpClient;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ITracking _tracking;
        private readonly IReportRepository _report;
        private readonly IDriverRepository _driver;

        public string AddOrEditStudent = "0";
        List<Students> student_list = new List<Students>();
        List<holiday_list> holiday = new List<holiday_list>();




        //ViewData["Admin"]=null;
        private readonly Iapitemplate _apitemplate;
        public HomeController(ILogger<HomeController> logger,ILoginRepository login, IStudentsRepository students, IDashboardRepository dashboardRepository,IHoliday holiday, IConfiguration configuration, Iapitemplate apitemplate, IReportRepository report, ITracking tracking,IDriverRepository driver, IHttpClientFactory httpClientFactory)
        {
            _driver = driver;
            _tracking = tracking;
            _logger = logger;
            _loginapi = login;
            // _totalstudents = totalstudents;
            _students = students;
            _dashboardRepository = dashboardRepository;
            _holiday = holiday;
            _configure = configuration;
            _httpClientFactory = httpClientFactory;
            _httpClient = httpClientFactory.CreateClient(HttpClientNames.SchoolBuddyApi);
            _apitemplate = apitemplate;
            _report = report;
        }

        //[HttpGet("~/")]
        //[HttpGet("/Home/Index")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]

        public IActionResult Index()
        {
            Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate"; // HTTP 1.1
            Response.Headers["Pragma"] = "no-cache"; // HTTP 1.0
            Response.Headers["Expires"] = "0"; // Proxies
            return View("/Views/Home/Login/index.cshtml");
        }
       
        [HttpPost]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public  async Task<IActionResult> Index(Login login)
        {   
            if (ModelState.IsValid)
            {
                var res = await _loginapi.LoginAPICall(login.username, login.password);
                if (res != "0" && res != "-1")
                {
                    var res_json = JsonConvert.DeserializeObject<login_res>(res);
                    // Drop anything stored before login so no earlier session data carries over.
                    HttpContext.Session.Clear();
                    HttpContext.Session.SetString("uid", res_json.user_id);
                    HttpContext.Session.SetString("database", res_json.database);
                    HttpContext.Session.SetString("schoolname", res_json.schoolname);
                    HttpContext.Session.SetString("password", login.password);
                    HttpContext.Session.SetString("username", login.username);
                    HttpContext.Session.SetString("SessionTime", DateTime.UtcNow.ToString("o"));

                    General.LogLogin(res_json.user_id, $"SUCCESS  username={login.username}  school={res_json.schoolname}  database={res_json.database}  source=WEB  ip={HttpContext.Connection.RemoteIpAddress}");

                    string? db = HttpContext.Session.GetString("database");
                    string uid = HttpContext.Session.GetString("uid");

                    Task<string> tokenTask =
                        _dashboardRepository.SendPayload(login.username, login.password);

                    await Task.WhenAll(tokenTask);

                    //string rfidResponse = await rfidTask;
                    string tokenResponse = await tokenTask;
                    string? trackofyToken = null;

                    try
                    {
                        if (!string.IsNullOrWhiteSpace(tokenResponse))
                        {
                            using JsonDocument tokenDocument =
                                JsonDocument.Parse(tokenResponse);


                            if (tokenDocument.RootElement.TryGetProperty(
                                    "token",
                                    out JsonElement tokenElement))
                            {
                                trackofyToken =
                                    tokenElement.GetString();
                            }


                        }
                        HttpContext.Session.SetString(
                        "token",
                        trackofyToken);

                    }
                    catch (Exception ex)
                    {
                        General.LogException(ex);
                        trackofyToken = null;
                    }

                    return RedirectToAction("Dashboard", "Home");
                }
                else
                {
                    General.LogLogin(null, $"FAILED  username={login.username}  api_result={res}  source=WEB  ip={HttpContext.Connection.RemoteIpAddress}");
                    HttpContext.Session.Clear();
                    ViewData["status"] = "fail";
                    return View("/Views/Home/Login/index.cshtml");
                }
                
            }
            return View("/Views/Home/Login/index.cshtml");
            //return RedirectToAction("Index", "Home");


        }
        [HttpGet]
        public async Task<IActionResult> Dashboard(Login login)
        {
            string? uid = HttpContext.Session.GetString("uid");
            string? db = HttpContext.Session.GetString("database");
            string? password = HttpContext.Session.GetString("password");
            string? username = HttpContext.Session.GetString("username");

            if (string.IsNullOrWhiteSpace(uid) ||
                string.IsNullOrWhiteSpace(db) ||
                string.IsNullOrWhiteSpace(username) ||
                string.IsNullOrWhiteSpace(password))
            {
                return RedirectToAction("Index", "Home");
            }

            try
            {
                string today = DateTime.Now.ToString("yyyy-MM-dd");
                string notificationDate = DateTime.Now.ToString("MM-dd-yyyy");

                /*
                 * Local helper: safely get a JSON property as string.
                 */
                static string GetValue(JsonElement element, string propertyName)
                {
                    if (!element.TryGetProperty(propertyName, out JsonElement property))
                    {
                        return string.Empty;
                    }

                    return property.ValueKind == JsonValueKind.String
                        ? property.GetString() ?? string.Empty
                        : property.ToString();
                }

                /*
                 * STEP 1:
                 * RFID and Trackofy token do not depend on each other.
                 */
                //Task<string> rfidTask =
                //    _report.GetRFIDReport(uid, today);



                string  trackofyToken =
                        HttpContext.Session.GetString("token");

                Stopwatch pageStopwatch = Stopwatch.StartNew();

                /*
                 * STEP 2:
                 * All these calls are independent, so start them together.
                 * Each one is timed and gets DashboardApiTimeout before its fallback is used.
                 */
                var vehicleHealthTask = WithDashboardTimeout("Vehicle_health",
                    _dashboardRepository.Vehicle_health(trackofyToken),
                    new List<VehicleHealthModel>());

                var totalStudentTask = WithDashboardTimeout("CountTotalStudentAPICall",
                    _dashboardRepository.CountTotalStudentAPICall(uid), "0");

                var totalLiveRouteTask = WithDashboardTimeout("countTotalLiveRouteApiCall",
                    _dashboardRepository.countTotalLiveRouteApiCall(uid, db), "0");

                var totalBusTask = WithDashboardTimeout("countTotalBusApiCall",
                    _dashboardRepository.countTotalBusApiCall(uid), "0");

                var totalRouteTask = WithDashboardTimeout("counttotalrouteApiCall",
                    _dashboardRepository.counttotalrouteApiCall(uid), "0");

                var stoppedBusTask = WithDashboardTimeout("countStopBusesApiCall",
                    _dashboardRepository.countStopBusesApiCall(uid), "0");

                var idleBusTask = WithDashboardTimeout("countIdleBusApiCall",
                    _dashboardRepository.countIdleBusApiCall(uid), "0");

                var assignedStudentTask = WithDashboardTimeout("countassignedstudent",
                    _dashboardRepository.countassignedstudent(uid), "0");

                var driverPerformanceTask = WithDashboardTimeout("DriverPerformance",
                    _dashboardRepository.DriverPerformance(
                        username,
                        password),
                    new driverdashboard { Status = false });

                var vehicleInServiceTask = WithDashboardTimeout("VehicleInServices",
                    _dashboardRepository.VehicleInServices(uid, db),
                    new List<VehicleInService>());

                var notificationTask = WithDashboardTimeout("GetNotification",
                    _report.GetNotification(
                        uid,
                        notificationDate,
                        db),
                    "[]");

                var alertTask = WithDashboardTimeout("Alerts",
                    _dashboardRepository.Alerts(trackofyToken),
                    new List<NotificationItem>());

                var routePerformanceTask = WithDashboardTimeout("RoutePerformance",
                    _dashboardRepository.RoutePerformance(uid, db),
                    new List<RouteLiveStatusModel>());

                var vehiclesTask = WithDashboardTimeout("GetVehiclesAsync",
                    _tracking.GetVehiclesAsync(
                        username,
                        password,
                        db, trackofyToken),
                    new List<DeviceIdAndVehiclenew>());

                var holidays = WithDashboardTimeout("GetHolidays",
                    _holiday.GetHolidays(uid), "[]");


                /*
                 * Wait once for all calls.
                 */
                await Task.WhenAll(
                    vehicleHealthTask,
                    totalStudentTask,
                    totalLiveRouteTask,
                    totalBusTask,
                    totalRouteTask,
                    stoppedBusTask,
                    idleBusTask,
                    assignedStudentTask,
                    driverPerformanceTask,
                    vehicleInServiceTask,
                    notificationTask,
                    alertTask,
                    routePerformanceTask,
                    vehiclesTask,
                    holidays
                );

                _logger.LogInformation(
                    "Dashboard data loaded in {ElapsedMs} ms",
                    pageStopwatch.ElapsedMilliseconds);

                /*
                 * Read completed results.
                 */
                string holidayJson = await holidays;

                List<holiday_list> holidayList;
                try
                {
                    holidayList = JsonConvert.DeserializeObject<List<holiday_list>>(holidayJson)
                                  ?? new List<holiday_list>();
                }
                catch (Newtonsoft.Json.JsonException ex)
                {
                    General.LogException(ex);
                    // The holiday API returns a plain error string on failure; don't let it blank the whole dashboard.
                    holidayList = new List<holiday_list>();
                }

                var upcomingHoliday = holidayList
                    .Where(x =>
                    {
                        DateTime date;
                        return DateTime.TryParse(x.from_date, out date) &&
                               date.Date >= DateTime.Today;
                    })
                    .OrderBy(x => DateTime.Parse(x.from_date))
                    .FirstOrDefault();

                ViewBag.UpcomingHolidayName =
                    upcomingHoliday?.description ?? "No Upcoming Holiday";

                ViewBag.UpcomingHolidayDate =
                    upcomingHoliday?.from_date ?? "";
                var vehicleHealth =
                    await vehicleHealthTask ??
                    new List<VehicleHealthModel>();

                string totalStudent =
                    await totalStudentTask ?? "0";

                string totalLiveRoute =
                    await totalLiveRouteTask ?? "0";

                string totalBuses =
                    await totalBusTask ?? "0";

                string totalRoute =
                    await totalRouteTask ?? "0";

                string totalStoppedBuses =
                    await stoppedBusTask ?? "0";

                string totalIdleBuses =
                    await idleBusTask ?? "0";

                string assignedStudents =
                    await assignedStudentTask ?? "0";

                var driverPerformance =
                    await driverPerformanceTask;

                var vehicleInService =
                    await vehicleInServiceTask ??
                    new List<VehicleInService>();

                string notificationResponse =
                    await notificationTask ?? "[]";

                var alerts =
                    await alertTask ??
                    new List<NotificationItem>();

                var routePerformance =
                    await routePerformanceTask;

                var vehicles =
                    await vehiclesTask;

                /*
                 * Notification counters.
                 *
                 * Parse once and calculate all counters from one record list.
                 */
                int boardingCount = 0;
                int deboardingCount = 0;
                int pickReachCount = 0;
                int dropReachCount = 0;
                int justPunched = 0;

                try
                {
                    if (!string.IsNullOrWhiteSpace(notificationResponse) &&
                        notificationResponse != "0")
                    {
                        using JsonDocument notificationDocument =
                            JsonDocument.Parse(notificationResponse);

                        if (notificationDocument.RootElement.ValueKind ==
                            JsonValueKind.Array)
                        {
                            List<JsonElement> records =
                                notificationDocument.RootElement
                                    .EnumerateArray()
                                    .ToList();

                            boardingCount = records
                                .Where(record =>
                                {
                                    string message =
                                        GetValue(record, "message");

                                    return message.Contains(
                                               "boarded",
                                               StringComparison.OrdinalIgnoreCase) &&
                                           !message.Contains(
                                               "deboarded",
                                               StringComparison.OrdinalIgnoreCase);
                                })
                                .Select(record =>
                                    GetValue(record, "admission_no"))
                                .Where(value =>
                                    !string.IsNullOrWhiteSpace(value))
                                .Distinct()
                                .Count();

                            deboardingCount = records
                                .Where(record =>
                                    GetValue(record, "message")
                                        .Contains(
                                            "deboarded",
                                            StringComparison.OrdinalIgnoreCase))
                                .Select(record =>
                                    GetValue(record, "admission_no"))
                                .Where(value =>
                                    !string.IsNullOrWhiteSpace(value))
                                .Distinct()
                                .Count();

                            pickReachCount = records
                                .Where(record =>
                                {
                                    string message =
                                        GetValue(record, "message");

                                    return message.Contains(
                                               "reach your stop within 10 min",
                                               StringComparison.OrdinalIgnoreCase) &&
                                           message.Contains(
                                               "pick",
                                               StringComparison.OrdinalIgnoreCase);
                                })
                                .Select(record =>
                                    GetValue(record, "admission_no"))
                                .Where(value =>
                                    !string.IsNullOrWhiteSpace(value))
                                .Distinct()
                                .Count();

                            dropReachCount = records
                                .Where(record =>
                                {
                                    string message =
                                        GetValue(record, "message");

                                    return message.Contains(
                                               "reach your stop within 10 min",
                                               StringComparison.OrdinalIgnoreCase) &&
                                           message.Contains(
                                               "drop",
                                               StringComparison.OrdinalIgnoreCase);
                                })
                                .Select(record =>
                                    GetValue(record, "admission_no"))
                                .Where(value =>
                                    !string.IsNullOrWhiteSpace(value))
                                .Distinct()
                                .Count();
                            justPunched = records
                                .Where(record =>
                                {
                                    string message =
                                        GetValue(record, "message");

                                    return message.Contains(
                                               "just punched his/her RF card",
                                               StringComparison.OrdinalIgnoreCase) &&
                                           message.Contains(
                                               "Dear parent, your ward",
                                               StringComparison.OrdinalIgnoreCase);
                                })
                                .Select(record =>
                                    GetValue(record, "admission_no"))
                                .Where(value =>
                                    !string.IsNullOrWhiteSpace(value))
                                .Distinct()
                                .Count();
                        }
                    }
                }
                catch (Exception ex)
                {
                    General.LogException(ex);
                    boardingCount = 0;
                    deboardingCount = 0;
                    pickReachCount = 0;
                    dropReachCount = 0;
                    justPunched = 0;
                }

                ViewBag.BoardingCount = boardingCount;
                ViewBag.DeboardingCount = deboardingCount;
                ViewBag.PickReachCount = pickReachCount;
                ViewBag.DropReachCount = dropReachCount;
                ViewBag.justPunched = justPunched;

                /*
                 * Alert counters.
                 */
                ViewBag.harshcount = alerts.Count(item =>
                    !string.IsNullOrWhiteSpace(item.msg_status) &&
                    item.msg_status.Contains(
                        "harsh",
                        StringComparison.OrdinalIgnoreCase));

                ViewBag.batterylow = alerts.Count(item =>
                    !string.IsNullOrWhiteSpace(item.msg_status) &&
                    item.msg_status.Contains(
                        "Battery Low",
                        StringComparison.OrdinalIgnoreCase));

                ViewBag.batterydisconnection = alerts.Count(item =>
                    !string.IsNullOrWhiteSpace(item.msg_status) &&
                    item.msg_status.Contains(
                        "Battery dis",
                        StringComparison.OrdinalIgnoreCase));

                ViewBag.tamperalert = alerts.Count(item =>
                    !string.IsNullOrWhiteSpace(item.msg_status) &&
                    item.msg_status.Contains(
                        "tamper",
                        StringComparison.OrdinalIgnoreCase));

                ViewData["total_sos"] = alerts.Count(item =>
                    !string.IsNullOrWhiteSpace(item.msg_status) &&
                    item.msg_status.Contains(
                        "panic",
                        StringComparison.OrdinalIgnoreCase));

                ViewData["total_overspeed"] = alerts.Count(item =>
                    !string.IsNullOrWhiteSpace(item.msg_status) &&
                    item.msg_status.Contains(
                        "speed",
                        StringComparison.OrdinalIgnoreCase));

                ViewBag.Alerts =
                    alerts.Any()
                        ? alerts
                        : null;

                /*
                 * Driver Performance.
                 */
                if (driverPerformance != null &&
                    driverPerformance.Status &&
                    driverPerformance.Data != null)
                {
                    ViewBag.DriverPerformance =
                        driverPerformance.Data;
                }
                else
                {
                    ViewBag.DriverPerformance =
                        Enumerable.Empty<SchoolBuddy.Models.Dashboard.DriverPerformanceModel>();
                }

                /*
                 * Remaining dashboard data.
                 */
                ViewBag.RoutePerformance =
                    routePerformance;

                ViewBag.vehicleserve =
                    vehicleInService;

                ViewBag.VehicleHealth =
                    vehicleHealth;

                ViewBag.VehicleList =
                    vehicles;

                ViewData["total_bus"] =
                    totalBuses;

                ViewData["total_running"] =
                    totalLiveRoute;

                ViewData["total_idle"] =
                    totalIdleBuses;

                ViewData["total_stopped"] =
                    totalStoppedBuses;

                ViewData["Admin"] =
                    username;

                var dashboardModel = new Dashboard
                {
                    assignedstudent = assignedStudents,
                    totalstudentcount = totalStudent,
                    totalroutecount = totalRoute,
                    totalbuscount = totalBuses,
                    totalliveroutecount = totalLiveRoute
                };

                return View(
                    "Views/Home/Dashboard/Dashboard.cshtml",
                    dashboardModel);
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                System.Diagnostics.Debug.WriteLine(
                    $"Dashboard loading error: {ex}");

                /*
                 * Keep the page available even if one external API fails.
                 */
                ViewBag.DriverPerformance =
                    Enumerable.Empty<SchoolBuddy.Models.Dashboard.DriverPerformanceModel>();

                ViewBag.RoutePerformance =
                    new List<RouteLiveStatusModel>();

                ViewBag.Alerts =
                    new List<NotificationItem>();

                ViewBag.vehicleserve =
                    new List<VehicleInService>();

                ViewBag.VehicleHealth =
                    new List<VehicleHealthModel>();

                ViewBag.VehicleList =
                    new List<DeviceIdAndVehiclenew>();

                ViewBag.BoardingCount = 0;
                ViewBag.DeboardingCount = 0;
                ViewBag.PickReachCount = 0;
                ViewBag.DropReachCount = 0;

                ViewData["total_bus"] = "0";
                ViewData["total_running"] = "0";
                ViewData["total_idle"] = "0";
                ViewData["total_stopped"] = "0";
                ViewData["total_sos"] = 0;
                ViewData["total_overspeed"] = 0;

                return View(
                    "Views/Home/Dashboard/Dashboard.cshtml",
                    new Dashboard
                    {
                        assignedstudent = "0",
                        totalstudentcount = "0",
                        totalroutecount = "0",
                        totalbuscount = "0",
                        totalliveroutecount = "0"
                    });
            }
        }
        // How long the dashboard waits for one external API before showing its fallback value.
        private static readonly TimeSpan DashboardApiTimeout = TimeSpan.FromSeconds(30);

        /*
         * Waits up to DashboardApiTimeout for one dashboard API call and logs how long it took,
         * so the slowest external API shows up in the logs. On timeout or error the fallback is
         * returned and the page still loads.
         */
        private async Task<T> WithDashboardTimeout<T>(string apiName, Task<T> call, T fallback)
        {
            Stopwatch stopwatch = Stopwatch.StartNew();
            using var delayCancellation = new CancellationTokenSource();

            try
            {
                Task finished = await Task.WhenAny(call, Task.Delay(DashboardApiTimeout, delayCancellation.Token));
                if (finished != call)
                {
                    _logger.LogWarning(
                        "Dashboard API {ApiName} timed out after {ElapsedMs} ms; showing fallback value",
                        apiName, stopwatch.ElapsedMilliseconds);
                    return fallback;
                }

                delayCancellation.Cancel();
                T result = await call;
                _logger.LogInformation(
                    "Dashboard API {ApiName} took {ElapsedMs} ms",
                    apiName, stopwatch.ElapsedMilliseconds);
                return result ?? fallback;
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                _logger.LogWarning(ex,
                    "Dashboard API {ApiName} failed after {ElapsedMs} ms; showing fallback value",
                    apiName, stopwatch.ElapsedMilliseconds);
                return fallback;
            }
        }

        [HttpPost]
        public async Task<IActionResult> StopViolationSummary()
        {
            string? uid = HttpContext.Session.GetString("uid");
            string? db = HttpContext.Session.GetString("database");

            if (string.IsNullOrWhiteSpace(uid) || string.IsNullOrWhiteSpace(db))
            {
                return Unauthorized(new { message = "The login session has expired." });
            }

            string response = await _dashboardRepository.StopWiseVoilation(uid, db);

            if (string.IsNullOrWhiteSpace(response) || response == "0")
            {
                return StatusCode(StatusCodes.Status502BadGateway,
                    new { message = "The stop violation service did not return data." });
            }

            try
            {
                JToken.Parse(response);
                return Content(response, "application/json");
            }
            catch (JsonReaderException ex)
            {
                General.LogException(ex);
                return StatusCode(StatusCodes.Status502BadGateway,
                    new { message = "The stop violation service returned invalid JSON." });
            }
        }


        [HttpGet("StudentBulkUpload")]
        public IActionResult StudentBulkUpload()
        {
            return View("Views/Home/Master/Student/StudentBulkUpload.cshtml");
        }

        [HttpGet]
        public IActionResult RFIDBulkUpload()
        {
            return View("Views/Home/Master/Student/RFIDBulkUpload.cshtml");
        }

        private static string GetJsonValue(JsonElement row, string columnName)
        {
            foreach (var property in row.EnumerateObject())
            {
                if (property.Name.Equals(columnName, StringComparison.OrdinalIgnoreCase))
                {
                    return property.Value.ValueKind == JsonValueKind.Null
                        ? string.Empty
                        : property.Value.ToString();
                }
            }

            return string.Empty;
        }

        [HttpPost]
        public async Task<IActionResult> RFIDBulkUpload(IFormFile file)
        {
            try
            {
                string userId = HttpContext.Session.GetString("uid");
                var content = new MultipartFormDataContent();
                content.Add(new StreamContent(file.OpenReadStream()), "file", file.FileName);
                content.Add(new StringContent(userId), "user_id");

                string? apiUrl = _configure["api_endpoint"];
                using (HttpClient client = _httpClientFactory.CreateClient(HttpClientNames.SchoolBuddyApi))
                {
                    var response = await client.PostAsync($"{apiUrl}Students/UpdateRFIDInBulk", content);
                    string responseBody = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        var responseJson = JsonConvert.DeserializeObject<Dictionary<string, object>>(responseBody);
                        TempData["SuccessMessage"] = responseJson.ContainsKey("message") ? responseJson["message"]?.ToString() : "RFID updated successfully.";

                        if (responseJson.ContainsKey("errors"))
                        {
                            // Deserialize the list properly
                            var errorList = JsonConvert.DeserializeObject<List<string>>(responseJson["errors"].ToString());
                            TempData["ErrorList"] = errorList;
                        }

                    }
                    else
                    {
                        TempData["ErrorMessage"] = "RFID update failed. " + responseBody;
                    }
                }
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                TempData["ErrorMessage"] = "Error occurred during upload: " + ex.Message;
            }

            return RedirectToAction("Students");
        }




        [HttpGet]
        public async Task<IActionResult> downloadRFIDTemp()
        {
            // ✅ EPPlus license setting
            ExcelPackage.LicenseContext = OfficeOpenXml.LicenseContext.NonCommercial;

            using (var package = new ExcelPackage())
            {
                var sheet = package.Workbook.Worksheets.Add("RFID Template");

                // ✅ Add headers only
                sheet.Cells[1, 1].Value = "Admission No";
                sheet.Cells[1, 2].Value = "RFID";
                            
                // ✅ Auto-fit columns
                sheet.Cells[sheet.Dimension.Address].AutoFitColumns();

                // ✅ Stream to client
                var stream = new MemoryStream();
                await package.SaveAsAsync(stream);
                stream.Position = 0;

                return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "RFID_Template.xlsx");
            }
        }
        
        [HttpGet]
        public IActionResult createholidayenvent()
        {
            return View();
        }
        [HttpGet]
        public async Task<IActionResult> Students(int id)
        {
            if (id==0)
            {

                ViewBag.del = TempData["del"];
                string? uid = HttpContext.Session.GetString("uid");
                if (!String.IsNullOrEmpty(uid))
                {

                    var model = await _students.GetAllStudentAPICall(uid);
                    if (model != "-1" && model != "0" && model!= "Something went wrong")
                    {
                        student_list = JsonConvert.DeserializeObject<List<Students>>(model);
                        return View("Views/Home/Master/Student/Students.cshtml", student_list);
                    }
                    return View("Views/Home/Master/Student/Students.cshtml", student_list);

                }

                //var res = _students.GetAllStudentAPICall("5736").Result;
                //string uid = HttpContext.Session.GetString("uid");
                //string res = @"
                //        [{
                //          ""Id"": 12345,
                //          ""Adminssion_no"": ""A123456789"",
                //          ""Student_name"": ""John Doe"",
                //          ""Gender"": ""Male"",
                //          ""Birth"": ""2005-05-15"",
                //          ""Class"": ""10"",
                //          ""Division"": ""A"",
                //          ""Parent_name"": ""Jane Doe"",
                //          ""Mobile"": ""+1234567890"",
                //          ""Address"": ""123 Main Street, Cityville"",
                //          ""Password"": ""password123"",

                //          ""Created_date"": ""2024-06-03T12:00:00"",
                //          ""Rf_tag"": ""RFID123"",
                //          ""Email"": ""john.doe@example.com"",
                //          ""Relation_with_std"": ""Parent"",
                //          ""Blood_group"": ""A+"",

                //          ""Qr_code"": ""QRCODE123""
                //        }]";

                return View("/Views/Home/Login/index.cshtml");



            }
            else
            {
                //AddOrEditStudent = HttpContext.Request.GetEncodedUrl();
                ViewData["Type"] = "Edit Student";
                HttpContext.Session.SetString("student_id", $"{id}");

                TempData["action"] = "Update";
                HttpContext.Session.SetString("editoradd", "edit");
                var model = await _students.GetStudentByID(id);
                Students? students = new Students();
                students = JsonConvert.DeserializeObject<Students>(model);
                var m = await _students.classes();
                List<class_dropdown> c = JsonConvert.DeserializeObject<List<class_dropdown>>(m);
                ViewBag.class_dropdown = c;
                return View("Views/Home/Master/Student/AddStudent.cshtml", students);
                //return RedirectToAction("AddStudent", "Home", new {student = students });

            }

        }

        [HttpPost]
        public async Task<IActionResult> addStudentsInBulk(IFormFile excelfile)
        {
            try
            {
                if (excelfile == null || excelfile.Length == 0)
                {
                    TempData["ErrorMessage"] = "No file uploaded!";
                    return RedirectToAction("Students", "Home");
                }

                string userId = HttpContext.Session.GetString("uid");
                var response = await _students.addStudentsInBulk(excelfile, userId);

                // Console.WriteLine("Bulk Upload API Response: " + response); // ✅ Debugging response

                if (!string.IsNullOrEmpty(response))
                {
                    try
                    {
                        var result = JsonConvert.DeserializeObject<Dictionary<string, object>>(response);

                        if (result.ContainsKey("status") && result["status"].ToString() == "success")
                        {
                            TempData["SuccessMessage"] = result["message"].ToString();
                        }
                        else
                        {
                            TempData["ErrorMessage"] = result["message"].ToString();
                            if (result.ContainsKey("errors"))
                            {
                                var errorsList = JsonConvert.DeserializeObject<List<string>>(result["errors"].ToString());
                                TempData["ErrorMessage"] += "\n" + string.Join("\n", errorsList);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        General.LogException(ex);
                        TempData["ErrorMessage"] = "Unexpected response format: " + response;
                    }
                }
                else
                {
                    TempData["ErrorMessage"] = "Bulk upload failed. Please try again.";
                }
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                // Console.WriteLine("Error in AddStudentsInBulk: " + ex.Message);
                TempData["ErrorMessage"] = "An unexpected error occurred during bulk upload.";
            }

            return RedirectToAction("Students", "Home");
        }




        [HttpGet]
        public IActionResult expenseAnnouncement()
        {
            return View("Views/Home/Master/ExpenseAnnouncement/expenseannouncement.cshtml");
        }
        [HttpGet]
        public IActionResult bulkExpense()
        {
            return View();
        }

        [HttpGet]
        public IActionResult createCommand()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> teacherDetails()
        {
            try
            {
                int uid = GetUserIdFromSession(); // Fetch UID from session
                string? url = _configure["api_endpoint"];

                HttpResponseMessage response = await _httpClient.GetAsync($"{url}Teacher/GetAllTeachers?uid={uid}");
                List<TeacherModel> teachers = new List<TeacherModel>();

                if (response.IsSuccessStatusCode)
                {
                    string responseData = await response.Content.ReadAsStringAsync();
                    teachers = JsonConvert.DeserializeObject<List<TeacherModel>>(responseData) ?? new List<TeacherModel>();
                }
                else
                {
                    return View("Views/Home/Master/TeacherDetails/teacherDetails.cshtml", new List<TeacherModel>());
                }

                return View("Views/Home/Master/TeacherDetails/teacherDetails.cshtml", teachers);
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                // Console.WriteLine($"Error fetching teacher details: {ex.Message}");
                return View("Views/Home/Master/TeacherDetails/teacherDetails.cshtml", new List<TeacherModel>());
            }
        }


        //[HttpGet]
        //public async Task<IActionResult> downloadTemp()
        //{
        //    string filepath = @"wwwroot\Template\student_upload.xlsx";

        //    if (System.IO.File.Exists(filepath))
        //    {
        //        string sn = HttpContext.Session.GetString("schoolname");

        //        var file_content = await System.IO.File.ReadAllBytesAsync(filepath);
        //        return File(file_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{sn}.xlsx");

        //    }
        //    else
        //    {
        //    }
        //}

        [HttpGet]
        public async Task<IActionResult> downloadTemp()
        {
            string filepath = @"wwwroot\Template\student_upload.xlsx";

            if (System.IO.File.Exists(filepath))
            {
                string sn = HttpContext.Session.GetString("schoolname");

                // ✅ EPPlus license setting (required for version 5+)
                ExcelPackage.LicenseContext = OfficeOpenXml.LicenseContext.NonCommercial;

                using (var package = new ExcelPackage(new FileInfo(filepath)))
                {
                    // ✅ Create a new worksheet named "ClassMaster"
                    var sheet = package.Workbook.Worksheets.Add("Class Table");

                    // ✅ Add headers
                    sheet.Cells[1, 1].Value = "id";
                    sheet.Cells[1, 2].Value = "class_name";

                    // ✅ Hardcoded class data
                    var classes = new List<(int Id, string ClassName)>
            {
                (1, "K.G./BAL vatika 1"),
                (2, "I"),
                (3, "II"),
                (4, "III"),
                (5, "IV"),
                (6, "V"),
                (7, "VI"),
                (8, "VII"),
                (9, "VIII"),
                (10, "IX"),
                (11, "PRE PRIMARY"),
                (12, "PRE SCHOOL"),
                (13, "XI"),
                (14, "XII"),
                (15, "X"),
                (16, "UKG/BAL VATIKA 3"),
                (17, "NURSERY"),
                (18, "PRE NURSERY")
            };

                    // ✅ Add rows to the worksheet
                    for (int i = 0; i < classes.Count; i++)
                    {
                        sheet.Cells[i + 2, 1].Value = classes[i].Id;
                        sheet.Cells[i + 2, 2].Value = classes[i].ClassName;
                    }

                    // ✅ Auto-fit the columns
                    sheet.Cells[sheet.Dimension.Address].AutoFitColumns();

                    // ✅ Save to memory stream
                    var stream = new MemoryStream();
                    await package.SaveAsAsync(stream);
                    stream.Position = 0;

                    return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{sn}.xlsx");
                }
            }
            else
            {
                return NotFound("Template file not found.");
            }
        }



        [HttpGet]
        public async Task<IActionResult> downloadSampleExcelForAssigningAtudents()
        {
            string filepath = @"wwwroot\Template\Assigning_Student_Sample_Excel.xlsx";

            if (System.IO.File.Exists(filepath))
            {
                string sn = HttpContext.Session.GetString("schoolname");

                var file_content = await System.IO.File.ReadAllBytesAsync(filepath);
                return File(file_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{sn}.xlsx");

            }
            else
            {
                return NotFound();
            }
        }




        [HttpGet]
        public async Task<IActionResult> addTeacherDetailsAsync()
        {
            string classesResponse = await _students.classes();
            var classDropdown = JsonConvert.DeserializeObject<List<class_dropdown>>(classesResponse) ?? new List<class_dropdown>();
            ViewBag.class_dropdown = classDropdown;
            return View("Views/Home/Master/TeacherDetails/addteacherDetails.cshtml");
        }

        public class ClassModel
        {
            public int Id { get; set; }
            public string ClassName { get; set; }
        }

        public class SectionModel
        {
            public string Section { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> addTeacherDetails(TeacherModel model)
        {
            try
            {
                int uid = GetUserIdFromSession(); 
                model.Uid = uid;

                string jsonData = JsonConvert.SerializeObject(model);

                StringContent content = new StringContent(jsonData, Encoding.UTF8, "application/json");
                string? url = _configure["api_endpoint"];

                HttpResponseMessage response = await _httpClient.PostAsync($"{url}Teacher/AddTeacher", content);

                string responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    return RedirectToAction("teacherDetails", "Home");
                }
                else
                {
                    TempData["ErrorMessage"] = "Failed to add teacher. Please try again.";
                    return RedirectToAction("addTeacherDetails", "Home");
                }
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                // Console.WriteLine($"Error: {ex.Message}");
                TempData["ErrorMessage"] = "An error occurred while adding the teacher.";
                return RedirectToAction("addTeacherDetails", "Home");
            }
        }

        [HttpGet]
        public async Task<IActionResult> editTeacherDetails(int id)
        {
            try
            {
                string? url = _configure["api_endpoint"];
                string classesResponse = await _students.classes();
                var classDropdown = JsonConvert.DeserializeObject<List<class_dropdown>>(classesResponse) ?? new List<class_dropdown>();
                ViewBag.class_dropdown = classDropdown;

                HttpResponseMessage response = await _httpClient.GetAsync($"{url}Teacher/GetTeacherById?id={id}");
                TeacherModel teacher = new TeacherModel();

                if (response.IsSuccessStatusCode)
                {
                    string responseData = await response.Content.ReadAsStringAsync();
                    teacher = JsonConvert.DeserializeObject<TeacherModel>(responseData);
                }

                return View("Views/Home/Master/TeacherDetails/addTeacherDetails.cshtml", teacher); // Load Add/Edit Teacher page with data
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                // Console.WriteLine($"Error fetching teacher details: {ex.Message}");
                return RedirectToAction("teacherDetails", "Home");
            }
        }

        [HttpPost]
        public async Task<IActionResult> updateTeacherDetails(TeacherModel model)
        {
            try
            {
                string jsonData = JsonConvert.SerializeObject(model);
                StringContent content = new StringContent(jsonData, Encoding.UTF8, "application/json");
                string? url = _configure["api_endpoint"];

                HttpResponseMessage response = await _httpClient.PostAsync($"{url}Teacher/UpdateTeacher", content);

                string responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    return RedirectToAction("teacherDetails", "Home");
                }
                else
                {
                    TempData["ErrorMessage"] = "Failed to update teacher. Please try again.";
                    return View("addTeacherDetails", model);
                }
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                // Console.WriteLine($"Error: {ex.Message}");
                TempData["ErrorMessage"] = "An error occurred while updating the teacher.";
                return View("addTeacherDetails", model);
            }
        }

        [HttpGet]
        public async Task<IActionResult> deleteTeacher(int id)
        {
            try
            {
                string? url = _configure["api_endpoint"];

                HttpResponseMessage response = await _httpClient.DeleteAsync($"{url}Teacher/DeleteTeacher?id={id}");

                if (response.IsSuccessStatusCode)
                {
                    TempData["SuccessMessage"] = "Teacher deleted successfully.";
                }
                else
                {
                    TempData["ErrorMessage"] = "Failed to delete teacher. Please try again.";
                }

                return RedirectToAction("teacherDetails", "Home"); // Redirect back to teacher list
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                // Console.WriteLine($"Error: {ex.Message}");
                TempData["ErrorMessage"] = "An error occurred while deleting the teacher.";
                return RedirectToAction("teacherDetails", "Home");
            }
        }


        private int GetUserIdFromSession()
        {
            string userId = HttpContext.Session.GetString("uid");
            return Convert.ToInt32(userId);
        }

        [HttpGet]
        public async Task<IActionResult> EventHoliday()
        {
            string? uid = HttpContext.Session.GetString("uid");
           
            var model = await _holiday.GetHolidays(uid);
            if (model != "-1" && model != "0")
            {
                holiday = JsonConvert.DeserializeObject<List<holiday_list>>(model);
                return View("Views/Home/Master/HolidayAndEvent/EventHoliday.cshtml",holiday);
            }
            return View("Views/Home/Master/HolidayAndEvent/EventHoliday.cshtml");
        }

        [HttpGet]
        public async Task<IActionResult> EventList()

        {
            try
            {
                string? uid = HttpContext.Session.GetString("uid");

                var model = await _holiday.GetHolidays(uid);
                //var res = JObject.Parse(model);
                return Ok(model);
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                return Ok("");
            }
        }




        [HttpGet]
        public IActionResult CreateHoliday()

        {
            return View("Views/Home/Master/HolidayAndEvent/addholidays.cshtml");

            //return View("Views/Home/Master/HolidayAndEvent/EventHoliday.cshtml");
        }
        [HttpGet]
        public IActionResult Report()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> AddStudent()
        {
            AddOrEditStudent = HttpContext.Request.GetEncodedUrl();
            ViewData["type"] = "Add Student";
            TempData["action"] = "SAVE";
            HttpContext.Session.SetString("editoradd","add");
            var model = await _students.classes();
            List<class_dropdown> clas = JsonConvert.DeserializeObject<List<class_dropdown>>(model);
            ViewBag.class_dropdown = clas;
            return View("Views/Home/Master/Student/AddStudent.cshtml");
        }
        [HttpPost]
        public async Task<IActionResult> AddStudent(Students students)
        {
            string editOrAdd = HttpContext.Session.GetString("editoradd");

            if (editOrAdd == "edit")
            {
                ModelState.Remove("gender");
                ModelState.Remove("birth");
                ModelState.Remove("blood_group");
                ModelState.Remove("relation_with_std");
            }
           

            if (ModelState.IsValid)
            {
                try
                {
                    int studentId = Convert.ToInt32(HttpContext.Session.GetString("student_id"));
                    string userId = HttpContext.Session.GetString("uid");
                    //string editOrAdd = HttpContext.Session.GetString("editoradd");

                    string apiResponse = "";
                    students.rf_id = Request.Form["rf_id"];
                    if (editOrAdd == "edit")
                    {
                        ViewBag.EditMsg = "Edit Student Successfully..";
                        apiResponse = await _students.UpdateStudent(students, studentId);
                    }
                    else
                    {
                        ViewBag.EditMsg = "Add Student Successfully..";
                        apiResponse = await _students.AddStudent(students, userId);
                    }

                    if (!string.IsNullOrEmpty(apiResponse))
                    {
                        // ✅ Fix: Agar API "true" return kare, to success message manually set karein
                        if (apiResponse.Trim().ToLower() == "true")
                        {
                            TempData["SuccessMessage"] = editOrAdd == "edit" ? "Student updated successfully!" : "Student added successfully!";
                            return RedirectToAction("Students", "Home");
                        }

                        // ✅ Proper JSON deserialize karein
                        /*var result = JsonConvert.DeserializeObject<Dictionary<string, string>>(apiResponse);)*/
                        Dictionary<string, string> result = null;
                        if (apiResponse.Trim().StartsWith("{"))
                        {
                             result = JsonConvert.DeserializeObject<Dictionary<string, string>>(apiResponse);
                        }
                        else
                        {
                            // Handle plain text error
                            TempData["ErrorMessage"] = apiResponse;
                            return RedirectToAction("Students", "Home");
                        }
                        if (result != null && result.ContainsKey("status") && result.ContainsKey("message"))
                        {
                            if (result["status"] == "success")
                            {
                                TempData["SuccessMessage"] = result["message"]; // ✅ Store only string
                            }
                            else
                            {
                                TempData["ErrorMessage"] = result["message"]; // ✅ Store only string
                                return RedirectToAction("Students", "Home");
                            }
                        }
                    }
                    else
                    {
                        TempData["ErrorMessage"] = "Failed to process request.";
                        return RedirectToAction("Students", "Home");
                    }

                    // ✅ Fetch Updated Student List
                    string studentsJson = await _students.GetAllStudentAPICall(userId);
                    var studentList = JsonConvert.DeserializeObject<List<Students>>(studentsJson) ?? new List<Students>();

                    // ✅ Store student list in TempData as serialized JSON string
                    //TempData["StudentList"] = JsonConvert.SerializeObject(studentList);

                    //return RedirectToAction("Students", "Home");
                    return View("Views/Home/Master/Student/Students.cshtml", studentList);
                }
                catch (Exception ex)
                {
                    General.LogException(ex);
                    // Console.WriteLine("Error in AddStudent: " + ex.Message);
                    TempData["ErrorMessage"] = "An error occurred while processing your request.";
                    return RedirectToAction("Students", "Home");
                }
            }
            else
            {
                TempData["ErrorMessage"] = "Something Went Wrong";
            }

            // ✅ Fallback for invalid model or exceptions
            TempData["action"] = "SAVE";
            ViewData["type"] = "Add Student";

            try
            {
                string classesResponse = await _students.classes();
                var classDropdown = JsonConvert.DeserializeObject<List<class_dropdown>>(classesResponse) ?? new List<class_dropdown>();
                ViewBag.class_dropdown = classDropdown;
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                // Console.WriteLine("Error fetching class dropdown: " + ex.Message);
                ViewBag.class_dropdown = new List<class_dropdown>();
            }

            return RedirectToAction("Students", "Home");
        }


        public IActionResult Students()
        {
            var studentList = TempData["StudentList"] != null
                ? JsonConvert.DeserializeObject<List<Students>>(TempData["StudentList"].ToString())
                : new List<Students>();

            return View("Views/Home/Master/Student/Students.cshtml", studentList);
        }

        [HttpGet]
        public async Task<IActionResult> Attendance()
        {
            var m = await _students.classes();
            List<class_dropdown> c = JsonConvert.DeserializeObject<List<class_dropdown>>(m);
            ViewBag.class_dropdown = c;
            return View("Views/Home/Attendance/Attendance.cshtml");
        }

        //[HttpGet]
        //public IActionResult visitorDetails()
        //{
        //    return View("Views/Home/IndoorTracking/VisitorDetails/visitorDetails.cshtml");
        //}

        //[HttpGet]
        //public IActionResult addStaffDetails()
        //{
        //    return View("Views/Home/IndoorTracking/Staff Details/staffDetails.cshtml");
        //}

        //[HttpGet]
        //public IActionResult staffDetails()
        //{
        //    return View("Views/Home/IndoorTracking/Staff Details/staffDetails.cshtml");
        //}

        [HttpGet]
        public IActionResult blTracking()
        {
            return View("Views/Home/IndoorTracking/BL/blTracking.cshtml");
        }

        [HttpGet]
        public IActionResult uwbTracking()
        {
            return View("Views/Home/IndoorTracking/UWB/uwbTracking.cshtml");
        }

        [HttpGet]
        public IActionResult uhfGates()
        {
            return View("Views/Home/IndoorTracking/UHF/uhfGates.cshtml");
        }

        [HttpGet]
        public IActionResult parentComplainReport()
        {
            return View("Views/Home/ParentCompliantRecord/parentComplainReport.cshtml");
        }
        [HttpGet]
        public IActionResult leaveRequests()
        {
            return View("Views/Home/LeaveRequest/leaveRequests.cshtml");
        }
        [HttpGet]
        public IActionResult Trip()
        {
            return View();
        }

        [HttpGet] // Delete Student
        public async Task<IActionResult> deleteStudent(int id)
        {
            try
            {
                string? uid = HttpContext.Session.GetString("uid");

                var model = await _students.DeleteStudent(id);
                var model1 = await _students.GetAllStudentAPICall(uid);
                student_list = JsonConvert.DeserializeObject<List<Students>>(model1);

                if (!string.IsNullOrEmpty(model) && (model.Trim().ToLower() == "true" || model.ToLower().Contains("success")))
                {
                    TempData["SuccessMessage"] = "Student deleted successfully!";
                }
                else
                {
                    TempData["ErrorMessage"] = "An error occurred while deleting the student.";
                }

                return RedirectToAction("Students", "Home", student_list);
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                // Console.WriteLine("Error in deleteStudent: " + ex.Message);
                TempData["ErrorMessage"] = "An unexpected error occurred while deleting the student.";
                return RedirectToAction("Students", "Home");
            }
        }




        [HttpPost]
        public async Task<IActionResult> AddHoliday([FromBody] holiday_properties holidayData)
        {
            try
            {
                // Console.WriteLine($"🔥 Received Data: {JsonConvert.SerializeObject(holidayData)}");

                if (holidayData == null || string.IsNullOrEmpty(holidayData.start) ||
                    string.IsNullOrEmpty(holidayData.end) || string.IsNullOrEmpty(holidayData.eventname) ||
                    string.IsNullOrEmpty(holidayData.status))
                {
                    return BadRequest(new { message = "Invalid input data. Please check the form values." });
                }

                // ✅ User ID Get from Session
                string uid = HttpContext.Session.GetString("uid");
                if (string.IsNullOrEmpty(uid))
                {
                    return Unauthorized(new { message = "User not logged in" });
                }

                // ✅ Call Holiday Repository to Add Holiday
                var response = await _holiday.AddHoliday(holidayData.start, holidayData.end, uid, holidayData.eventname, holidayData.status);

                var responseData = JsonConvert.DeserializeObject<Dictionary<string, string>>(response);

                // ✅ Check if response contains the expected success message
                if (responseData != null && responseData.ContainsKey("message") && responseData["message"] == "Holiday added successfully!")
                {
                    return Ok(new { message = "Holiday added successfully!" });
                }
                else
                {
                    return BadRequest(new { message = "Failed to add holiday." });
                }
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                // Console.WriteLine("❌ Exception: " + ex.Message);
                return StatusCode(500, new { message = "Internal Server Error", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateHoliday([FromBody] holiday_properties holidayData)
        {
            try
            {
                // Console.WriteLine($"🔥 Received Data: {JsonConvert.SerializeObject(holidayData)}");

                if (holidayData == null || string.IsNullOrEmpty(holidayData.start) ||
                    string.IsNullOrEmpty(holidayData.end) || string.IsNullOrEmpty(holidayData.eventname) ||
                    string.IsNullOrEmpty(holidayData.status) || string.IsNullOrEmpty(holidayData.schoolid))
                {
                    return BadRequest(new { message = "Invalid input data." });
                }

                // ✅ Session se uid lene ki jagah schoolid directly use karein
                string schoolid = holidayData.schoolid;

                // ✅ Data ko Repository me bhej rahe hain
                var response = await _holiday.UpdateHoliday(holidayData.id, holidayData.start, holidayData.end, schoolid, holidayData.eventname, holidayData.status);

                // ✅ Debugging Log (Check करें API Response)
                // Console.WriteLine($"📥 API Response: {response}");

                // ✅ क्योंकि response एक boolean है, उसे JSON की तरह parse करने की जरूरत नहीं
                if (response)
                {
                    return Ok(new { message = "Holiday updated successfully!" });
                }
                else
                {
                    return BadRequest(new { message = "Failed to update holiday." });
                }

            }
            catch (Exception ex)
            {
                General.LogException(ex);
                // Console.WriteLine("❌ Exception: " + ex.Message);
                return StatusCode(500, new { message = "Internal Server Error", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteHoliday([FromBody] DeleteHolidayModel holidayData)
        {
            try
            {
                if (holidayData == null || holidayData.id <= 0 || string.IsNullOrEmpty(holidayData.schoolid))
                {
                    return BadRequest(new { message = "Invalid holiday ID or schoolid missing." });
                }

                var response = await _holiday.DeleteHoliday(holidayData.id, holidayData.schoolid);

                if (response)
                {
                    return Ok(new { message = "Holiday deleted successfully!" });
                }
                else
                {
                    return BadRequest(new { message = "Failed to delete holiday." });
                }
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                return StatusCode(500, new { message = "Internal Server Error", error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> TotalStudentSummary()
        {
            try
            {
                string uid = HttpContext.Session.GetString("uid");
                string database = HttpContext.Session.GetString("database");
                if (!String.IsNullOrEmpty(uid))
                {
                    var model = await _dashboardRepository.TotalSutudentSummary(uid, database);
                    return Json(model);
                }
                return Json("");
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                return Json("");

            }

        }


        [HttpGet]
        public async Task<IActionResult> TodaynotificationSummary( )
        {
            try
            {
                string uid = HttpContext.Session.GetString("uid");
                if (!String.IsNullOrEmpty(uid))
                {
                    var model = await _dashboardRepository.TotalTodayNotificationsSummary(uid);
                    return Json(model);
                }
                return Json("");
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                return Json("");

            }

        }

        [HttpGet]
        public async Task<IActionResult> TotalnotificationSummary(int page, int pageSize)
        {
            try
            {
                string uid = HttpContext.Session.GetString("uid");
                if (!String.IsNullOrEmpty(uid))
                {
                    var model = await _dashboardRepository.TotalNotificationsSummary(uid, page, pageSize);
                    return Json(model);
                }
                return Json("");
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                return Json("");

            }

        }

        
        [HttpGet]
        public async Task<IActionResult> TotalBusesSummary()
        {
            try
            {
                string uid = HttpContext.Session.GetString("uid");
                string database = HttpContext.Session.GetString("database");
                if (!String.IsNullOrEmpty(uid))
                {
                    var model = await _dashboardRepository.TotalBusesSummary(uid,database);
                    return Json(model);
                }
                return Json("");
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                return Json("");

            }

        }

        [HttpGet]
        public async Task<IActionResult> TotalLiveRoutesSummary()
        {
            try
            {
                string uid = HttpContext.Session.GetString("uid");
                string database = HttpContext.Session.GetString("database");
                if (!String.IsNullOrEmpty(uid))
                {
                    var model = await _dashboardRepository.TotalLiveRoutesSummary(uid,database);
                    return Json(model);
                }
                return Json("");
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                return Json("");

            }

        }


        [HttpGet]
        public async Task<string> address(string latitude, string longitude)
        {
            try
            {
                var result = await _dashboardRepository.Address(latitude, longitude);
                if (string.IsNullOrWhiteSpace(result)) return "";

                try
                {
                    var token = JToken.Parse(result);
                    if (token.Type == JTokenType.String)
                        return token.Value<string>()?.Trim() ?? "";

                    return token.SelectTokens("$..*")
                        .OfType<JValue>()
                        .Select(value => value.Value<string>()?.Trim())
                        .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value)) ?? "";
                }
                catch (Exception ex)
                {
                    General.LogException(ex);
                    return result.Trim().Trim('"');
                }
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                return "";
            }
        }


        [HttpGet]
        public async Task<IActionResult> DownloadStudentsExcel()
        {
            try
            {
                string? userId = HttpContext.Session.GetString("uid");
                string? schoolName = HttpContext.Session.GetString("schoolname");

                if (string.IsNullOrEmpty(userId))
                {
                    TempData["ErrorMessage"] = "Session expired. Please login again.";
                    return RedirectToAction("Index", "Home");
                }

                var fileBytes = await _students.DownloadStudentsExcel(userId);

                if (fileBytes == null || fileBytes.Length == 0)
                {
                    TempData["ErrorMessage"] = "No student data found for download.";
                    return RedirectToAction("Students", "Home");
                }

                string fileName = string.IsNullOrWhiteSpace(schoolName)
                    ? "Students.xlsx"
                    : $"{schoolName}_Students.xlsx";

                return File(
                    fileBytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    fileName
                );
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                // Console.WriteLine("Error in DownloadStudentsExcel: " + ex.Message);
                TempData["ErrorMessage"] = "An error occurred while downloading student excel.";
                return RedirectToAction("Students", "Home");
            }
        }




        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        [HttpGet]
        public IActionResult visitorDetails()
        {
            return View("Views/Home/IndoorTracking/VisitorDetails/visitorDetails.cshtml", new Visitor());
        }

        [HttpPost]
        public async Task<IActionResult> AddvisitorDetails(Visitor model)
        {
            if (ModelState.IsValid)
            {
                string jsonData = JsonConvert.SerializeObject(model);

                StringContent content = new StringContent(jsonData, Encoding.UTF8, "application/json");
                string? url = _configure["api_endpoint"];

                HttpResponseMessage response = await _httpClient.PostAsync($"{url}visitor/AddVisitor", content);

                string responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    bool isSaved = bool.TryParse(responseContent, out bool apiResult) && apiResult;
                    TempData["SuccessMessage"] = "Visitor details saved successfully.";
                    return RedirectToAction("visitorDetails");
                }
                else
                {
                    TempData["ErrorMessage"] = "Something Went Wrong !";
                    return RedirectToAction("visitorDetails");
                }

            }


            return RedirectToAction("visitorDetails");
        }

        [HttpGet]
        public IActionResult addStaffDetails()
        {
            string? uid = HttpContext.Session.GetString("uid");
            int.TryParse(uid, out int sysUserId);

            Staff model = new Staff
            {
                sys_user_id = sysUserId,

            };


            return View("Views/Home/IndoorTracking/Staff Details/addStaffDetails.cshtml", model);
        }

        [HttpGet]
        public async Task<IActionResult> staffDetails()
        {
            List<Staff> staffList = new List<Staff>();

            try
            {
                string? uid = HttpContext.Session.GetString("uid");
                if (!string.IsNullOrEmpty(uid))
                {
                    string? url = _configure["api_endpoint"];
                    HttpResponseMessage response = await _httpClient.GetAsync($"{url}Staff/GetAllStaffDetails?uid={uid}");

                    if (response.IsSuccessStatusCode)
                    {
                        string responseData = await response.Content.ReadAsStringAsync();
                        staffList = JsonConvert.DeserializeObject<List<Staff>>(responseData) ?? new List<Staff>();
                    }
                }
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                TempData["ErrorMessage"] = "Unable to load staff details: " + ex.Message;
            }

            return View("Views/Home/IndoorTracking/Staff Details/staffDetails.cshtml", staffList);
        }

        [HttpGet]
        public async Task<IActionResult> downloadStaffdetailsTemp()
        {
            // ✅ EPPlus license setting
            ExcelPackage.LicenseContext = OfficeOpenXml.LicenseContext.NonCommercial;

            using (var package = new ExcelPackage())
            {
                var sheet = package.Workbook.Worksheets.Add("Staff Detail Template");

                // ✅ Add headers only
                sheet.Cells[1, 1].Value = "Employee Code";
                sheet.Cells[1, 2].Value = "Name";
                sheet.Cells[1, 3].Value = "Mobile Number";
                sheet.Cells[1, 4].Value = "RFID";
                sheet.Cells[1, 5].Value = "In Time";
                sheet.Cells[1, 6].Value = "Out Time";
                sheet.Cells[1, 7].Value = "Address";

                // ✅ Auto-fit columns
                sheet.Cells[sheet.Dimension.Address].AutoFitColumns();

                // ✅ Stream to client
                var stream = new MemoryStream();
                await package.SaveAsAsync(stream);
                stream.Position = 0;

                return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Staff_Details_Format.xlsx");
            }
        }
        [HttpGet]
        public IActionResult StaffBulkUploadFile()
        {
            return View("Views/Home/IndoorTracking/Staff Details/staffbulkupload.cshtml");
        }

        [HttpPost]
        public async Task<IActionResult> AddStaffInBulk(IFormFile excelfile)
        {
            try
            {
                if (excelfile == null || excelfile.Length == 0)
                {
                    TempData["ErrorMessage"] = "No file uploaded!";
                    return RedirectToAction("staffDetails", "Home");
                }

                string? uid = HttpContext.Session.GetString("uid");
                if (string.IsNullOrEmpty(uid))
                {
                    TempData["ErrorMessage"] = "User session not found. Please login again.";
                    return RedirectToAction("staffDetails", "Home");
                }

                // Validate Excel content before sending to API
                ExcelPackage.LicenseContext = OfficeOpenXml.LicenseContext.NonCommercial;
                var errors = new List<string>();
                var empCodeSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var rfidSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                using (var stream = new MemoryStream())
                {
                    await excelfile.CopyToAsync(stream);
                    stream.Position = 0;
                    using (var package = new ExcelPackage(stream))
                    {
                        var sheet = package.Workbook.Worksheets.FirstOrDefault();
                        if (sheet == null)
                        {
                            TempData["ErrorMessage"] = "Uploaded file contains no worksheet.";
                            return RedirectToAction("StaffBulkUploadFile", "Home");
                        }

                        int startRow = 2; // assume headers in first row
                        int totalRows = sheet.Dimension?.Rows ?? 0;

                        // allow a few common datetime formats
                        var dateFormats = new[] {
                            "yyyy MM dd HH mm ss",
                            "yyyy-MM-dd HH:mm:ss",
                            "yyyy-MM-ddTHH:mm:ss",
                            "yyyy/MM/dd HH:mm:ss",
                            "yyyy-MM-dd HH:mm",
                            "yyyy-MM-ddTHH:mm",
                            "MM/dd/yyyy HH:mm:ss",
                            "MM/dd/yyyy HH:mm"
                        };

                        for (int row = startRow; row <= totalRows; row++)
                        {
                            var empCode = (sheet.Cells[row, 1].Text ?? string.Empty).Trim();
                            var name = (sheet.Cells[row, 2].Text ?? string.Empty).Trim();
                            var mobile = (sheet.Cells[row, 3].Text ?? string.Empty).Trim();
                            var rfid = (sheet.Cells[row, 4].Text ?? string.Empty).Trim();
                            var inTimeText = (sheet.Cells[row, 5].Text ?? string.Empty).Trim();
                            var outTimeText = (sheet.Cells[row, 6].Text ?? string.Empty).Trim();
                            var address = (sheet.Cells[row, 7].Text ?? string.Empty).Trim();

                            // skip empty rows (all empty)
                            if (string.IsNullOrEmpty(empCode) && string.IsNullOrEmpty(name) && string.IsNullOrEmpty(rfid) && string.IsNullOrEmpty(inTimeText) && string.IsNullOrEmpty(outTimeText))
                                continue;

                            if (string.IsNullOrEmpty(empCode))
                                errors.Add($"Row {row}: Employee Code is required.");

                            if (string.IsNullOrEmpty(rfid))
                                errors.Add($"Row {row}: RFID is required.");

                            // check duplicate within file
                            if (!string.IsNullOrEmpty(empCode))
                            {
                                if (!empCodeSet.Add(empCode))
                                    errors.Add($"Row {row}: Duplicate Employee Code '{empCode}' in uploaded file.");
                            }

                            if (!string.IsNullOrEmpty(rfid))
                            {
                                if (!rfidSet.Add(rfid))
                                    errors.Add($"Row {row}: Duplicate RFID '{rfid}' in uploaded file.");
                            }

                            // parse in/out times: allow Excel date cells as well
                            DateTime inTimeVal, outTimeVal;
                            bool inParsed = false, outParsed = false;

                            var inCell = sheet.Cells[row, 5];
                            if (inCell.Value is DateTime dtIn)
                            {
                                inTimeVal = dtIn;
                                inParsed = true;
                            }
                            else
                            {
                                inParsed = DateTime.TryParseExact(inTimeText, dateFormats, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out inTimeVal)
                                           || DateTime.TryParse(inTimeText, out inTimeVal);
                            }

                            var outCell = sheet.Cells[row, 6];
                            if (outCell.Value is DateTime dtOut)
                            {
                                outTimeVal = dtOut;
                                outParsed = true;
                            }
                            else
                            {
                                outParsed = DateTime.TryParseExact(outTimeText, dateFormats, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out outTimeVal)
                                            || DateTime.TryParse(outTimeText, out outTimeVal);
                            }

                            if (!inParsed)
                                errors.Add($"Row {row}: In Time '{inTimeText}' is not in a valid format. Expected formats: yyyy MM dd HH mm ss or yyyy-MM-dd HH:mm:ss.");

                            if (!outParsed)
                                errors.Add($"Row {row}: Out Time '{outTimeText}' is not in a valid format. Expected formats: yyyy MM dd HH mm ss or yyyy-MM-dd HH:mm:ss.");

                            if (inParsed && outParsed)
                            {
                                if (!(inTimeVal < outTimeVal))
                                    errors.Add($"Row {row}: In Time must be earlier than Out Time.");
                            }
                        }
                    }
                }

                if (errors.Any())
                {
                    TempData["excelErrorList"] = JsonConvert.SerializeObject(errors); ;
                    TempData["excelErrorMessage"] = "Validation failed for uploaded file.";
                    return RedirectToAction("staffDetails", "Home");
                }


                // if validation passed, forward file to backend API
                using (var content = new MultipartFormDataContent())
                {
                    // reset stream so API receives whole file
                    excelfile.OpenReadStream().Position = 0;
                    content.Add(new StreamContent(excelfile.OpenReadStream()), "file", excelfile.FileName);
                    content.Add(new StringContent(uid), "user_id");

                    string? url = _configure["api_endpoint"];
                    HttpResponseMessage response = await _httpClient.PostAsync($"{url}Staff/AddStaffInBulk", content);
                    string responseBody = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        var result = JsonConvert.DeserializeObject<Dictionary<string, object>>(responseBody);
                        TempData["SuccessMessage"] = result != null && result.ContainsKey("message")
                            ? result["message"]?.ToString()
                            : "Staff uploaded successfully.";
                        if (result != null &&
        result.ContainsKey("errors") &&
        result["errors"] != null &&
        result["errors"].ToString() != "[]")
                        {
                            TempData["ErrorMessage"] =
                                "Staff bulk upload warnings: " + result["errors"].ToString();
                        }
                    }
                    else
                    {
                        TempData["ErrorMessage"] = "Few Staff Details upload failed. " + responseBody;
                    }
                }
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                TempData["ErrorMessage"] = "An unexpected error occurred during staff bulk upload: " + ex.Message;
            }

            return RedirectToAction("staffDetails", "Home");
        }

        [HttpPost]
        public async Task<IActionResult> AddStaff(Staff model)
        {
            try
            {
                string? uid = HttpContext.Session.GetString("uid");
                if (!int.TryParse(uid, out int sysUserId))
                {
                    return RedirectToAction("StaffDetails");
                }

                model.sys_user_id = sysUserId;
                

                string jsonData = JsonConvert.SerializeObject(model);
                string urlend = $@"Staff/AddStaffDetails";
                string response = await _apitemplate.PostApiTemplate(jsonData, urlend);

                if (response == "true")
                {

                    TempData["SuccessMessage"] = "Staff saved successfully.";
                    return RedirectToAction("StaffDetails");
                }
                else
                {
                    TempData["ErrorMessage"] = "RFID and Employee ID must be unique.";
                    return RedirectToAction("StaffDetails");
                }
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                TempData["ErrorMessage"] = "Something Went Wrong !";
                return RedirectToAction("StaffDetails");
            }
        }

        [HttpGet]
        public async Task<IActionResult> DownloadstaffDetails()
        {
            List<Staff> staffList = new List<Staff>();

            try
            {
                string? uid = HttpContext.Session.GetString("uid");

                if (!string.IsNullOrEmpty(uid))
                {
                    string? url = _configure["api_endpoint"];
                    HttpResponseMessage response = await _httpClient.GetAsync($"{url}Staff/GetAllStaffDetails?uid={uid}");

                    if (response.IsSuccessStatusCode)
                    {
                        string responseData = await response.Content.ReadAsStringAsync();
                        staffList = JsonConvert.DeserializeObject<List<Staff>>(responseData) ?? new List<Staff>();
                    }
                }

                ExcelPackage.LicenseContext = OfficeOpenXml.LicenseContext.NonCommercial;

                using (var package = new ExcelPackage())
                {
                    var sheet = package.Workbook.Worksheets.Add("Staff Details");

                    sheet.Cells[1, 1].Value = "S.No";
                    sheet.Cells[1, 2].Value = "Employee Code";
                    sheet.Cells[1, 3].Value = "Name";
                    sheet.Cells[1, 4].Value = "RFID";
                    sheet.Cells[1, 5].Value = "Mobile Number";
                    sheet.Cells[1, 6].Value = "Address";
                    sheet.Cells[1, 7].Value = "In Time";
                    sheet.Cells[1, 8].Value = "Out Time";

                    for (int i = 0; i < staffList.Count; i++)
                    {
                        sheet.Cells[i + 2, 1].Value = i + 1;
                        sheet.Cells[i + 2, 2].Value = staffList[i].emp_code;
                        sheet.Cells[i + 2, 3].Value = staffList[i].name;
                        sheet.Cells[i + 2, 4].Value = staffList[i].rf_id;
                        sheet.Cells[i + 2, 5].Value = staffList[i].mobile_no;
                        sheet.Cells[i + 2, 6].Value = staffList[i].address;
                        sheet.Cells[i + 2, 7].Value = staffList[i].in_time.ToString("yyyy-MM-dd HH:mm");
                        sheet.Cells[i + 2, 8].Value = staffList[i].out_time.ToString("yyyy-MM-dd HH:mm");
                    }

                    if (sheet.Dimension != null)
                    {
                        sheet.Cells[sheet.Dimension.Address].AutoFitColumns();
                    }

                    var stream = new MemoryStream();
                    await package.SaveAsAsync(stream);
                    stream.Position = 0;

                    return File(
                        stream,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "Staff_Details.xlsx"
                    );
                }
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                TempData["ErrorMessage"] = "Unable to download staff details: " + ex.Message;
                return RedirectToAction("staffDetails");
            }
        }
        
        [HttpPost]
        public async Task<IActionResult> RFID()
        {
            try
            {
                string? uid = HttpContext.Session.GetString("uid");
                string? db = HttpContext.Session.GetString("database");

                if (!string.IsNullOrEmpty(uid))
                {
                    var model = await _dashboardRepository.RFIDPUNCHED(uid,db);

                    if (model != "-1" &&
                        model != "0" &&
                        model != "Something went wrong")
                    {
                       

                        return Json(model);
                    }
                }

                return Json(new List<dynamic>());
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                return Json(new List<dynamic>());
            }
        }

        [HttpPost]
        public async Task<IActionResult> FilterNotifications(
           
    string startDate,
    string startTime,
    string endDate,
    string endTime,string notificationStatus)
        {
            try
            {
                string token= HttpContext.Session.GetString("token");
                var startDateTime = DateTime.ParseExact(
                    $"{startDate} {startTime}",
                    "yyyy-MM-dd HH:mm",
                    System.Globalization.CultureInfo.InvariantCulture
                );

                var endDateTime = DateTime.ParseExact(
                    $"{endDate} {endTime}",
                    "yyyy-MM-dd HH:mm",
                    System.Globalization.CultureInfo.InvariantCulture
                );

                var notifications = 
                await _dashboardRepository.GetFilteredNotifications(
                    startDateTime,
                    endDateTime,token, notificationStatus
                );

                return Json(new
                {
                    success = true,
                    data = notifications
                });
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                _logger.LogError(
                    ex,
                    "Error loading filtered notifications"
                );

                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to load notifications."
                });
            }
           }
        
            [HttpPost]
        public async Task<IActionResult> MarkNotificationAsRead(
    [FromBody] NotificationReadRequest request)
         {
            if (request?.Id is null || request.Id <= 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "A valid notification ID is required."
                });
            }

            try
            {
                string token = HttpContext.Session.GetString("token");
                

                var notifications =
                await _dashboardRepository.MarkNotificationAsRead(
                 request.Id.Value.ToString(),token
                );

                return Json(new
                {
                    success = true,
                    data = notifications
                });
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                _logger.LogError(
                    ex,
                    "Error loading filtered notifications"
                );

                return StatusCode(500, new
                {
                    success = false,
                    message = "Unable to load notifications."
                });
            }
        }
    }


}
