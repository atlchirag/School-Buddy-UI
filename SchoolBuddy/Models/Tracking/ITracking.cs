namespace SchoolBuddy.Models.Tracking
{
    public interface ITracking
    {
        List<DeviceIdAndVehicle> GetVehicles(string school_name,string password, string database);
        Task<string> GetImei(string id, string datbabase);

        string GetLiveTrackingURL(string imei, string database);
        Task<List<DeviceIdAndVehiclenew> >GetVehiclesAsync(
    string schoolName,
    string password,
    string database,
    string token);




    }
}
