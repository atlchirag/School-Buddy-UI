using Microsoft.AspNetCore.Mvc;

namespace SchoolBuddy.Controllers
{
    /// <summary>
    /// Help & FAQs page. FAQ content is currently served as static data from
    /// wwwroot/js/help/faq-data.js; to move it to an API, point the data source
    /// in wwwroot/js/help/faq-center.js at a JSON endpoint with the same shape.
    /// </summary>
    public class HelpController : BaseController
    {
        [HttpGet]
        public IActionResult Index()
        {
            return View("~/Views/Help/Index.cshtml");
        }
    }
}
