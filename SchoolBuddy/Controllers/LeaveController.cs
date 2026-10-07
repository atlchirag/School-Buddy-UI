using Microsoft.AspNetCore.Mvc;
using SchoolBuddy.Models.Leave;

namespace SchoolBuddy.Controllers
{
    [Route("{Controller}/{action}")]
    public class LeaveController : Controller
    {
        private readonly ILeave _leave;
        public LeaveController(ILeave leave)
        {
            _leave = leave;
        }

        // month : yyyy-MM (empty = current month, decided by the API)
        public async Task<string> GetLeaveRequests(string month)
        {
            string? school_id = HttpContext.Session.GetString("uid");
            if (!String.IsNullOrEmpty(school_id))
            {
                return await _leave.GetLeaveRequests(school_id, month);
            }

            return "";
        }

        [HttpPost]
        public async Task<string> UpdateLeaveStatus(int leave_id, int status, string remark)
        {
            string? school_id = HttpContext.Session.GetString("uid");
            if (!String.IsNullOrEmpty(school_id))
            {
                return await _leave.UpdateLeaveStatus(school_id, leave_id, status, remark ?? "");
            }

            return "";
        }
    }
}
