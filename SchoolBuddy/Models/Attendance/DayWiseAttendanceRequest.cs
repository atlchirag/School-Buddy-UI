using System.Text.Json.Serialization;

namespace SchoolBuddy.Models.Attendance;

public sealed class DayWiseAttendanceRequest
{
    public string? Date { get; set; }
}
public sealed class DayWiseAttendanceResponse
{
    [JsonPropertyName("success")] public bool Success { get; init; }
    [JsonPropertyName("message")] public string Message { get; init; } = string.Empty;
    [JsonPropertyName("attendanceDate")] public string? AttendanceDate { get; init; }
    [JsonPropertyName("totalStudents")] public int TotalStudents { get; init; }
    [JsonPropertyName("presentStudents")] public int PresentStudents { get; init; }
    [JsonPropertyName("absentStudents")] public int AbsentStudents { get; init; }
    [JsonPropertyName("attendancePercentage")] public decimal AttendancePercentage { get; init; }
    [JsonPropertyName("students")] public List<DayWiseAttendanceStudentResponse> Students { get; init; } = new();
}

public sealed class DayWiseAttendanceStudentResponse
{
    [JsonPropertyName("studentId")] public long StudentId { get; init; }
    [JsonPropertyName("admissionNo")] public string AdmissionNo { get; init; } = string.Empty;
    [JsonPropertyName("studentName")] public string StudentName { get; init; } = string.Empty;
    [JsonPropertyName("className")] public string ClassName { get; init; } = string.Empty;
    [JsonPropertyName("sectionName")] public string SectionName { get; init; } = string.Empty;
    [JsonPropertyName("vehicleNo")] public string VehicleNo { get; init; } = string.Empty;
    [JsonPropertyName("rfid")] public string Rfid { get; init; } = string.Empty;
    [JsonPropertyName("attendanceStatus")] public string AttendanceStatus { get; init; } = string.Empty;
}
public class Requestjson
{
    public string user_id { get; set; }
    public string? date { get; set; }
    public string? database { get; set; }
}
public class ClassWiseAttendanceRequest
{
    public string user_id { get; set; }

    public string class_id { get; set; }

    public string from_date { get; set; } = string.Empty;

    public string to_date { get; set; } = string.Empty;

    public string database { get; set; }
}
public sealed class ClassWiseAttendanceResponse
{
    public bool Success { get; set; }

    public string Message { get; set; } = string.Empty;

    public string ClassId { get; set; }

    public string ClassName { get; set; } = string.Empty;

    public string DateFrom { get; set; } = string.Empty;

    public string DateTo { get; set; } = string.Empty;

    public int TotalDays { get; set; }

    public int PresentDays { get; set; }

    public int AbsentDays { get; set; }

    public decimal AttendancePercentage { get; set; }

    public List<ClassWiseAttendanceRowResponse> Attendance { get; set; }
        = new List<ClassWiseAttendanceRowResponse>();
}

public sealed class ClassWiseAttendanceRowResponse
{
    public long StudentId { get; set; }

    public string AdmissionNo { get; set; } = string.Empty;

    public string StudentName { get; set; } = string.Empty;

    public string ClassName { get; set; } = string.Empty;

    public string SectionName { get; set; } = string.Empty;

    public string AttendanceDate { get; set; } = string.Empty;

    public string AttendanceTime { get; set; } = string.Empty;

    public string VehicleNo { get; set; } = string.Empty;

    public string Rfid { get; set; } = string.Empty;

    public string AttendanceStatus { get; set; } = string.Empty;
}
