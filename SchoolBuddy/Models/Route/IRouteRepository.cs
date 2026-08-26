using SchoolBuddy.Models.Students;

namespace SchoolBuddy.Models.Route
{
    public interface IRouteRepository
    {
        //IEnumerable<routedetails> GetRoutes();
        Task<string> GetRouteByID(string id);
        Task<string> GetRoutes(string id, string db);

        Task<string> GetBuses(string user_id,string db);
        //Students UpdateStudent(Students student);
        Task<string> DeleteRoute(string id);
        Task<string> AddRoute(routedetails route, string school_id);
        Task<string> GetAllRouteAPICall(string user_id, string db);
        Task<string> UpdateRoute(Eroutedetails route,string uid);

        Task<string> getPlayBack(string service_id, string start_date, string end_date);

        Task<string> getStops(string route_id);
        Task<string> geAssignedStudents_route(string route_id);
        Task<string> getStudentWise_route(string sys_user_id);

        Task<string> getAssignedStudents(string route_id);

        public Task<string> AssignStudents(IFormFile file, string r_id, string schoolid);
        Task<string> addPlayBack(playbackdata playbackdata_Api);
        Task<string> AddStop(Stop stop);
        Task<string> EditStop(Stop stop);
        Task<string> GetAllAssignedStudents(string stopid);
        Task<string> DeleteStop(string id, string route_id);

        Task<string> AssignStoptosingalstudent(assign_student AS);

        Task<string> GetHaltsMultiDayTelemetry(string schoolId, string routeId, string startDate, string endDate, string pass, string user);
        Task<string> GetExistingStops(string routeId);

        Task<byte[]> DownloadAssignedStudentsExcel(string routeId);

        Task<string> UpdateStudentWise(UpdateStudentModel student, string uid);
        Task<string> DeleteStudent(int id);

    }
}
