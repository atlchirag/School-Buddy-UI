namespace SchoolBuddy.Models.ProfileEdit
{
    public interface IProfileEditRepository
    {
        Task<TrackofyProfileOperationResult> SendOtpAsync(
            string type,
            string value,
            string bearerToken);

        Task<TrackofyProfileOperationResult> VerifyOtpAsync(
            string type,
            string value,
            string otp,
            string bearerToken);

        Task<TrackofyProfileOperationResult> UpdateFieldAsync(
            string apiField,
            string value,
            string bearerToken);

        Task<TrackofyProfileOperationResult> UpdateProfileImageAsync(
            Stream imageStream,
            string fileName,
            string contentType,
            string bearerToken);
    }
}
