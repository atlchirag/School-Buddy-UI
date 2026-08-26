using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace SchoolBuddy.Models.ProfileEdit
{
    public sealed class ProfileEditRepository : IProfileEditRepository
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ProfileEditRepository> _logger;

        public ProfileEditRepository(
            IConfiguration configuration,
            ILogger<ProfileEditRepository> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public Task<TrackofyProfileOperationResult> SendOtpAsync(
            string type,
            string value,
            string bearerToken)
        {
            object payload = type == "mobile"
                ? new { method = "get_otp", mobile = value }
                : new { method = "get_otp", email = value };

            return SendProfileRequestAsync(payload, bearerToken);
        }

        public Task<TrackofyProfileOperationResult> VerifyOtpAsync(
            string type,
            string value,
            string otp,
            string bearerToken)
        {
            object payload = type == "mobile"
                ? new { method = "get_verify_otp", otp, mobile = value }
                : new { method = "get_verify_otp", otp, email = value };

            return SendProfileRequestAsync(payload, bearerToken);
        }

        public Task<TrackofyProfileOperationResult> UpdateFieldAsync(
            string apiField,
            string value,
            string bearerToken)
        {
            var payload = new
            {
                method = "update_user_fullName",
                field = apiField,
                value
            };

            return SendProfileRequestAsync(payload, bearerToken);
        }

        public async Task<TrackofyProfileOperationResult> UpdateProfileImageAsync(
            Stream imageStream,
            string fileName,
            string contentType,
            string bearerToken)
        {
            string? apiUrl = GetProfileApiUrl();

            if (string.IsNullOrWhiteSpace(apiUrl))
            {
                return Failure("Profile API URL is not configured.");
            }

            try
            {
                using HttpClientHandler handler = CreateProfileHttpHandler();
                using HttpClient client = CreateAuthorizedClient(
                    handler,
                    bearerToken);
                using MultipartFormDataContent formData = new();

                formData.Add(
                    new StringContent("update_user_logo"),
                    "method");

                if (imageStream.CanSeek)
                {
                    imageStream.Position = 0;
                }

                using StreamContent imageContent = new(imageStream);
                imageContent.Headers.ContentType =
                    new MediaTypeHeaderValue(contentType);

                formData.Add(
                    imageContent,
                    "logo_img",
                    fileName);

                using HttpResponseMessage response = await client.PostAsync(
                    apiUrl,
                    formData);

                string responseBody = await response.Content.ReadAsStringAsync();

                return MapProfileResponse(
                    response,
                    responseBody,
                    "Profile image could not be updated. Please upload a valid JPG or PNG image.",
                    "profile image upload");
            }
            catch (HttpRequestException exception)
            {
                _logger.LogWarning(
                    exception,
                    "Unable to connect to Trackofy during profile image upload.");

                return Failure(
                    "Unable to update profile picture. Please try again.");
            }
            catch (TaskCanceledException exception)
            {
                _logger.LogWarning(
                    exception,
                    "Trackofy profile image upload timed out.");

                return Failure(
                    "Unable to update profile picture. Please try again.");
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected Trackofy profile image upload failure.");

                return Failure(
                    "Unable to update profile picture. Please try again.");
            }
        }

        private async Task<TrackofyProfileOperationResult> SendProfileRequestAsync(
            object payload,
            string bearerToken)
        {
            string? apiUrl = GetProfileApiUrl();

            if (string.IsNullOrWhiteSpace(apiUrl))
            {
                return Failure("Profile API URL is not configured.");
            }

            try
            {
                using HttpClientHandler handler = CreateProfileHttpHandler();
                using HttpClient client = CreateAuthorizedClient(
                    handler,
                    bearerToken);

                string requestJson = JsonSerializer.Serialize(payload);

                using StringContent content = new(
                    requestJson,
                    Encoding.UTF8,
                    "application/json");

                using HttpResponseMessage response = await client.PostAsync(
                    apiUrl,
                    content);

                string responseBody = await response.Content.ReadAsStringAsync();

                return MapProfileResponse(
                    response,
                    responseBody,
                    "The profile API returned an invalid response.",
                    "profile JSON request");
            }
            catch (HttpRequestException exception)
            {
                _logger.LogWarning(
                    exception,
                    "Unable to connect to Trackofy during a profile request.");

                return Failure(
                    "Unable to connect to the profile service. Please try again.");
            }
            catch (TaskCanceledException exception)
            {
                _logger.LogWarning(
                    exception,
                    "Trackofy profile request timed out.");

                return Failure(
                    "The profile service request timed out. Please try again.");
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected Trackofy profile request failure.");

                return Failure(
                    "Unable to complete the profile request. Please try again.");
            }
        }

        private string? GetProfileApiUrl()
        {
            return _configuration.GetValue<string>("trackofy_api_profile");
        }

        private static HttpClientHandler CreateProfileHttpHandler()
        {
            return new HttpClientHandler
            {
                AllowAutoRedirect = false,
                // Kept consistent with the existing ProfileController loader.
                ServerCertificateCustomValidationCallback =
                    (message, certificate, chain, errors) => true
            };
        }

        private static HttpClient CreateAuthorizedClient(
            HttpMessageHandler handler,
            string bearerToken)
        {
            HttpClient client = new(handler, disposeHandler: false);
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", bearerToken);

            return client;
        }

        private TrackofyProfileOperationResult MapProfileResponse(
            HttpResponseMessage response,
            string responseBody,
            string malformedResponseMessage,
            string operation)
        {
            TrackofyProfileApiResponse? apiResponse =
                TryParseTrackofyResponse(responseBody);

            if (apiResponse is null)
            {
                _logger.LogWarning(
                    "Trackofy returned a malformed response for {Operation}. HTTP {StatusCode}. Response: {ResponseBody}",
                    operation,
                    (int)response.StatusCode,
                    TruncateForLog(responseBody));

                return Failure(malformedResponseMessage);
            }

            bool success = response.IsSuccessStatusCode && apiResponse.Status;
            string fallbackMessage = success
                ? "Profile updated successfully."
                : malformedResponseMessage;
            string message = !response.IsSuccessStatusCode && apiResponse.Status
                ? fallbackMessage
                : GetSafeTrackofyMessage(
                    apiResponse.Message,
                    fallbackMessage);

            if (!success)
            {
                _logger.LogWarning(
                    "Trackofy rejected {Operation}. HTTP {StatusCode}. Response: {ResponseBody}",
                    operation,
                    (int)response.StatusCode,
                    TruncateForLog(responseBody));
            }

            return new TrackofyProfileOperationResult
            {
                Success = success,
                Message = message
            };
        }

        private static TrackofyProfileApiResponse? TryParseTrackofyResponse(
            string responseBody)
        {
            if (string.IsNullOrWhiteSpace(responseBody))
            {
                return null;
            }

            TrackofyProfileApiResponse? parsed =
                TryDeserializeTrackofyResponse(responseBody);

            if (parsed is not null)
            {
                return parsed;
            }

            int objectStart = responseBody.IndexOf('{');

            while (objectStart >= 0)
            {
                int objectEnd = responseBody.LastIndexOf('}');

                while (objectEnd > objectStart)
                {
                    string candidate = responseBody.Substring(
                        objectStart,
                        objectEnd - objectStart + 1);

                    parsed = TryDeserializeTrackofyResponse(candidate);

                    if (parsed is not null)
                    {
                        return parsed;
                    }

                    objectEnd = responseBody.LastIndexOf(
                        '}',
                        objectEnd - 1);
                }

                objectStart = responseBody.IndexOf('{', objectStart + 1);
            }

            return null;
        }

        private static TrackofyProfileApiResponse? TryDeserializeTrackofyResponse(
            string json)
        {
            try
            {
                return JsonSerializer.Deserialize<TrackofyProfileApiResponse>(
                    json,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
            }
            catch (JsonException)
            {
                return null;
            }
        }

        private static string GetSafeTrackofyMessage(
            string? message,
            string fallback)
        {
            string value = message?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(value) ||
                value.Length > 500 ||
                value.Contains('<') ||
                value.Contains('>') ||
                value.Contains("Warning", StringComparison.OrdinalIgnoreCase) ||
                value.Contains("Fatal error", StringComparison.OrdinalIgnoreCase) ||
                value.Contains("Stack trace", StringComparison.OrdinalIgnoreCase) ||
                value.Contains("htdocs", StringComparison.OrdinalIgnoreCase) ||
                value.Contains(".php", StringComparison.OrdinalIgnoreCase))
            {
                return fallback;
            }

            return value;
        }

        private static string TruncateForLog(string value)
        {
            const int maximumLength = 8000;

            return value.Length <= maximumLength
                ? value
                : value[..maximumLength];
        }

        private static TrackofyProfileOperationResult Failure(string message)
        {
            return new TrackofyProfileOperationResult
            {
                Success = false,
                Message = message
            };
        }
    }
}
