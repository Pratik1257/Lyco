using Lyco.Api.DTOs;

namespace Lyco.Api.Services;

public interface IServiceService
{
    Task<PagedResult<ServiceDto>> GetPagedAsync(string? search, int page, int pageSize);
    Task<(ServiceDto? Service, string? Error)> CreateAsync(string name);
    Task<(ServiceDto? Service, string? Error)> UpdateAsync(long id, string name);
}
