using Lyco.Api.Models;

namespace Lyco.Api.Repositories;

public interface IServiceRepository
{
    Task<(IEnumerable<ServiceMst> Items, int Total)> GetPagedAsync(string? search, int page, int pageSize);
    Task<ServiceMst?> GetByIdAsync(long id);
    Task<bool> ExistsByNameAsync(string name, long? excludeId);
    Task<ServiceMst> CreateAsync(string name);
    Task UpdateAsync(ServiceMst service);
}
