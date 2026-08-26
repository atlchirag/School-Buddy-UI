using Microsoft.AspNetCore.Mvc;

namespace SchoolBuddy.Controllers
{
    public class ContactController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
