using Lyco.Api.Data;
using Lyco.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Lyco.Api.Repositories;

public class CardDetailRepository : ICardDetailRepository
{
    private readonly LycoDbContext _context;

    public CardDetailRepository(LycoDbContext context) => _context = context;

    public async Task<(IEnumerable<CardDetail> Items, int TotalCount)> GetPagedAsync(string? search, int page, int pageSize)
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

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CardId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

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
}
