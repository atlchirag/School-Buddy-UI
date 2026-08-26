using System.ComponentModel.DataAnnotations;

namespace SchoolBuddy.Models
{
    public class Staff : IValidatableObject
    {
        [Required]
        public string emp_code { get; set; }

        [Required]
        public string rf_id { get; set; }
        [Required(ErrorMessage = "Mobile number is required")]
        [RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Enter valid mobile number")]
        [StringLength(10, ErrorMessage = "Mobile number cannot exceed 10 characters")]
        public string mobile_no { get; set; }
        [Required]
        public string address { get; set; }

        [Required(ErrorMessage = "In time is required")]
        [DataType(DataType.DateTime)]
        public DateTime in_time { get; set; }

        [Required(ErrorMessage = "Out time is required")]
        [DataType(DataType.DateTime)]
        public DateTime out_time { get; set; }

        [Required]
        public int sys_user_id { get; set; }
        [Required(ErrorMessage = "Visitor name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        [RegularExpression(@"^[a-zA-Z\s]+$", ErrorMessage = "Only alphabets are allowed")]
        public string name { get; set; }
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (in_time >= out_time)
            {
                yield return new ValidationResult("In Time must be earlier than Out Time",
                    new[] { nameof(in_time), nameof(out_time) });
            }
        }
    }
}
