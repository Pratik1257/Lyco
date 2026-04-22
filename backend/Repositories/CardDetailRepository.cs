using Lyco.Api.Data;
using Lyco.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Lyco.Api.Repositories;

public class CardDetailRepository : ICardDetailRepository
{
    private readonly LycoDbContext _context;

    public CardDetailRepository(LycoDbContext context) => _context = context;

    // Handles both "MM/YYYY" and ISO "YYYY-MM-DD" formats stored in the DB
    private static bool IsCardValid(string? expDate)
    {
        if (string.IsNullOrEmpty(expDate)) return false;
        try
        {
            var now = DateTime.UtcNow;
            // Format: MM/YYYY
            if (expDate.Contains('/') && expDate.Length >= 7)
            {
                var parts = expDate.Split('/');
                if (parts.Length != 2) return false;
                var month = int.Parse(parts[0]);
                var year = parts[1].Length == 4 ? int.Parse(parts[1]) : int.Parse(parts[1]);
                return year > now.Year || (year == now.Year && month >= now.Month);
            }
            // Format: YYYY-MM-DD
            if (DateTime.TryParse(expDate, out var dt))
            {
                return dt.Year > now.Year || (dt.Year == now.Year && dt.Month >= now.Month);
            }
            return false;
        }
        catch { return false; }
    }

    public async Task<(IEnumerable<CardDetail> Items, int TotalCount)> GetPagedAsync(string? search, string? status, int page, int pageSize)
    {
        var query = _context.CardDetails
            .Include(c => c.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(c =>
                (c.FirstName != null && c.FirstName.ToLower().Contains(s)) ||
                (c.LastName != null && c.LastName.ToLower().Contains(s)) ||
                (c.User != null && c.User.Companyname != null && c.User.Companyname.ToLower().Contains(s)));
        }

        var allItems = await query
            .OrderByDescending(c => c.CardId)
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(status) && status != "all")
        {
            allItems = status == "active"
                ? allItems.Where(c => IsCardValid(c.ExpDate)).ToList()
                : allItems.Where(c => !IsCardValid(c.ExpDate)).ToList();
        }

        var total = allItems.Count;
        var items = allItems.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return (items, total);
    }

    public Task<CardDetail?> GetByIdAsync(long id) =>
        _context.CardDetails
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.CardId == id);

    public async Task<CardDetail> CreateAsync(CardDetail card)
    {
        _context.CardDetails.Add(card);
        await _context.SaveChangesAsync();
        return card;
    }

    public async Task UpdateAsync(CardDetail card)
    {
        _context.CardDetails.Update(card);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(long id)
    {
        var card = await _context.CardDetails.FindAsync(id);
        if (card != null)
        {
            _context.CardDetails.Remove(card);
            await _context.SaveChangesAsync();
        }
    }

    public Task<bool> ExistsAsync(long id) =>
        _context.CardDetails.AnyAsync(c => c.CardId == id);

    public Task<bool> ExistsForUserAsync(long userId) =>
        _context.CardDetails.AnyAsync(c => c.UserId == userId);
}
