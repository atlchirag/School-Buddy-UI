using Newtonsoft.Json;
using SchoolBuddy.Models.ApiTemplate;

namespace SchoolBuddy.Models.Leave
{
    public class LeaveRepository : ILeave
    {
        private readonly Iapitemplate _apitemplate;
        public LeaveRepository(Iapitemplate apitemplate)
        {
            _apitemplate = apitemplate;
        }

        public async Task<string> GetLeaveRequests(string user_id, string month)
        {
            try
            {
                string urlend = $"Leave/GetLeaveRequests?user_id={Uri.EscapeDataString(user_id)}&month={Uri.EscapeDataString(month ?? "")}";
                return await _apitemplate.PostApiTemplate("{}", urlend);
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                General.WriteToLogFile($"{ex.Message} - GetLeaveRequestsApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "something went wrong";
            }
        }

        public async Task<string> UpdateLeaveStatus(string user_id, int leave_id, int status, string remark)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new
                {
                    user_id,
                    leave_id,
                    status,
                    remark
                });

                return await _apitemplate.PostApiTemplate(json, "Leave/UpdateLeaveStatus");
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                General.WriteToLogFile($"{ex.Message} - UpdateLeaveStatusApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "something went wrong";
            }
        }
    }
}
