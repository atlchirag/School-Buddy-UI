using System.ComponentModel.DataAnnotations;

namespace SchoolBuddy.Models.Login
{
    public class Login
    {
       [Required]
       public string? username { get; set; }
       [Required]
       public string? password { get; set; }
       

    }

    public class login_res
    {
        public string? user_id { get; set; } 
        public string? database { get; set; }
        public string? schoolname { get; set; }
    }

}
