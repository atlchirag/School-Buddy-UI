using SchoolBuddy.Models.Attendance;

namespace SchoolBuddy.Repositories.Attendance;

public interface IAttendanceRepository
{
    Task<List<DayWiseAttendanceStudentResponse>> GetDayWiseAttendanceAsync(
           string attendanceDate, string database,
           string userId,
           CancellationToken cancellationToken = default);
    Task<List<ClassWiseAttendanceRowResponse>> GetClassWiseAttendanceAsync(
        string classid, string from,string database,
          string userId
          );
}
