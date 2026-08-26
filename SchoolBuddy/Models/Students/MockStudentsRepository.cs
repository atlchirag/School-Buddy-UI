using Newtonsoft.Json;
using System.Data;
using System.Net.Http;
using System.Text;
using System.Xml.Linq;
using Microsoft.AspNetCore.Http;
using System.Net.Http.Headers;

namespace SchoolBuddy.Models.Students
{
    public class MockStudentsRepository : IStudentsRepository
    {
        private readonly IConfiguration _configure;
        public MockStudentsRepository(IConfiguration configuration)
        {
            _configure = configuration;
        }
        //List<Students> students = new List<Students>();
        //public MockStudentsRepository()
        //{

        //    students.Add(new Students
        //    {
        //        Id = 1,
        //        Adminssion_no = "1234",
        //        Student_name = "Rita",
        //        Gender = "Female",
        //        Birth = "14-02-2000",
        //        Class = "XII",
        //        Division = "A",
        //        Parent_name = "Ram",
        //        Mobile = "9876543212",
        //        Address = "CP",
        //        Password = "@qwe",
        //        Acadminc_year = "2004",
        //        Created_date = "30-may-2024",
        //        Rf_tag = "12d45f",
        //        Email = "rita@gmail.com",
        //        Relation_with_std = "Father",
        //        Blood_group = "O-",
        //        Parent_profession = "ITO",
        //        Qr_code = "xsdds3scwdc3"
        //    });
        //    students.Add(new Students
        //    {
        //        Id = 2,
        //        Adminssion_no = "1235",
        //        Student_name = "Sita",
        //        Gender = "Female",
        //        Birth = "11-02-2000",
        //        Class = "XI",
        //        Division = "A",
        //        Parent_name = "Raman",
        //        Mobile = "9876543212",
        //        Address = "CP",
        //        Password = "@qweq",
        //        Acadminc_year = "2004",
        //        Created_date = "30-may-2024",
        //        Rf_tag = "1d45f",
        //        Email = "sita@gmail.com",
        //        Relation_with_std = "Father",
        //        Blood_group = "O-",
        //        Parent_profession = "ITO",
        //        Qr_code = "xsdds3scwdc3"
        //    });
        //}

