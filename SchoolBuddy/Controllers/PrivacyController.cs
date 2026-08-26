using Microsoft.AspNetCore.Mvc;

namespace SchoolBuddy.Controllers
{
    public class PrivacyController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
