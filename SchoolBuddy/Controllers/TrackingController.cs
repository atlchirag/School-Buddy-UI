//using Microsoft.AspNetCore.Mvc;
//using SchoolBuddy.Models.Tracking;

//namespace SchoolBuddy.Controllers
//{
//    public class TrackingController : BaseController
//    {
//        private readonly ITracking _tracking;
//        public TrackingController(ITracking tracking) 
//        {
//            _tracking= tracking;
//        }
//        public IActionResult Index()
//        {
//            List<DeviceIdAndVehicle> vehicles = new List<DeviceIdAndVehicle>();
//            string? uid = HttpContext.Session.GetString("username");
//            string? password = HttpContext.Session.GetString("password");
//            string database = HttpContext.Session.GetString("database");
//            vehicles = _tracking.GetVehicles(uid, password,database);
//            return View("/Views/Tracking/Tracking.cshtml", vehicles);
//        }

//        public async Task<string> GetImei(string id)
//        {
//            string database = HttpContext.Session.GetString("database");

//            string imei;
//            imei = await _tracking.GetImei(id,database);
//            return imei;
//        }
//        public async Task<string> LiveTracking(string imei)
//        {
//            string database = HttpContext.Session.GetString("database");
//            string url = _tracking.GetLiveTrackingURL(imei,database);
//            return url;
//        }
//    }
//}
using Microsoft.AspNetCore.Mvc;
using SchoolBuddy.Models.Tracking;
using System.Text.RegularExpressions;

namespace SchoolBuddy.Controllers
{
    public class TrackingController : BaseController
    {
        private readonly ITracking _tracking;
        public TrackingController(ITracking tracking)
        {
            _tracking = tracking;
        }
        //public IActionResult Index()
        //{
        //    List<DeviceIdAndVehicle> vehicles = new List<DeviceIdAndVehicle>();
        //    string? uid = HttpContext.Session.GetString("username");
        //    string? password = HttpContext.Session.GetString("password");
        //    string database = HttpContext.Session.GetString("database");
        //    vehicles = _tracking.GetVehicles(uid, password,database);

        //    return View("/Views/Tracking/Tracking.cshtml", vehicles);
        //}
        public IActionResult Index()
        {
            string? uid = HttpContext.Session.GetString("username");
            string? password = HttpContext.Session.GetString("password");
            string? database = HttpContext.Session.GetString("database");
            string? token = HttpContext.Session.GetString("token");

            var vehicles = _tracking
                .GetVehiclesAsync(uid, password, database, token)
                .GetAwaiter()
                .GetResult();

            return View("/Views/Tracking/Tracking.cshtml", vehicles);
        }
        public async Task<string> GetImei(string id)
        {
            string database = HttpContext.Session.GetString("database");

            string imei;
            imei = await _tracking.GetImei(id, database);
            return imei;
        }

        [HttpGet]
        public IActionResult LiveTracking(string imei)
        {
            if (string.IsNullOrWhiteSpace(imei))
            {
                return BadRequest("IMEI is required.");
            }

            string database =
                HttpContext.Session.GetString("database")?.ToLowerInvariant()
                ?? string.Empty;

            string trackingUrl = database switch
            {
                "newtrack" =>
                    $"https://fasttracksoft.us/vertical_menu/newuser/vehicle_location_tracking_api.php?imei={Uri.EscapeDataString(imei)}",

                "atltracking" =>
                    $"https://trackofy.com/user/vehicle-location-tracking.php?imei={Uri.EscapeDataString(imei)}",

                _ => string.Empty
            };

            if (string.IsNullOrWhiteSpace(trackingUrl))
            {
                return Json(new
                {
                    status = false,
                    message = "Unknown tracking database."
                });
            }

            return Json(new
            {
                status = true,
                url = trackingUrl
            });
        }

    }
}
