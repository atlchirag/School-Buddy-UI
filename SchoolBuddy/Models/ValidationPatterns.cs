using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace SchoolBuddy.Models
{
    /// <summary>
    /// Regular expressions shared by model validation; they match the client rules in
    /// wwwroot/js/form-length-validation.js so the browser and the server agree.
    /// </summary>
    public static class ValidationPatterns
    {
        public const string PersonName = @"^[A-Za-z][A-Za-z .'-]*$";
        public const string PersonNameMessage = "Use letters only (spaces, dot, apostrophe and hyphen are allowed).";

        public const string Code = @"^[A-Za-z0-9][A-Za-z0-9/._-]*$";
        public const string CodeMessage = "Use letters and numbers only (allowed symbols: / . _ -), without spaces.";

        public const string AlnumSpace = @"^[A-Za-z0-9][A-Za-z0-9 -]*$";
        public const string AlnumSpaceMessage = "Use letters, numbers, spaces and hyphens only.";

        public const string Letters = @"^[A-Za-z]+$";
        public const string LettersMessage = "Use letters only (no numbers, spaces or symbols).";

        public const string Mobile = @"^[6-9][0-9]{9}$";
        public const string MobileMessage = "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.";

        public const string Hex8 = @"^[0-9A-Fa-f]{8}$";
        public const string Hex8Message = "Enter exactly 8 characters using 0-9 and A-F.";

        public const string BloodGroup = @"^(A|B|AB|O|a|b|ab|o)[+-]$";
        public const string BloodGroupMessage = "Enter a valid blood group, e.g. A+, O-, AB+.";

        public const string Email = @"^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$";
        public const string EmailMessage = "Enter a valid email address, e.g. name@example.com.";
    }

    /// <summary>
    /// Free text must contain at least one letter or number (not only special characters)
    /// and must not contain &lt; or &gt;. Empty values pass; combine with [Required] when needed.
    /// </summary>
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
    public sealed class MeaningfulTextAttribute : ValidationAttribute
    {
        private static readonly Regex HasAlphanumeric = new("[A-Za-z0-9]", RegexOptions.Compiled);

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            var text = (value as string)?.Trim();
            if (string.IsNullOrEmpty(text)) return ValidationResult.Success;

            var members = validationContext.MemberName == null ? null : new[] { validationContext.MemberName };
            if (text.IndexOfAny(new[] { '<', '>' }) >= 0)
                return new ValidationResult("The characters < and > are not allowed.", members);
            if (!HasAlphanumeric.IsMatch(text))
                return new ValidationResult("Please enter letters or numbers, not only special characters.", members);
            return ValidationResult.Success;
        }
    }
}
