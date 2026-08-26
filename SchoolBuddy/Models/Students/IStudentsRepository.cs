namespace SchoolBuddy.Models.Students
{
    public interface IStudentsRepository
    {
        IEnumerable<Students> GetStudents();
        Task<string> GetStudentByID(int id);
        //Students UpdateStudent(Students student);
        Task<string> DeleteStudent(int id);
        Task<string> AddStudent(Students students,string school_id);
        Task<string> GetAllStudentAPICall(string user_id);
        Task<string> UpdateStudent(Students students,int student_id);

        public Task<string> addStudentsInBulk(IFormFile file, string schoolid);

        public Task<string> classes();

        Task<byte[]> DownloadStudentsExcel(string schoolid);
    }
}
