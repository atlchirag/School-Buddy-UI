using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Globalization;
using System.Linq;

namespace SchoolBuddy.Controllers
{
    public class BaseController : Controller
    {
        private const int SessionTimeoutMinutes = 30;

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var httpContext = context.HttpContext;

            // Disable Browser Cache
            httpContext.Response.Headers["Cache-Control"] =
                "no-cache, no-store, must-revalidate";
            httpContext.Response.Headers["Pragma"] = "no-cache";
            httpContext.Response.Headers["Expires"] = "0";

            // Prevent iframe / clickjacking
            httpContext.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";

            var controller = context.ActionDescriptor.RouteValues["controller"] ?? string.Empty;
            var action = context.ActionDescriptor.RouteValues["action"] ?? string.Empty;

            // =====================================================
            // PUBLIC ACTIONS (LOGIN, FORGOT PASSWORD)
            // =====================================================
            if (action.Equals("Login", StringComparison.OrdinalIgnoreCase) ||
                action.Equals("ForgotPassword", StringComparison.OrdinalIgnoreCase))
            {
                base.OnActionExecuting(context);
                return;
            }

            // =====================================================
            // CHECK SESSION DATA & TIMEOUT (30 MINUTES)
            // =====================================================
            var userId = httpContext.Session.GetString("uid");
            var database = httpContext.Session.GetString("database");
            var username = httpContext.Session.GetString("username");
            var sessionTimeStr = httpContext.Session.GetString("SessionTime");

            // Session has valid data only if credentials and database are set and not invalid/empty
            bool hasValidData = !string.IsNullOrWhiteSpace(userId) &&
                                userId != "0" &&
                                userId != "-1" &&
                                !string.IsNullOrWhiteSpace(database) &&
                                !string.IsNullOrWhiteSpace(username);

            bool isSessionExpired = true;
            if (hasValidData && !string.IsNullOrWhiteSpace(sessionTimeStr))
            {
                if (DateTime.TryParse(sessionTimeStr, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out DateTime sessionTime) ||
                    DateTime.TryParse(sessionTimeStr, out sessionTime))
                {
                    // Check if session data is older than 30 minutes from current time
                    if ((DateTime.UtcNow - sessionTime).TotalMinutes <= SessionTimeoutMinutes)
                    {
                        isSessionExpired = false;
                    }
                }
            }

            bool isBaseUrl = controller.Equals("Home", StringComparison.OrdinalIgnoreCase) &&
                             action.Equals("Index", StringComparison.OrdinalIgnoreCase);

            // =====================================================
            // BASE URL / HOME / INDEX
            // =====================================================
            if (isBaseUrl)
            {
                // Allow POST /Home/Index (Login submission) to proceed to HomeController
                if (HttpMethods.IsPost(httpContext.Request.Method))
                {
                    base.OnActionExecuting(context);
                    return;
                }

                // If session has no data OR data before 30 min from current time:
                // Clear session, delete cookies, and stay on login page cleanly
                if (!hasValidData || isSessionExpired)
                {
                    ClearSessionAndCookies(httpContext);
                    base.OnActionExecuting(context);
                    return;
                }

                // Valid active session within 30 min -> refresh timestamp & redirect to Dashboard
                httpContext.Session.SetString("SessionTime", DateTime.UtcNow.ToString("o"));
                context.Result = new RedirectToActionResult(
                    "Dashboard",
                    "Home",
                    null);
                return;
            }

            // =====================================================
            // ALL OTHER PAGES (REQUIRE VALID SESSION <= 30 MIN)
            // =====================================================
            if (!hasValidData || isSessionExpired)
            {
                ClearSessionAndCookies(httpContext);

                // Prevent multiple redirection loops when UI sends AJAX / API requests while API is not active
                if (IsAjaxOrApiRequest(httpContext.Request))
                {
                    httpContext.Response.Headers["Session-Expired"] = "true";
                    context.Result = new StatusCodeResult(StatusCodes.Status401Unauthorized);
                    return;
                }

                context.Result = new RedirectToActionResult(
                    "Index",
                    "Home",
                    null);
                return;
            }

            // Refresh session activity timestamp for ongoing valid requests
            httpContext.Session.SetString("SessionTime", DateTime.UtcNow.ToString("o"));

            base.OnActionExecuting(context);
        }

        /// <summary>
        /// Clears session and deletes all tracking and authentication cookies.
        /// </summary>
        private static void ClearSessionAndCookies(HttpContext httpContext)
        {
            try
            {
                httpContext.Session.Clear();
            }
            catch
            {
                // Ignore if session state is inaccessible
            }

            try
            {
                var expiredOptions = new CookieOptions
                {
                    Expires = DateTime.UtcNow.AddDays(-1),
                    Path = "/",
                    HttpOnly = true,
                    Secure = httpContext.Request.IsHttps
                };

                // Delete all cookies present in the incoming request
                foreach (var cookieKey in httpContext.Request.Cookies.Keys)
                {
                    httpContext.Response.Cookies.Delete(cookieKey);
                    httpContext.Response.Cookies.Delete(cookieKey, expiredOptions);
                }

                // Explicitly delete ASP.NET Core session and authentication cookies
                var standardCookies = new[] { ".AspNetCore.Session", ".AspNetCore.Cookies", ".AspNetCore.Antiforgery" };
                foreach (var cookieName in standardCookies)
                {
                    httpContext.Response.Cookies.Delete(cookieName);
                    httpContext.Response.Cookies.Delete(cookieName, expiredOptions);
                }
            }
            catch
            {
                // Ignore cookie deletion errors
            }
        }

        /// <summary>
        /// Detects if request is an AJAX or API call to avoid 302 redirect loops.
        /// </summary>
        private static bool IsAjaxOrApiRequest(HttpRequest request)
        {
            if (request == null) return false;

            if (string.Equals(request.Headers["X-Requested-With"], "XMLHttpRequest", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            var accept = request.Headers["Accept"].ToString();
            if (!string.IsNullOrEmpty(accept) && accept.Contains("application/json", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (request.Path.HasValue && request.Path.Value.StartsWith("/api", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        }
    }
}