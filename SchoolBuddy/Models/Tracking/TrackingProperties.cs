namespace SchoolBuddy.Models.Tracking
{
    public class TrackingProperties
    {
        public int Deviceid { get; set; }
        public string Name { get; set; }
        public string Speed { get; set; }
        public string LastContact { get; set; }
        public string Odometer { get; set; }
        public string Ignition { get; set; }
        public string GPS { get; set; }
        public string Latitude { get; set; }
        public string Longitude { get; set; }
        public string Address { get; set; }
    }

    public class DeviceIdAndVehicle
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public class Device
    {
        public string id { get; set; }
        public string database { get; set; }

    }
    public class Imei
    {
        public string imei { get; set; }

    }


    public class VehicleListApiResponse
    {
        public bool status { get; set; }

        public string message { get; set; }

        public VehicleStatusCount status_count { get; set; }

        public List<TrackofyVehicleItem> data { get; set; }
    }

    public class VehicleStatusCount
    {
        public int running { get; set; }

        public int idle { get; set; }

        public int stop { get; set; }

        public int no_data { get; set; }

        public int all { get; set; }
    }

    public class TrackofyVehicleItem
    {
        public int service_id { get; set; }

        public string veh_reg { get; set; }

        public object is_mdvr { get; set; }

        public string imei { get; set; }

        public string vehileRunningStatus { get; set; }

        public decimal speed { get; set; }

        public string lastcontact { get; set; }

        public string ignitionOnOff { get; set; }
    }

    public class DeviceIdAndVehiclenew
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string Imei { get; set; }

        public string Status { get; set; }

        public decimal Speed { get; set; }

        public string LastContact { get; set; }

        public string IgnitionStatus { get; set; }
    }


}
