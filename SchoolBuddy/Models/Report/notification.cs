namespace SchoolBuddy.Models.Report
{
    public class TrackofyReportRequest
    {
        public string? ReportType { get; set; }
        public string? AlertId { get; set; }
        public string? Columns { get; set; }
        public string? VehicleList { get; set; }
        public string? StartDate { get; set; }
        public string? EndDate { get; set; }
        public string? MinDistance { get; set; }
        public string? MaxDistance { get; set; }
        public string? Page { get; set; }
        public string? PerPage { get; set; }
        public string? TimezoneDiff { get; set; }
    }

    public class DriverPerformanceReportRequest
    {
        [Microsoft.AspNetCore.Mvc.FromForm(Name = "columns")]
        public string Columns { get; set; }

        [Microsoft.AspNetCore.Mvc.FromForm(Name = "start_date")]
        public string StartDate { get; set; }

        [Microsoft.AspNetCore.Mvc.FromForm(Name = "end_date")]
        public string EndDate { get; set; }

        [Microsoft.AspNetCore.Mvc.FromForm(Name = "timezoneDiff")]
        public string TimezoneDiff { get; set; }

        [Microsoft.AspNetCore.Mvc.FromForm(Name = "page")]
        public string Page { get; set; }

        [Microsoft.AspNetCore.Mvc.FromForm(Name = "per_page")]
        public string PerPage { get; set; }
    }

    public class VehicleSummaryReportRequest
    {
        [Microsoft.AspNetCore.Mvc.FromForm(Name = "columns")]
        public string Columns { get; set; }

        [Microsoft.AspNetCore.Mvc.FromForm(Name = "start_date")]
        public string StartDate { get; set; }

        [Microsoft.AspNetCore.Mvc.FromForm(Name = "end_date")]
        public string EndDate { get; set; }

        [Microsoft.AspNetCore.Mvc.FromForm(Name = "vehicleList")]
        public string VehicleList { get; set; }
    }

    public class TemperatureReportRequest
    {
        public string Columns { get; set; } = string.Empty;
        public string? VehicleList { get; set; }
        public string? StartDate { get; set; }
        public string? EndDate { get; set; }
        public int Page { get; set; } = 1;
        public int PerPage { get; set; } = 10;
    }

    public class TrackofyTemperatureRequest
    {
        [Newtonsoft.Json.JsonProperty("columns")] public string Columns { get; set; } = string.Empty;
        [Newtonsoft.Json.JsonProperty("end_date")] public string EndDate { get; set; } = string.Empty;
        [Newtonsoft.Json.JsonProperty("page")] public string Page { get; set; } = "1";
        [Newtonsoft.Json.JsonProperty("per_page")] public string PerPage { get; set; } = "10";
        [Newtonsoft.Json.JsonProperty("start_date")] public string StartDate { get; set; } = string.Empty;
        [Newtonsoft.Json.JsonProperty("timezoneDiff")] public string timezoneDiff { get; set; } = "330";
        [Newtonsoft.Json.JsonProperty("vehicleList")] public string VehicleList { get; set; } = string.Empty;
    }

    public class TrackofyTemperatureRow
    {
        [Newtonsoft.Json.JsonProperty("Date")] public string? Date { get; set; }
        [Newtonsoft.Json.JsonProperty("Min Temperature(°C)")] public decimal? MinTemperature { get; set; }
        [Newtonsoft.Json.JsonProperty("Min Temp Lat/Long")] public string? MinTemperatureLatLong { get; set; }
        [Newtonsoft.Json.JsonProperty("Min Temp Status")] public string? MinTemperatureStatus { get; set; }
        [Newtonsoft.Json.JsonProperty("Avg Temperature(°C)")] public decimal? AverageTemperature { get; set; }
        [Newtonsoft.Json.JsonProperty("Max Temperature(°C)")] public decimal? MaxTemperature { get; set; }
        [Newtonsoft.Json.JsonProperty("Max Temp Lat/Long")] public string? MaxTemperatureLatLong { get; set; }
        [Newtonsoft.Json.JsonProperty("Max Temp Status")] public string? MaxTemperatureStatus { get; set; }
    }

    public class TrackofyTemperatureMeta
    {
        [Newtonsoft.Json.JsonProperty("page")] public int Page { get; set; }
        [Newtonsoft.Json.JsonProperty("per_page")] public int PerPage { get; set; }
        [Newtonsoft.Json.JsonProperty("total")] public int Total { get; set; }
        [Newtonsoft.Json.JsonProperty("last_page")] public int LastPage { get; set; }
        [Newtonsoft.Json.JsonProperty("count")] public int Count { get; set; }
    }

    public class TrackofyTemperatureData
    {
        [Newtonsoft.Json.JsonProperty("response")] public List<TrackofyTemperatureRow>? Response { get; set; }
        [Newtonsoft.Json.JsonProperty("meta")] public TrackofyTemperatureMeta? Meta { get; set; }
    }

    public class TrackofyTemperatureResponse
    {
        [Newtonsoft.Json.JsonProperty("status")] public bool Status { get; set; }
        [Newtonsoft.Json.JsonProperty("message")] public string? Message { get; set; }
        [Newtonsoft.Json.JsonProperty("data")] public TrackofyTemperatureData? Data { get; set; }
    }

    public class TrackofyIdleSummaryRequest
    {
        [Newtonsoft.Json.JsonProperty("start_date")] public string? StartDate { get; set; }
        [Newtonsoft.Json.JsonProperty("end_date")] public string? EndDate { get; set; }
        [Newtonsoft.Json.JsonProperty("page")] public string? Page { get; set; }
        [Newtonsoft.Json.JsonProperty("per_page")] public string? PerPage { get; set; }
        [Newtonsoft.Json.JsonProperty("timezoneDiff")] public string? TimezoneDifference { get; set; }
        [Newtonsoft.Json.JsonProperty("vehicleList")] public string? VehicleList { get; set; }
    }

    public class TrackofyIdleSummaryRow
    {
        [Newtonsoft.Json.JsonProperty("service_id")] public long? ServiceId { get; set; }
        [Newtonsoft.Json.JsonProperty("Unit")] public string? Unit { get; set; }
        [Newtonsoft.Json.JsonProperty("Total Idle Time")] public string? TotalIdleTime { get; set; }
        [Newtonsoft.Json.JsonProperty("Total Halt Time")] public string? TotalHaltTime { get; set; }
        [Newtonsoft.Json.JsonProperty("Max Idle")] public string? MaximumIdleTime { get; set; }
        [Newtonsoft.Json.JsonProperty("idle_latitude")] public string? IdleLatitude { get; set; }
        [Newtonsoft.Json.JsonProperty("idle_longitude")] public string? IdleLongitude { get; set; }
        [Newtonsoft.Json.JsonProperty("Start Time")] public string? StartTime { get; set; }
        [Newtonsoft.Json.JsonProperty("End Time")] public string? EndTime { get; set; }
        [Newtonsoft.Json.JsonProperty("Total Distance")] public string? TotalDistance { get; set; }
        [Newtonsoft.Json.JsonProperty("Total Running Time")] public string? TotalRunningTime { get; set; }
        [Newtonsoft.Json.JsonProperty("Max Idle Location")] public string? MaximumIdleLocation { get; set; }
        [Newtonsoft.Json.JsonProperty("sys_service_id")] public long? ErrorServiceId { get; set; }
        [Newtonsoft.Json.JsonProperty("vehiclename")] public string? ErrorVehicleName { get; set; }
        [Newtonsoft.Json.JsonProperty("error")] public string? Error { get; set; }
    }

    public class TrackofyPaginationMeta
    {
        [Newtonsoft.Json.JsonProperty("page")] public int Page { get; set; }
        [Newtonsoft.Json.JsonProperty("per_page")] public int PerPage { get; set; }
        [Newtonsoft.Json.JsonProperty("total")] public int Total { get; set; }
        [Newtonsoft.Json.JsonProperty("last_page")] public int LastPage { get; set; }
        [Newtonsoft.Json.JsonProperty("count")] public int Count { get; set; }
    }

    public class TrackofyIdleSummaryData
    {
        [Newtonsoft.Json.JsonProperty("response")] public List<TrackofyIdleSummaryRow>? Response { get; set; }
        [Newtonsoft.Json.JsonProperty("meta")] public TrackofyPaginationMeta? Meta { get; set; }
    }

    public class TrackofyIdleSummaryResponse
    {
        [Newtonsoft.Json.JsonProperty("status")] public bool Status { get; set; }
        [Newtonsoft.Json.JsonProperty("message")] public string? Message { get; set; }
        [Newtonsoft.Json.JsonProperty("data")] public TrackofyIdleSummaryData? Data { get; set; }
    }

    public class user
    {
        public string from { get; set; }
        public string to { get; set; }
        public string user_id { get; set; }
        public string database { get; set; }
    }
    public class boarding
    {
        public string from { get; set; }
        public string to { get; set; }
        public string user_id { get; set; }
        public string database { get; set; }
    }
    public class notification
    {
        public string date { get; set; }
        public string user_id { get; set; }
        public string database { get; set; }
    }
    public class student_notification
    {
        public string datefrom { get; set; }
        public string dateto { get; set; }
        public string student_id { get; set; }
        public string user_id { get; set; }
    }

    public class alert_notification
    {
        public string datefrom { get; set; }
      
        public string route_id { get; set; }
        public string user_id { get; set; }
    }
    public class AttendanceExcelModel
    {
        public string? student_name { get; set; }
        public string? admission_no { get; set; }

        public string? class_name { get; set; }
        public string? section { get; set; }
        public string? father_name { get; set; }
        public string? mobile_no1 { get; set; }
        public string? rfid { get; set; }
        public string? AttendanceTime { get; set; }
       
    }
}
