namespace SchoolBuddy.Models.Analysis
{
    public class Analysisproperties
    {
        
    }

    public class checkvias
    {
        public string route_id
        {
            get;set;
        }
    }

    public class checketa
    {
        public int route_id
        {
            get; set;
        }
    }
    public class checkroute
    {
        public string? schoolid
        {
            get; set;
        }
    }

    public class checkign
    {

        
        public string? service_id
        {
            get; set;
        }
        public string? start_date
        {
            get; set;
        }
        public string? end_date
        {
            get; set;
        }
        public string? database
        {
            get; set;
        }
    }

}
