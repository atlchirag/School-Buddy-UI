using Microsoft.AspNetCore.Mvc;
using SchoolBuddy.Models.Analysis;
using SchoolBuddy.Models.Route;
using System.Reflection;

namespace SchoolBuddy.Controllers
{
    [Route("{Controller}/{action}")]
    public class AnalysisController : BaseController
    {
        private readonly IRouteRepository _route;
        private readonly IAnaysis _anaysis;

        public AnalysisController(IRouteRepository route,IAnaysis anaysis) 
        {
            _route= route;
            _anaysis = anaysis;
        }

        [HttpGet]
        public async Task<IActionResult> analysis()
        {
            try
            {
                string? uid = HttpContext.Session.GetString("uid");

                ViewBag.RouteList = "[]";

                if (!string.IsNullOrEmpty(uid))
                {
                    var routeJson = await _anaysis.CheckRoute(uid);

                    if (!string.IsNullOrEmpty(routeJson) &&
                        routeJson != "0" &&
                        routeJson != "Data Not Found" &&
                        routeJson != "Login Again..")
                    {
                        ViewBag.RouteList = routeJson;
                    }
                }

                return View("Views/Home/Analysis/analysis.cshtml");
            }
            catch (Exception ex)
            {
                ViewBag.RouteList = "[]";
                return View("Views/Home/Analysis/analysis.cshtml");
            }
        }


        [HttpPost]
        public async Task<string> GetRouteVias(string route_id)
        {
            var model = await _anaysis.CheckVais(route_id);
            return model;

        }



        [HttpPost]
        public async Task<string> GetStops(string route_id)
        {

            var model = await _route.getStops(route_id);
            return model;

        }


        [HttpPost]
        public async Task<string> Geteta(int rid)
        {
            var model = await _anaysis.CheckEta(rid);
            return model;
        }


        [HttpPost]
        public async Task<string> checkroute(string schoolid)
        {
            string? uid = HttpContext.Session.GetString("uid");
            var model = await _anaysis.CheckRoute(uid);
            return model;

        }


        [HttpPost]
        public async Task<string> checkeachviasing(string rid)
        {
            var model = await _anaysis.CheckViasingforeachroute(rid);
            return model;
        }


        [HttpPost]
        public async Task<string> checkign(string sid,string sdate,string edate)
        {

            var model = "";
            string? database = HttpContext.Session.GetString("database");
            if (!String.IsNullOrEmpty(database))
            {
                model = await _anaysis.CheckIgnition(sid, sdate, edate, database);
                return model;
            }
            return model;

        }




        [HttpPost]
        public async Task<string> checinactive(string sid, string sdate, string edate)
        {

            var model = "";
            string? database = HttpContext.Session.GetString("database");
            if (!String.IsNullOrEmpty(database))
            {
                model = await _anaysis.CheckInActive(sid, sdate, edate, database);
                return model;
            }
            return model;



        }
    }
}
