using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SchoolBuddy.Models.ProfileEdit
{
    public sealed class UpdateProfileFieldRequest
    {
        [Required]
        public string Field { get; set; } = string.Empty;

        public string CurrentValue { get; set; } = string.Empty;

        public string NewValue { get; set; } = string.Empty;
    }

    public sealed class SendProfileOtpRequest
    {
        [Required]
        public string Type { get; set; } = string.Empty;

        [Required]
        public string Value { get; set; } = string.Empty;
    }

    public sealed class VerifyProfileOtpRequest
    {
        [Required]
        public string Type { get; set; } = string.Empty;

        [Required]
        public string Value { get; set; } = string.Empty;

        [Required]
        public string Otp { get; set; } = string.Empty;
    }

    public sealed class VerifyProfilePasswordRequest
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;
    }

    public sealed class TrackofyProfileApiResponse
    {
        [JsonPropertyName("status")]
        public bool Status { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

    }

    public sealed class TrackofyProfileOperationResult
    {
        public bool Success { get; init; }

        public string Message { get; init; } = string.Empty;
    }
}
