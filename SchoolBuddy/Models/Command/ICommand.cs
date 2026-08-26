namespace SchoolBuddy.Models.Command
{
    public interface ICommand
    {
        Task<string> GetCommands(string user_id);
        Task<string> CommandHistory(string cid);

        Task<string> AddCommand(string user_id, string rid, string msg,string reason);
    }
}
