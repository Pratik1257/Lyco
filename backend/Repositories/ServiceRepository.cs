using Microsoft.EntityFrameworkCore;
using Lyco.Api.Data;
using Lyco.Api.Models;

namespace Lyco.Api.Repositories;

public class ServiceRepository : IServiceRepository
{
    private readonly LycoDbContext _db;

    public ServiceRepository(LycoDbContext db) => _db = db;

    public async Task<(IEnumerable<ServiceMst> Items, int Total)> GetPagedAsync(
        string? search, int page, int pageSize)
    {
        var query = _db.ServiceMsts
            .Where(s => s.ServiceName != null && s.ServiceName != "")
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s => s.ServiceName!.Contains(search));

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(s => s.ServiceName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }

    public Task<ServiceMst?> GetByIdAsync(long id) =>
        _db.ServiceMsts.FirstOrDefaultAsync(s => s.ServiceId == id);

    public Task<bool> ExistsByNameAsync(string name, long? excludeId) =>
        _db.ServiceMsts.AnyAsync(s =>
            s.ServiceName != null && s.ServiceName.ToLower() == name.ToLower() &&
            (excludeId == null || s.ServiceId != excludeId));

    public async Task<ServiceMst> CreateAsync(string name)
    {
        var service = new ServiceMst { ServiceName = name };
        _db.ServiceMsts.Add(service);
        await _db.SaveChangesAsync();
        return service;
    }

    public async Task UpdateAsync(ServiceMst service)
    {
        _db.ServiceMsts.Update(service);
        await _db.SaveChangesAsync();
    }

    public async Task<bool> HasOrdersAsync(long serviceId) =>
        await _db.OrderDetails.AnyAsync(od => od.ServiceId == serviceId && od.OrderNo != null && od.OrderNo != "");

    public async Task DeleteAsync(long id)
    {
        var entity = await _db.ServiceMsts
            .Include(s => s.PriceMsts)
            .Include(s => s.UserPriceMsts)
            .Include(s => s.PromotionMsts)
            .Include(s => s.Quotes)
            .FirstOrDefaultAsync(s => s.ServiceId == id);

        if (entity != null)
        {
            _db.PriceMsts.RemoveRange(entity.PriceMsts);
            _db.UserPriceMsts.RemoveRange(entity.UserPriceMsts);
            _db.PromotionMsts.RemoveRange(entity.PromotionMsts);
            _db.Quotes.RemoveRange(entity.Quotes);
            _db.ServiceMsts.Remove(entity);
            await _db.SaveChangesAsync();
        }
    }
}
