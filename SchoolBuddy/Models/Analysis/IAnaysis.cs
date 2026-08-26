namespace SchoolBuddy.Models.Analysis
{
    public interface IAnaysis
    {
        Task<string> CheckIgnition(string service_id,string start, string end, string db);
        Task<string> CheckInActive(string service_id, string start, string end, string db);

        Task<string> Route(string user_id);
        Task<string> CheckRoute(string user_id);
        Task<string> CheckURL(string service_id);
        Task<string> CheckSta(string service_id, string start, string end, string db);
        Task<string> CheckVais(string route_id);
        Task<string> CheckEta(int route_id);

        Task<string> CheckViasingforeachroute(string rid);


    }
}
