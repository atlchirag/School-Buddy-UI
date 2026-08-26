namespace SchoolBuddy.Models.Route
{
    public class HaltsRequest
    {
        public string schoolId { get; set; }
        public string routeId { get; set; }
        public string startDate { get; set; }
        public string endDate { get; set; }
    }

    public class ExistingStopsRequest
    {
        public string route_id { get; set; }
    }

    public class DraftStopRequest
    {
        public string route_id { get; set; }
        public string stop_name { get; set; }
        public string latitude { get; set; }
        public string longitude { get; set; }
        public string stop_order { get; set; }
    }
}