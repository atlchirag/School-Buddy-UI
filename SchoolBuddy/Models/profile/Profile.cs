using System.Text.Json.Serialization;

namespace SchoolBuddy.Models
{
    public class ProfileApiResponse
    {
        [JsonPropertyName("status")]
        public bool status { get; set; }

        [JsonPropertyName("message")]
        public string message { get; set; } = string.Empty;

        [JsonPropertyName("data")]
        public ProfileData data { get; set; } = new();
    }

    public class ProfileData
    {
        [JsonPropertyName("maps")]
        public MapData maps { get; set; } = new();

        [JsonPropertyName("settings")]
        public ProfileSettings settings { get; set; } = new();

        [JsonPropertyName("profile")]
        public SchoolProfile profile { get; set; } = new();

        [JsonPropertyName("limits")]
        public ProfileLimits limits { get; set; } = new();
    }

    public class MapData
    {
        [JsonPropertyName("count")]
        public int count { get; set; }

        [JsonPropertyName("list")]
        public List<MapItem> list { get; set; } = new();
    }

    public class MapItem
    {
        [JsonPropertyName("id")]
        public int id { get; set; }

        [JsonPropertyName("type")]
        public string type { get; set; } = string.Empty;
    }

    public class ProfileSettings
    {
        [JsonPropertyName("map_id")]
        public int? map_id { get; set; }

        [JsonPropertyName("date_format")]
        public string date_format { get; set; } = string.Empty;
    }

    public class SchoolProfile
    {
        [JsonPropertyName("full_name")]
        public string full_name { get; set; } = string.Empty;

        [JsonPropertyName("company_name")]
        public string company_name { get; set; } = string.Empty;

        [JsonPropertyName("mobile")]
        public string mobile { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string email { get; set; } = string.Empty;

        [JsonPropertyName("timezone")]
        public string timezone { get; set; } = string.Empty;

        [JsonPropertyName("language")]
        public string language { get; set; } = string.Empty;

        [JsonPropertyName("currency")]
        public string currency { get; set; } = string.Empty;

        [JsonPropertyName("plan_name")]
        public string plan_name { get; set; } = string.Empty;

        [JsonPropertyName("payment_type")]
        public string payment_type { get; set; } = string.Empty;

        [JsonPropertyName("bill_type")]
        public string bill_type { get; set; } = string.Empty;

        [JsonPropertyName("gst_no")]
        public string gst_no { get; set; } = string.Empty;

        [JsonPropertyName("pan_no")]
        public string pan_no { get; set; } = string.Empty;

        [JsonPropertyName("total_devices")]
        public int total_devices { get; set; }

        [JsonPropertyName("profile_url")]
        public string profile_url { get; set; } = string.Empty;

        [JsonPropertyName("address")]
        public string address { get; set; } = string.Empty;
    }

    public class ProfileLimits
    {
        [JsonPropertyName("device_limit")]
        public int device_limit { get; set; }

        [JsonPropertyName("device_limit_left_raw")]
        public int device_limit_left_raw { get; set; }

        [JsonPropertyName("device_limit_left")]
        public int device_limit_left { get; set; }

        [JsonPropertyName("added_device")]
        public int added_device { get; set; }

        [JsonPropertyName("message_limit")]
        public int message_limit { get; set; }

        [JsonPropertyName("message_limit_left_raw")]
        public int message_limit_left_raw { get; set; }

        [JsonPropertyName("message_limit_left")]
        public int message_limit_left { get; set; }

        [JsonPropertyName("used_sms")]
        public int used_sms { get; set; }

        [JsonPropertyName("sub_user_limit")]
        public int sub_user_limit { get; set; }

        [JsonPropertyName("sub_user_limit_left_raw")]
        public int sub_user_limit_left_raw { get; set; }

        [JsonPropertyName("sub_user_limit_left")]
        public int sub_user_limit_left { get; set; }

        [JsonPropertyName("added_subuser")]
        public int added_subuser { get; set; }

        [JsonPropertyName("email_limit")]
        public int email_limit { get; set; }

        [JsonPropertyName("email_limit_left_raw")]
        public int email_limit_left_raw { get; set; }

        [JsonPropertyName("email_limit_left")]
        public int email_limit_left { get; set; }

        [JsonPropertyName("used_email")]
        public int used_email { get; set; }
    }
}