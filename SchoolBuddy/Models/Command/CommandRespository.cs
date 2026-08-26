using Newtonsoft.Json;
using SchoolBuddy.Models.ApiTemplate;
using SchoolBuddy.Models.Complains;
using System.Text;

namespace SchoolBuddy.Models.Command
{
    public class CommandRespository : ICommand
    {
        
        private readonly Iapitemplate _apitemplate;
        public CommandRespository(Iapitemplate apitemplate)
        {
            _apitemplate = apitemplate;
        }

        public async Task<string> AddCommand(string user_id, string rid, string msg, string reason)
        {
            try
            {
                
                var json = JsonConvert.SerializeObject(new Commands
                {
                    sys_user_id = user_id,
                    route_id=rid,
                    message= msg,
                    reason=reason
                });
                string urlend = $@"Command/AddBroadcastMessage";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "something went wrong";
            }
        }

        public async Task<string> CommandHistory(string cid)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Commandproperties
                {
                    id = cid
                });
                string urlend = $@"Command/GetCommandHistory";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "something went wrong";
            }
        }

        public async Task<string> GetCommands(string user_id)
        {
            try
            {
               
                var json = JsonConvert.SerializeObject(new Commandproperties
                {
                    id = user_id
                });
                string urlend = $@"Command/GetCommandList";
                return await _apitemplate.PostApiTemplate(json, urlend);

                
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "something went wrong";
            }
        }
    }
}
