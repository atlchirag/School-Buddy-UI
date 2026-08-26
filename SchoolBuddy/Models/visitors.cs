using System.ComponentModel.DataAnnotations;

namespace SchoolBuddy.Models
{
    public class Visitor : IValidatableObject
    {
        [Required(ErrorMessage = "Visitor name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        [RegularExpression(@"^[a-zA-Z\s]+$", ErrorMessage = "Only alphabets are allowed")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Mobile number is required")]
        [RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Enter valid mobile number")]
        [StringLength(12, ErrorMessage = "Mobile number cannot exceed 20 characters")]
        public string MobileNo { get; set; }

        [Required(ErrorMessage = "Card Id is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select a valid Card Id")]
        public int? CardId { get; set; }

        [Required(ErrorMessage = "Card number is required")]
        [StringLength(50, ErrorMessage = "Card number cannot exceed 50 characters")]
        public string CardNo { get; set; }

        public int SysUserId { get; set; }

        [Required(ErrorMessage = "In time is required")]
        [DataType(DataType.DateTime)]
        public DateTime in_time { get; set; }

        [Required(ErrorMessage = "Out time is required")]
        [DataType(DataType.DateTime)]
        public DateTime out_time { get; set; }

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
