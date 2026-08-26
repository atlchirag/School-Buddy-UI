using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SchoolBuddy.Models.Command;
using SchoolBuddy.Models.Complains;
using SchoolBuddy.Models.Login;
using SchoolBuddy.Models.Route;
using SchoolBuddy.Models.Students;

namespace SchoolBuddy.Controllers
{
    [Route("{Controller}/{action}")]

    public class CommandController : BaseController
    {
        private readonly IRouteRepository _route;
        private readonly ICommand _commmand;
        List<show_command> Commands= new List<show_command>();
       
        public CommandController(ICommand command,IRouteRepository route)
        {
            _commmand = command;
            _route = route;
        }
        public async Task<string> AddCommand(string rid,string msg,string reason)
        {
            string ? school_id = HttpContext.Session.GetString("uid");
            if (!String.IsNullOrEmpty(school_id))
            {
                var model = await _commmand.AddCommand(school_id,rid,msg,reason);
                return model;
            }
            

            //List<dynamic> nogps = JsonConvert.DeserializeObject<dynamic>(model);
            //ViewBag.nogps = nogps;
            return "";
        }


        [HttpPost]
        public async Task<string> CommandHistory(string commandid)
        {
           
            
            var model = await _commmand.CommandHistory(commandid);
            return model;
           
           

        }



        [HttpGet]
        public async Task<IActionResult> Getcommandss()
        {
            string? uid = HttpContext.Session.GetString("uid");
            if (!String.IsNullOrEmpty(uid))
            {
                var model = _commmand.GetCommands(uid).Result;
                if (model != "-1" && model != "0")
                {
                    Commands = JsonConvert.DeserializeObject<List<show_command>>(model);
                    return View("Views/Home/Master/Command/Command.cshtml", Commands);
                }
                return View("Views/Home/Master/Command/Command.cshtml");



            }
            else
            {
                return View("Views/Home/Login/Index.cshtml");

            }

            
        }


        public async Task<string> GetRoutes(string database)
        {
            try
            {
                string? uid = HttpContext.Session.GetString("uid");
                string? db = HttpContext.Session.GetString("database");
                database = db;

                var model = await _route.GetRoutes(uid, database);

                return model;
               
            }
            catch (Exception ex)
            {
                return "";

            }

        }



    }
}
