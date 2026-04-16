using Lyco.Api.Data;
using Lyco.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Lyco.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly LycoDbContext _context;

    public UserRepository(LycoDbContext context) => _context = context;

    public async Task<(IEnumerable<UserRegistration> Items, int TotalCount)> GetPagedAsync(string? search, int page, int pageSize)
    {
        var query = _context.UserRegistrations.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(u =>
                (u.Username != null && u.Username.ToLower().Contains(s)) ||
                (u.Firstname != null && u.Firstname.ToLower().Contains(s)) ||
                (u.Lastname != null && u.Lastname.ToLower().Contains(s)) ||
                (u.PrimaryEmail != null && u.PrimaryEmail.ToLower().Contains(s)));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(u => u.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

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
}
