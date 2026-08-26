namespace SchoolBuddy.Models.Login
{
    public interface ILoginRepository
    {
        Task<string> LoginAPICall(string name,string pass);
    }

}
