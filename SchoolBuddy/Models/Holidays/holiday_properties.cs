namespace SchoolBuddy.Models.Holidays
{
    public class holiday_properties
    {
        public int id { get; set; }
        public string start { get; set; }
        public string end { get; set; }
        public string eventname { get; set; }
        public string schoolid { get; set; }  // ✅ Ensure this exists
        public string status { get; set; }
    }


    public class Aholidays
    {
        public int id { get; set; }
        public string start { get; set; }
        public string end { get; set; }
        public string eventname { get; set; }
        public string schoolid { get; set; }
        public string status { get; set; }
    }

    public class school
    {
        public string id { get; set; }
    }

    public class holiday_list
    {
        public int id { get; set; }
        public string from_date { get; set; }
        public string to_date { get; set; }
        public string description { get; set; }
        public string sys_user_id { get; set; }  // Ensure schoolid is available
        public string status { get; set; }  // ✅ ADD THIS LINE
    }


    public class DeleteHolidayModel
    {
        public int id { get; set; }
        public string schoolid { get; set; }
    }

}
