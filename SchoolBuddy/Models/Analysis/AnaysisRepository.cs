using Newtonsoft.Json;
using SchoolBuddy.Models.ApiTemplate;
using SchoolBuddy.Models.Command;
using System.Drawing;
using System.Security.Cryptography;
using System.Security.Policy;
using System.Text;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace SchoolBuddy.Models.Analysis
{
   
    public class AnaysisRepository : IAnaysis
    {
        
        private readonly Iapitemplate _apitemplate;
        public AnaysisRepository(Iapitemplate apitemplate)
        {
            _apitemplate = apitemplate;
        }
        public async Task<string> CheckEta(int route_id)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new checketa
                {
                    route_id = route_id
                });

                string urlend = $@"Analysis/CheckEta";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - CheckEta", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");
                return "something went wrong";
            }
        }

        public async Task<string> CheckIgnition(string service_id, string start, string end, string db)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new checkign
                {
                   service_id=service_id,
                   start_date = start,
                   end_date = end,
                   database = db
                });
                string urlend = "Analysis/CheckIgnition";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "something went wrong";
            }
        }

        public async Task<string> CheckInActive(string service_id, string start, string end, string db)
        {
            try
            {
               
                var json = JsonConvert.SerializeObject(new checkign
                {
                    service_id = service_id,
                    start_date = start,
                    end_date = end,
                    database = db
                });
                string urlend = $@"Analysis/checkInActive";
                return await _apitemplate.PostApiTemplate(json,urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "something went wrong";
            }
        }

        public async Task<string> CheckRoute(string user_id)
        {
            try
            {
               
                var json = JsonConvert.SerializeObject(new checkroute
                {
                   schoolid = user_id
                });
                string urlend = $@"Analysis/checkRoute";
                return await _apitemplate.PostApiTemplate(json,urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "something went wrong";
            }
        }

        public Task<string> CheckSta(string service_id, string start, string end, string db)
        {
            throw new NotImplementedException();
        }

        public Task<string> CheckURL(string service_id)
        {
            throw new NotImplementedException();
        }

        public async Task<string> CheckVais(string rid)
        {
            try
            {
                
                var json = JsonConvert.SerializeObject(new checkvias
                {
                   route_id= rid,
                });
                string urlend = $@"Analysis/CheckVias";
                return await _apitemplate.PostApiTemplate(json,urlend);                
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "something went wrong";
            }
        }

        public async Task<string> CheckViasingforeachroute(string rid)
        {
            try
            {
                
                var json = JsonConvert.SerializeObject(new checkvias
                {
                    route_id = rid,
                });
                string urlend = $@"Analysis/CheckEachRouteViasing";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "something went wrong";
            }
        }

        public Task<string> Route(string user_id)
        {
            throw new NotImplementedException();
        }
    }
}
