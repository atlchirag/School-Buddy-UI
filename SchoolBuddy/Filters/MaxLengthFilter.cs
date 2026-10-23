using System.Collections;
using System.Reflection;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ViewFeatures;

namespace SchoolBuddy.Filters
{
    /// <summary>
    /// Server-side counterpart of the name / address limits in wwwroot/js/form-length-validation.js:
    /// on every add / update request, person names may not exceed 100 characters and addresses
    /// 250, whichever action receives them, so a save that skips the page's script is refused too.
    /// Checks action parameters and the string properties of bound models (nested models and lists included).
    /// </summary>
    public class MaxLengthFilter : IActionFilter
    {
        public const int NameMaxLength = 100;
        public const int AddressMaxLength = 250;
        private const int MaxDepth = 2;

        private static readonly Regex PersonName = new(
            "^(name|(first|last|full|company|student|parent|father|mother|driver|teacher|visitor|staff)_?name)$",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        public void OnActionExecuting(ActionExecutingContext context)
        {
            var method = context.HttpContext.Request.Method;
            if (HttpMethods.IsGet(method) || HttpMethods.IsHead(method)) return;

            string? error = null;
            foreach (var argument in context.ActionArguments)
            {
                error = argument.Value is string text
                    ? Check(argument.Key, text)
                    : argument.Value != null ? CheckObject(argument.Value, 0) : null;
                if (error != null) break;
            }
            if (error == null) return;

            var request = context.HttpContext.Request;
            bool isAjax = request.Headers["X-Requested-With"] == "XMLHttpRequest" ||
                          request.Headers.Accept.ToString().Contains("application/json") ||
                          request.ContentType?.Contains("application/json") == true;

            var referer = request.Headers.Referer.ToString();
            if (!isAjax && !string.IsNullOrEmpty(referer) && context.Controller is Controller controller)
            {
                controller.TempData["ErrorMessage"] = error;
                context.Result = new RedirectResult(referer);
                return;
            }

            context.Result = new BadRequestObjectResult(new { success = false, status = false, message = error });
        }

        public void OnActionExecuted(ActionExecutedContext context) { }

        private static string? CheckObject(object target, int depth)
        {
            if (depth > MaxDepth || target is IFormFile || target is Stream) return null;

            if (target is IEnumerable items && target is not string && target is not IDictionary)
            {
                foreach (var item in items)
                {
                    if (item == null) continue;
                    var error = item is string text ? null : CheckObject(item, depth + 1);
                    if (error != null) return error;
                }
                return null;
            }

            var type = target.GetType();
            if (type.Namespace?.StartsWith("SchoolBuddy", StringComparison.Ordinal) != true) return null;

            foreach (var property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                if (!property.CanRead || property.GetIndexParameters().Length > 0) continue;

                var value = property.GetValue(target);
                var error = value switch
                {
                    null => null,
                    string text => Check(property.Name, text),
                    _ when property.PropertyType.IsPrimitive || property.PropertyType.IsValueType => null,
                    _ => CheckObject(value, depth + 1)
                };
                if (error != null) return error;
            }
            return null;
        }

        private static string? Check(string fieldName, string value)
        {
            var length = value.Trim().Length;
            if (IsAddress(fieldName) && length > AddressMaxLength)
                return $"Address cannot exceed {AddressMaxLength} characters (you entered {length}).";
            if (PersonName.IsMatch(fieldName) && length > NameMaxLength)
                return $"Name cannot exceed {NameMaxLength} characters (you entered {length}).";
            return null;
        }

        private static bool IsAddress(string fieldName) =>
            (fieldName.Contains("address", StringComparison.OrdinalIgnoreCase) ||
             fieldName.Contains("street", StringComparison.OrdinalIgnoreCase)) &&
            !fieldName.Contains("mail", StringComparison.OrdinalIgnoreCase) &&
            !fieldName.Contains("ip", StringComparison.OrdinalIgnoreCase) &&
            !fieldName.Contains("mac", StringComparison.OrdinalIgnoreCase);
    }
}
