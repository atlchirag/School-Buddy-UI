using SchoolBuddy.Models.Driver;

namespace SchoolBuddy.Models.Dashboard
{
    public interface IDashboardRepository
    {
        Task<List<VehicleInService>> VehicleInServices(string user, string db);
        Task<List<NotificationItem>> MarkNotificationAsRead(string id, string token);
       Task<List<NotificationItem>> GetFilteredNotifications(
    DateTime startDateTime,
    DateTime endDateTime, string token,string status);
        Task<List<NotificationItem>> Alerts(string token);
        Task<string> SendPayload(string user, string pass);
        Task<string> RFIDPUNCHED(string user_id,string db);

        Task<string> CountTotalStudentAPICall(string user_id);
        Task<string> counttotalrouteApiCall(string user_id);

        Task<string> counttotalNotificationApiCall(string user_id);

        Task<List<VehicleHealthModel>> Vehicle_health(string token);
        Task<string> countIdleBusApiCall(string user_id);
        Task<string> countStopBusesApiCall(string user_id);
        Task<string> countTodayNotificationApiCall(string user_id);
        Task<string> countTotalBusApiCall(string user_id);
        Task<string> countTotalLiveRouteApiCall(string user_id, string database);
        Task<string> TotalSutudentSummary(string user_id, string database);
        Task<string> TotalBusesSummary(string user_id, string database);
        Task<string> TotalTodayNotificationsSummary(string user_id);
        Task<string> TotalNotificationsSummary(string user_id, int page, int pagesize);
        Task<string> TotalLiveRoutesSummary(string user_id, string database );
        Task<string> GetUpcomingHolidays(string user_id);
        Task<string> UpcomingEentSummary(string user_id);

        Task<string> Address(string lat, string lng);


        Task<string> StopWiseVoilation(string uid,string db);

        Task<string> countassignedstudent(string user_id);

        Task<driverdashboard> DriverPerformance(string user, string pass);
        Task<List<RouteLiveStatusModel>> RoutePerformance(string user,string db);
    }
}
