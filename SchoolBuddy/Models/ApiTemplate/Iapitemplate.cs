namespace SchoolBuddy.Models.ApiTemplate
{
    public interface Iapitemplate
    {

        Task<string> PostApiTemplate(string obj, string urlend);
        Task<string> GetApiTemplate(string urlend);
    }
}
