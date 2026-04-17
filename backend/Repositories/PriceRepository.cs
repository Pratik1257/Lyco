using Microsoft.EntityFrameworkCore;
using Lyco.Api.Data;
using Lyco.Api.Models;

namespace Lyco.Api.Repositories;

public class PriceRepository : IPriceRepository
{
    private readonly LycoDbContext _db;

    public PriceRepository(LycoDbContext db) => _db = db;

    // ── General Prices ────────────────────────────────────────────────────────

    public async Task<(IEnumerable<PriceMst> Items, int Total)> GetGeneralPagedAsync(
        string? search, int page, int pageSize)
    {
        var query = _db.PriceMsts
            .Include(p => p.Service)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p =>
                (p.Service != null && p.Service.ServiceName != null && p.Service.ServiceName.Contains(search)) ||
                (p.Currency != null && p.Currency.Contains(search)));

        // 1. Get total number of distinct services matching the query
        var total = await query
            .Select(p => p.ServiceId)
            .Distinct()
            .CountAsync();

        // 2. Get the paginated list of ServiceIds
        var paginatedServiceIds = await query
            .Select(p => new { p.ServiceId, p.Service!.ServiceName })
            .Distinct()
            .OrderBy(x => x.ServiceName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => x.ServiceId)
            .ToListAsync();

        // 3. Fetch all price records for these services
        var items = await query
            .Where(p => paginatedServiceIds.Contains(p.ServiceId))
            .OrderBy(p => p.Service!.ServiceName)
            .ToListAsync();

