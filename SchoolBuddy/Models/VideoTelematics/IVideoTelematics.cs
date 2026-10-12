namespace SchoolBuddy.Models.VideoTelematics
{
    public interface IVideoTelematics
    {
        string CmsBaseUrl { get; }

        /// <summary>Logs in to the Trackofy PHP API and the CMSV6 server if the session has no tokens yet.</summary>
        Task<VtConnectionState> EnsureConnectedAsync(ISession session, CancellationToken cancellationToken);

        /// <summary>POST {core}/{file} with a JSON body and the Bearer token; re-logs in once on an auth failure.</summary>
        Task<VtApiResponse> CallCoreAsync(ISession session, string file, IDictionary<string, object?> payload, CancellationToken cancellationToken);

        /// <summary>POST {core}/caladdress.php?latitude=..&amp;longitude=..&amp;id=.. (reverse geocode).</summary>
        Task<VtApiResponse> GetAddressAsync(double latitude, double longitude, string id, CancellationToken cancellationToken);

        /// <summary>GET {cms}/StandardApiAction_{action}.action with jsession; re-logs in once on a session error.</summary>
        Task<VtApiResponse> CallCmsAsync(ISession session, string action, IEnumerable<KeyValuePair<string, string>> query, CancellationToken cancellationToken);

        /// <summary>The CMSV6 jsession used by the live video player URL.</summary>
        Task<string> GetCmsSessionAsync(ISession session, CancellationToken cancellationToken);

        /// <summary>
        /// Is MDVR enabled for this school? Asks SchoolBuddy_APIs (api/VideoTelematics/IsMdvrEnabled),
        /// which is true when the school has a tbl_services row with is_mdvr = 1.
        /// Cached in session (10 min; 2 min after a failure).
        /// </summary>
        Task<VtMdvrStatus> GetMdvrStatusAsync(ISession session, bool forceRefresh, CancellationToken cancellationToken);
    }
}
