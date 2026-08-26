using Newtonsoft.Json;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;
using System.Xml.Linq;

namespace SchoolBuddy.Models.Dashboard
{
    public class NotificationReadRequest
    {
        public long? Id { get; set; }
    }

    public class NotificationResponse
    {
        [JsonPropertyName("status")]
        public bool Status { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("data")]
        public NotificationData Data { get; set; } = new();
    }

    public class NotificationData
    {
        [JsonPropertyName("items")]
        public List<NotificationItem> Items { get; set; } = new();

        [JsonPropertyName("count")]
        public int Count { get; set; }

        [JsonPropertyName("has_more")]
        public bool HasMore { get; set; }

        [JsonPropertyName("limit")]
        public int Limit { get; set; }
    }

    public class NotificationItem
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("nid")]
        public long Nid { get; set; }

        [JsonPropertyName("sys_service_id")]
        public int SysServiceId { get; set; }

        [JsonPropertyName("alert_setting_id")]
        public int AlertSettingId { get; set; }

        [JsonPropertyName("msg_status")]
        public string msg_status { get; set; } = string.Empty;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("sent_on")]
        public DateTime sent_on { get; set; }

        [JsonPropertyName("gps_latitude")]
        public double gps_latitude { get; set; }

        [JsonPropertyName("gps_longitude")]
        public double gps_longitude { get; set; }

        [JsonPropertyName("is_read")]
        public int is_read { get; set; }
    }
    public class VehicleInService
    {
        public string sys_service_id { get; set; }
        public string veh_reg { get; set; }
        public string  route_name { get; set; }
        public string MaximumSpeedToday { get; set; }
        public string LastRunningTime { get; set; }
    }
    
    public class RouteLiveStatusModel
    {
        public string Route { get; set; }
        public string Vehicle { get; set; }
        public int Students { get; set; }

        public string StartTime { get; set; }
        public string EndTime { get; set; }

        public string StopName { get; set; }
        public string ETA { get; set; }

        public int? EtaDifferenceMinutes { get; set; }

        public string RouteStatus { get; set; }
        public string VehicleLiveStatus { get; set; }

        public decimal? CurrentSpeed { get; set; }
        public int? I2 { get; set; }

        public DateTime? LastTelemetryTime { get; set; }
    }
    public class Dashboard 
    {
        public string totalstudentcount { get; set; }
        public string assignedstudent { get; set; }
        public string totalroutecount { get; set; }
        public string totalnotificationcount { get; set; }
        public string todaynotificationcount { get; set; }
        public string totalbuscount { get; set; }
        public string totalliveroutecount { get; set; }

        public string HolidayName { get; set; }
        public string HolidayDate { get; set; }
        public string count { get; set; }

    }
    public class Dashboard_var
    {
       public string user_id { get; set; }
       public string database { get; set; }

        public int? page { get; set; }
        public int? pageSize { get; set; }
    }



    public class Event
    {
        public string from_date { get; set; }
        public string to_date { get; set; }
        public string description { get; set; }
    }
    public class LoginPayload
    {
        public string device_id { get; set; }
        public int domain_id { get; set; }
        public string username { get; set; }
        public string password { get; set; }
    }
    public class DriverPerformanceModel
    {
        public int DriverId { get; set; }

        public string DriverName { get; set; }

        public string BusName { get; set; }

        public string DriverStatus { get; set; }

        public string BusStatus { get; set; }
    }

    public class VehicleHealthResponse
    {
        public bool Status { get; set; }
        public string Message { get; set; }
        public List<VehicleHealthModel> Data { get; set; }
    }
    public class VehicleHealthModel
    {
        public string Id { get; set; }
        public string Temperature { get; set; }
        public string battery_percent { get; set; }
        public DateTime DateTime { get; set; }
        public string remaining_fuel { get; set; }
    }

}
