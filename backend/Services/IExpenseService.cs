using Lyco.Api.DTOs;

namespace Lyco.Api.Services;

public interface IExpenseService
{
    Task<object> GetPagedAsync(string? search, long? serviceId, DateTime? startDate, DateTime? endDate, int page, int pageSize);
    Task<ExpenseResponseDto?> GetByIdAsync(long id);
    Task<ExpenseResponseDto> CreateAsync(CreateExpenseDto dto);
    Task<(ExpenseResponseDto? Result, string? Error)> UpdateAsync(long id, UpdateExpenseDto dto);
    Task<string?> DeleteAsync(long id);
}
