using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SchoolBuddy.Models
{
    public class TeacherModel
    {
        public int Id { get; set; }
        public int Uid { get; set; }
        public string TeacherName { get; set; }
        public string TeacherLogin { get; set; }
        public string Password { get; set; }
        public int ClassId { get; set; }
        public string ClassName { get; set; }
        public string Section { get; set; }
        public string StartTime { get; set; }

        //[Required]
        //[Compare("Password", ErrorMessage = "Password and Confirm Password must match.")]
        //[NotMapped]
        //public string ConfirmPassword { get; set; }
    }
}
