using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using SchoolBuddy.Models;
using SchoolBuddy.Models.ProfileEdit;
using System.Globalization;
using System.Net.Mail;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace SchoolBuddy.Controllers
{
    public class ProfileController : BaseController
    {
        private const string PasswordVerifiedAtKey =
            "Profile.PasswordVerifiedAt";
        private const string PendingMobileOtpValueKey =
            "Profile.PendingMobileOtpValue";
        private const string PendingEmailOtpValueKey =
            "Profile.PendingEmailOtpValue";
        private const string VerifiedMobileOtpValueKey =
            "Profile.VerifiedMobileOtpValue";
        private const string VerifiedEmailOtpValueKey =
            "Profile.VerifiedEmailOtpValue";
        private const string CurrentMobileKey = "Profile.CurrentMobile";
        private const string CurrentEmailKey = "Profile.CurrentEmail";
        private const long MaximumProfileImageSize = 2 * 1024 * 1024;
        private const long MaximumProfileImageRequestSize =
            MaximumProfileImageSize + (64 * 1024);

        private static readonly IReadOnlyDictionary<string, string>
            ProfileFieldMap = new Dictionary<string, string>(
                StringComparer.OrdinalIgnoreCase)
            {
                ["full_name"] = "name",
                ["company_name"] = "company_name",
                ["address"] = "address",
                ["mobile"] = "mobile_no",
                ["email"] = "email_id"
                // TODO: Add timezone, language and currency mappings only
                // when their Trackofy payloads are confirmed. Profile images
                // use the dedicated multipart endpoint below.
            };

        private readonly IConfiguration _config;
        private readonly IProfileEditRepository _profileEditRepository;

        public ProfileController(
            IConfiguration configuration,
            IProfileEditRepository profileEditRepository)
        {
            _config = configuration;
            _profileEditRepository = profileEditRepository;
        }

        [HttpGet]
        public async Task<IActionResult> Index()
        {
            ProfileApiResponse model = new ProfileApiResponse();

            try
            {
                string? apiUrl =
                    _config.GetValue<string>("trackofy_api_profile");

                if (string.IsNullOrWhiteSpace(apiUrl))
                {
                    ViewBag.ErrorMessage =
                        "Profile API URL is not configured.";

                    return View(
                        "~/Views/Home/Dashboard/Profile.cshtml",
                        model
                    );
                }

                string? token =
                    HttpContext.Session.GetString("token");

                if (string.IsNullOrWhiteSpace(token))
                {
                    ViewBag.ErrorMessage =
                        "Authentication token was not found.";

                    return View(
                        "~/Views/Home/Dashboard/Profile.cshtml",
                        model
                    );
                }

                using HttpClientHandler handler =
                    new HttpClientHandler
                    {
                        AllowAutoRedirect = false,

                        ServerCertificateCustomValidationCallback =
                            (message, certificate, chain, errors) => true
                    };

                using HttpClient client =
                    new HttpClient(handler);

                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue(
                        "Bearer",
                        token
                    );

                var payload = new
                {
                    method = "update_profiles"
                };

                string json =
                    JsonConvert.SerializeObject(payload);

                using StringContent content =
                    new StringContent(
                        json,
                        Encoding.UTF8,
                        "application/json"
                    );

                using HttpResponseMessage response =
                    await client.PostAsync(apiUrl, content);

                string responseBody =
                    await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    ViewBag.ErrorMessage =
                        $"Unable to load profile information. " +
                        $"Status code: {(int)response.StatusCode}";

                    return View(
                        "~/Views/Home/Dashboard/Profile.cshtml",
                        model
                    );
                }

                ProfileApiResponse? apiResponse =
                    JsonConvert.DeserializeObject<ProfileApiResponse>(
                        responseBody
                    );

                if (apiResponse == null)
                {
                    ViewBag.ErrorMessage =
                        "Profile API returned an invalid response.";

                    return View(
                        "~/Views/Home/Dashboard/Profile.cshtml",
                        model
                    );
                }

                if (!apiResponse.status)
                {
                    ViewBag.ErrorMessage =
                        string.IsNullOrWhiteSpace(apiResponse.message)
                            ? "Unable to load profile information."
                            : apiResponse.message;

                    return View(
                        "~/Views/Home/Dashboard/Profile.cshtml",
                        apiResponse
                    );
                }

                HttpContext.Session.SetString(
                    CurrentMobileKey,
                    apiResponse.data.profile.mobile ?? string.Empty);
                HttpContext.Session.SetString(
                    CurrentEmailKey,
                    apiResponse.data.profile.email ?? string.Empty);

                return View(
                    "~/Views/Home/Dashboard/Profile.cshtml",
                    apiResponse
                );
            }
            catch (Exception ex)
            {
                ViewBag.ErrorMessage =
                    "Something went wrong while loading the profile.";

                ViewBag.ExceptionMessage = ex.Message;

                return View(
                    "~/Views/Home/Dashboard/Profile.cshtml",
                    model
                );
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult VerifyProfilePassword(
            [FromBody] VerifyProfilePasswordRequest? request)
        {
            if (string.IsNullOrEmpty(request?.CurrentPassword))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Please enter your current password."
                });
            }

            string? sessionPassword =
                HttpContext.Session.GetString("password");

            if (string.IsNullOrEmpty(sessionPassword))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Your login session has expired. Please sign in again."
                });
            }

            byte[] suppliedPassword =
                Encoding.UTF8.GetBytes(request.CurrentPassword);
            byte[] storedPassword = Encoding.UTF8.GetBytes(sessionPassword);

            if (!CryptographicOperations.FixedTimeEquals(
                    suppliedPassword,
                    storedPassword))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "The current password is incorrect."
                });
            }

            HttpContext.Session.SetString(
                PasswordVerifiedAtKey,
                DateTimeOffset.UtcNow
                    .ToUnixTimeSeconds()
                    .ToString(CultureInfo.InvariantCulture));

            ClearOtpVerificationState();

            return Json(new
            {
                success = true,
                message = "Password verified."
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SendProfileOtp(
            [FromBody] SendProfileOtpRequest? request)
        {
            if (!HasRecentPasswordVerification())
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Please verify your password again."
                });
            }

            string type = request?.Type?.Trim().ToLowerInvariant() ?? string.Empty;
            string value = request?.Value?.Trim() ?? string.Empty;
            string? validationMessage = ValidateSensitiveValue(type, value);

            if (validationMessage is not null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = validationMessage
                });
            }

            string currentSensitiveValue = HttpContext.Session.GetString(
                type == "mobile" ? CurrentMobileKey : CurrentEmailKey
            ) ?? string.Empty;

            if (!string.IsNullOrEmpty(currentSensitiveValue) &&
                SensitiveValuesMatch(type, value, currentSensitiveValue))
            {
                return BadRequest(new
                {
                    success = false,
                    message = type == "mobile"
                        ? "The new mobile number must be different from the current mobile number."
                        : "The new email address must be different from the current email address."
                });
            }

            string? token = HttpContext.Session.GetString("token");

            if (string.IsNullOrWhiteSpace(token))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Your authentication session has expired."
                });
            }

            TrackofyProfileOperationResult result =
                await _profileEditRepository.SendOtpAsync(type, value, token);

            if (!result.Success)
            {
                return BadRequest(new
                {
                    success = false,
                    message = result.Message
                });
            }

            HttpContext.Session.SetString(
                GetPendingOtpValueKey(type),
                value);
            HttpContext.Session.Remove(GetVerifiedOtpValueKey(type));

            return Json(new
            {
                success = true,
                message = result.Message
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> VerifyProfileOtp(
            [FromBody] VerifyProfileOtpRequest? request)
        {
            if (!HasRecentPasswordVerification())
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Please verify your password again."
                });
            }

            string type = request?.Type?.Trim().ToLowerInvariant() ?? string.Empty;
            string value = request?.Value?.Trim() ?? string.Empty;
            string otp = request?.Otp?.Trim() ?? string.Empty;
            string? validationMessage = ValidateSensitiveValue(type, value);

            if (validationMessage is not null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = validationMessage
                });
            }

            if (!Regex.IsMatch(otp, "^[0-9]{6}$"))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Please enter a valid 6-digit OTP."
                });
            }

            string pendingValue =
                HttpContext.Session.GetString(
                    GetPendingOtpValueKey(type)) ?? string.Empty;

            if (!SensitiveValuesMatch(type, value, pendingValue))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "The OTP request does not match the value being verified."
                });
            }

            string? token = HttpContext.Session.GetString("token");

            if (string.IsNullOrWhiteSpace(token))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Your authentication session has expired."
                });
            }

            TrackofyProfileOperationResult result =
                await _profileEditRepository.VerifyOtpAsync(
                    type,
                    value,
                    otp,
                    token);

            if (!result.Success)
            {
                return BadRequest(new
                {
                    success = false,
                    message = result.Message
                });
            }

            HttpContext.Session.SetString(
                GetVerifiedOtpValueKey(type),
                value);
            HttpContext.Session.Remove(GetPendingOtpValueKey(type));

            return Json(new
            {
                success = true,
                message = result.Message
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateProfileField(
            [FromBody] UpdateProfileFieldRequest? request)
        {
            string field = request?.Field?.Trim().ToLowerInvariant() ?? string.Empty;
            string newValue = request?.NewValue?.Trim() ?? string.Empty;

            if (!HasRecentPasswordVerification())
            {
                return Unauthorized(new
                {
                    success = false,
                    field,
                    message = "Please verify your password again."
                });
            }

            if (!ProfileFieldMap.TryGetValue(field, out string? apiField))
            {
                return BadRequest(new
                {
                    success = false,
                    field,
                    message = "Unsupported profile field."
                });
            }

            if (field == "full_name" && string.IsNullOrWhiteSpace(newValue))
            {
                return BadRequest(new
                {
                    success = false,
                    field,
                    message = "Full name is required."
                });
            }

            int maximumLength = field switch
            {
                "full_name" => 150,
                "company_name" => 200,
                "address" => 500,
                "email" => 254,
                _ => 15
            };

            if (newValue.Length > maximumLength)
            {
                return BadRequest(new
                {
                    success = false,
                    field,
                    message = "The entered value is too long."
                });
            }

            if (field is "mobile" or "email")
            {
                string? validationMessage =
                    ValidateSensitiveValue(field, newValue);

                if (validationMessage is not null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        field,
                        message = validationMessage
                    });
                }

                string verifiedValue =
                    HttpContext.Session.GetString(
                        GetVerifiedOtpValueKey(field)) ?? string.Empty;

                if (!SensitiveValuesMatch(field, newValue, verifiedValue))
                {
                    return BadRequest(new
                    {
                        success = false,
                        field,
                        message = $"Please verify the OTP for the new {field}."
                    });
                }
            }

            string? token = HttpContext.Session.GetString("token");

            if (string.IsNullOrWhiteSpace(token))
            {
                return Unauthorized(new
                {
                    success = false,
                    field,
                    message = "Your authentication session has expired."
                });
            }

            TrackofyProfileOperationResult result =
                await _profileEditRepository.UpdateFieldAsync(
                    apiField,
                    newValue,
                    token);

            if (!result.Success)
            {
                return BadRequest(new
                {
                    success = false,
                    field,
                    message = string.IsNullOrWhiteSpace(result.Message)
                        ? "Unable to update this field. Please try again."
                        : result.Message
                });
            }

            if (field is "mobile" or "email")
            {
                HttpContext.Session.SetString(
                    field == "mobile" ? CurrentMobileKey : CurrentEmailKey,
                    newValue);
                ClearOtpVerificationState(field);
            }

            return Json(new
            {
                success = true,
                field,
                message = result.Message
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Consumes("multipart/form-data")]
        [RequestFormLimits(
            MultipartBodyLengthLimit = MaximumProfileImageRequestSize)]
        public async Task<IActionResult> UpdateProfileImage(
            [FromForm(Name = "logo_img")] IFormFile? logoImage)
        {
            if (!HasRecentPasswordVerification())
            {
                return Unauthorized(new
                {
                    success = false,
                    field = "profile_image",
                    message = "Please verify your password again."
                });
            }

            if (logoImage is null || logoImage.Length == 0)
            {
                return BadRequest(new
                {
                    success = false,
                    field = "profile_image",
                    message = "Please select a profile image."
                });
            }

            if (logoImage.Length > MaximumProfileImageSize)
            {
                return BadRequest(new
                {
                    success = false,
                    field = "profile_image",
                    message = "Image size must be 2 MB or less."
                });
            }

            string extension = Path.GetExtension(
                logoImage.FileName).ToLowerInvariant();
            string declaredContentType = (logoImage.ContentType ?? string.Empty)
                .Split(';', 2)[0]
                .Trim()
                .ToLowerInvariant();
            bool declaredAsJpeg =
                declaredContentType == "image/jpeg" &&
                extension is ".jpg" or ".jpeg";
            bool declaredAsPng =
                declaredContentType == "image/png" &&
                extension == ".png";

            if (!declaredAsJpeg && !declaredAsPng)
            {
                return InvalidProfileImageFormat();
            }

            await using MemoryStream imageBuffer = new(
                checked((int)logoImage.Length));
            await logoImage.CopyToAsync(
                imageBuffer,
                HttpContext.RequestAborted);

            byte[] imageBytes = imageBuffer.ToArray();
            bool hasJpegSignature = HasJpegSignature(imageBytes);
            bool hasPngSignature = HasPngSignature(imageBytes);

            if ((declaredAsJpeg && !hasJpegSignature) ||
                (declaredAsPng && !hasPngSignature))
            {
                // RIFF/WebP starts with 52 49 46 46 and is rejected here;
                // changing a filename or MIME header cannot make it JPEG.
                return InvalidProfileImageFormat();
            }

            string? token = HttpContext.Session.GetString("token");

            if (string.IsNullOrWhiteSpace(token))
            {
                return Unauthorized(new
                {
                    success = false,
                    field = "profile_image",
                    message = "Your authentication session has expired."
                });
            }

            string verifiedContentType = hasJpegSignature
                ? "image/jpeg"
                : "image/png";
            string forwardedFileName = hasJpegSignature
                ? "profile-image.jpg"
                : "profile-image.png";

            imageBuffer.Position = 0;

            TrackofyProfileOperationResult result =
                await _profileEditRepository.UpdateProfileImageAsync(
                    imageBuffer,
                    forwardedFileName,
                    verifiedContentType,
                    token);

            if (!result.Success)
            {
                return BadRequest(new
                {
                    success = false,
                    field = "profile_image",
                    message = string.IsNullOrWhiteSpace(result.Message)
                        ? "Unable to update profile picture. Please try again."
                        : result.Message
                });
            }

            return Json(new
            {
                success = true,
                field = "profile_image",
                message = string.IsNullOrWhiteSpace(result.Message)
                    ? "Logo updated successfully"
                    : result.Message
            });
        }

        private bool HasRecentPasswordVerification()
        {
            string? value =
                HttpContext.Session.GetString(PasswordVerifiedAtKey);

            if (!long.TryParse(
                    value,
                    NumberStyles.Integer,
                    CultureInfo.InvariantCulture,
                    out long verifiedAtUnix))
            {
                return false;
            }

            DateTimeOffset verifiedAt =
                DateTimeOffset.FromUnixTimeSeconds(verifiedAtUnix);

            return DateTimeOffset.UtcNow - verifiedAt <= TimeSpan.FromMinutes(10);
        }

        private static string? ValidateSensitiveValue(
            string type,
            string value)
        {
            if (type == "mobile")
            {
                if (string.IsNullOrWhiteSpace(value))
                {
                    return "Mobile number is required.";
                }

                return Regex.IsMatch(value, "^[0-9]{7,15}$")
                    ? null
                    : "Please enter a valid mobile number.";
            }

            if (type == "email")
            {
                if (string.IsNullOrWhiteSpace(value))
                {
                    return "Email address is required.";
                }

                if (value.Length > 254)
                {
                    return "Please enter a valid email address.";
                }

                return MailAddress.TryCreate(value, out MailAddress? address) &&
                    string.Equals(
                        address.Address,
                        value,
                        StringComparison.OrdinalIgnoreCase)
                    ? null
                    : "Please enter a valid email address.";
            }

            return "Unsupported verification type.";
        }

        private static bool SensitiveValuesMatch(
            string type,
            string first,
            string second)
        {
            return string.Equals(
                first,
                second,
                type == "email"
                    ? StringComparison.OrdinalIgnoreCase
                    : StringComparison.Ordinal);
        }

        private void ClearOtpVerificationState()
        {
            ClearOtpVerificationState("mobile");
            ClearOtpVerificationState("email");
        }

        private void ClearOtpVerificationState(string type)
        {
            HttpContext.Session.Remove(GetPendingOtpValueKey(type));
            HttpContext.Session.Remove(GetVerifiedOtpValueKey(type));
        }

        private static string GetPendingOtpValueKey(string type)
        {
            return type == "mobile"
                ? PendingMobileOtpValueKey
                : PendingEmailOtpValueKey;
        }

        private static string GetVerifiedOtpValueKey(string type)
        {
            return type == "mobile"
                ? VerifiedMobileOtpValueKey
                : VerifiedEmailOtpValueKey;
        }

        private BadRequestObjectResult InvalidProfileImageFormat()
        {
            return BadRequest(new
            {
                success = false,
                field = "profile_image",
                message = "Only JPG and PNG images are allowed."
            });
        }

        private static bool HasJpegSignature(ReadOnlySpan<byte> bytes)
        {
            return bytes.Length >= 3 &&
                bytes[0] == 0xFF &&
                bytes[1] == 0xD8 &&
                bytes[2] == 0xFF;
        }

        private static bool HasPngSignature(ReadOnlySpan<byte> bytes)
        {
            ReadOnlySpan<byte> pngSignature =
                stackalloc byte[]
                {
                    0x89, 0x50, 0x4E, 0x47,
                    0x0D, 0x0A, 0x1A, 0x0A
                };

            return bytes.StartsWith(pngSignature);
        }
    }
}
