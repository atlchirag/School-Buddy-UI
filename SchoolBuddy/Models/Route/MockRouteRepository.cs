using Microsoft.AspNetCore.Components.Routing;
using Microsoft.AspNetCore.Routing;
using Newtonsoft.Json;
using SchoolBuddy.Models.ApiTemplate;
using SchoolBuddy.Models.Students;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Security.Policy;
using System.Text;

namespace SchoolBuddy.Models.Route
{
    public class MockRouteRepository : IRouteRepository
    {
        private readonly Iapitemplate _apitemplate;
        private readonly IConfiguration _url;
        public MockRouteRepository(Iapitemplate apitemplate,IConfiguration url)
        {
            _apitemplate = apitemplate;
            _url = url;
        }


        public async Task<string> GetHaltsMultiDayTelemetry(string schoolId, string routeId, string startDate, string endDate, string pass, string user)
        {
            try
            {
                string urlend = $"halts/route-multiday-telemetry?schoolId={schoolId}&routeId={routeId}&startDate={startDate}&endDate={endDate}&pass={pass}&user={user}";
                return await _apitemplate.GetApiTemplate(urlend);
            }
            catch
            {
                return "[]";
            }
        }

        public async Task<string> GetExistingStops(string routeId)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new
                {
                    route_id = routeId
                });

