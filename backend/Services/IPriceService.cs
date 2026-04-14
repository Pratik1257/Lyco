using Lyco.Api.DTOs;

namespace Lyco.Api.Services;

public interface IPriceService
{
    // General
    Task<PagedResult<GeneralPriceDto>> GetGeneralPagedAsync(string? search, int page, int pageSize);
    Task<(GeneralPriceDto? Dto, string? Error)> CreateGeneralAsync(CreateGeneralPriceRequest req);
    Task<(GeneralPriceDto? Dto, string? Error)> UpdateGeneralAsync(long id, UpdateGeneralPriceRequest req);

    // Userwise
    Task<PagedResult<UserwisePriceDto>> GetUserwisePagedAsync(string? search, int page, int pageSize);
    Task<(UserwisePriceDto? Dto, string? Error)> CreateUserwiseAsync(CreateUserwisePriceRequest req);
    Task<(UserwisePriceDto? Dto, string? Error)> UpdateUserwiseAsync(long id, UpdateUserwisePriceRequest req);

    // Users for dropdown
    Task<IEnumerable<UserDto>> GetUsersAsync();
}
