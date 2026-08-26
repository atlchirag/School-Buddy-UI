using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using SchoolBuddy.Models.Driver;

namespace SchoolBuddy.Controllers
{
    public class Driver_ManagementController : BaseController
    {
        private readonly IDriverRepository _driverrepo;

        public Driver_ManagementController(IDriverRepository driverrepo)
        {
            _driverrepo = driverrepo;
        }

        public async Task<IActionResult> Index()
        {
            try
            {
                string token = HttpContext.Session.GetString("token");

                var driver = await _driverrepo.DriverListtrack(token);

                ViewBag.DriverCount = driver.Count();
                return View("/Views/Home/Driver_Management/index.cshtml", driver);
            }
            catch (Exception ex) {
                return View("/Views/Home/Driver_Management/index.cshtml");
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddDriver(AddDriver model)
        {

            try
            {
                string token = HttpContext.Session.GetString("token");
                if (ModelState.IsValid) 
                {
                    var response = await _driverrepo.AddDriver(model,token);
                    if (response != null && response!="") 
                    {
                        return Json(new
                        {
                            success = true,
                            message = "Driver Added Successfully"
                        });
                    }
                    return Json(new
                    {
                        success = false,
                        message = "Something Went Wrong"
                    });
                }
               

                return Json(new
                {
                    success = false,
                    message = "Something Went Wrong"
                });


            }
            catch (Exception ex)
            {


                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });


            }


        }


        [HttpPost]
        public async Task<IActionResult> Veh_list()
        {
            try
            {
                string token = HttpContext.Session.GetString("token");

                var response = await _driverrepo.Veh_list(token);

                return Json(new
                {
                    success = true,
                    data = response
                });
            }
            catch (Exception ex)
            {
                // Optional: Log ex.Message
                return Json(new
                {
                    success = false,
                    data = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UnAssignVehicle(string driverId, string serviceId, string deviceId)
        {
           try
            {
                string token = HttpContext.Session.GetString("token");

                var result = await _driverrepo.UnAssignVehicle(driverId, serviceId, deviceId, token);
                if (result.status==false)
                {
                    return Json(new
                    {
                        success = false,
                        message = "Something Went Wrong"
                    });
                }
                return Json(new
                {
                    success = result.status,
                    message = result.message
                });
            }
            catch(Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
        [HttpPost]
        public async Task<IActionResult> AssignDriver(
    int serviceId,
    int driverId,
    bool isEdit = true)
        {
            try
            {

                var response = await _driverrepo.AssignDriver(
                    serviceId,
                    driverId,
                    isEdit
                );


                if (response != null && response.status)
                {
                    return Json(new
                    {
                        success = true,
                        message = response.message,
                        data = response.data
                    });
                }


                return Json(new
                {
                    success = false,
                    message = response?.message ?? "Driver assignment failed"
                });

            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> DriverHistory(int driverId)
        {
            try
            {
                string token = HttpContext.Session.GetString("token");

                if (string.IsNullOrEmpty(token))
                {
                    return Json(new
                    {
                        success = false,
                        message = "Session expired. Please login again."
                    });
                }

                var result = await _driverrepo.DriverHistory(token, driverId);

                return Json(new
                {
                    success = result.status,
                    message = result.message,
                    data = result.data
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }



        [HttpPost]
        public async Task<IActionResult> EditDriver(editDriver model)
        {
            try
            {
                string token = HttpContext.Session.GetString("token");
                var result = await _driverrepo.EditDriver(model, token);


                if (result.status)
                {
                    return Json(new
                    {
                        success = true,
                        message = result.message
                    });
                }

                return Json(new
                {
                    success = false,
                    message = result.message
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteDriver(long driver_id)
        {
            try
            {
                string token = HttpContext.Session.GetString("token");
                var result = await _driverrepo.DeleteDriver(driver_id,token);

                if (result.status)
                {
                    return Json(new
                    {
                        success = true,
                        message = result.message
                    });
                }

                return Json(new
                {
                    success = false,
                    message = result.message
                });
            }
            catch(Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        public async Task<IActionResult> performance()
        {
            try
            {
                string token = HttpContext.Session.GetString("token");

                var performanceResponse = await _driverrepo.DriverPerformance(token);

          
                return View("/Views/Home/Driver_Management/performance.cshtml", performanceResponse);
            }
            catch (Exception ex)
            {
                return View("/Views/Home/Driver_Management/performance.cshtml");
            }
        }
        [HttpPost]
        public async Task<IActionResult> DeletePerformance(int category_id)
        {
            try
            {
                string token = HttpContext.Session.GetString("token");

                if (string.IsNullOrEmpty(token))
                {
                    return Json(new
                    {
                        status = false,
                        message = "Session expired. Please login again."
                    });
                }

                var result = await _driverrepo.DeletePerformance(token, category_id);

                return Json(result);
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    status = false,
                    message = ex.Message
                   
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetDriverCriteria()
        {
            try
            {
                var token = HttpContext.Session.GetString("token");

                var result = await _driverrepo.GetDriverCriteria(token);

                return Json(result);

            }
            catch(Exception ex)
            {
                return Json(new
                {
                    status = false,
                    message = ex.Message

                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> SaveDriverPerformance(
    [FromBody] SaveDriverPerformanceRequest request)
        {
            try
            {
                string token = HttpContext.Session.GetString("token");

                var response = await _driverrepo.SaveDriverPerformance(request, token);

                return Json(response);
            }
            catch (Exception ex)
            {
                return Json(new SaveDriverPerformanceResponse
                {
                    status = false,
                    message = ex.Message,
                    data = new List<object>()
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateDriverPerformance(
    [FromBody] SaveDriverPerformanceRequest request)
        {
            try
            {
                string token = HttpContext.Session.GetString("token");

                var response = await _driverrepo.UpdateDriverPerformance(request, token);

                return Json(response);
            }
            catch (Exception ex)
            {
                return Json(new SaveDriverPerformanceResponse
                {
                    status = false,
                    message = ex.Message,
                    data = new List<object>()
                });
            }
        }

    }
}
    