                string urlend = "Stop/getAllStops";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch
            {
                return "[]";
            }
        }


        public async Task<string> AddRoute(routedetails route, string school_id)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new routedetails
                {
                    id="0",
                    route_name= route.route_name,
                    start_time_up = route.start_time_up,
                    end_time_up=route.end_time_up,
                    service_id = route.service_id,

                    user_id = school_id,
                    device_id = route.device_id
                });
                string urlend = $@"Route/AddRoute";
                return await _apitemplate.PostApiTemplate(json, urlend);

                
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> DeleteRoute(string id)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new getroutebyid
                {
                    route_id = id
                }) ;
                string urlend = $@"Route/DeleteRoute";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> GetAllRouteAPICall(string user_id,string db)
        {
            try
            {
               
                var json = JsonConvert.SerializeObject(new Routeuser
                {
                    user_id = user_id,
                    database = db
                    
                });
                string urlend = $@"Route/GetAllRoutes";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> geAssignedStudents_route(string routeId)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new { route_id = routeId });

                string urlend = $@"Route/GetStudentsByRouteId";
                return await _apitemplate.PostApiTemplate(json, urlend);

            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> getStudentWise_route(string sys_user_id)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new { sys_user_id = sys_user_id });  // ✔️ Correct JSON
                string urlend = $@"Route/GetStudentWise";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch
            {
                return "";
            }
        }


        public async Task<string> getAssignedStudents(string stopid)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new Stop
                {
                    id=stopid
                });
                string urlend = $@"Stop/getAllAssignedStudents";
                return await _apitemplate.PostApiTemplate(json,urlend);
                
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> GetBuses(string user_id,string db)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new Routeuser
                {
                    user_id = user_id,
                    database = db

                });
                string urlend = $@"Route/GetBuses";
                return await _apitemplate.PostApiTemplate(json,urlend);
                
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> AssignStudents(IFormFile file, string r_id, string schoolid)
        {
            try
            {
                string? url = _url["api_endpoint"];

                using (var content = new MultipartFormDataContent())
                {
                    // Add the file content
                    var fileStream = file.OpenReadStream();
                    var fileContent = new StreamContent(fileStream);
                    fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
                    content.Add(fileContent, "file", file.FileName);

                    // Add the string content
                    var route_id = new StringContent(r_id);
                    content.Add(route_id, "r_id");
                    // Add the string content
                    var schoolid_ = new StringContent(schoolid);
                    content.Add(schoolid_, "schoolid");

                    HttpClient httpClient = new HttpClient();
                    var response = await httpClient.PostAsync($"{url}Students/assignStudentsInBulk", content);
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        return res;
                    }
                    else
                    {
                        var rev = "error";
                        //return "Something went wrong";
                        return rev;
                    }
                }


            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> getPlayBack(string device_id,string start_date,string end_date)
        {
            try
            {
                string url_ = _url["api_endpoint"];

                // Create an HttpClientHandler
                HttpClientHandler handler = new HttpClientHandler();

                // Ignore SSL certificate errors
                handler.ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true;
                HttpClient httpClient = new HttpClient(handler);
                string url = $"https://fasttracksoft.us/api_v2/abctraq/GetplaybackData.php?did={device_id}&sdate={start_date}&edate={end_date}";
                var response = await httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var res = await response.Content.ReadAsStringAsync();
                    return res;
                }
                else
                {
                    var rev = "error";
                    //return "Something went wrong";
                    return rev;
                }
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> GetRouteByID(string id)
        {
            try

            {
                var json = JsonConvert.SerializeObject(new Routeid
                {
                    route_id = id
                });
                string urlend = $@"Route/GetRouteById";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> GetRoutes(string id, string db)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new Routeuser
                {
                    user_id = id,
                    database = db

                });
                string urlend = $@"Route/GetRoutes";
                return await _apitemplate.PostApiTemplate(json,urlend);
                
            }
            catch (Exception ex)
            {
                return "";
            }
        }


        public async Task<string> getStops(string id)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new Stop
                {
                    route_id = id
                });
                string urlend = $@"Stop/getAllStops";
                return await _apitemplate.PostApiTemplate(json,urlend);
                
            }
            catch (Exception ex)
            {
                return "";
            }
        
        }


        public async Task<string> DeleteStop(string id, string route_id)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new get_stopid
                {
                    id = id,
                    rid = route_id
                });
                string urlend = $@"Stop/DeleteStopById";
                return await _apitemplate.PostApiTemplate(json,urlend);
               
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> UpdateRoute(Eroutedetails route, string uid)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new Eroutedetails
                {
                    id = route.id,
                    route_name = route.route_name,
                    start_time_up = route.start_time_up,
                    end_time_up = route.end_time_up,
                    rowupdated = route.rowupdated,
                    service_id = route.service_id

                });
                string urlend = $@"Route/EditRoute";
                return await _apitemplate.PostApiTemplate(json,urlend);
                
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> addPlayBack(playbackdata playbackdata_Api)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new playbackdata
                {
                    Route_id = playbackdata_Api.Route_id,
                    lat = playbackdata_Api.lat,
                    lng = playbackdata_Api.lng,
                    via_order = playbackdata_Api.via_order
                });

                string urlend = $@"Route/addPlayBack";
                return await _apitemplate.PostApiTemplate(json,urlend);

                
            }
            catch (Exception ex)
            {
                return "";
            }
        }


        public async Task<string> AddStop(Stop stop)
        {
            try
            {

                Stop stop1 = new Stop
                {
                    Stop_Name = stop.Stop_Name,
                    route_id = stop.route_id,
                    id = stop.id,
                    uid = stop.uid,
                    stop_order = stop.stop_order,
                    Latitude = stop.Latitude,
                    Longitude = stop.Longitude
                };
                var json = JsonConvert.SerializeObject(stop1);

                string urlend = $@"Stop/addStop";
                return await _apitemplate.PostApiTemplate(json,urlend);
                
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> EditStop(Stop stop)
        {
            try
            {
                var json = JsonConvert.SerializeObject(stop);
                string urlend = "Stop/editStop";  // API endpoint

                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                return $" Exception in EditStop: {ex.Message}";
            }
        }


        public async Task<string> GetAllAssignedStudents(string stopid)
        {
            try
            {

                var json = JsonConvert.SerializeObject(new getstopid
                {
                    id = stopid
                });

                string urlend = $@"Stop/getAllAssignedStudents";

                return await _apitemplate.PostApiTemplate(json,urlend);
               
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> AssignStoptosingalstudent(assign_student AS)
        {
            try
            {

                assign_student a_s = new assign_student
                {
                    student_name = AS.student_name,
                    Admission_no = AS.Admission_no,
                    stopid = AS.stopid,
                    rfid = AS.rfid,
                    schoolid=AS.schoolid,
                    route_id = AS.route_id
                };
                var json = JsonConvert.SerializeObject(a_s);

                string urlend = $@"Students/assignStudent";
                return await _apitemplate.PostApiTemplate(json, urlend);

            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<byte[]> DownloadAssignedStudentsExcel(string routeId)
        {
            try
            {
                string? url = _url["api_endpoint"];

                HttpClient httpClient = new HttpClient();
                var response = await httpClient.GetAsync($"{url}Route/DownloadAssignedStudentsExcel?routeId={routeId}");

                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadAsByteArrayAsync();
                }
                else
                {
                    return null;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in DownloadAssignedStudentsExcel: {ex.Message}");
                return null;
            }
        }

        public async Task<string> UpdateStudentWise(UpdateStudentModel model, string uid)
        {
            try
            {

                var json = JsonConvert.SerializeObject(
      new UpdateStudentModel
      {
          student_id = model.student_id,
          change_type = model.change_type,
          pick_route_id = model.pick_route_id,
          drop_route_id = model.drop_route_id,
          pick_stop_id = model.pick_stop_id,
          drop_stop_id = model.drop_stop_id,
          prev_drop_route_id = model.prev_drop_route_id,
          prev_pick_route_id = model.prev_pick_route_id,
          prev_pick_stop_id = model.prev_pick_stop_id,
          prev_drop_stop_id = model.prev_drop_stop_id
      }
 );
                string urlend = $@"Route/UpdateStudentWise";
                return await _apitemplate.PostApiTemplate(json, urlend);

            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"UpdateStudentWise API call failed: {ex}");
                return "Unable to reach the UpdateStudentWise API.";
            }
        }

        public async Task<string> DeleteStudent (int id)
        {
            try
            {
                string url = _url["api_endpoint"];
                
                HttpClient httpClient = new HttpClient();
                string urlend = $@"Route/DeleteStudent";
                var response = await httpClient.PostAsync(
    $"{url}{urlend}?id={id}",
    null
);
                if (response.IsSuccessStatusCode)
                {
                    var res = await response.Content.ReadAsStringAsync();
                    return res;
                }
                else
                {
                    var res = await response.Content.ReadAsStringAsync();
                    return "something went wrong";
                }
            }
            catch
            {
                return "";
            }
        }
    }
}

