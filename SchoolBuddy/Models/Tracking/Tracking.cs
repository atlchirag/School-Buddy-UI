using Microsoft.AspNetCore.ResponseCompression;
using Newtonsoft.Json;
using SchoolBuddy.Models.ApiTemplate;
using SchoolBuddy.Models.Driver;
using System.Linq;
using System.Net;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Xml.Linq;

namespace SchoolBuddy.Models.Tracking
{
    public class Tracking : ITracking
    {
        private readonly IConfiguration _config;
        private readonly Iapitemplate _apitemplate;
        private readonly HttpClient _httpclient;
        public Tracking(IConfiguration configuration,Iapitemplate apitemplate,HttpClient httpClient)
        {
            _config = configuration; _apitemplate = apitemplate; _httpclient = httpClient;
        }
        //    public async Task<List<DeviceIdAndVehiclenew>>GetVehiclesAsync(
        //string schoolName,
        //string password,
        //string database,
        //string token)
        //    {
        //        using var handler = new HttpClientHandler
        //        {
        //            AllowAutoRedirect = false,

        //            // Keep this only when the API certificate requires it.
        //            ServerCertificateCustomValidationCallback =
        //                  (message, cert, chain, errors) => true
        //        };
        //        using var client = new HttpClient(handler);

        //        var vehicleList = new List<DeviceIdAndVehiclenew>();

        //        try
        //        {
        //            string url;
        //            if (database.Equals("newtrack", StringComparison.OrdinalIgnoreCase))
        //            {
        //                url = _config.GetSection("getvehicles_api_endpoint").Value;
        //                string getvehiclesurl = String.Format(url, schoolName, password);


        //                HttpResponseMessage res = client.GetAsync(getvehiclesurl).Result;
        //                if (res.IsSuccessStatusCode)
        //                {
        //                    string resp = res.Content.ReadAsStringAsync().Result;

        //                    vehicles = JsonConvert.DeserializeObject<List<TrackingProperties>>(resp);
        //                    if (vehicles != null)
        //                    {
        //                        foreach (var item in vehicles)
        //                        {
        //                            DeviceIdAndVehicle dev_veh = new DeviceIdAndVehicle
        //                            {
        //                                Id = item.Deviceid,
        //                                Name = item.Name,
        //                            };
        //                            deviceIdAndVehicles.Add(dev_veh);
        //                        }
        //                    }
        //                }
        //                return deviceIdAndVehicles;
        //            }

        //            if (string.IsNullOrWhiteSpace(token))
        //            {
        //                return vehicleList;
        //            }

        //            url = _config["trackofy_vehicle_list"];

        //            if (string.IsNullOrWhiteSpace(url))
        //            {
        //                return vehicleList;
        //            }




        //            client.DefaultRequestHeaders.Authorization =
        //                new System.Net.Http.Headers.AuthenticationHeaderValue(
        //                    "Bearer",
        //                    token);

        //            var payload = new
        //            {
        //                method = "getvehiclelist"

        //            };

        //            string json = JsonConvert.SerializeObject(payload);

        //            using var content = new StringContent(
        //                json,
        //                Encoding.UTF8,
        //                "application/json");

        //            HttpResponseMessage response =
        //                await client.PostAsync(url, content);

        //            string responseBody =
        //                await response.Content.ReadAsStringAsync();

        //            if (!response.IsSuccessStatusCode)
        //            {
        //                return vehicleList;
        //            }

        //            var apiResponse =
        //                JsonConvert.DeserializeObject<VehicleListApiResponse>(
        //                    responseBody);

        //            if (apiResponse?.status != true || apiResponse.data == null)
        //            {
        //                return vehicleList;
        //            }

        //            vehicleList = apiResponse.data
        //                .Select(vehicle => new DeviceIdAndVehiclenew
        //                {
        //                    Id = vehicle.service_id,
        //                    Name = vehicle.veh_reg ?? string.Empty,
        //                    Imei = vehicle.imei ?? string.Empty,
        //                    Status = vehicle.vehileRunningStatus ?? string.Empty,
        //                    Speed = vehicle.speed,
        //                    LastContact = vehicle.lastcontact ?? string.Empty,
        //                    IgnitionStatus = vehicle.ignitionOnOff ?? string.Empty
        //                })
        //                .ToList();

