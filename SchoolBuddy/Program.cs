using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Rewrite;
using SchoolBuddy.Models.Analysis;
using SchoolBuddy.Models.ApiTemplate;
using SchoolBuddy.Models.Command;
using SchoolBuddy.Models.Complains;
using SchoolBuddy.Models.Dashboard;
using SchoolBuddy.Models.Dashboard.TotalStudents;
using SchoolBuddy.Models.Driver;
using SchoolBuddy.Models.Holidays;
using SchoolBuddy.Models.Login;
using SchoolBuddy.Models.ProfileEdit;
using SchoolBuddy.Models.Report;
using SchoolBuddy.Models.Route;
using SchoolBuddy.Models.Students;
using SchoolBuddy.Models.Tracking;
using SchoolBuddy.Repositories.Attendance;

var builder = WebApplication.CreateBuilder(args);
//builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
//    .AddCookie(options =>
//    {
//        //options.LoginPath = "/Account/Login";
//        options.LogoutPath = "/SignOut/Logout";
//    });
builder.Services.AddAuthentication(
    CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Home/Index";
    });
// Add services to the container.
builder.Services.AddDistributedMemoryCache(); // For in-memory cache
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30); // Set your desired timeout duration
    options.Cookie.HttpOnly = true; // Mitigate XSS attacks
    options.Cookie.IsEssential = true; // Make the session cookie essential
});
builder.Services.AddControllersWithViews();
builder.Services.AddAntiforgery(options => options.HeaderName = "RequestVerificationToken");
builder.Services.AddHttpClient();
builder.Services.AddTransient<ILoginRepository, MockLoginRepository>();
builder.Services.AddScoped<IProfileEditRepository, ProfileEditRepository>();
//builder.Services.AddSingleton<ITotalStudents, MockTotalStudents>();
builder.Services.AddTransient<IStudentsRepository, MockStudentsRepository>();
builder.Services.AddSingleton<IDashboardRepository, DashboardRepository>();
builder.Services.AddSingleton<IRouteRepository, MockRouteRepository>();
builder.Services.AddSingleton<IReportRepository, ReportRepository>();
builder.Services.AddSingleton<IHoliday, HolidayRepository>();
builder.Services.AddSingleton<IComplain, ComplainRepository>();
builder.Services.AddSingleton<ICommand, CommandRespository>();
builder.Services.AddSingleton<IAnaysis, AnaysisRepository>();
builder.Services.AddSingleton<Iapitemplate,api>();
builder.Services.AddSingleton<ITracking, Tracking>();
builder.Services.AddSingleton<IDriverRepository, DriverRepository>();
builder.Services.AddScoped<IAttendanceRepository, AttendanceRepository>();


var app = builder.Build();
// Configure the HTTP request pipeline.
//if (!app.Environment.IsDevelopment())
//{
//    app.UseStatusCodePagesWithReExecute("/Error/{0}");
//    app.UseExceptionHandler("/Home/Error");
//    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
//    app.UseHsts();
//}
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseStatusCodePagesWithReExecute("/Error/{0}");
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
//app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();
app.UseRewriter(new RewriteOptions()
.AddRewrite("^schoolbuddy/(.*)", "$1", skipRemainingRules: true));
// Iframe/clickjacking protection
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
    context.Response.Headers["Content-Security-Policy"] =
        "frame-ancestors 'self';";

    await next();
});

app.UseSession();
app.UseAuthentication();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
