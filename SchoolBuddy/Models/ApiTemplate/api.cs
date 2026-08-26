using Newtonsoft.Json;
using SchoolBuddy.Models.Analysis;
using System.Text;

namespace SchoolBuddy.Models.ApiTemplate
{
    public class api: Iapitemplate
    {
        private readonly IConfiguration _url;
        public api(IConfiguration configuration)
        {
            _url = configuration;
        }
        public async Task<string> PostApiTemplate(string obj,string urlend)
        {
            string url = _url["api_endpoint"];
            Console.WriteLine(obj);
            var JSON = new StringContent(obj, Encoding.UTF8, "application/json");
            HttpClient httpClient = new HttpClient();
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

                HttpClient httpClient = new HttpClient();
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
            catch
            {
                return "[]";
            }
        }
    }
}
