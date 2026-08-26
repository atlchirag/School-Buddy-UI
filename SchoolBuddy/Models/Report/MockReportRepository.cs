using Newtonsoft.Json;
using SchoolBuddy.Models.ApiTemplate;
using SchoolBuddy.Models.Dashboard;
using SchoolBuddy.Models.Route;
using SchoolBuddy.Models.Students;
using System.Diagnostics;
using System.Text;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace SchoolBuddy.Models.Report
{
    public class MockReportRepository : IReportRepository
    {

        private readonly Iapitemplate _apitemplate;
        public MockReportRepository(Iapitemplate apitemplate)
        {
            _apitemplate = apitemplate;
        }

        public async Task<string> GetAllStudents(string user_id)
        {
            try
            {
                
                var json = JsonConvert.SerializeObject(new notification
                {
                    
                    user_id = user_id,

                });
                string urlend = $@"Students/GetAllStudents";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                return "";
            }
        }
        public async Task<string> Attandence(string user_id, string db,string from,string to)
        {
            try
            {


                var json = JsonConvert.SerializeObject(new user
                {
                    database=db,
                    from=from,
                    to=to,
                    user_id = user_id
                });
                string urlend = $@"Report/Attendence";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> Boarding(string user_id, string db, string from, string to)
        {
            try
            {


                var json = JsonConvert.SerializeObject(new boarding
                {

                    from = from,
                    to = to,
                    user_id = user_id,
                    database=db
                });
                string urlend = $@"Dashboard/RFIDPUNCHED";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                return "";
            }
        }
        public async Task<string> GetNoGps(string user_id)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new notification
                {
                  
                    user_id = user_id,

                });
                string urlend = $@"Report/NoGps";
                return await _apitemplate.PostApiTemplate(json,urlend);
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> GetNotification(string user_id, string date, string database)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new notification
                {
                    date = date,
                    user_id = user_id,
                    database = database

                });
                string urlend = $@"Report/GetNotification";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> GetLoginReport(string user_id, string date)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new notification
                {
                    date = date,
                    user_id = user_id,

                });
                string urlend = $@"Report/LoginReport";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> GetStudentNotificationReport(string user_id, string fdate,string tdate,string students)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new student_notification
                {
                    datefrom = fdate,
                    dateto =tdate,
                    student_id = students,
                    user_id = user_id

                });

                string urlend = $@"Report/GetStudentNotificationLog";
                return await _apitemplate.PostApiTemplate(json,urlend);
            }
            catch (Exception ex)
            {
                return "";
            }
        }


        public async Task<string> GetRFIDReport(string user_id, string date,string database)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new notification
                {

                    date = date,
                    user_id = user_id,
                    database=database

                });

                string urlend = $@"Report/RfidReport";
                return await _apitemplate.PostApiTemplate(json,urlend);
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> GetAllRoutes(string user_id)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new notification
                {

                    user_id = user_id,

                });
                string urlend = $@"Route/GetRoutes";
                return await _apitemplate.PostApiTemplate(json,urlend);
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> GetAlertNotificationReport(string user_id, string fdate, string routes)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new alert_notification
                {
                    datefrom = fdate,

                    route_id = routes,
                    user_id = user_id

                });
                string urlend = $@"Report/StopVoilationReport";

                return await _apitemplate.PostApiTemplate(json,urlend);
            }
            catch (Exception ex)
            {
                return "";
            }
        }
        public virtual Task<string> GetDriverPerformanceReportAsync(DriverPerformanceReportRequest request, string token)
        {
            throw new NotSupportedException("Driver Performance Report is available through ReportRepository.");
        }

        public virtual Task<string> GetVehicleSummaryReportAsync(VehicleSummaryReportRequest request, string token)
        {
            throw new NotSupportedException("Vehicle Summary Report is available through ReportRepository.");
        }

        public virtual Task<string> GenerateTrackofyReportAsync(TrackofyReportRequest request, string token)
        {
            throw new NotSupportedException("Trackofy reports are available through ReportRepository.");
        }

        public virtual Task<string> GetTemperatureReportAsync(TemperatureReportRequest request, string token)
        {
            throw new NotSupportedException("Temperature Report is available through ReportRepository.");
        }

        public virtual Task<string> GetIdleSummaryReportAsync(TrackofyIdleSummaryRequest request, string token)
        {
            throw new NotSupportedException("Idle Summary Report is available through ReportRepository.");
        }
    }
}
