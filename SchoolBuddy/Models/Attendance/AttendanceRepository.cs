using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using SchoolBuddy.Models.ApiTemplate;
using SchoolBuddy.Models.Attendance;
using System.Data;

namespace SchoolBuddy.Repositories.Attendance;

public sealed class AttendanceRepository : IAttendanceRepository
{
    private readonly Iapitemplate _apitemplate;

    public AttendanceRepository(Iapitemplate iapitemplate)
    {
        _apitemplate = iapitemplate;
    }

    public async Task<List<DayWiseAttendanceStudentResponse>>GetDayWiseAttendanceAsync(
          string attendanceDate, string database,
          string userId,
          CancellationToken cancellationToken = default)
    {
        try
        {
            var payload = new Requestjson
            {
                 user_id= userId,
                date = attendanceDate,
                database= database
            };

            string json = JsonConvert.SerializeObject(payload);

            string urlEnd = "Attendance/DaywiseAttendence";

            string apiResult = await _apitemplate.PostApiTemplate(
                json,
                urlEnd
            );

           
            if (string.IsNullOrWhiteSpace(apiResult))
            {
                return new List<
                    DayWiseAttendanceStudentResponse
                >();
            }

            var students =
                JsonConvert.DeserializeObject<
                    List<DayWiseAttendanceStudentResponse>
                >(apiResult);

            return students ??
                   new List<
                       DayWiseAttendanceStudentResponse
                   >();
        }
        catch (Exception ex)
        {
            return new List<DayWiseAttendanceStudentResponse>();
        }
    }
    public async Task<List<ClassWiseAttendanceRowResponse>> GetClassWiseAttendanceAsync(
        string classId,
         string date, string database,
         string userId
         )
    {
        try
        {
            var payload = new ClassWiseAttendanceRequest
            {
                user_id = userId,
                from_date = date,
                to_date = date,
                database=database,
                class_id=classId
            };

            string json = JsonConvert.SerializeObject(payload);

            string urlEnd = "Attendance/ClassWiseAttendence";

            string apiResult = await _apitemplate.PostApiTemplate(
                json,
                urlEnd
            );


            if (string.IsNullOrWhiteSpace(apiResult))
            {
                return new List<
                    ClassWiseAttendanceRowResponse
                >();
            }

            var students =
                JsonConvert.DeserializeObject<
                    List<ClassWiseAttendanceRowResponse>
                >(apiResult);

            return students ??
                   new List<
                       ClassWiseAttendanceRowResponse
                   >();
        }
        catch (Exception ex)
        {
            return new List<ClassWiseAttendanceRowResponse>();
        }
    }
    private static string GetString(SqlDataReader reader, int ordinal) =>
        reader.IsDBNull(ordinal) ? string.Empty : Convert.ToString(reader.GetValue(ordinal)) ?? string.Empty;
}