        public async Task<string> AddStudent(Students students,string school_id)
        {
            try
            {
                string? url = _configure["api_endpoint"];
                var json = JsonConvert.SerializeObject(new Students
                {
                    id = students.id,
                    user_id= school_id,
                    student_name = students.student_name,
                    class_ = students.class_,
                    admission_no = students.admission_no,
                    gender = students.gender,
                    birth = students.birth,
                    division = students.division,
                    parent_name = students.parent_name,
                    mobile_no1 = students.mobile_no1,
                    password = students.password,
                    street = students.street,
                    created_date = students.created_date,
                    //rf_id = students.rf_id,
                    rf_id = string.IsNullOrEmpty(students.rf_id) ? null : students.rf_id,
                    email = students.email,
                    relation_with_std = students.relation_with_std,
                    blood_group = students.blood_group,
                    qr_code = students.qr_code
                }); ;

                var JSON = new StringContent(json, Encoding.UTF8, "application/json");
                HttpClient httpClient = new HttpClient();
                var response = await httpClient.PostAsync($"{url}Students/AddStudent", JSON);
                if (response.IsSuccessStatusCode)
                {
                    var res = await response.Content.ReadAsStringAsync();
                    return res;
                }
                else
                {
                    return "Something went wrong";
                }
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task <string> DeleteStudent(int id)
        {
            try
            {
                string? url = _configure["api_endpoint"];

                var json = JsonConvert.SerializeObject(new getstudentbyid
                {
                    student_id = id
                });
                var JSON = new StringContent(json, Encoding.UTF8, "application/json");
                HttpClient httpClient = new HttpClient();
                var response = await httpClient.PostAsync($"{url}Students/DeleteStudentById", JSON);
                if (response.IsSuccessStatusCode)
                {
                    var res = await response.Content.ReadAsStringAsync();
                    return res;
                }
                else
                {
                    return "Something went wrong";
                }
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<string> GetStudentByID(int id)
        {

            try
            {
                string url = _configure["api_endpoint"];

                var json = JsonConvert.SerializeObject(new getstudentbyid
                {
                    student_id = id
                });
                var JSON = new StringContent(json, Encoding.UTF8, "application/json");
                HttpClient httpClient = new HttpClient();
                var response = await httpClient.PostAsync($"{url}Students/GetStudentById", JSON);
                if (response.IsSuccessStatusCode)
                {
                    var res = await response.Content.ReadAsStringAsync();
                    return res;
                }
                else
                {
                    return "Something went wrong";
                }
            }
            catch (Exception ex)
            {
                return "";
            }
            //var std = students.FirstOrDefault(std => std.Id==id);
            //return std;
            //throw new NotImplementedException();


        }

        public IEnumerable<Students> GetStudents()
        {
            throw new NotImplementedException();

        }

        

        public async Task <string> GetAllStudentAPICall(string userid)
        {
            try
            {
                string? url = _configure["api_endpoint"];

                var json = JsonConvert.SerializeObject(new getstudents
                {
                    user_id = userid
                });
                var JSON = new StringContent(json, Encoding.UTF8, "application/json");
                HttpClient httpClient = new HttpClient();
                var response = await httpClient.PostAsync($"{url}Students/GetAllStudentDetails", JSON);
                if (response.IsSuccessStatusCode)
                {
                    var res = await response.Content.ReadAsStringAsync();
                    return res;
                }
                else
                {
                    return "Something went wrong";
                }
            }
            catch (Exception ex)
            {
                return "";
            }

        }

        public async Task<string> UpdateStudent(Students students,int student_id)
        {
            try
            {
                string? url = _configure["api_endpoint"];

                var json = JsonConvert.SerializeObject(new Students
                {
                    id = student_id,
                    student_name = students.student_name,
                    class_ = students.class_,
                    admission_no = students.admission_no,
                    gender = students.gender,
                    birth = students.birth,
                    division = students.division,
                    parent_name = students.parent_name,
                    mobile_no1 = students.mobile_no1,
                    password = students.password,
                    street = students.street,
                    created_date = students.created_date,
                    rf_id = students.rf_id,
                    email = students.email,
                    relation_with_std = students.relation_with_std,
                    blood_group = students.blood_group,
                    qr_code = students.qr_code
                }); ;
               
                var JSON = new StringContent(json, Encoding.UTF8, "application/json");
                HttpClient httpClient = new HttpClient();
                //var response = await httpClient.PostAsync("http://localhost:5156/api/Students/EditStudent", JSON);
                var response = await httpClient.PostAsync($"{url}Students/EditStudent", JSON); // Using dynamic URL here
                if (response.IsSuccessStatusCode)
                {
                    var res = await response.Content.ReadAsStringAsync();
                    return res;
                }
                else
                {
                    return "Something went wrong";
                }
            }
            catch (Exception ex)
            {
                return "";
            }
        }



        public Task<string> GetAllStudentAPICall(int user_id)
        {
            throw new NotImplementedException();
        }

        public async Task<string> addStudentsInBulk(IFormFile file, string schoolid)
        {
            try
            {
                // Fetch the dynamic URL from configuration
                string? url = _configure["api_endpoint"];
                //Console.WriteLine($"API URL: {url}api/Students/AddStudentsInBulk"); // ✅ Debugging

                using (var content = new MultipartFormDataContent())
                {
                    var fileStream = file.OpenReadStream();
                    var fileContent = new StreamContent(fileStream);
                    fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
                    content.Add(fileContent, "file", file.FileName);

                    var schoolIdContent = new StringContent(schoolid);
                    content.Add(schoolIdContent, "user_id");

                    HttpClient httpClient = new HttpClient();
                    //var response = await httpClient.PostAsync("http://localhost:5156/api/Students/AddStudentsInBulk", content);
                    var response = await httpClient.PostAsync($"{url}Students/AddStudentsInBulk", content);
                    if (response.IsSuccessStatusCode)
                    {
                        return await response.Content.ReadAsStringAsync();
                    }
                    else
                    {
                        Console.WriteLine($"Error Response: {response.StatusCode} - {await response.Content.ReadAsStringAsync()}");
                        return "Something went wrong";
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");  
                return "";
            }
        }



        public async Task<string> classes()
        {
            try
            {
                string? url = _configure["api_endpoint"];

              
                //var JSON = new StringContent(json, Encoding.UTF8, "application/json");
                HttpClient httpClient = new HttpClient();
                var response = await httpClient.GetAsync($"{url}Students/getclasses");
                if (response.IsSuccessStatusCode)
                {
                    var res = await response.Content.ReadAsStringAsync();
                    return res;
                }
                else
                {
                    return "Something went wrong";
                }
            }
            catch (Exception ex)
            {
                return "";
            }
        }

        public async Task<byte[]> DownloadStudentsExcel(string schoolid)
        {
            try
            {
                string? url = _configure["api_endpoint"];

                HttpClient httpClient = new HttpClient();
                var response = await httpClient.GetAsync($"{url}Students/DownloadStudentsExcel?user_id={schoolid}");

                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadAsByteArrayAsync();
                }
                else
                {
                    return null;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in DownloadStudentsExcel: {ex.Message}");
                return null;
            }
        }
    }
}
