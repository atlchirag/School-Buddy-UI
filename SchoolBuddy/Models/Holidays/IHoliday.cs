namespace SchoolBuddy.Models.Holidays
{
    public interface IHoliday
    {


        Task<string> AddHoliday(string start_date, string end_date, string schoolid, string description, string status);
        Task<string> GetHolidays(string schoolid);
        Task<bool> UpdateHoliday(int id, string start_date, string end_date, string schoolid, string eventname, string status);
        Task<bool> DeleteHoliday(int id, string schoolid);



    }
}
