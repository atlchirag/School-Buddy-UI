using System.Collections;
using System.Reflection;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SchoolBuddy.Filters
{
    /// <summary>
    /// Server-side counterpart of wwwroot/js/form-length-validation.js: trims every bound string
    /// (action parameters and the public string properties of bound models, one level of nested
    /// models and lists deep) before the action runs, so data sent without the page's script is
    /// trimmed too. Passwords and tokens are left exactly as sent.
    /// </summary>
    public class TrimStringsFilter : IActionFilter
    {
        private const int MaxDepth = 2;

        public void OnActionExecuting(ActionExecutingContext context)
        {
            foreach (var key in context.ActionArguments.Keys.ToList())
            {
                var value = context.ActionArguments[key];
                if (value is string text)
                {
                    if (!IsSecret(key)) context.ActionArguments[key] = text.Trim();
                }
                else if (value != null)
                {
                    TrimObject(value, 0);
                }
            }
        }

        public void OnActionExecuted(ActionExecutedContext context) { }

        private static void TrimObject(object target, int depth)
        {
            if (depth > MaxDepth || target is IFormFile || target is Stream) return;

            if (target is IEnumerable items && target is not string && target is not IDictionary)
            {
                foreach (var item in items)
                {
                    if (item != null && !IsSimple(item.GetType())) TrimObject(item, depth + 1);
                }
                return;
            }

            var type = target.GetType();
            if (IsSimple(type) || type.Namespace?.StartsWith("SchoolBuddy", StringComparison.Ordinal) != true) return;

            foreach (var property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                if (!property.CanRead || property.GetIndexParameters().Length > 0) continue;

                if (property.PropertyType == typeof(string))
                {
                    if (!property.CanWrite || IsSecret(property.Name)) continue;
                    var text = (string?)property.GetValue(target);
                    if (text != null && text.Length != text.Trim().Length) property.SetValue(target, text.Trim());
                }
                else if (!IsSimple(property.PropertyType))
                {
                    var nested = property.GetValue(target);
                    if (nested != null) TrimObject(nested, depth + 1);
                }
            }
        }

        private static bool IsSecret(string name) =>
            name.Contains("password", StringComparison.OrdinalIgnoreCase) ||
            name.Contains("token", StringComparison.OrdinalIgnoreCase);

        private static bool IsSimple(Type type)
        {
            var underlying = Nullable.GetUnderlyingType(type) ?? type;
            return underlying.IsPrimitive || underlying.IsEnum || underlying == typeof(string) ||
                   underlying == typeof(decimal) || underlying == typeof(DateTime) ||
                   underlying == typeof(DateTimeOffset) || underlying == typeof(TimeSpan) || underlying == typeof(Guid);
        }
    }
}
