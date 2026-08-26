using Microsoft.AspNetCore.Mvc;

namespace SchoolBuddy.Models.Driver
{
    public interface IDriverRepository
    {

        
        Task<List<driver>> DriverListtrack(string token);
        Task<string> AddDriver(AddDriver model, string token);
        Task<List<Vehicle>> Veh_list(string token);
        Task<CommonResponse> UnAssignVehicle(string driverId, string serviceId, string deviceId, string token);
        Task<AssignDriverResponse> AssignDriver(int serviceId, int driverId, bool isEdit);
        Task<DriverHistoryResponse> DriverHistory(string token, int driverId);
        Task<DriverApiResponse> EditDriver(editDriver model, string toke);

        Task<DriverApiResponse> DeleteDriver(long driverId, string token);

        Task<DriverPerformanceResponse> DriverPerformance(string token);
        Task<DeletePerformanceResponse> DeletePerformance(string token, int categoryId);
        Task<DriverCriteriaResponse> GetDriverCriteria(string token);
        Task<SaveDriverPerformanceResponse> SaveDriverPerformance(
    SaveDriverPerformanceRequest request,
    string token);
        Task<SaveDriverPerformanceResponse> UpdateDriverPerformance(
    SaveDriverPerformanceRequest request,
    string token);
        Task<driverdashboard> DriverPerformance(string user, string pass);
    }
} 
