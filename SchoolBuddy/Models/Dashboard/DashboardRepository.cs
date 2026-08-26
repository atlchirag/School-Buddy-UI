
using ExcelDataReader.Log;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Newtonsoft.Json;
using SchoolBuddy.Models.ApiTemplate;
using SchoolBuddy.Models.Driver;
using SchoolBuddy.Models.Report;
using System.Diagnostics;
using System.Drawing.Printing;
using System.Net.Http.Headers;
using System.Net.NetworkInformation;
using System.Runtime.InteropServices;
using System.Text;


namespace SchoolBuddy.Models.Dashboard
{
    public class DashboardRepository : IDashboardRepository
    {
        private readonly Iapitemplate _apitemplate;
        private readonly IConfiguration _configuration;
        public DashboardRepository(Iapitemplate apitemplate, IConfiguration configuration)
        {
            _apitemplate = apitemplate;
            _configuration = configuration;
        }

        public async Task<string> countIdleBusApiCall(string user_id)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id
                });

                string urlend = $@"Dashboard/TotalIdleRoute_summ";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> countStopBusesApiCall(string user_id)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id
                });

                string urlend = $@"Dashboard/TotalStopRoute_summ";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> countTodayNotificationApiCall(string user_id)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id
                });

                string urlend = $@"Dashboard/GetTodayNotifications";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> countTotalBusApiCall(string user_id)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id
                });
                string urlend = $@"Dashboard/GetTotalBuses";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTotalBusApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> countTotalLiveRouteApiCall(string user_id, string database)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id,
                    database = database
                });

                string urlend = $@"Dashboard/Getliveroute";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTotalLiveRouteApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> counttotalNotificationApiCall(string user_id)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id
                });
                string urlend = $@"Dashboard/GetTotalNotifications";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - counttotalNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> counttotalrouteApiCall(string user_id)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id
                });
                string urlend = $@"Dashboard/GetTotalRouteCount";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - counttotalrouteApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> CountTotalStudentAPICall(string userid)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = userid
                });

                string urlend = $@"Dashboard/GetTotalStudentCount";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - CountTotalStudentAPICall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }
        public async Task<string> RFIDPUNCHED(string userid,string db)
        {
            try
            {
                string from = DateTime.Today.ToString("yyyy-MM-dd HH:mm:ss");
                string to = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");

                var json = JsonConvert.SerializeObject(new
                {
                    database=db,
                    user_id = userid,
                    from = from,
                    to = to
                });


                string urlend = $@"Dashboard/RFIDPUNCHED";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - CountTotalStudentAPICall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> TotalBusesSummary(string user_id, string database)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id,
                    database = database
                });

                string urlend = $@"Dashboard/TotalBus_summ";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - CountTotalStudentAPICall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> TotalLiveRoutesSummary(string user_id, string database)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id,
                    database = database
                });

                string urlend = $@"Dashboard/TotalLiveRoute_summ";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - CountTotalStudentAPICall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> TotalNotificationsSummary(string user_id, int page, int pagesize)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id,
                    page = page,
                    pageSize = pagesize
                });

                string urlend = $@"Dashboard/TotalNotification_summ";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - CountTotalStudentAPICall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> TotalSutudentSummary(string user_id, string database)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id,
                    database = database,


                });

                string urlend = $@"Dashboard/TotalStudent_summ";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - CountTotalStudentAPICall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> TotalTodayNotificationsSummary(string user_id)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id,

                });


                string urlend = $@"Dashboard/TodayNotification_summ";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - CountTotalStudentAPICall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> UpcomingEentSummary(string user_id)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id
                });

                string urlend = $@"Dashboard/GetUpcomingEvents";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - CountTotalStudentAPICall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }

        }

        public async Task<string> GetUpcomingHolidays(string user_id)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id
                });

                string urlend = $@"Dashboard/GetUpcomingHolidays";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - CountTotalStudentAPICall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> Address(string lat, string lng)
        {
            try
            {
                HttpClient client = new HttpClient();
                //HttpResponseMessage res = await client.GetAsync($"http://test.abctraq.in/trackofy/user/caladdress.php?latitude={lat}&longitude={lng}");
                HttpResponseMessage res = await client.GetAsync($"https://trackofy.com/user/caladdress.php?latitude={lat}&longitude={lng}");

                if (res.IsSuccessStatusCode)
                {
                    return await res.Content.ReadAsStringAsync();
                }
                return "";
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - CountTotalStudentAPICall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }
        public async Task<string> StopWiseVoilation(string uid, string db)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = uid,
                    database = db

                });

                string urlend = $@"Dashboard/StopWiseVoilation";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - CountTotalStudentAPICall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }
        public async Task<string> countassignedstudent(string user_id)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new Dashboard_var
                {
                    user_id = user_id
                });

                string urlend = $@"Dashboard/GetTotalassignstudentCount";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                General.WriteToLogFile($"{ex.Message} - countTodayNotificationApiCall", "D:\\Dotnet_Applications\\schoolbuddy\\log", "log.txt");

                return "0";
            }
        }

        public async Task<string> SendPayload(string user, string pass)
        {
            string baseUrl = _configuration["trackofy_api_token"];

            HttpClient client = new HttpClient();
            string uuid = GetDeviceUuid();

            var json = JsonConvert.SerializeObject(new LoginPayload
            {

                device_id = uuid,
                domain_id = 1,
                password = pass,
                username = user
            });


            var content = new StringContent(
                json,
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(
                $"{baseUrl}",
                content
            );
            return await response.Content.ReadAsStringAsync();
        }


        public static string GetDeviceUuid()
        {
            try
            {
                // 1. WINDOWS APPROACH
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                {
                    using var process = Process.Start(new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/c reg query HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid",
                        RedirectStandardOutput = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    });

                    if (process == null) return "Unknown Windows UUID";
                    string output = process.StandardOutput.ReadToEnd();
                    process.WaitForExit();

                    // Extract the actual GUID from the registry string output
                    var parts = output.Split(new[] { ' ', '\t', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                    return parts.Length > 0 ? parts[^1].Trim() : "Unknown Windows UUID";
                }

                // 2. MACOS APPROACH
                if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
                {
                    using var process = Process.Start(new ProcessStartInfo
                    {
                        FileName = "/bin/bash",
                        Arguments = "-c \"system_profiler SPHardwareDataType | awk '/UUID/ {print $3}'\"",
                        RedirectStandardOutput = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    });

                    if (process == null) return "Unknown Mac UUID";
                    string output = process.StandardOutput.ReadToEnd();
                    process.WaitForExit();

                    return output.Trim();
                }

                // 3. LINUX APPROACH
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                {
                    // Primary: System product UUID (May require root permissions)
                    if (System.IO.File.Exists("/sys/class/dmi/id/product_uuid"))
                    {
                        return System.IO.File.ReadAllText("/sys/class/dmi/id/product_uuid").Trim();
                    }
                    // Fallback: OS machine ID (Accessible by standard user spaces)
                    if (System.IO.File.Exists("/etc/machine-id"))
                    {
                        return System.IO.File.ReadAllText("/etc/machine-id").Trim();
                    }
                    return "Unknown Linux UUID";
                }
            }
            catch (Exception ex)
            {
                // Fallback or logging can be placed here
                return $"Error retrieving UUID: {ex.Message}";
            }

            return "Unsupported OS Platform";
        }
        public async Task<driverdashboard> DriverPerformance(string user, string pass)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new
                {
                    username = user,
                    password = pass
                });

                string urlend = "Dashboard/DriverPerformance";

                var response = await _apitemplate.PostApiTemplate(json, urlend);

                if (string.IsNullOrWhiteSpace(response) || response == "0")
                {
                    return new driverdashboard
                    {
                        Status = false,
                        Message = "No response received from API",

                    };
                }

                return JsonConvert.DeserializeObject<driverdashboard>(response);
            }
            catch (Exception ex)
            {

                return new driverdashboard
                {
                    Status = false,
                    Message = ex.Message,
                };
            }
        }
        public async Task<List<VehicleInService>> VehicleInServices(string user, string db)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new
                {
                    database = db,

                    user_id = user,
                    
                });

                string urlend = "Dashboard/VehicleInServices";

                var response = await _apitemplate.PostApiTemplate(json, urlend);

                if (string.IsNullOrWhiteSpace(response) || response == "0")
                {
                    return new List<VehicleInService>();
                }

                var result =
                    JsonConvert.DeserializeObject<List<VehicleInService>>(response);

                return result ?? new List<VehicleInService>();
            }
            catch (Exception ex)
            {
                // Log ex.Message if logging is available
                return new List<VehicleInService>();
            }
        }

        public async Task<List<RouteLiveStatusModel>> RoutePerformance(string user,string db)
        {
            try
            {
            
                var json = JsonConvert.SerializeObject(new
                {
                    database=db,

        user_id = user,
                    from = DateTime.Today.ToString("yyyy-MM-dd HH:mm:ss"),
                    to = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                });

                string urlend = "Dashboard/RoutePerformance";

                var response = await _apitemplate.PostApiTemplate(json, urlend);

                if (string.IsNullOrWhiteSpace(response) || response == "0")
                {
                    return new List<RouteLiveStatusModel>();
                }

                var result =
                    JsonConvert.DeserializeObject<List<RouteLiveStatusModel>>(response);

                return result ?? new List<RouteLiveStatusModel>();
            }
            catch (Exception ex)
            {
                // Log ex.Message if logging is available
                return new List<RouteLiveStatusModel>();
            }
        }

        public async Task<List<VehicleHealthModel>> Vehicle_health(string token)
        {
            try
            {
                string url = _configuration.GetSection("trackofy_api_tabular_dashboard").Value;

                HttpClientHandler handler = new HttpClientHandler
                {
                    AllowAutoRedirect = false,
                    ServerCertificateCustomValidationCallback =
                        (message, cert, chain, errors) => true
                };

                using HttpClient client = new HttpClient(handler);

                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);

                var payload = new
                {
                    method = "tabular_dashboard"
                };

                var json = JsonConvert.SerializeObject(payload);

                var content = new StringContent(
                    json,
                    Encoding.UTF8,
                    "application/json"
                );

                HttpResponseMessage res = await client.PostAsync(url, content);

                string resp = await res.Content.ReadAsStringAsync();

                if (res.IsSuccessStatusCode)
                {
                    var apiResponse = JsonConvert.DeserializeObject<VehicleHealthResponse>(resp);

                    return apiResponse?.Data ?? new List<VehicleHealthModel>();
                }

                return new List<VehicleHealthModel>();
            }
            catch
            {
                return new List<VehicleHealthModel>();
            }
        }

        public async Task<List<NotificationItem>> Alerts(string token)
        {
            try
            {
                string url = _configuration.GetSection("trackofy_api_user").Value;

                HttpClientHandler handler = new HttpClientHandler
                {
                    AllowAutoRedirect = false,
                    ServerCertificateCustomValidationCallback =
                        (message, cert, chain, errors) => true
                };

                using HttpClient client = new HttpClient(handler);

                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);

                //var payload = new
                //{
                //    method = "get_notification_tabular",
                //    start_date = DateTime.Now.ToString("yyyy-MM-dd")
                //};
                var payload = new
                {
                    method = "get_notification",
                    show_all = "true",
                    status = 0,
                    start_date = DateTime.Now.Date.ToString("yyyy-MM-dd HH:mm"),
                    end_date = DateTime.Now.ToString("yyyy-MM-dd HH:mm")
                };

                var json = JsonConvert.SerializeObject(payload);

                var content = new StringContent(
                    json,
                    Encoding.UTF8,
                    "application/json"
                );

                HttpResponseMessage res = await client.PostAsync(url, content);

                string resp = await res.Content.ReadAsStringAsync();
                if (!res.IsSuccessStatusCode)
                    return new List<NotificationItem>();

                var apiResponse = JsonConvert.DeserializeObject<NotificationResponse>(resp);

                return apiResponse?.Data?.Items ?? new List<NotificationItem>();
            }
            catch
            {
                return new List<NotificationItem>();
            }
        }

        public async Task<List<NotificationItem>> GetFilteredNotifications(
    DateTime startDateTime,
    DateTime endDateTime, string token, string status)
        {
            try
            {

                string url = _configuration.GetSection("trackofy_api_user").Value;

                HttpClientHandler handler = new HttpClientHandler
                {
                    AllowAutoRedirect = false,
                    ServerCertificateCustomValidationCallback =
                        (message, cert, chain, errors) => true
                };

                using HttpClient client = new HttpClient(handler);

                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);

                //var payload = new
                //{
                //    method = "get_notification_tabular",
                //    start_date = DateTime.Now.ToString("yyyy-MM-dd")
                //};
                var payload = new
                {
                    method = "get_notification_search",
                    status = status,
                    start_date = startDateTime.ToString("yyyy-MM-dd HH:mm"),
                    end_date = endDateTime.ToString("yyyy-MM-dd HH:mm")
                };
               

                var json = JsonConvert.SerializeObject(payload);

                var content = new StringContent(
                    json,
                    Encoding.UTF8,
                    "application/json"
                );

                HttpResponseMessage res = await client.PostAsync(url, content);

                string resp = await res.Content.ReadAsStringAsync();
                if (!res.IsSuccessStatusCode)
                    return new List<NotificationItem>();

                var apiResponse = JsonConvert.DeserializeObject<NotificationResponse>(resp);

                return apiResponse?.Data?.Items ?? new List<NotificationItem>();
            }
            catch
            {
                return new List<NotificationItem>();
            }
        }


        public async Task<List<NotificationItem>> MarkNotificationAsRead(string id, string token)
        {
            try
            {
                string url = _configuration.GetSection("trackofy_api_user").Value;

                HttpClientHandler handler = new HttpClientHandler
                {
                    AllowAutoRedirect = false,
                    ServerCertificateCustomValidationCallback =
                        (message, cert, chain, errors) => true
                };

                using HttpClient client = new HttpClient(handler);

                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);

                //var payload = new
                //{
                //    method = "get_notification_tabular",
                //    start_date = DateTime.Now.ToString("yyyy-MM-dd")
                //};
                var payload = new
                {
                    method = "update_notification",
                    notificationLogId = id
                };

                var json = JsonConvert.SerializeObject(payload);

                var content = new StringContent(
                    json,
                    Encoding.UTF8,
                    "application/json"
                );

                HttpResponseMessage res = await client.PostAsync(url, content);

                string resp = await res.Content.ReadAsStringAsync();
                if (!res.IsSuccessStatusCode)
                    return new List<NotificationItem>();

                var apiResponse = JsonConvert.DeserializeObject<NotificationResponse>(resp);

                return apiResponse?.Data?.Items ?? new List<NotificationItem>();
            }
            catch
            {
                return new List<NotificationItem>();
            }
        }
    }
}
