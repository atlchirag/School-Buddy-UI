using Azure.Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using SchoolBuddy.Models.Attendance;
using SchoolBuddy.Repositories.Attendance;
using System.Globalization;

namespace SchoolBuddy.Controllers;

public class AttendanceController : BaseController
{
    private const string DateFormat = "yyyy-MM-dd";
    private readonly IAttendanceRepository _attendanceRepository;
    private readonly HttpClient _httpClient;

    public AttendanceController(IAttendanceRepository attendanceRepository,HttpClient httpClient)
    {
        _attendanceRepository = attendanceRepository;
        _httpClient = httpClient;
    }

    [HttpGet]
    public IActionResult Attendance() => View("Views/Home/Attendance/Attendance.cshtml");

    [HttpGet]
    public async Task<IActionResult> GetDayWiseAttendance([FromQuery] DayWiseAttendanceRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Date))
            return BadRequest(Failure("Attendance date is required."));

        //if (!DateTime.TryParseExact(request.Date, DateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var attendanceDate))
        //    return BadRequest(Failure("Invalid date. Expected format is yyyy-MM-dd."));

        try
        {
            string user=HttpContext.Session.GetString("uid");
           string db= HttpContext.Session.GetString("database");
            var students = await _attendanceRepository.GetDayWiseAttendanceAsync(request.Date, db,user,cancellationToken);
            var totalStudents = students.Count;
            var presentStudents = students.Count(s => string.Equals(s.AttendanceStatus, "Present", StringComparison.OrdinalIgnoreCase));
            var absentStudents = totalStudents - presentStudents;
            var percentage = totalStudents == 0 ? 0m : Math.Round((decimal)presentStudents / totalStudents * 100m, 1);

            return Ok(new DayWiseAttendanceResponse
            {
                Success = true, Message = "Attendance loaded successfully.",
                AttendanceDate = request.Date,
                TotalStudents = totalStudents, PresentStudents = presentStudents,
                AbsentStudents = absentStudents, AttendancePercentage = percentage, Students = students
            });
        }
        catch (Exception exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, Failure("An error occurred while loading attendance."));
        }
    }

    private static object Failure(string message) => new

    {
        success = false,
        message,
        students = new List<DayWiseAttendanceStudentResponse>()
    };


    [HttpGet]
    public async Task<IActionResult> GetClassWiseAttendance(
    string classId,
    string date)
    {
        try
        {
            string? user =
                HttpContext.Session.GetString("uid");

            string? db =
                HttpContext.Session.GetString("database");

            if (string.IsNullOrWhiteSpace(user))
            {
                return Json(new ClassWiseAttendanceResponse
                {
                    Success = false,
                    Message = "User session was not found.",
                    ClassId = classId,
                    DateFrom = date ?? string.Empty,
                    Attendance = new List<ClassWiseAttendanceRowResponse>()
                });
            }

            if (string.IsNullOrWhiteSpace(db))
            {
                return Json(new ClassWiseAttendanceResponse
                {
                    Success = false,
                    Message = "Database session was not found.",
                    ClassId = classId,
                    DateFrom = date ?? string.Empty,
                    Attendance = new List<ClassWiseAttendanceRowResponse>()
                });
            }

           

            if (string.IsNullOrWhiteSpace(date))
            {
                return Json(new ClassWiseAttendanceResponse
                {
                    Success = false,
                    Message = "Attendance date is required.",
                    ClassId = classId,
                    DateFrom = date ?? string.Empty,
                    Attendance = new List<ClassWiseAttendanceRowResponse>()
                });
            }

            if (!DateTime.TryParseExact(
                    date,
                    DateFormat,
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out DateTime attendanceDate))
            {
                return Json(new ClassWiseAttendanceResponse
                {
                    Success = false,
                    Message = "Invalid attendance date. Expected format is yyyy-MM-dd.",
                    ClassId = classId,
                    DateFrom = date,
                    Attendance = new List<ClassWiseAttendanceRowResponse>()
                });
            }

            var rows =
                await _attendanceRepository
                    .GetClassWiseAttendanceAsync(
                        classId,
                        date,
                        db,
                        user
                    );

            rows ??= new List<ClassWiseAttendanceRowResponse>();

            int totalRecords = rows.Count;

            int presentRecords = rows.Count(row =>
                string.Equals(
                    row.AttendanceStatus,
                    "Present",
                    StringComparison.OrdinalIgnoreCase
                )
            );

            int absentRecords = rows.Count(row =>
                string.Equals(
                    row.AttendanceStatus,
                    "Absent",
                    StringComparison.OrdinalIgnoreCase
                )
            );

            decimal attendancePercentage =
                totalRecords == 0
                    ? 0m
                    : Math.Round(
                        (decimal)presentRecords /
                        totalRecords *
                        100m,
                        1
                    );

            string className =
                rows.FirstOrDefault()?.ClassName
                ?? string.Empty;

            return Json(new ClassWiseAttendanceResponse
            {
                Success = true,

                Message = totalRecords > 0
                    ? "Class-wise attendance loaded successfully."
                    : "No attendance records found for the selected class and date.",

                ClassId = classId,
                ClassName = className,

                DateFrom = attendanceDate.ToString(DateFormat),
                DateTo = attendanceDate.ToString(DateFormat),

                TotalDays = totalRecords,
                PresentDays = presentRecords,
                AbsentDays = absentRecords,

                AttendancePercentage = attendancePercentage,

                Attendance = rows
            });
        }
        catch (Exception ex)
        {
            General.WriteToLogFile(
                $"{ex.Message} - GetClassWiseAttendance",
                "D:\\Dotnet_Applications\\schoolbuddy\\log",
                "log.txt"
            );

            return Json(new ClassWiseAttendanceResponse
            {
                Success = false,
                Message =
                    "An error occurred while loading class-wise attendance.",

                ClassId = classId,
                DateFrom = date ?? string.Empty,

                TotalDays = 0,
                PresentDays = 0,
                AbsentDays = 0,
                AttendancePercentage = 0,

                Attendance =
                    new List<ClassWiseAttendanceRowResponse>()
            });
        }
    }
}
