using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.Rewrite;
using Microsoft.Net.Http.Headers;
using System.IO.Compression;
using SchoolBuddy.Models.Analysis;
using SchoolBuddy.Models.ApiTemplate;
using SchoolBuddy.Models.Command;
using SchoolBuddy.Models.Complains;
using SchoolBuddy.Models.Dashboard;
using SchoolBuddy.Models.Dashboard.TotalStudents;
using SchoolBuddy.Models.Driver;
using SchoolBuddy.Models.Holidays;
using SchoolBuddy.Models.Leave;
using SchoolBuddy.Models.Login;
using SchoolBuddy.Models.ProfileEdit;
using SchoolBuddy.Models.Report;
using SchoolBuddy.Models.Route;
using SchoolBuddy.Models.Students;
using SchoolBuddy.Models.Tracking;
using SchoolBuddy.Repositories.Attendance;
using SchoolBuddy.Models.VideoTelematics;

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
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // Never send the session cookie over plain HTTP
    options.Cookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Strict; // Not sent on cross-site requests (CSRF)
    options.Cookie.IsEssential = true; // Make the session cookie essential
});
// Validate the anti-forgery token on every POST/PUT/PATCH/DELETE; _Layout.cshtml adds it to jQuery and fetch calls.
builder.Services.AddControllersWithViews(options =>
    options.Filters.Add(new AutoValidateAntiforgeryTokenAttribute()));
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "RequestVerificationToken";
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});
builder.Services.AddHsts(options => options.MaxAge = TimeSpan.FromDays(365));
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[] { "image/svg+xml" });
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);

// Lets General.LogException read the current request's Session "uid"
builder.Services.AddHttpContextAccessor();

builder.Services.AddHttpClient();
builder.Services.AddHttpClient(HttpClientNames.SchoolBuddyApi);
builder.Services.AddHttpClient(HttpClientNames.Trackofy)
    .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
    {
        AllowAutoRedirect = false
    });
builder.Services.AddHttpClient(Tracking.TrackingClientName);
builder.Services.AddTransient<ILoginRepository, MockLoginRepository>();
builder.Services.AddScoped<IProfileEditRepository, ProfileEditRepository>();
//builder.Services.AddSingleton<ITotalStudents, MockTotalStudents>();
builder.Services.AddTransient<IStudentsRepository, MockStudentsRepository>();
builder.Services.AddSingleton<IDashboardRepository, DashboardRepository>();
builder.Services.AddSingleton<IRouteRepository, MockRouteRepository>();
builder.Services.AddSingleton<IReportRepository, ReportRepository>();
builder.Services.AddSingleton<IHoliday, HolidayRepository>();
builder.Services.AddSingleton<IComplain, ComplainRepository>();
builder.Services.AddSingleton<ILeave, LeaveRepository>();
builder.Services.AddSingleton<ICommand, CommandRespository>();
builder.Services.AddSingleton<IAnaysis, AnaysisRepository>();
builder.Services.AddSingleton<Iapitemplate,api>();
builder.Services.AddSingleton<ITracking, Tracking>();
builder.Services.AddSingleton<IDriverRepository, DriverRepository>();
builder.Services.AddSingleton<IAttendanceRepository, AttendanceRepository>();//singleton
builder.Services.AddSingleton<IVideoTelematics, VideoTelematicsRepository>(); //singleton


var app = builder.Build();

// File logging: <LogRootPath>\ddMMyyyy\<uid>\exception_<Controller>.log
SchoolBuddy.General.ConfigureLogging(app.Services, app.Configuration);
app.Lifetime.ApplicationStopping.Register(SchoolBuddy.AsyncLogWriter.Stop);

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
// Security headers; registered before UseStaticFiles so static files get them too.
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Frame-Options"] = "SAMEORIGIN";
    headers["X-Content-Type-Options"] = "nosniff";
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    headers["Permissions-Policy"] = "camera=(), microphone=()";
    headers["Content-Security-Policy"] = "frame-ancestors 'self';";
    // Report-only until the CDNs and map tile servers the views load are listed.
    headers["Content-Security-Policy-Report-Only"] =
        "default-src 'self'; object-src 'none'; base-uri 'self'";

    await next();
});
app.UseResponseCompression();
app.UseRewriter(new RewriteOptions()
.AddRewrite("^schoolbuddy/(.*)", "$1", skipRemainingRules: true));
//app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Files linked with asp-append-version carry ?v=<hash>, so they can be cached for a year.
        // Unversioned files get one day so a deploy is picked up within a day.
        ctx.Context.Response.Headers[HeaderNames.CacheControl] =
            ctx.Context.Request.Query.ContainsKey("v")
                ? "public,max-age=31536000,immutable"
                : "public,max-age=86400";
    }
});

app.UseRouting();

app.UseSession();

// Logs any exception a controller did not catch, then rethrows so the error page still shows.
// Placed after UseSession so the log can use the Session "uid".
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        SchoolBuddy.General.LogException(ex, "UNHANDLED");
        throw;
    }
});

app.UseAuthentication();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
