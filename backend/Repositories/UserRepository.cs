using Lyco.Api.Data;
using Lyco.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Lyco.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly LycoDbContext _context;

    public UserRepository(LycoDbContext context) => _context = context;

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

    public async Task<(IEnumerable<UserRegistration> Items, int TotalCount)> GetPagedAsync(string? search, string? status, int page, int pageSize)
    {
        // Step 1: Apply text search in SQL and include card details
        var query = _context.UserRegistrations
            .Include(u => u.CardDetails)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(u =>
                (u.Firstname != null && u.Firstname.ToLower().Contains(s)) ||
                (u.Lastname != null && u.Lastname.ToLower().Contains(s)) ||
                (u.Companyname != null && u.Companyname.ToLower().Contains(s)));
        }

        // Step 2: Load all matching users with their cards into memory
        var allItems = await query
            .OrderByDescending(u => u.CreatedDate)
            .ToListAsync();

        // Step 3: Apply card-based status filter client-side
        if (!string.IsNullOrWhiteSpace(status) && status != "all")
        {
            allItems = status == "active"
                ? allItems.Where(u => u.CardDetails.Any(c => IsCardValid(c.ExpDate))).ToList()
                : allItems.Where(u => !u.CardDetails.Any(c => IsCardValid(c.ExpDate))).ToList();
        }

        // Step 4: Apply pagination
        var total = allItems.Count;
        var items = allItems.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return (items, total);
    }

    public Task<UserRegistration?> GetByIdAsync(long id) =>
        _context.UserRegistrations.FirstOrDefaultAsync(u => u.UserId == id);

    public async Task<UserRegistration> CreateAsync(UserRegistration user)
    {
        _context.UserRegistrations.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task UpdateAsync(UserRegistration user)
    {
        _context.UserRegistrations.Update(user);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(long id)
    {
        var user = await _context.UserRegistrations.FindAsync(id);
        if (user != null)
        {
            _context.UserRegistrations.Remove(user);
            await _context.SaveChangesAsync();
        }
    }

    public Task<bool> ExistsAsync(long id) =>
        _context.UserRegistrations.AnyAsync(u => u.UserId == id);

    public async Task<long> GetNextUniqueNoAsync()
    {
        var max = await _context.UserRegistrations.MaxAsync(u => (long?)u.UniqueNo) ?? 99;
        return Math.Max(100, max + 1);
    }
}