        //            return vehicleList;
        //        }
        //        catch (Exception ex)
        //        {
        //            // Add your existing logger here.
        //            // _logger.LogError(ex, "Unable to load Trackofy vehicles.");

        //            return vehicleList;
        //        }
        //    }
        public async Task<List<DeviceIdAndVehiclenew>> GetVehiclesAsync(
        string schoolName,
        string password,
        string database,
        string token)
        {
            var vehicleList = new List<DeviceIdAndVehiclenew>();

            using var handler = new HttpClientHandler
            {
                AllowAutoRedirect = false,

                // Use only when the API certificate requires it.
                // Avoid this in production if possible.
                ServerCertificateCustomValidationCallback =
                    (message, certificate, chain, errors) => true
            };

            using var client = new HttpClient(handler);

            try
            {
                // NEWTRACK API
                if (string.Equals(
                        database,
                        "newtrack",
                        StringComparison.OrdinalIgnoreCase))
                {
                    string? newTrackEndpoint =
                        _config["getvehicles_api_endpoint"];

                    if (string.IsNullOrWhiteSpace(newTrackEndpoint))
                    {
                        return vehicleList;
                    }

                    string newTrackUrl = string.Format(
                        newTrackEndpoint,
                        schoolName,
                        password);

                    using HttpResponseMessage newTrackResponse =
                        await client.GetAsync(newTrackUrl);

                    if (!newTrackResponse.IsSuccessStatusCode)
                    {
                        return vehicleList;
                    }

                    string newTrackResponseBody =
                        await newTrackResponse.Content.ReadAsStringAsync();

                    List<TrackingProperties>? newTrackVehicles =
                        JsonConvert.DeserializeObject<List<TrackingProperties>>(
                            newTrackResponseBody);

                    if (newTrackVehicles == null)
                    {
                        return vehicleList;
                    }

                    vehicleList = newTrackVehicles
                        .Select(vehicle => new DeviceIdAndVehiclenew
                        {
                            Id = vehicle.Deviceid,
                            Name = vehicle.Name ?? string.Empty,

                            // NewTrack response does not provide these values.
                            Imei = string.Empty,
                            Status = string.Empty,
                            Speed = 0,
                            LastContact = string.Empty,
                            IgnitionStatus = string.Empty
                        })
                        .ToList();

                    return vehicleList;
                }

                // TRACKOFY API
                if (string.IsNullOrWhiteSpace(token))
                {
                    return vehicleList;
                }

                string? trackofyUrl =
                    _config["trackofy_vehicle_list"];

                if (string.IsNullOrWhiteSpace(trackofyUrl))
                {
                    return vehicleList;
                }

                client.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue(
                        "Bearer",
                        token);

                var payload = new
                {
                    method = "getvehiclelist"
                };

                string requestJson =
                    JsonConvert.SerializeObject(payload);

                using var requestContent = new StringContent(
                    requestJson,
                    Encoding.UTF8,
                    "application/json");

                using HttpResponseMessage trackofyResponse =
                    await client.PostAsync(
                        trackofyUrl,
                        requestContent);

                string trackofyResponseBody =
                    await trackofyResponse.Content.ReadAsStringAsync();

                if (!trackofyResponse.IsSuccessStatusCode)
                {
                    return vehicleList;
                }

                VehicleListApiResponse? trackofyApiResponse =
                    JsonConvert.DeserializeObject<VehicleListApiResponse>(
                        trackofyResponseBody);

                if (trackofyApiResponse?.status != true ||
                    trackofyApiResponse.data == null)
                {
                    return vehicleList;
                }

                vehicleList = trackofyApiResponse.data
                    .Select(vehicle => new DeviceIdAndVehiclenew
                    {
                        Id = vehicle.service_id,
                        Name = vehicle.veh_reg ?? string.Empty,
                        Imei = vehicle.imei ?? string.Empty,
                        Status = vehicle.vehileRunningStatus ?? string.Empty,
                        Speed = vehicle.speed,
                        LastContact = vehicle.lastcontact ?? string.Empty,
                        IgnitionStatus = vehicle.ignitionOnOff ?? string.Empty
                    })
                    .ToList();

                return vehicleList;
            }
            catch (Exception ex)
            {
                // Add your logger here.
                // _logger.LogError(
                //     ex,
                //     "Error loading vehicles for database {Database}",
                //     database);

                return vehicleList;
            }
        }
        public List<DeviceIdAndVehicle> GetVehicles(string school_name, string password, string database)
        {
            List<DeviceIdAndVehicle> deviceIdAndVehicles = new List<DeviceIdAndVehicle>();
            try
            {
                List<TrackingProperties> vehicles = new List<TrackingProperties>();
                TrackingProperties trackingProperties = new();
               
                HttpClientHandler handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = IgnoreSSLValidation
                };

                string url = null;

                if (database.Equals("newtrack", StringComparison.OrdinalIgnoreCase))
                {
                     url = _config.GetSection("getvehicles_api_endpoint").Value;
                }
                else if (database.Equals("atltracking", StringComparison.OrdinalIgnoreCase))
                {
                     url = _config.GetSection("getvehicles_api_endpoint_trckfy").Value;
                }
                else
                {
                    return null;
                }

                string getvehiclesurl = String.Format(url,school_name,password);

                HttpClient client = new HttpClient(handler);
                HttpResponseMessage res = client.GetAsync(getvehiclesurl).Result;
                if(res.IsSuccessStatusCode)
                {
                    string resp = res.Content.ReadAsStringAsync().Result;

                    vehicles = JsonConvert.DeserializeObject<List<TrackingProperties>>(resp);
                    if(vehicles!=null)
                    {
                        foreach (var item in vehicles)
                        {
                            DeviceIdAndVehicle dev_veh = new DeviceIdAndVehicle
                            {
                                Id = item.Deviceid,
                                Name = item.Name,
                            };
                            deviceIdAndVehicles.Add(dev_veh);
                        }
                    }
                }
                return deviceIdAndVehicles;
            }
            catch
            {
                return deviceIdAndVehicles;
            }
        }

