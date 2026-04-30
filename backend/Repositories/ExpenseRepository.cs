using Lyco.Api.Data;
using Lyco.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Lyco.Api.Repositories;

public class ExpenseRepository : IExpenseRepository
{
    private readonly LycoDbContext _db;

    public ExpenseRepository(LycoDbContext db) => _db = db;

    public async Task<(IEnumerable<ExpenseMst> Items, int TotalCount, decimal TotalAmount)> GetPagedAsync(
        string? search, long? serviceId, DateTime? startDate, DateTime? endDate, int page, int pageSize)
    {
        var query = _db.ExpenseMsts
            .Include(e => e.Service)
            .AsQueryable();

        // Filter by service
        if (serviceId.HasValue && serviceId.Value > 0)
        {
            query = query.Where(e => e.ServiceId == serviceId.Value);
        }

        // Filter by date range
        if (startDate.HasValue)
        {
            query = query.Where(e => e.ExpenseDate >= startDate.Value);
        }
        if (endDate.HasValue)
        {
            // Set to end of day
            var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(e => e.ExpenseDate <= endOfDay);
        }

        // Search across title and service name
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(e =>
                (e.Title != null && e.Title.ToLower().Contains(term)) ||
                (e.Service != null && e.Service.ServiceName != null &&
                 e.Service.ServiceName.ToLower().Contains(term)) ||
                (e.Notes != null && e.Notes.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync();
        var totalAmount = await query.SumAsync(e => e.Amount ?? 0);

        var items = await query
            .OrderByDescending(e => e.ExpenseDate)
            .ThenByDescending(e => e.ExpenseId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount, totalAmount);
    }

    public async Task<ExpenseMst?> GetByIdAsync(long id)
    {
        return await _db.ExpenseMsts
            .Include(e => e.Service)
            .FirstOrDefaultAsync(e => e.ExpenseId == id);
    }

    public async Task<ExpenseMst> CreateAsync(ExpenseMst expense)
    {
        expense.CreatedDate = DateTime.Now;
        _db.ExpenseMsts.Add(expense);
        await _db.SaveChangesAsync();

        // Reload with navigation
        return (await GetByIdAsync(expense.ExpenseId))!;
    }

    public async Task<ExpenseMst?> UpdateAsync(ExpenseMst expense)
    {
        var existing = await _db.ExpenseMsts.FindAsync(expense.ExpenseId);
        if (existing == null) return null;

        existing.ServiceId = expense.ServiceId;
        existing.Title = expense.Title;
        existing.Amount = expense.Amount;
        existing.Currency = expense.Currency;
        existing.ExpenseDate = expense.ExpenseDate;
        existing.Notes = expense.Notes;

        await _db.SaveChangesAsync();

        // Reload with navigation
        return (await GetByIdAsync(existing.ExpenseId))!;
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var entity = await _db.ExpenseMsts.FindAsync(id);
        if (entity == null) return false;

        _db.ExpenseMsts.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }
}
