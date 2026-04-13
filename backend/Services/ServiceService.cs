using Lyco.Api.DTOs;
using Lyco.Api.Models;
using Lyco.Api.Repositories;

namespace Lyco.Api.Services;

public class ServiceService : IServiceService
{
    private readonly IServiceRepository _repo;
    private static readonly HashSet<int> AllowedPageSizes = [10, 20, 50];

    public ServiceService(IServiceRepository repo) => _repo = repo;

    public async Task<PagedResult<ServiceDto>> GetPagedAsync(string? search, int page, int pageSize)
    {
        // Clamp to valid values matching the frontend dropdown options
        pageSize = AllowedPageSizes.Contains(pageSize) ? pageSize : 10;
        page = Math.Max(1, page);

        var (items, total) = await _repo.GetPagedAsync(search, page, pageSize);
        var totalPages = (int)Math.Ceiling((double)total / pageSize);
        // Note: Assumed DateTime.UtcNow for DTO as ServiceMst doesn't have CreatedAt in schema
        var dtos = items.Select(s => new ServiceDto(s.ServiceId, s.ServiceName ?? string.Empty, DateTime.UtcNow));

        return new PagedResult<ServiceDto>(dtos, total, page, pageSize, Math.Max(1, totalPages));
    }

    public async Task<(ServiceDto? Service, string? Error)> CreateAsync(string name)
    {
        var cleanName = name.Trim();

        if (await _repo.ExistsByNameAsync(cleanName, excludeId: null))
            return (null, "A service with this name already exists.");

        var created = await _repo.CreateAsync(cleanName);
        return (new ServiceDto(created.ServiceId, created.ServiceName ?? string.Empty, DateTime.UtcNow), null);
    }

    public async Task<(ServiceDto? Service, string? Error)> UpdateAsync(long id, string name)
    {
        var existing = await _repo.GetByIdAsync(id);
        if (existing is null)
            return (null, "not_found");

        var cleanName = name.Trim();

        if (await _repo.ExistsByNameAsync(cleanName, excludeId: id))
            return (null, "A service with this name already exists.");

        existing.ServiceName = cleanName;
        await _repo.UpdateAsync(existing);

        return (new ServiceDto(existing.ServiceId, existing.ServiceName ?? string.Empty, DateTime.UtcNow), null);
    }
}
