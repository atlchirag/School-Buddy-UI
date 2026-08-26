namespace SchoolBuddy.Models.Report
{
    public interface IReportRepository
    {
        Task<string> GetNotification(string user_id,string date, string database);
        Task<string> Attandence(string user_id,string db ,string from,string to);
        Task<string> Boarding(string user_id, string db, string from, string to);

        Task<string> GetAllStudents(string user_id);

        Task<string> GetNoGps(string user_id);

        Task<string> GetLoginReport(string user_id,string date);

        Task<string> GetRFIDReport(string user_id, string date,string database);

        Task<string> GetAllRoutes(string user_id);

        Task<string> GetStudentNotificationReport(string user_id, string fdate, string tdate, string students);
        Task<string> GetAlertNotificationReport(string user_id, string fdate,  string routes);
        Task<string> GenerateTrackofyReportAsync(TrackofyReportRequest request, string token);
        Task<string> GetDriverPerformanceReportAsync(DriverPerformanceReportRequest request, string token);
        Task<string> GetVehicleSummaryReportAsync(VehicleSummaryReportRequest request, string token);
        Task<string> GetTemperatureReportAsync(TemperatureReportRequest request, string token);
        Task<string> GetIdleSummaryReportAsync(TrackofyIdleSummaryRequest request, string token);
    }
}
