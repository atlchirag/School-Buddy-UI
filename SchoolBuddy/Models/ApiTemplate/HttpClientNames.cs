namespace SchoolBuddy.Models.ApiTemplate
{
    /// <summary>
    /// Named HttpClient registrations (see Program.cs). Clients come from
    /// IHttpClientFactory so sockets are pooled instead of opened per call.
    /// </summary>
    public static class HttpClientNames
    {
        // School Buddy backend API ("api_endpoint").
        public const string SchoolBuddyApi = "SchoolBuddyApi";

        // Trackofy / tracking APIs: no auto-redirect, certificate check skipped
        // (same behaviour as the per-call handlers this replaces).
        public const string Trackofy = "Trackofy";
    }
}
