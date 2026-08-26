namespace SchoolBuddy.Models.Command
{
    public class Commandproperties
    {
        public string id { get; set; }
    }

    public class schoolinfo
    {
        public string schoolid { get; set; }
    }
  
    public class Commands
    {
        public string sys_user_id { get; set; }
        public string route_id { get; set; }
        public string message { get; set; }
        public string reason { get; set; }
    }
    public class show_command
    {
        public string id { get; set; }
        public string route_name { get; set; }
        public string message { get; set; }
        
    }
}
