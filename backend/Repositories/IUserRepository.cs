using Lyco.Api.Models;

namespace Lyco.Api.Repositories;

public interface IUserRepository
{
    Task<(IEnumerable<UserRegistration> Items, int TotalCount)> GetPagedAsync(string? search, string? status, int page, int pageSize);
    Task<UserRegistration?> GetByIdAsync(long id);
    Task<UserRegistration> CreateAsync(UserRegistration user);
    Task UpdateAsync(UserRegistration user);
    Task<(bool Success, string? Error)> DeleteAsync(long id);
    Task<bool> ExistsAsync(long id);
    Task<long> GetNextUniqueNoAsync();
    Task<bool> IsEmailUniqueAsync(string email, long? excludeUserId = null);
    Task<bool> IsUsernameUniqueAsync(string username, long? excludeUserId = null);
}
