using Lyco.Api.DTOs;
using Lyco.Api.Repositories;

namespace Lyco.Api.Services;

public class PriceService : IPriceService
{
    private readonly IPriceRepository _repo;
    private static readonly HashSet<int> AllowedPageSizes = [10, 20, 50];

    public PriceService(IPriceRepository repo) => _repo = repo;

    // ── General Prices ────────────────────────────────────────────────────────

    public async Task<PagedResult<GeneralPriceDto>> GetGeneralPagedAsync(string? search, int page, int pageSize)
    {
        pageSize = AllowedPageSizes.Contains(pageSize) ? pageSize : 10;
        page = Math.Max(1, page);

        var (items, total) = await _repo.GetGeneralPagedAsync(search, page, pageSize);
        var totalPages = (int)Math.Ceiling((double)total / pageSize);

        var dtos = items.Select(p => new GeneralPriceDto(
            p.PriceId,
            p.ServiceId ?? 0,
            p.Service?.ServiceName ?? "Unknown",
            p.Currency ?? "",
            decimal.TryParse(p.Price, out var price) ? price : 0m
        ));

        return new PagedResult<GeneralPriceDto>(dtos, total, page, pageSize, Math.Max(1, totalPages));
    }

    public async Task<(GeneralPriceDto? Dto, string? Error)> CreateGeneralAsync(CreateGeneralPriceRequest req)
    {
        var entity = await _repo.CreateGeneralAsync(req.ServiceId, req.Currency, req.Price);
        var dto = new GeneralPriceDto(
            entity.PriceId,
            entity.ServiceId ?? 0,
            entity.Service?.ServiceName ?? "Unknown",
            entity.Currency ?? "",
            decimal.TryParse(entity.Price, out var p) ? p : 0m
        );
        return (dto, null);
    }

    public async Task<(GeneralPriceDto? Dto, string? Error)> UpdateGeneralAsync(long id, UpdateGeneralPriceRequest req)
    {
        var entity = await _repo.GetGeneralByIdAsync(id);
        if (entity is null) return (null, "not_found");

        entity.ServiceId = req.ServiceId;
        entity.Currency = req.Currency;
        entity.Price = req.Price.ToString("F2");

        await _repo.UpdateGeneralAsync(entity);

        var dto = new GeneralPriceDto(
            entity.PriceId,
            entity.ServiceId ?? 0,
            entity.Service?.ServiceName ?? "Unknown",
            entity.Currency ?? "",
            req.Price
        );
        return (dto, null);
    }

    // ── Userwise Prices ───────────────────────────────────────────────────────

    public async Task<PagedResult<UserwisePriceDto>> GetUserwisePagedAsync(string? search, int page, int pageSize)
    {
        pageSize = AllowedPageSizes.Contains(pageSize) ? pageSize : 10;
        page = Math.Max(1, page);

        var (items, total) = await _repo.GetUserwisePagedAsync(search, page, pageSize);
        var totalPages = (int)Math.Ceiling((double)total / pageSize);

        var dtos = items.Select(p => new UserwisePriceDto(
            p.UserPriceId,
            p.UserId ?? 0,
            p.User?.Username ?? "Unknown",
            p.ServiceId ?? 0,
            p.Service?.ServiceName ?? "Unknown",
            p.Currency ?? "",
            decimal.TryParse(p.Price, out var price) ? price : 0m
        ));

        return new PagedResult<UserwisePriceDto>(dtos, total, page, pageSize, Math.Max(1, totalPages));
    }

    public async Task<(UserwisePriceDto? Dto, string? Error)> CreateUserwiseAsync(CreateUserwisePriceRequest req)
    {
        var entity = await _repo.CreateUserwiseAsync(req.UserId, req.ServiceId, req.Currency, req.Price);
        var dto = new UserwisePriceDto(
            entity.UserPriceId,
            entity.UserId ?? 0,
            entity.User?.Username ?? "Unknown",
            entity.ServiceId ?? 0,
            entity.Service?.ServiceName ?? "Unknown",
            entity.Currency ?? "",
            decimal.TryParse(entity.Price, out var p) ? p : 0m
        );
        return (dto, null);
    }

    public async Task<(UserwisePriceDto? Dto, string? Error)> UpdateUserwiseAsync(long id, UpdateUserwisePriceRequest req)
    {
        var entity = await _repo.GetUserwiseByIdAsync(id);
        if (entity is null) return (null, "not_found");

        entity.UserId = req.UserId;
        entity.ServiceId = req.ServiceId;
        entity.Currency = req.Currency;
        entity.Price = req.Price.ToString("F2");

        await _repo.UpdateUserwiseAsync(entity);

        var dto = new UserwisePriceDto(
            entity.UserPriceId,
            entity.UserId ?? 0,
            entity.User?.Username ?? "Unknown",
            entity.ServiceId ?? 0,
            entity.Service?.ServiceName ?? "Unknown",
            entity.Currency ?? "",
            req.Price
        );
        return (dto, null);
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    public async Task<IEnumerable<UserDto>> GetUsersAsync()
    {
        var users = await _repo.GetAllUsersAsync();
        return users.Select(u => new UserDto(u.UserId, u.Username ?? ""));
    }
}
