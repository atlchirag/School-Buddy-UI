using Newtonsoft.Json;
using NuGet.Protocol.Core.Types;
using SchoolBuddy.Models.ApiTemplate;
using System.Text;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace SchoolBuddy.Models.Login
{
    public class MockLoginRepository : ILoginRepository
    {
        private readonly IConfiguration _configure;
        private readonly Iapitemplate _apitemplate;
        public MockLoginRepository(IConfiguration configuration,Iapitemplate apitemplate) 
        { 
            _configure = configuration;
            _apitemplate = apitemplate;
        }

        public async Task<string> LoginAPICall(string name, string pass)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Login
                {
                    username = name,
                    password = pass
                });

                string urlend = $@"Home/Login";
                return await _apitemplate.PostApiTemplate(json, urlend);

            }
            catch (Exception ex)
            {
                return $"fail-101";
            }

        }
    }
}
