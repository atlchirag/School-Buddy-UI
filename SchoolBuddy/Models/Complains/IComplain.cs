namespace SchoolBuddy.Models.Complains
{
    public interface IComplain
    {
        Task<string> PendingTicket(string user_id);
        Task<string> ResolvedTicket(string user_id);

        Task<string> UTicket(string user_id,string comment,int ticketid);


    }
}
