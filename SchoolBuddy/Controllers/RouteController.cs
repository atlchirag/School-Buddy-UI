using Microsoft.AspNetCore.Mvc;
using Microsoft.Win32.SafeHandles;
using Newtonsoft.Json;
using SchoolBuddy.Models.Route;
using SchoolBuddy.Models.Students;
using System.Reflection;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace SchoolBuddy.Controllers
{
    [Route("{controller}/{action}")]
    public class RouteController : BaseController
    {
        List<getstop> stop_details = new List<getstop>();
        List<routedetails> student_details = new List<routedetails>();

        private readonly IRouteRepository _route;
        private readonly IConfiguration _cfg;
        List<routedetails> route_list = new List<routedetails>();
        List<busnumber> buses = new List<busnumber>();

        public RouteController(IRouteRepository route, IConfiguration cfg)
        {
            _route = route;
            _cfg = cfg;
        }
        [HttpGet]
        public IActionResult Trip(string? id = null)
        {
            try
            {
                if (id == null)
                {

                    ViewBag.del = TempData["del"];
                    string? uid = HttpContext.Session.GetString("uid");
                    string? db = HttpContext.Session.GetString("database");

                    ViewBag.SysUserId = uid;

                    var model = _route.GetAllRouteAPICall(uid, db).Result;
                    route_list = JsonConvert.DeserializeObject<List<routedetails>>(model);
                    ViewBag.RouteList = route_list.Select(x => new
                    {
                        x.id,
                        x.route_name
                    }).ToList();
                    return View("~/Views/Home/Master/Route/Trip.cshtml", route_list);


                }
                else
                {
                    //AddOrEditStudent = HttpContext.Request.GetEncodedUrl();
                    ViewData["Type"] = "Edit Student";
                    HttpContext.Session.SetString("student_id", $"{id}");

                    TempData["action"] = "Edit";
                    HttpContext.Session.SetString("editoradd", "edit");
                    var model = _route.GetRouteByID(id).Result;
                    routedetails? rd = new routedetails();
                    rd = JsonConvert.DeserializeObject<routedetails>(model);
                    return View("~/Views/Home/Master/Student/AddStudent.cshtml", rd);
                    //return RedirectToAction("AddStudent", "Home", new {student = students });

                }

                //return View("~/Views/Home/Master/Route/Trip.cshtml");
            }
            catch (Exception ex)
            {
                return View("~/Views/Home/Master/Route/Trip.cshtml");

            }

        }





        [HttpGet]
        public async Task<IActionResult> GetTripById(string id)
        {
            try
            {
                if (id == null)
                {

                    return Ok("");

                }
                else
                {

                    var model = _route.GetRouteByID(id).Result;

                    return Ok(model);
                    //return RedirectToAction("AddStudent", "Home", new {student = students });

                }

                //return View("~/Views/Home/Master/Route/Trip.cshtml");
            }
            catch (Exception ex)
            {
                return Ok("");

            }

        }

        [HttpPost]
        public async Task<bool> deleteroute(string rid)
        {

            var modal = await _route.DeleteRoute(rid);

            if (modal == "true")
            {
                //TempData["result"] = $"stop deleted successfully.";
                return true;

            }
            else
            {
                //TempData["result"] = $"Deletion Failed";
                return false;
            }
            //var modal1 = await _route.getStops(rid);

            //stop_details = JsonConvert.DeserializeObject<List<getstop>>(modal1);

            //return RedirectToAction("stopSection", new { id = rid });




        }




        [HttpGet]
        public IActionResult createExpense()
        {
            return View();
        }

        public IActionResult createtrip()
        {

            string uid = HttpContext.Session.GetString("uid");
            string db = HttpContext.Session.GetString("database");


            var model = _route.GetBuses(uid, db).Result;
            if (model == "Data Not Found")
            {
                return View("~/Views/Home/Master/Route/createtrip.cshtml");

            }
            else
            {
                buses = JsonConvert.DeserializeObject<List<busnumber>>(model);
                return View("~/Views/Home/Master/Route/createtrip.cshtml", buses);
            }

        }
        [HttpPost]
        public IActionResult addRoute(string route_name, string veh_reg, string start_time_up, string end_time_up, string option)
        {
            try
            {
                string? school_id = HttpContext.Session.GetString("uid");
                string? db = HttpContext.Session.GetString("database");

                if (string.IsNullOrEmpty(school_id))
                {
                    return AddRouteResponse(false, "Session expired. Please login again.", true);
                }

                route_name = route_name?.Trim();
                veh_reg = veh_reg?.Trim();
                start_time_up = start_time_up?.Trim();
                end_time_up = end_time_up?.Trim();
                option = option?.Trim();

                if (string.IsNullOrEmpty(route_name))
                {
                    return AddRouteResponse(false, "Route Name is required.");
                }

                if (string.IsNullOrEmpty(veh_reg))
                {
                    return AddRouteResponse(false, "Select Bus is required.");
                }

                if (string.IsNullOrEmpty(start_time_up))
                {
                    return AddRouteResponse(false, "Start Time is required.");
                }

                if (string.IsNullOrEmpty(end_time_up))
                {
                    return AddRouteResponse(false, "End Time is required.");
                }

                if (!TimeSpan.TryParse(start_time_up, out var startTime) ||
                    !TimeSpan.TryParse(end_time_up, out var endTime) ||
                    startTime >= endTime)
                {
                    return AddRouteResponse(false, "Start Time must be earlier than End Time.");
                }

                if (string.IsNullOrEmpty(option))
                {
                    return AddRouteResponse(false, "Trip Type is required.");
                }

                string finalRouteName = $"{route_name} {option}".Trim();


                // MVC level duplicate check
                var allRoutesJson = _route.GetAllRouteAPICall(school_id, db).Result;

                if (!string.IsNullOrWhiteSpace(allRoutesJson) &&
                    allRoutesJson != "Data Not Found")
                {
                    var existingRoutes =
                        JsonConvert.DeserializeObject<List<routedetails>>(allRoutesJson)
                        ?? new List<routedetails>();

                    // 1. Same route name for user
                    bool isDuplicate = existingRoutes.Any(r =>
                        !string.IsNullOrWhiteSpace(r.route_name) &&
                        r.route_name.Trim().Equals(
                            finalRouteName,
                            StringComparison.OrdinalIgnoreCase));

                    if (isDuplicate)
                    {
                        return AddRouteResponse(
                            false,
                            "Same route name already exists for this user.");
                    }

                    // 2. Same vehicle + overlapping time
                    bool isVehicleAssigned = existingRoutes.Any(r =>
                        !string.IsNullOrWhiteSpace(r.veh_reg) &&
                        r.veh_reg.Trim().Equals(
                            veh_reg,
                            StringComparison.OrdinalIgnoreCase)
                        &&
                        TimeSpan.TryParse(r.start_time_up, out var existingStartTime) &&
                        TimeSpan.TryParse(r.end_time_up, out var existingEndTime) &&
                        existingStartTime < endTime &&
                        existingEndTime > startTime
                    );

                    if (isVehicleAssigned)
                    {
                        return AddRouteResponse(
                            false,
                            "This vehicle is already assigned to another route during this time.");
                    }
                }

                routedetails routedetails = new routedetails
                {
                    service_id = veh_reg,
                    route_name = finalRouteName,
                    start_time_up = start_time_up,
                    end_time_up = end_time_up
                };

                var model = _route.AddRoute(routedetails, school_id).Result;

                if (!string.IsNullOrEmpty(model) && model.Trim().ToLower() == "true")
                {
                    return AddRouteResponse(true, "Trip created successfully.");
                }
                else
                {
                    return AddRouteResponse(false, "Trip creation failed. Route may already exist.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in addRoute: " + ex.Message);
                return AddRouteResponse(false, "An unexpected error occurred while creating trip.");
            }
        }

        private IActionResult AddRouteResponse(bool success, string message, bool sessionExpired = false)
        {
            bool isAjax = string.Equals(
                Request.Headers["X-Requested-With"].ToString(),
                "XMLHttpRequest",
                StringComparison.OrdinalIgnoreCase);

            if (isAjax)
            {
                return Json(new { success, message });
            }

            TempData[success ? "SuccessMessage" : "ErrorMessage"] = message;
            return success || sessionExpired
                ? RedirectToAction(sessionExpired ? "Index" : "Trip", sessionExpired ? "Home" : "Route")
                : RedirectToAction("createtrip", "Route");
        }



        [HttpPost]
        public IActionResult editRoute(string routeid, string route_name, string veh_reg, string start_time_up, string end_time_up, string option)
        {
            string school_id = HttpContext.Session.GetString("uid");

            route_name = (route_name ?? "").Trim();
            option = (option ?? "").Trim();

            string routename;

            // If the selected option already exists, keep the route name unchanged
            if (route_name.Contains(option, StringComparison.OrdinalIgnoreCase))
            {
                routename = route_name;
            }
            // Replace "pick" with the selected option
            else if (route_name.Contains("pick", StringComparison.OrdinalIgnoreCase))
            {
                routename = System.Text.RegularExpressions.Regex.Replace(
                    route_name,
                    @"\bpick\b",
                    option,
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            }
            // Replace "drop" with the selected option
            else if (route_name.Contains("drop", StringComparison.OrdinalIgnoreCase))
            {
                routename = System.Text.RegularExpressions.Regex.Replace(
                    route_name,
                    @"\bdrop\b",
                    option,
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            }
            // If neither exists, append the selected option
            else
            {
                routename = $"{route_name} {option}".Trim();
            }
            Eroutedetails routedetails = new Eroutedetails
            {
                id = routeid,

                route_name = routename,
                start_time_up = start_time_up,
                end_time_up = end_time_up,
                rowupdated = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                service_id = veh_reg   // NEW: this is the selected bus id

            };
            var model = _route.UpdateRoute(routedetails, school_id).Result;
            //var model1 = _route.GetAllRouteAPICall(school_id).Result;
            route_list.Clear();
            //route_list = JsonConvert.DeserializeObject<List<routedetails>>(model1);
            //return RedirectToAction("Trip", "Route", new { routelist = route_list });
            return RedirectToAction("Trip", "Route");



        }

        [HttpGet]
        public async Task<IActionResult> stopSection(string id)
        {
            TempData["r_id"] = id;
            ViewData["r_id"] = id;

            var modal = await _route.getStops(id);
            if (modal != "-1" && modal != "0")
            {
                stop_details = JsonConvert.DeserializeObject<List<getstop>>(modal);

                return View("~/Views/Home/Master/Route/stop.cshtml", stop_details);
            }
            return View("~/Views/Home/Master/Route/stop.cshtml");

        }

        //[HttpGet]
        //public IActionResult Halts()
        //{
        //    var uid = HttpContext.Session.GetString("uid") ?? "";
        //    var db = HttpContext.Session.GetString("database") ?? "";

        //    ViewBag.SysUserId = uid;
        //    ViewBag.ApiEndpoint = Url.Content("~/api/halts");  // <-- add this

        //    var json = _route.GetAllRouteAPICall(uid, db).Result;
        //    var routes = string.IsNullOrWhiteSpace(json) || json == "Data Not Found"
        //        ? new List<SchoolBuddy.Models.Route.routedetails>()
        //        : JsonConvert.DeserializeObject<List<SchoolBuddy.Models.Route.routedetails>>(json) ?? new();

        //    return View("~/Views/Home/Master/Route/Halts.cshtml", routes);
        //}

        [HttpGet]
        public IActionResult Halts()
        {
            var uid = HttpContext.Session.GetString("uid") ?? "";
            var db = HttpContext.Session.GetString("database") ?? "";

            ViewBag.SysUserId = uid;


            //var api = (_cfg["api_endpoint"] ?? "").TrimEnd('/');
            //ViewBag.ApiEndpoint = api; 
            ViewBag.ApiEndpoint = "/sbapi/api";

            var json = _route.GetAllRouteAPICall(uid, db).Result;
            var routes = string.IsNullOrWhiteSpace(json) || json == "Data Not Found"|| json== "Something Went Wrong"
                ? new List<SchoolBuddy.Models.Route.routedetails>()
                : JsonConvert.DeserializeObject<List<SchoolBuddy.Models.Route.routedetails>>(json) ?? new();
            return View("~/Views/Home/Master/Route/Halts.cshtml", routes);
        }

        [HttpPost]
        public async Task<IActionResult> GetHaltsMultiDayData([FromBody] SchoolBuddy.Models.Route.HaltsRequest req)
        {
            try
            {
                if (req == null || string.IsNullOrWhiteSpace(req.routeId) || string.IsNullOrWhiteSpace(req.startDate) || string.IsNullOrWhiteSpace(req.endDate))
                    return Content("[]", "application/json");
                string pass = HttpContext.Session.GetString("password");
                string user = HttpContext.Session.GetString("username");

                var json = await _route.GetHaltsMultiDayTelemetry(req.schoolId, req.routeId, req.startDate, req.endDate, pass, user);
                return Content(string.IsNullOrWhiteSpace(json) ? "[]" : json, "application/json");
            }
            catch
            {
                return Content("[]", "application/json");
            }
        }
        [HttpPost]
        public async Task<IActionResult> GetExistingStopsData([FromBody] SchoolBuddy.Models.Route.ExistingStopsRequest req)
        {
            try
            {
                if (req == null || string.IsNullOrWhiteSpace(req.route_id))
                    return Content("[]", "application/json");

                var json = await _route.GetExistingStops(req.route_id);

                if (string.IsNullOrWhiteSpace(json) || json == "-1" || json == "0")
                    return Content("[]", "application/json");

                return Content(json, "application/json");
            }
            catch
            {
                return Content("[]", "application/json");
            }
        }

        [HttpPost]
        public async Task<IActionResult> SubmitDraftStops([FromBody] List<SchoolBuddy.Models.Route.DraftStopRequest> stops)
        {
            try
            {
                string? school_id = HttpContext.Session.GetString("uid");
                if (school_id == null)
                    return Json(new { success = false, message = "Session expired" });

                if (stops == null || stops.Count == 0)
                    return Json(new { success = false, message = "No stops to save" });

                int successCount = 0;

                foreach (var s in stops)
                {
                    Stop sp = new Stop
                    {
                        Stop_Name = s.stop_name,
                        Latitude = s.latitude,
                        Longitude = s.longitude,
                        uid = school_id,
                        route_id = s.route_id,
                        stop_order = s.stop_order
                    };

                    var result = await _route.AddStop(sp);
                    if (result == "true")
                        successCount++;
                }

                return Json(new
                {
                    success = successCount > 0,
                    saved = successCount,
                    total = stops.Count
                });
            }
            catch
            {
                return Json(new { success = false, message = "Something went wrong" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> assignedStudents(string id)
        {
            TempData["r_id"] = id;
            ViewData["r_id"] = id;

            var modal = await _route.geAssignedStudents_route(id);
            if (modal != "-1" && modal != "0")
            {
                student_details = JsonConvert.DeserializeObject<List<routedetails>>(modal);

                //return View("~/Views/Home/Master/Route/Trip.cshtml", student_details);
                return Json(student_details);
            }
            //return View("~/Views/Home/Master/Route/Trip.cshtml");
            return Json(new { status = "No data found" });
        }

        [HttpPost]
        public async Task<IActionResult> addstop(string stopname, string lat, string lng, string rid)
        {
            string stop_order = "";
            string? school_id = HttpContext.Session.GetString("uid");
            if (school_id == null)
            {
                return RedirectToAction("Index", "Home");

            }

            Stop sp = new Stop
            {
                Stop_Name = stopname,
                Latitude = lat,
                Longitude = lng,
                uid = school_id,
                route_id = rid,
                stop_order = stop_order
            };
            var json = await _route.GetExistingStops(rid);

            if (!string.IsNullOrWhiteSpace(json) &&
      json != "Data Not Found"  && json!="-1")
            {
                var existingStops =
                    JsonConvert.DeserializeObject<List<ExistingStop>>(json)
                    ?? new List<ExistingStop>();

                // Parse new coordinates once
                bool validLat = double.TryParse(lat, out double newLat);
                bool validLng = double.TryParse(lng, out double newLng);

                // Check duplicate stop by name OR coordinates
                bool isDuplicate = existingStops.Any(x =>
                {
                    // Check same stop name
                    bool sameName =
                        !string.IsNullOrWhiteSpace(x.user_stop_name) &&
                        x.user_stop_name.Trim().Equals(
                            stopname.Trim(),
                            StringComparison.OrdinalIgnoreCase);

                    // Check same coordinates
                    bool sameCoordinates = false;

                    if (validLat &&
                        validLng &&
                        double.TryParse(x.latitude, out double existingLat) &&
                        double.TryParse(x.longitude, out double existingLng))
                    {
                        sameCoordinates =
                            existingLat == newLat &&
                            existingLng == newLng;
                    }

                    return sameName || sameCoordinates;
                });

                if (isDuplicate)
                {
                    TempData["result"] =
                        $"{stopname} or these coordinates already exist in this route.";

                    return RedirectToAction(
                        "stopSection",
                        "Route",
                        new { id = rid });
                }
            }

            var modal = await _route.AddStop(sp);
                if (modal == "true")
                {
                    TempData["result"] = $"{stopname} is added successfully as stop";
                }
                else
                {
                    TempData["result"] = $"Insertion Failed";
                }
            
            

            return RedirectToAction("stopSection", "Route", new { id = rid });

        }


        [HttpPost]
        public async Task<IActionResult> editStop(string id, string stopname, string lat, string lng, string rid)
        {
            string stop_order = "";
            string? school_id = HttpContext.Session.GetString("uid");
            if (school_id == null)
            {
                return RedirectToAction("Index", "Home");
            }

            Stop sp = new Stop
            {
                id = id,
                Stop_Name = stopname,
                Latitude = lat,
                Longitude = lng,
                uid = school_id,
                route_id = rid,
                stop_order = stop_order
            };

            var modal = await _route.EditStop(sp);

            if (modal == "1")
            {
                TempData["result"] = $"{stopname} is updated successfully.";
            }
            else
            {
                TempData["result"] = $"Update Failed";
            }

            return RedirectToAction("stopSection", "Route", new { id = rid });
        }



        [HttpPost]
        public async Task<bool> deletestop(string stopid, string rid)
        {

            var modal = await _route.DeleteStop(stopid, rid);

            if (modal == "true")
            {
                TempData["result"] = $"stop deleted successfully.";
                return true;
            }
            else
            {
                TempData["result"] = $"Deletion Failed";
                return false;
            }
            //var modal1 = await _route.getStops(rid);

            //stop_details = JsonConvert.DeserializeObject<List<getstop>>(modal1);

            //return RedirectToAction("stopSection", new { id = rid });




        }




        [HttpGet]
        public string createVias(string id)
        {
            return "";
        }

        public async Task<string> addVias(string routeid, string sdate, string edate)
        {
            try
            {
                var model = await _route.GetRouteByID(routeid);
                routedetails rd = new routedetails();
                rd = JsonConvert.DeserializeObject<routedetails>(model);
                string device_id = rd.device_id;
                var modal = await _route.getPlayBack(routeid, sdate, edate);
                List<playbackdata> pb = new List<playbackdata>();
                pb = JsonConvert.DeserializeObject<List<playbackdata>>(modal);
                for (int index = 0; index < pb.Count; index++)
                {
                    playbackdata pbd = new playbackdata
                    {
                        Route_id = routeid,
                        lat = pb[index].lat,


                    };
                }
                return "";
            }
            catch (Exception ex)
            {
                return " ";
            }

        }



        [HttpPost]
        public async Task<IActionResult> AssignStudents(IFormFile excelfile, string routeid)
        {
            string schoolid = HttpContext.Session.GetString("uid");
            if (schoolid != null)
            {
                if (excelfile.FileName.Contains(".xls") && excelfile.FileName.Contains(".xlsx"))
                {
                    var model = await _route.AssignStudents(excelfile, routeid, schoolid);
                    TempData["res"] = model;
                    //return Json(new { redirectUrl = Url.Action("Trip", "Route") });

                    return RedirectToAction("stopSection", "Route", new { id = routeid });
                }
                TempData["result"] = "Please upload valid Excel Sheet";
                return RedirectToAction("stopSection", "Route", new { id = routeid });
                //return true;
            }
            //return RedirectToAction("Trip", "Route");
            return BadRequest("School ID is null");

        }



        [HttpPost]
        public async Task<IActionResult> assign_student(string StudentName, string AdmissionNumber, string StopId, string RFId, string routeid)
        {
            string? school_id = HttpContext.Session.GetString("uid");
            if (school_id == null)
            {
                return RedirectToAction("Index", "Home");

            }

            assign_student AS = new assign_student
            {
                student_name = StudentName,
                Admission_no = AdmissionNumber,
                stopid = StopId,
                rfid = RFId,
                schoolid = school_id,
                route_id = routeid

            };
            var modal = await _route.AssignStoptosingalstudent(AS);

            TempData["result"] = $"{modal}";

            return RedirectToAction("stopSection", "Route", new { id = routeid });
        }


        [HttpPost]
        public async Task<IActionResult> checkAssignedStudents(string stopid)
        {
            List<getstop> l = new List<getstop>();
            var modal = await _route.getAssignedStudents(stopid);
            if (modal != "-1" && modal != "0")
            {

                return Json(modal);
            }
            return Json("error");

        }

        [HttpPost]
        public async Task<IActionResult> GetStudentWiseList(string id)
        {
            if (string.IsNullOrEmpty(id))
                return Json(new { status = "sys_user_id is null" });

            var modal = await _route.getStudentWise_route(id);

            if (!string.IsNullOrEmpty(modal) && modal != "-1" && modal != "0")
            {
                var student_details = JsonConvert.DeserializeObject<List<studentwise>>(modal);

                return Json(student_details);
            }

            return Json(new { status = "No data found" });
        }

        [HttpGet]
        public async Task<IActionResult> GetBusesForEdit()
        {
            try
            {
                string? uid = HttpContext.Session.GetString("uid");
                string? db = HttpContext.Session.GetString("database");

                if (string.IsNullOrEmpty(uid) || string.IsNullOrEmpty(db))
                    return Json(Array.Empty<object>());

                var model = await _route.GetBuses(uid, db);
                if (model == "Data Not Found" || string.IsNullOrWhiteSpace(model))
                    return Json(Array.Empty<object>());

                // The API returns a DataTable JSON (array of rows). Just pass it through.
                return Content(model, "application/json");
            }
            catch
            {
                return Json(Array.Empty<object>());
            }
        }

        [HttpGet]
        public async Task<IActionResult> DownloadAssignedStudentsExcel(string routeId)
        {
            try
            {
                if (string.IsNullOrEmpty(routeId))
                {
                    TempData["ErrorMessage"] = "Route ID is required.";
                    return RedirectToAction("Trip", "Route");
                }

                var fileBytes = await _route.DownloadAssignedStudentsExcel(routeId);

                if (fileBytes == null || fileBytes.Length == 0)
                {
                    TempData["ErrorMessage"] = "No assigned student data found for export.";
                    return RedirectToAction("Trip", "Route");
                }

                return File(
                    fileBytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"AssignedStudents_Route_{routeId}.xlsx"
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in DownloadAssignedStudentsExcel: " + ex.Message);
                TempData["ErrorMessage"] = "An error occurred while downloading assigned students excel.";
                return RedirectToAction("Trip", "Route");
            }
        }

        [HttpPost]
        //public async Task<IActionResult> UpdateStudent(UpdateStudentModel model)
        //{
        //    try
        //    {
        //        string? uid = HttpContext.Session.GetString("uid");

        //        if (string.IsNullOrWhiteSpace(uid))
        //        {
        //            return Unauthorized(new
        //            {
        //                success = false,
        //                message = "Your session has expired. Please sign in again."
        //            });
        //        }

        //        if (string.IsNullOrWhiteSpace(model.student_id))
        //        {
        //            return BadRequest(new
        //            {
        //                success = false,
        //                message = "Student id is required."
        //            });
        //        }

        //        var response = await _route.UpdateStudentWise(model, uid);

        //        if (string.IsNullOrWhiteSpace(response) ||
        //response.Contains("not", StringComparison.OrdinalIgnoreCase))
        //        {
        //            return StatusCode(StatusCodes.Status400BadRequest, new
        //            {
        //                success = false,
        //                message = "Student update failed."
        //            });
        //        }

        //        route_list.Clear();

        //        return Ok(new
        //        {
        //            success = true,
        //            message = response   // use actual API message
        //        });
        //    }
        //    catch
        //    {
        //        return StatusCode(StatusCodes.Status400BadRequest, new
        //        {
        //            success = false,
        //            message = "Student update failed."
        //        });
        //    }
        //}
        public async Task<IActionResult> UpdateStudent(UpdateStudentModel model)
        {
            try
            {
                string? uid = HttpContext.Session.GetString("uid");

                if (string.IsNullOrWhiteSpace(uid))
                {
                    return Unauthorized(new
                    {
                        success = false,
                        message = "Your session has expired. Please sign in again."
                    });
                }
                

                    if (string.IsNullOrWhiteSpace(model.student_id))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Student id is required."
                    });
                }

                var response = await _route.UpdateStudentWise(model, uid);
                

                if (!string.Equals(
                        response?.Trim().Trim('"'),
                        "Data Updated Successfully",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = string.IsNullOrWhiteSpace(response)
                            ? "Student update failed."
                            : response.Trim().Trim('"')
                    });
                }

                route_list.Clear();

                return Ok(new
                {
                    success = true,
                    message = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        success = false,
                        message = "Student update failed."
                    }
                );
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetStopsByRoute(string id)
        {
            try
            {
                var result = await _route.getStops(id);

                if (string.IsNullOrWhiteSpace(result) || result == "0" || result == "-1")
                {
                    return Ok(new List<getstop>());
                }

                var stopList = JsonConvert.DeserializeObject<List<getstop>>(result)
                               ?? new List<getstop>();

                return Ok(stopList);
            }
            catch (Exception)
            {
                return Ok(new List<getstop>());
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            try { 

            var response = await _route.DeleteStudent(id);
           
                if (string.IsNullOrWhiteSpace(response) ||
       response.Contains("not removed", StringComparison.OrdinalIgnoreCase))
                {
                    return StatusCode(StatusCodes.Status400BadRequest, new
                    {
                        message = "Student update failed."
                    });
                }

                route_list.Clear();

                return Ok(new
                {
                    success = true,
                    message = response   // use actual API message
                });
            }
            catch
            {
                return StatusCode(StatusCodes.Status400BadRequest, new
                {
                    message = "Student update failed."
                });
            }
        }
    }
}
