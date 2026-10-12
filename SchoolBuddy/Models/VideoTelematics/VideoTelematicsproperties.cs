namespace SchoolBuddy.Models.VideoTelematics
{
    /// <summary>Body of get_adas_alert_history (Dashboard and Report pages).</summary>
    public sealed class VtAlertHistoryRequest
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 25;
        public string? Scope { get; set; }
        public string? From { get; set; }
        public string? To { get; set; }
        public List<string>? DeviceImei { get; set; }
        public List<int>? AlarmCode { get; set; }
        public string? NotifyState { get; set; }
        public string? Filter { get; set; }
    }

    /// <summary>Body of save_adas_alert_config (Add Alert dialog).</summary>
    public sealed class VtSaveAlertConfigRequest
    {
        public List<int>? AlertMasterIds { get; set; }
        public List<string>? DeviceImeis { get; set; }
        public string? Priority { get; set; }
        public bool WhatsappEnabled { get; set; }
        public bool EmailEnabled { get; set; }
        public string? DeliveryMode { get; set; }
        public int? IntervalMinutes { get; set; }
        public int CooldownMinutes { get; set; }
        public bool IsActive { get; set; } = true;
    }

    /// <summary>Body of update_adas_alert_config (cooldown change).</summary>
    public sealed class VtUpdateAlertConfigRequest
    {
        public long Id { get; set; }
        public int CooldownMinutes { get; set; }
    }

    /// <summary>Body of toggle_adas_alert_config (enable / disable).</summary>
    public sealed class VtToggleAlertConfigRequest
    {
        public long Id { get; set; }
        public bool IsActive { get; set; }
    }

    /// <summary>Body of delete_adas_alert_config.</summary>
    public sealed class VtDeleteAlertConfigRequest
    {
        public List<long>? Ids { get; set; }
    }

    /// <summary>Raw upstream response, passed through to the browser unchanged.</summary>
    public sealed record VtApiResponse(int StatusCode, string Body);

    /// <summary>Result of logging in to both Trackofy servers before a page renders.</summary>
    public sealed record VtConnectionState(bool CoreReady, bool CmsReady, string? Message);

    /// <summary>
    /// Whether the logged-in account has MDVR (video) vehicles.
    /// Checked = false means Trackofy could not be asked (login or network failure).
    /// </summary>
    public sealed record VtMdvrStatus(bool Enabled, int VehicleCount, bool Checked, string? Message);

    /// <summary>Raised when a Trackofy login fails or the School Buddy session has no credentials.</summary>
    public sealed class VideoTelematicsAuthException : Exception
    {
        public VideoTelematicsAuthException(string message) : base(message) { }
    }
}
