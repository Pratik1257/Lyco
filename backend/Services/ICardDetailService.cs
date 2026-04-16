using Lyco.Api.DTOs;

namespace Lyco.Api.Services;

public interface ICardDetailService
{
    Task<PagedResult<CardDetailDto>> GetPagedAsync(string? search, int page, int pageSize);
    Task<CardDetailDto?> GetByIdAsync(long id);
    Task<(CardDetailDto? Dto, string? Error)> CreateAsync(CreateCardRequest req);
    Task<(CardDetailDto? Dto, string? Error)> UpdateAsync(long id, UpdateCardRequest req);
    Task<bool> DeleteAsync(long id);
}
