namespace SchoolBuddy.Models.Leave
{
    public interface ILeave
    {
        Task<string> GetLeaveRequests(string user_id, string month);
        Task<string> UpdateLeaveStatus(string user_id, int leave_id, int status, string remark);
    }
}
