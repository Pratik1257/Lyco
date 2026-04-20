using Lyco.Api.Models;

namespace Lyco.Api.Repositories;

public interface IExpenseRepository
{
    Task<(IEnumerable<ExpenseMst> Items, int TotalCount)> GetPagedAsync(
        string? search, long? serviceId, int page, int pageSize);
    Task<ExpenseMst?> GetByIdAsync(long id);
    Task<ExpenseMst> CreateAsync(ExpenseMst expense);
    Task<ExpenseMst?> UpdateAsync(ExpenseMst expense);
    Task<bool> DeleteAsync(long id);
}
