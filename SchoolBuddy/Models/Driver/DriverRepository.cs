using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SchoolBuddy.Models.ApiTemplate;
using SchoolBuddy.Models.Dashboard;
using SchoolBuddy.Models.Login;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Security;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Security.Policy;
using System.Text;

namespace SchoolBuddy.Models.Driver
{
    public class DriverRepository : IDriverRepository
    {
        private readonly IConfiguration _config;
        private readonly Iapitemplate _apitemplate;

        public DriverRepository(Iapitemplate apitemplate, IConfiguration config)
        {
            _apitemplate = apitemplate;
            _config = config;
        }

        public async Task<List<driver>> DriverListtrack(string token)
        {
            List<driver> drierlist = new List<driver>();

            try
            {
                string url = _config.GetSection("trackofy_api_driver_list").Value;
              

                HttpClientHandler handler = new HttpClientHandler
                {
                    AllowAutoRedirect = false,
                    ServerCertificateCustomValidationCallback =
                        (message, cert, chain, errors) => true
                };

                HttpClient client = new HttpClient(handler);

                client.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue(
                        "Bearer",
                        token
                    );

                var payload = new
                {
                };

                var json = JsonConvert.SerializeObject(payload);

                var content = new StringContent(
                    json,
                    Encoding.UTF8,
                    "application/json"
                );

                HttpResponseMessage res =
    await client.PostAsync(url, content);

              

                string resp =
                    await res.Content.ReadAsStringAsync();

                if (res.IsSuccessStatusCode)
                {
                    var apiResponse =
                        JsonConvert.DeserializeObject<DriverApiResponse>(resp);

                    if (apiResponse != null && apiResponse.data != null)
                    {
                        drierlist = apiResponse.data;
                    }
                }

                return drierlist;
            }
            catch
            {
                return drierlist;
            }
        }


        public async Task<string> AddDriver(AddDriver model,string token)
        {
            try
            {
               

                string url = _config.GetSection("trackofy_api_add_driver").Value;


                HttpClientHandler handler = new HttpClientHandler
                {
                    AllowAutoRedirect = false,
                    ServerCertificateCustomValidationCallback =
                        (message, cert, chain, errors) => true
                };


                HttpClient client = new HttpClient(handler);


                client.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue(
                        "Bearer",
                        token
                    );


                using var formData = new MultipartFormDataContent();



                formData.Add(
                    new StringContent(model.name),
                    "name"
                );


                formData.Add(
                    new StringContent(model.mobile),
                    "mobile"
                );


                formData.Add(
                    new StringContent(model.email),
                    "email"
                );


                formData.Add(
                    new StringContent(model.dob.ToString("yyyy-MM-dd")),
                    "dob"
                );


                formData.Add(
                    new StringContent(model.emergency_contact),
                    "emergency_contact"
                );


                formData.Add(
                    new StringContent(model.dl_number),
                    "dl_number"
                );


                formData.Add(
                    new StringContent(model.dl_issue_date.ToString("yyyy-MM-dd")),
                    "dl_issue_date"
                );


                formData.Add(
                    new StringContent(model.dl_expiry_date.ToString("yyyy-MM-dd")),
                    "dl_expiry_date"
                );


                formData.Add(
                    new StringContent(model.address),
                    "address"
                );



                // File Upload

                if (model.dl_scan != null)
                {

                    var fileContent = new StreamContent(
                        model.dl_scan.OpenReadStream()
                    );


                    fileContent.Headers.ContentType =
                        new System.Net.Http.Headers.MediaTypeHeaderValue(
                            model.dl_scan.ContentType
                        );


                    formData.Add(
                        fileContent,
                        "dl_scan",
                        model.dl_scan.FileName
                    );

                }



                HttpResponseMessage res =
                    await client.PostAsync(url, formData);



                string resp =
                    await res.Content.ReadAsStringAsync();

                if (res.IsSuccessStatusCode)
                {
                    var apiResponse =
                        JsonConvert.DeserializeObject<DriverApiResponse>(resp);
                    return "success";

                }


                return "";

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return "";
            }
        }
        private static bool IgnoreSSLValidation(
            object sender,
            X509Certificate certificate,
            X509Chain chain,
            SslPolicyErrors sslPolicyErrors)
        {
            return true;
        }