        return (items, total);
    }

    public async Task<PriceMst?> GetGeneralByIdAsync(long id) =>
        await _db.PriceMsts.Include(p => p.Service).FirstOrDefaultAsync(p => p.PriceId == id);

    public async Task<decimal?> GetGeneralPriceValueAsync(long serviceId, string currency)
    {
        var priceStr = await _db.PriceMsts
            .Where(p => p.ServiceId == serviceId && p.Currency == currency)
            .Select(p => p.Price)
            .FirstOrDefaultAsync();

        if (priceStr == null) return null;
        return decimal.TryParse(priceStr, out var p) ? p : null;
    }

    public async Task<bool> GeneralPriceExistsAsync(long serviceId, string currency, long? excludeId = null)
    {
        var query = _db.PriceMsts.Where(p => p.ServiceId == serviceId && p.Currency == currency);
        if (excludeId.HasValue)
        {
            query = query.Where(p => p.PriceId != excludeId.Value);
        }
        return await query.AnyAsync();
    }

    public async Task<PriceMst> CreateGeneralAsync(long serviceId, string currency, decimal price)
    {
        var entity = new PriceMst
        {
            ServiceId = serviceId,
            Currency = currency,
            Price = price.ToString("F2"),
            Show = "Y"
        };
        _db.PriceMsts.Add(entity);
        await _db.SaveChangesAsync();
        // reload with navigation
        await _db.Entry(entity).Reference(p => p.Service).LoadAsync();
        return entity;
    }

    public async Task UpdateGeneralAsync(PriceMst price)
    {
        _db.PriceMsts.Update(price);
        await _db.SaveChangesAsync();
    }

    // ── Userwise Prices ───────────────────────────────────────────────────────

    public async Task<(IEnumerable<UserPriceMst> Items, int Total)> GetUserwisePagedAsync(
        string? search, int page, int pageSize)
    {
        var query = _db.UserPriceMsts
            .Include(p => p.Service)
            .Include(p => p.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p =>
                (p.User != null && p.User.Username != null && p.User.Username.Contains(search)) ||
                (p.Service != null && p.Service.ServiceName != null && p.Service.ServiceName.Contains(search)) ||
                (p.Currency != null && p.Currency.Contains(search)));

        // 1. Get total number of distinct (User, Service) pairs
        var total = await query
            .Select(p => new { p.UserId, p.ServiceId })
            .Distinct()
            .CountAsync();

        // 2. Get the paginated list of pairs
        var paginatedPairs = await query
            .Select(p => new { p.UserId, p.User!.Username, p.ServiceId, p.Service!.ServiceName })
            .Distinct()
            .OrderBy(p => p.Username)
            .ThenBy(p => p.ServiceName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // 3. Fetch all price records for these pairs
        // We'll use a combination approach to match the pairs efficiently
        var items = new List<UserPriceMst>();
        foreach (var pair in paginatedPairs)
        {
            var pairItems = await query
                .Where(p => p.UserId == pair.UserId && p.ServiceId == pair.ServiceId)
                .ToListAsync();
            items.AddRange(pairItems);
        }

        return (items, total);
    }

    public async Task<UserPriceMst?> GetUserwiseByIdAsync(long id) =>
        await _db.UserPriceMsts
            .Include(p => p.User)
            .Include(p => p.Service)
            .FirstOrDefaultAsync(p => p.UserPriceId == id);

    public async Task<bool> UserwisePriceExistsAsync(long userId, long serviceId, string currency, long? excludeId = null)
    {
        var query = _db.UserPriceMsts.Where(p => p.UserId == userId && p.ServiceId == serviceId && p.Currency == currency);
        if (excludeId.HasValue)
        {
            query = query.Where(p => p.UserPriceId != excludeId.Value);
        }
        return await query.AnyAsync();
    }

    public async Task<UserPriceMst> CreateUserwiseAsync(long userId, long serviceId, string currency, decimal price)
    {
        var entity = new UserPriceMst
        {
            UserId = userId,
            ServiceId = serviceId,
            Currency = currency,
            Price = price.ToString("F2"),
            IsActive = "Y"
        };
        _db.UserPriceMsts.Add(entity);
        await _db.SaveChangesAsync();
        await _db.Entry(entity).Reference(p => p.Service).LoadAsync();
        await _db.Entry(entity).Reference(p => p.User).LoadAsync();
        return entity;
    }

    public async Task UpdateUserwiseAsync(UserPriceMst price)
    {
        _db.UserPriceMsts.Update(price);
        await _db.SaveChangesAsync();
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    public async Task<IEnumerable<UserRegistration>> GetAllUsersAsync() =>
        await _db.UserRegistrations
            .Where(u => u.Username != null && u.Username != "")
            .OrderBy(u => u.Username)
            .ToListAsync();

    // ── Group Management ──────────────────────────────────────────────────────

    // ── Deletion ─────────────────────────────────────────────────────────────

    public async Task DeleteGeneralPriceAsync(long id)
    {
        var entity = await _db.PriceMsts.FindAsync(id);
        if (entity != null)
        {
            _db.PriceMsts.Remove(entity);
            await _db.SaveChangesAsync();
        }
    }

    public async Task DeleteUserwisePriceAsync(long id)
    {
        var entity = await _db.UserPriceMsts.FindAsync(id);
        if (entity != null)
        {
            _db.UserPriceMsts.Remove(entity);
            await _db.SaveChangesAsync();
        }
    }

    public async Task<bool> AnyServiceOrdersAsync(long serviceId) =>
        await _db.OrderDetails.AnyAsync(od => od.ServiceId == serviceId && od.OrderNo != null && od.OrderNo != "");

    public async Task DeleteGeneralGroupAsync(long serviceId)
    {
        var prices = await _db.PriceMsts.Where(p => p.ServiceId == serviceId).ToListAsync();
        _db.PriceMsts.RemoveRange(prices);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteUserwiseGroupAsync(long userId, long serviceId)
    {
        var prices = await _db.UserPriceMsts.Where(p => p.UserId == userId && p.ServiceId == serviceId).ToListAsync();
        _db.UserPriceMsts.RemoveRange(prices);
        await _db.SaveChangesAsync();
    }
}
