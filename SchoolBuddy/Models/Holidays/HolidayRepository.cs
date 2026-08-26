using Newtonsoft.Json;
using SchoolBuddy.Models.ApiTemplate;
using System.Text;
using System.Xml.Linq;

namespace SchoolBuddy.Models.Holidays
{
    public class HolidayRepository : IHoliday
    {
        private readonly Iapitemplate _apitemplate;
        public HolidayRepository(Iapitemplate apitemplate)
        {
            _apitemplate = apitemplate;
        }
        public async Task<string> AddHoliday(string start_date, string end_date, string schoolid, string description, string status)
        {
            try
            {
                // Serialize the data into JSON
                var json = JsonConvert.SerializeObject(new Aholidays
                {
                    start = start_date,
                    end = end_date,
                    eventname = description,
                    schoolid = schoolid,
                    status = status
                });

                string urlend = "Holiday/AddHoliday";

                // Make the API request using the PostApiTemplate
                var response = await _apitemplate.PostApiTemplate(json, urlend);

                // Log the response for debugging
                if (!response.StartsWith("Success"))
                {
                    Console.WriteLine($"API Response Error: {response}");
                }

                return response;
            }
            catch (Exception ex)
            {
                // Log the exception for debugging
               // Console.WriteLine($"Exception: {ex.Message}");
                return "An error occurred while adding the holiday.";
            }
        }


        public async Task<string> GetHolidays(string schoolid)
        {
            try

            {
                var json = JsonConvert.SerializeObject(new school
                {
                    id = schoolid
                });

                string urlend = $@"Holiday/GetHolidays";
                return await _apitemplate.PostApiTemplate(json, urlend);
            }
            catch (Exception ex)
            {
                return $"fail-101";
            }
        }

        public async Task<bool> UpdateHoliday(int id, string start_date, string end_date, string schoolid, string eventname, string status)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new Aholidays
                {
                    id = id,
                    start = start_date,
                    end = end_date,
                    eventname = eventname,
                    schoolid = schoolid,
                    status = status
                });

               // Console.WriteLine($"📤 Sending Data to API for Update: {json}");

                string urlend = "Holiday/UpdateHoliday";
                string result = await _apitemplate.PostApiTemplate(json, urlend);

                Console.WriteLine($"📥 API Response: {result}");

                return result == "true"; // ✅ Convert response to boolean
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ Exception: " + ex.Message);
                return false;
            }
        }

        public async Task<bool> DeleteHoliday(int id, string schoolid)
        {
            try
            {
                var json = JsonConvert.SerializeObject(new { id = id, schoolid = schoolid });

                Console.WriteLine($"📤 Sending Data to API for Delete: {json}");

                string urlend = "Holiday/DeleteHoliday";
                string result = await _apitemplate.PostApiTemplate(json, urlend);

                Console.WriteLine($"📥 API Response: {result}");

                return result == "true";
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ Exception in DeleteHoliday: " + ex.Message);
                return false;
            }
        }


    }
}
