using Newtonsoft.Json;
using SchoolBuddy.Models.ApiTemplate;
using SchoolBuddy.Models.Dashboard;
using System.Text;

namespace SchoolBuddy.Models.Complains
{
    public class ComplainRepository : IComplain
    {
        private readonly Iapitemplate _apitemplate;
        public ComplainRepository(Iapitemplate apitemplate)
        {
            _apitemplate = apitemplate;
        }
        public async Task<string> PendingTicket(string user_id)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new ComplainProperties
                {
                    uid = user_id
                });
                string urlend = $@"Complaint/GetPendingComplaint?user_id={user_id}";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "something went wrong";
            }
        }

        public async Task<string> ResolvedTicket(string user_id)
        {
            try
            {
                
                var json = JsonConvert.SerializeObject(new ComplainProperties
                {
                    uid = user_id
                });

                string urlend = $@"Complaint/GetResolvedComplaint?user_id={user_id}";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "something went wrong";
            }
        }

        public async Task<string> UTicket(string user_id, string comment, int ticketid)
        {
            try
            {
               
                var json = JsonConvert.SerializeObject(new UComplaint
                {
                    userid= user_id,
                    comment= comment,
                    id=ticketid
                });

                string urlend = $@"Complaint/UpdatedComplaint";
                return await _apitemplate.PostApiTemplate(json,urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "something went wrong";
            }
        }

    }
}