        private static bool IgnoreSSLValidation(object sender, X509Certificate certificate, X509Chain chain, SslPolicyErrors sslPolicyErrors)
        {
            return true; // Always accept the certificate
        }

        public async Task<string> GetImei(string id, string database)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Device
                {
                   id = id,
                   database = database
                });

                string urlend = $@"Route/GetIMEI";
                return await _apitemplate.PostApiTemplate(json, urlend);

            }
            catch (Exception ex)
            {
                return $"fail-101";
            }
        }

        //public string GetLiveTrackingURL(string imei, string database)
        //{
        //    string result = null;
        //    try
        //    {


        //        HttpClientHandler handler = new HttpClientHandler
        //        {
        //            ServerCertificateCustomValidationCallback = IgnoreSSLValidation
        //        };
        //        string url = _config.GetSection("tracking_api_endpoint").Value;
        //        string livetracking = String.Format(url, imei);

        //        HttpClient client = new HttpClient(handler);
        //        HttpResponseMessage res = client.GetAsync(livetracking).Result;
        //        if (res.IsSuccessStatusCode)
        //        {
        //            result = res.Content.ReadAsStringAsync().Result;
        //            return result;

        //        }
        //        return result;
        //    }
        //    catch
        //    {
        //        return result;
        //    }
        //}


        public string GetLiveTrackingURL(string imei, string database)
        {
            string result = null;
            try
            {
                HttpClientHandler handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = IgnoreSSLValidation
                };

                string url = null;

                // Choose the correct URL based on database value
                if (database.Equals("newtrack", StringComparison.OrdinalIgnoreCase))
                {
                    url = _config.GetSection("tracking_api_endpoint").Value;
                }
                else if (database.Equals("atltracking", StringComparison.OrdinalIgnoreCase))
                {
                    url = _config.GetSection("tracking_api_endpoint_trckfy").Value;
                }
                else
                {
                    // Optional: Handle unknown database cases
                    return null;
                }

                string liveTrackingUrl = string.Format(url, imei);

                using (HttpClient client = new HttpClient(handler))
                {
                    HttpResponseMessage response = client.GetAsync(liveTrackingUrl).Result;
                    if (response.IsSuccessStatusCode)
                    {
                        result = response.Content.ReadAsStringAsync().Result;
                        return result;
                    }
                    return result;
                }
            }
            catch
            {
                return result;
            }

            //return result;
        }

    }
}
