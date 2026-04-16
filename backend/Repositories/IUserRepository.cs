using Lyco.Api.Models;

namespace Lyco.Api.Repositories;

public interface IUserRepository
{
    Task<(IEnumerable<UserRegistration> Items, int TotalCount)> GetPagedAsync(string? search, int page, int pageSize);
    Task<UserRegistration?> GetByIdAsync(long id);
    Task<UserRegistration> CreateAsync(UserRegistration user);
    Task UpdateAsync(UserRegistration user);
    Task DeleteAsync(long id);
    Task<bool> ExistsAsync(long id);
}
