using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SchoolBuddy.Controllers
{
    public class BaseController : Controller
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            // Disable Browser Cache
            context.HttpContext.Response.Headers["Cache-Control"] =
                "no-cache, no-store, must-revalidate";

            context.HttpContext.Response.Headers["Pragma"] = "no-cache";
            context.HttpContext.Response.Headers["Expires"] = "0";

            // Prevent iframe/browser caching
            context.HttpContext.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";

            var action = context.ActionDescriptor.RouteValues["action"];

            if (!string.IsNullOrEmpty(action) &&
                (action.Equals("Index", StringComparison.OrdinalIgnoreCase) ||
                 action.Equals("Login", StringComparison.OrdinalIgnoreCase) ||
                 action.Equals("ForgotPassword", StringComparison.OrdinalIgnoreCase)))
            {
                base.OnActionExecuting(context);
                return;
            }

            // Session Validation
            var userId = HttpContext.Session.GetString("uid");

            if (string.IsNullOrEmpty(userId))
            {
                context.Result = new RedirectToActionResult(
                    "Index",
                    "Home",
                    null);

                return;
            }

            base.OnActionExecuting(context);
        }
    }
}