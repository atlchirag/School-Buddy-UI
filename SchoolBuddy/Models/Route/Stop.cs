using System.Security.Policy;

namespace SchoolBuddy.Models.Route
{
    public class Stop
    {
        public string Stop_Name { get; set; }
        public string route_id { get; set; }
        public string? id { get; set; }
        public string uid { get; set; }
        public string Latitude { get; set; }
        public string Longitude { get; set; }
        public string? stop_order { get; set; }

    }
    public class ExistingStop
    {
        public int id { get; set; }
        public string latitude { get; set; }
        public string longitude { get; set; }
        public string user_stop_name { get; set; }
        public int? stop_order { get; set; }
        public int? status { get; set; }
    }
    public class getstop
    {
        public string id { get; set; }
        public string user_stop_name { get; set; }
        public string stop_order { get; set; }
        public string latitude { get; set; }
        public string longitude { get; set; }
        public string student_name { get; set; }
        public string rf_id { get; set; }

        
    }

    

    public class getstopid
    {
        public string id { get; set; }
    }

    public class get_stopid
    {
        public string id { get; set; }
        public string rid { get; set; }
    }

}