        public async Task<List<Vehicle>> Veh_list(string token)
        {
            try
            {
                string url = _config.GetSection("trackofy_api_user").Value;

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
                    method = "getvehiclelist"
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
                    var apiResponse = JsonConvert.DeserializeObject<VehicleApiResponse>(resp);
                    //var apiResponse = JsonConvert.DeserializeObject<dynamic>(resp);

                    return apiResponse?.data ?? new List<Vehicle>();
                }

                return new List<Vehicle>();
            }
            catch (Exception)
            {
                return new List<Vehicle>();
            }
        }
        public async Task<CommonResponse> UnAssignVehicle(string driverId, string serviceId, string deviceId, string token)
        {
            try
            {
                string url = _config.GetSection("trackofy_api_unassigndriver").Value;

                HttpClientHandler handler = new HttpClientHandler
                {
                    AllowAutoRedirect = false,
                    ServerCertificateCustomValidationCallback =
                        (message, cert, chain, errors) => true
                };

                using HttpClient client = new HttpClient(handler);

                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);
                int idriverId = Convert.ToInt32(driverId);
                int iserviceId = Convert.ToInt32(serviceId);
                var payload = new
                {
                    // Replace with your actual API method name
                
                   
                    service_id = iserviceId,
                    driver_id = idriverId,

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
                    var apiResponse = JsonConvert.DeserializeObject<CommonResponse>(resp);

                    return apiResponse ?? new CommonResponse();
                }

                return new CommonResponse();
            }
            catch (Exception)
            {
                return new CommonResponse();
            }
        }

        public async Task<AssignDriverResponse> AssignDriver(int serviceId, int driverId, bool isEdit)
        {
            try
            {
                string url = _config.GetSection("trackofy_api_assign_driver").Value;


                HttpClientHandler handler = new HttpClientHandler
                {
                    AllowAutoRedirect = false,
                    ServerCertificateCustomValidationCallback =
                    (message, cert, chain, errors) => true
                };


                using HttpClient client = new HttpClient(handler);


                var payload = new
                {
                    service_id = serviceId,
                    driver_id = driverId,
                    isEdit = isEdit
                };


                string json = JsonConvert.SerializeObject(payload);


                var content = new StringContent(
                    json,
                    Encoding.UTF8,
                    "application/json"
                );


                HttpResponseMessage res = await client.PostAsync(url, content);


                string response = await res.Content.ReadAsStringAsync();


                var result = JsonConvert.DeserializeObject<AssignDriverResponse>(response);


                return result;

            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public async Task<DriverHistoryResponse> DriverHistory(string token, int driverId)
        {
            DriverHistoryResponse history = new DriverHistoryResponse();

            try
            {
                string url = _config.GetSection("trackofy_api_driver_assign_history").Value;

                HttpClientHandler handler = new HttpClientHandler
                {
                    AllowAutoRedirect = false,
                    ServerCertificateCustomValidationCallback =
                        (message, cert, chain, errors) => true
                };

                HttpClient client = new HttpClient(handler);

                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);

                var payload = new
                {
                    driver_id = driverId
                };

                var json = JsonConvert.SerializeObject(payload);

                var content = new StringContent(
                    json,
                    Encoding.UTF8,
                    "application/json");

                HttpResponseMessage res = await client.PostAsync(url, content);

                if (res.IsSuccessStatusCode)
                {
                    var result = await res.Content.ReadAsStringAsync();

                    history = JsonConvert.DeserializeObject<DriverHistoryResponse>(result);
                }
            }
            catch (Exception ex)
            {
                throw;
            }

            return history;
        }


        public async Task<DriverApiResponse> EditDriver(editDriver model, string token)
        {
            try
            {
                using (var client = new HttpClient())
                {
                    string url = _config.GetSection("trackofy_api_add_driver").Value;
                    client.DefaultRequestHeaders.Authorization =
                        new AuthenticationHeaderValue("Bearer", token);

                    var form = new MultipartFormDataContent();

                    form.Add(new StringContent(model.driver_id.ToString()), "driver_id");
                    form.Add(new StringContent(model.name ?? ""), "name");
                    form.Add(new StringContent(model.dob.ToString("yyyy-MM-dd")), "dob");
                    form.Add(new StringContent(model.mobile ?? ""), "mobile");
                    form.Add(new StringContent(model.email ?? ""), "email");
                    form.Add(new StringContent(model.dl_number ?? ""), "dl_number");
                    form.Add(new StringContent(model.dl_issue_date.ToString("yyyy-MM-dd")), "dl_issue_date");
                    form.Add(new StringContent(model.dl_expiry_date.ToString("yyyy-MM-dd")), "dl_expiry_date");
                    form.Add(new StringContent(model.address ?? ""), "address");
                    form.Add(new StringContent(model.emergency_contact ?? ""), "emergency_contact");
                    if (model.dl_scan != null && model.dl_scan.Length > 0)
                    {
                        var stream = model.dl_scan.OpenReadStream();

                        var fileContent = new StreamContent(stream);

                        fileContent.Headers.ContentType =
                            new MediaTypeHeaderValue(model.dl_scan.ContentType);

                        form.Add(fileContent, "dl_scan", model.dl_scan.FileName);
                    }
                    else
                    {
                        form.Add(new StringContent(""), "dl_scan");
                    }
                    var response = await client.PostAsync(
                        url,
                        form);

                    var json = await response.Content.ReadAsStringAsync();

                    return JsonConvert.DeserializeObject<DriverApiResponse>(json);
                }
            }
            catch (Exception ex)
            {
                return new DriverApiResponse
                {
                    status = false,
                    message = ex.Message
                };
            }
        }
        public async Task<DriverApiResponse> DeleteDriver(long driverId,string token)
        {
            try
            {
                using var client = new HttpClient();
                string url = _config.GetSection("trackofy_api_deletedriver").Value;

                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);

                var form = new MultipartFormDataContent();

                form.Add(new StringContent(driverId.ToString()), "driver_id");

                var response = await client.PostAsync(url, form);

                var json = await response.Content.ReadAsStringAsync();
                if (!response.IsSuccessStatusCode)
                {
                    return new DriverApiResponse
                    {
                        status = false,
                        message = $"API Error: {response.StatusCode}",
                        data = new List<driver>()
                    };
                }

                return JsonConvert.DeserializeObject<DriverApiResponse>(json);
            }
            catch (Exception ex)
            {
                return new DriverApiResponse
                {
                    status = false,
                    message = ex.Message,
                    data = new List<driver>()
                };
            }
        }

        public async Task<DriverPerformanceResponse> DriverPerformance(string token)
        {
           

            try
            {
                string url = _config.GetSection("trackofy_api_driver_performance").Value;


                HttpClientHandler handler = new HttpClientHandler
                {
                    AllowAutoRedirect = false,
                    ServerCertificateCustomValidationCallback =
                        (message, cert, chain, errors) => true
                };

                HttpClient client = new HttpClient(handler);

                client.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue(
                        "Bearer",
                        token
                    );

                var payload = new
                {
                };

                var json = JsonConvert.SerializeObject(payload);

                var content = new StringContent(
                    json,
                    Encoding.UTF8,
                    "application/json"
                );

                HttpResponseMessage response =
    await client.PostAsync(url, content);



                string resp =
                    await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return new DriverPerformanceResponse
                    {
                        Status = false,
                        Message = $"API Error : {response.StatusCode}"
                    };
                }

                return JsonConvert.DeserializeObject<DriverPerformanceResponse>(resp);
            }
            catch (Exception ex)
            {
                return new DriverPerformanceResponse
                {
                    Status = false,
                    Message = ex.Message
                };
            }
        }

        public async Task<DeletePerformanceResponse> DeletePerformance(string token, int categoryId)
        {
            try
            {
                using var client = new HttpClient();

                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);

                string url = _config.GetSection("trackofy_api_delete_performance").Value;

                var payload = new
                {
                    category_id = categoryId
                };

                var content = new StringContent(
                    JsonConvert.SerializeObject(payload),
                    Encoding.UTF8,
                    "application/json");

                HttpResponseMessage response = await client.PostAsync(url, content);

                string resp = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return new DeletePerformanceResponse
                    {
                        Status = false,
                        Message = "API Error"
                    };
                }

                return JsonConvert.DeserializeObject<DeletePerformanceResponse>(resp);
            }
            catch(Exception ex)
            {
                return new DeletePerformanceResponse
                {
                    Status = false,
                    Message = ex.Message
                };
            }
        }
        public async Task<DriverCriteriaResponse> GetDriverCriteria(string token)
        {
            try
            {
                using var client = new HttpClient();

                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);
                string url = _config.GetSection("trackofy_api_get_driver_criteria").Value;
                var response = await client.PostAsync(url,
                    new StringContent("{}", Encoding.UTF8, "application/json")
                );

                var json = await response.Content.ReadAsStringAsync();

                return JsonConvert.DeserializeObject<DriverCriteriaResponse>(json);
            }
            catch (Exception ex)
            {
                return new DriverCriteriaResponse
                {
                    status = false,
                    message = ex.Message,
                    data = new List<DriverCriteriaData>()
                };
            }
        }

        public async Task<SaveDriverPerformanceResponse> SaveDriverPerformance( SaveDriverPerformanceRequest request, string token)
        {
            try
            {
                using var client = new HttpClient();
                string url = _config.GetSection("trackofy_api_save_driver_performance").Value;
                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);

                var jsonPayload = JsonConvert.SerializeObject(request);

                var content = new StringContent(
                    jsonPayload,
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await client.PostAsync(url, content);

                var json = await response.Content.ReadAsStringAsync();

                return JsonConvert.DeserializeObject<SaveDriverPerformanceResponse>(json);
            }
            catch (Exception ex)
            {
                return new SaveDriverPerformanceResponse
                {
                    status = false,
                    message = ex.Message,
                    data = new List<object>()
                };
            }
        }
        public async Task<SaveDriverPerformanceResponse> UpdateDriverPerformance( SaveDriverPerformanceRequest request, string token)
        {
            try
            {
                using var client = new HttpClient();
                string url = _config.GetSection("trackofy_api_update_driver_performance").Value;
                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);

                var jsonPayload = JsonConvert.SerializeObject(request);

                var content = new StringContent(
                    jsonPayload,
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await client.PostAsync(url, content);

                var json = await response.Content.ReadAsStringAsync();

                return JsonConvert.DeserializeObject<SaveDriverPerformanceResponse>(json);
            }
            catch (Exception ex)
            {
                return new SaveDriverPerformanceResponse
                {
                    status = false,
                    message = ex.Message,
                    data = new List<object>()
                };
            }
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
                        Data = new List<DriverPerformanceModel>()
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
                    Data = new List<DriverPerformanceModel>()
                };
            }
        }

    }
}