using Microsoft.AspNetCore.Mvc;
using SchoolBuddy.Models.Complains;
using SchoolBuddy.Models.Report;
using System.Reflection;

namespace SchoolBuddy.Controllers
{
    [Route("{Controller}/{action}")]
    public class ComplainController : Controller
    {
        private readonly IComplain _complain;
        public ComplainController(IComplain complain)
        {
            _complain = complain;
        }
        public async Task<string> PendingTicket()
        {
            string? school_id = HttpContext.Session.GetString("uid");
            if (!String.IsNullOrEmpty(school_id))
            {
                var model = await _complain.PendingTicket(school_id);
                return model;
            }

            return "";
        }

        //public async Task<string> PendingTicket(string uid)
        //{
        //    var model = await _complain.PendingTicket(uid);

        //    return model;
        //}

        public async Task<string> ResolvedTicket()
        {
            string? school_id = HttpContext.Session.GetString("uid");
            if (!String.IsNullOrEmpty(school_id))
            {
                var model = await _complain.ResolvedTicket(school_id);
                return model;
            }

            //List<dynamic> nogps = JsonConvert.DeserializeObject<dynamic>(model);
            //ViewBag.nogps = nogps;
            return "";
        }

        public async Task<string> Complaintpage()
        {
            string? school_id = HttpContext.Session.GetString("uid");
            if (!String.IsNullOrEmpty(school_id))
            {
                var model = await _complain.ComplaintPage(school_id);
                return model;
            }

            //List<dynamic> nogps = JsonConvert.DeserializeObject<dynamic>(model);
            //ViewBag.nogps = nogps;
            return "";
        }
        public async Task<string> ResolvedComplaintPage()
        {
            string? school_id = HttpContext.Session.GetString("uid");
            if (!String.IsNullOrEmpty(school_id))
            {
                var model = await _complain.ResolvedComplaintPage(school_id);
                return model;
            }

            //List<dynamic> nogps = JsonConvert.DeserializeObject<dynamic>(model);
            //ViewBag.nogps = nogps;
            return "";
        }

        public async Task<string> UpdateTicket(string comment,int ticketid)
        {
            string school_id = HttpContext.Session.GetString("uid");
            if (!String.IsNullOrEmpty(school_id))
            {
                var model = await _complain.UTicket(school_id,comment,ticketid);

                //List<dynamic> nogps = JsonConvert.DeserializeObject<dynamic>(model);
                //ViewBag.nogps = nogps;
                return model;
            }
            return "false";

        }

    }
}
