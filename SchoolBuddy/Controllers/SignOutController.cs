using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace SchoolBuddy.Controllers
{
    [Route("{controller}/{action}")]
    public class SignOutController : Controller
    {
        [HttpGet]
        public async Task<IActionResult> Logout()
        {
            // Clear Session

            HttpContext.Session.Clear();

            // Remove Authentication Cookie

            await HttpContext.SignOutAsync(
                CookieAuthenticationDefaults.AuthenticationScheme);

            // Delete Session/Cookie Manually

            Response.Cookies.Delete(".AspNetCore.Session");

            Response.Cookies.Delete(".AspNetCore.Cookies");

            // Prevent Browser Cache

            Response.Headers["Cache-Control"] =
                "no-cache, no-store, must-revalidate";

            Response.Headers["Pragma"] = "no-cache";

            Response.Headers["Expires"] = "0";

            return RedirectToAction("Index", "Home");
        }
    }
}