using Microsoft.Build.Framework;

namespace SchoolBuddy.Models.Students
{
    public class Students
    {

        public int id { get; set; }
        [Required]
        public string? admission_no { get; set; }
        [Required]
        public string? student_name { get; set; }
        [Required]
        public string gender { get; set; }
        [Required]
        public string? birth { get; set; }
        [Required]
        public string? class_ { get; set; }
        [Required]
        public string? division { get; set; }
        [Required]
        public string? parent_name { get; set; }
        [Required]
        public string? mobile_no1 { get; set; }

        public string? user_id { get; set; }
        [Required]
        public string? street { get; set; }
        [Required]
        public string? password { get; set; }
        [Required]
        public string? created_date { get; set; }
        // [Required]
        public string? rf_id { get; set; }
        [Required]
        public string? email { get; set; }
        [Required]

        public string? relation_with_std { get; set; }
        [Required]
        public string? blood_group { get; set; }

        [Required]
        public string? qr_code { get; set; }

        //[Required]
        //public List<class_dropdown> cls { get; set; }

    }

    public class assign_student
    {
        public string student_name { get; set; }
        public string Admission_no { get; set; }
        public string stopid { get; set; }
        public string rfid { get; set; }
        public string schoolid { get; set; }
        public string route_id { get; set; }
    }

    public class class_dropdown
    {
        public string id { get; set; }
        public string class_name { get; set; }
    }

    public class FormDataModel
    {
        public List<string> SelectedValues { get; set; }
        public string from { get; set; }
        public string to { get; set; }
    }


}
