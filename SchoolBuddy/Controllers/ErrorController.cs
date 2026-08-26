using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Razor.Compilation;

namespace SchoolBuddy.Controllers
{
    public class ErrorController :Controller
    {
        [Route("Error/{StatusCode}")]
        public IActionResult HttpStatusCodes(int StatusCode)
        {
            switch (StatusCode)
            {
                case 404:
                    ViewBag.ErrorMessage = "Sorry,the resource you requested could not be found!";
                    break;

            }
            return View("~/Views/Error/HttpStatusCodes.cshtml");
        }
    }
}
