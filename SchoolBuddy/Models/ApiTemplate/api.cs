using Newtonsoft.Json;
using SchoolBuddy.Models.Analysis;
using System.Text;

namespace SchoolBuddy.Models.ApiTemplate
{
    public class api: Iapitemplate
    {
        private readonly IConfiguration _url;
        private readonly IHttpClientFactory _httpClientFactory;
        public api(IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _url = configuration;
            _httpClientFactory = httpClientFactory;
        }
        public async Task<string> PostApiTemplate(string obj,string urlend)
        {
            string url = _url["api_endpoint"];
            var JSON = new StringContent(obj, Encoding.UTF8, "application/json");
            HttpClient httpClient = _httpClientFactory.CreateClient(HttpClientNames.SchoolBuddyApi);
            var response = await httpClient.PostAsync($"{url}{urlend}", JSON);
            if (response.IsSuccessStatusCode)
            {
                var res = await response.Content.ReadAsStringAsync();
                return res;
            }
            else
            {
                var res = await response.Content.ReadAsStringAsync();
                return "something went wrong";
            }
        }

        public async Task<string> GetApiTemplate(string urlend)
        {
            try
            {
                string url = _url["api_endpoint"] ?? "";

                HttpClient httpClient = _httpClientFactory.CreateClient(HttpClientNames.SchoolBuddyApi);
                var response = await httpClient.GetAsync($"{url}{urlend}");

                if (response.IsSuccessStatusCode)
                {
                    var res = await response.Content.ReadAsStringAsync();
                    return res;
                }
                else
                {
                    return "[]";
                }
            }
            catch (Exception ex)
            {
                General.LogException(ex);
                return "[]";
            }
        }
    }
}
