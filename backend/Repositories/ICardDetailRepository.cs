using Lyco.Api.Models;

namespace Lyco.Api.Repositories;

public interface ICardDetailRepository
{
    Task<(IEnumerable<CardDetail> Items, int TotalCount)> GetPagedAsync(string? search, int page, int pageSize);
    Task<CardDetail?> GetByIdAsync(long id);
    Task<CardDetail> CreateAsync(CardDetail card);
    Task UpdateAsync(CardDetail card);
    Task DeleteAsync(long id);
    Task<bool> ExistsAsync(long id);
}
