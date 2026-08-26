namespace SchoolBuddy.Models.Driver
{
    public class driver
    {
        public string? id { get; set; }
        public string? name { get; set; }
        public string? dob { get; set; }

        public string? address { get; set; }
        public string? mobile { get; set; }
        public string? email { get; set; }

        public string? dl_no { get; set; }

        public string? dl_issued { get; set; }
        public string? dl_expiry { get; set; }

        public string? created_by { get; set; }

        public string? row_created { get; set; }

        public string? emergency_contact_no { get; set; }

        public string? dl_copy { get; set; }

        public string service_id { get; set; }

        public string? driver_assigned_date { get; set; }

        public string? veh_reg { get; set; }

        public string? dl_filename { get; set; }
    }
    public class DriverApiResponse
    {
        public bool status { get; set; }

        public string message { get; set; }

        public List<driver> data { get; set; }
    }
    public class editDriver
    {
        public int driver_id { get; set; }
        public string name { get; set; }

        public DateTime dob { get; set; }

        public string mobile { get; set; }

        public string email { get; set; }

        public string dl_number { get; set; }

        public DateOnly dl_issue_date { get; set; }

        public DateOnly dl_expiry_date { get; set; }

        public string address { get; set; }

        public string emergency_contact { get; set; }

        public IFormFile dl_scan { get; set; }
    }
    public class AddDriver
    {
  
        public string name { get; set; }

        public DateTime dob { get; set; }

        public string mobile { get; set; }

        public string email { get; set; }

        public string dl_number { get; set; }

        public DateOnly dl_issue_date { get; set; }

        public DateOnly dl_expiry_date { get; set; }

        public string address { get; set; }

        public string emergency_contact { get; set; }

        public IFormFile dl_scan { get; set; }
    }
    public class Vehicle
    {
        public int service_id { get; set; }

        public string? veh_reg { get; set; }

          // <-- Correct
    }
    public class VehicleApiResponse
    {
        public bool status { get; set; }

        public string message { get; set; }

        public StatusCount status_count { get; set; }

        public List<Vehicle> data { get; set; }
    }
    public class StatusCount
    {
        public int running { get; set; }
        public int idle { get; set; }
        public int stop { get; set; }
        public int no_data { get; set; }
        public int all { get; set; }
    }
    public class CommonResponse
    {
        public bool status { get; set; }
        public string message { get; set; }
        public List<object> data { get; set; } = new List<object>();
    }
    public class AssignDriverRequest
    {
        public int service_id { get; set; }

        public int driver_id { get; set; }

        public bool isEdit { get; set; }
    }
    public class AssignDriverResponse
    {
        public bool status { get; set; }

        public string message { get; set; }

        public AssignDriverData data { get; set; }
    }


    public class AssignDriverData
    {
        public bool linked { get; set; }

        public int driver_id { get; set; }

        public int service_id { get; set; }
    }

    public class DriverHistory
    {
        public string assigned_date { get; set; }

        public string assigned_till { get; set; }

        public string veh_reg { get; set; }
    }

    public class DriverHistoryResponse
    {
        public bool status { get; set; }

        public string message { get; set; }

        public List<DriverHistory> data { get; set; }
    }
    public class GetDriverResponse
    {
        public bool status { get; set; }

        public string message { get; set; }

        public driver data { get; set; }
    }

    public class DriverPerformanceResponse
    {
        public bool Status { get; set; }

        public string Message { get; set; }

        public DriverPerformanceData Data { get; set; }
    }
 
    public class DriverPerformanceData
    {
        public List<PerformanceType> PerformanceType { get; set; }

        public List<PerformanceType> CategoryConfigured { get; set; }

        public Dictionary<string, List<CategoryDetail>> Category { get; set; }
    }

    public class PerformanceType
    {
        public string Category { get; set; }

        public int C_id { get; set; }
    }

    public class CategoryDetail
    {
        public string Setting_id { get; set; }

        public string Category_id { get; set; }

        public string Category_name { get; set; }

        public string Criteria_name { get; set; }

        public string Min_value { get; set; }

        public string Max_value { get; set; }

        public string Unit { get; set; }

        public string Crieteria_id { get; set; }
    }
    public class DeletePerformanceRequest
    {
        public int category_id { get; set; }
    }
    public class DeletePerformanceResponse
    {
        public bool Status { get; set; }
        public string Message { get; set; }
        public List<object> Data { get; set; }
    }
    public class DriverCriteriaResponse
    {
        public bool status { get; set; }
        public string message { get; set; }
        public List<DriverCriteriaData> data { get; set; }
    }

    public class DriverCriteriaData
    {
        public string id { get; set; }
        public string name { get; set; }
        public string unit { get; set; }
    }
    public class SaveDriverPerformanceRequest
    {
        public int type { get; set; }

        public Dictionary<string, string> criterion_selection { get; set; }
    }
    public class SaveDriverPerformanceResponse
    {
        public bool status { get; set; }

        public string message { get; set; }

        public List<object> data { get; set; }
    }
    
    public class driverdashboard
    {
        public bool Status { get; set; }

        public string Message { get; set; }

        public List<DriverPerformanceModel> Data { get; set; }
    }
    public class DriverPerformanceModel
    {
        public int DriverId { get; set; }

        public string DriverName { get; set; }

        public string BusName { get; set; }

        public string DriverStatus { get; set; }

        public string BusStatus { get; set; }
    }
}
