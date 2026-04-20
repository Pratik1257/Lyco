using Lyco.Api.DTOs;
using Lyco.Api.Models;
using Lyco.Api.Repositories;

namespace Lyco.Api.Services;

public class ExpenseService : IExpenseService
{
    private readonly IExpenseRepository _repo;

    public ExpenseService(IExpenseRepository repo) => _repo = repo;

    public async Task<object> GetPagedAsync(string? search, long? serviceId, int page, int pageSize)
    {
        var (items, totalCount) = await _repo.GetPagedAsync(search, serviceId, page, pageSize);

        var dtos = items.Select(e => MapToDto(e)).ToList();

        return new
        {
            items = dtos,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };
    }

    public async Task<ExpenseResponseDto?> GetByIdAsync(long id)
    {
        var entity = await _repo.GetByIdAsync(id);
        return entity == null ? null : MapToDto(entity);
    }

    public async Task<ExpenseResponseDto> CreateAsync(CreateExpenseDto dto)
    {
        var entity = new ExpenseMst
        {
            ServiceId = dto.ServiceId,
            Title = dto.Title,
            Amount = dto.Amount,
            Currency = dto.Currency,
            ExpenseDate = dto.ExpenseDate,
            Notes = dto.Notes
        };

        var created = await _repo.CreateAsync(entity);
        return MapToDto(created);
    }

    public async Task<(ExpenseResponseDto? Result, string? Error)> UpdateAsync(long id, UpdateExpenseDto dto)
    {
        var entity = new ExpenseMst
        {
            ExpenseId = id,
            ServiceId = dto.ServiceId,
            Title = dto.Title,
            Amount = dto.Amount,
            Currency = dto.Currency,
            ExpenseDate = dto.ExpenseDate,
            Notes = dto.Notes
        };

        var updated = await _repo.UpdateAsync(entity);
        if (updated == null)
            return (null, "not_found");

        return (MapToDto(updated), null);
    }

    public async Task<string?> DeleteAsync(long id)
    {
        var success = await _repo.DeleteAsync(id);
        return success ? null : "Expense not found.";
    }

    private static ExpenseResponseDto MapToDto(ExpenseMst e) => new()
    {
        ExpenseId = e.ExpenseId,
        ServiceId = e.ServiceId,
        ServiceName = e.Service?.ServiceName,
        Title = e.Title,
        Amount = e.Amount,
        Currency = e.Currency,
        ExpenseDate = e.ExpenseDate,
        Notes = e.Notes,
        CreatedDate = e.CreatedDate
    };
}
