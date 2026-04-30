using Lyco.Api.DTOs;
using Lyco.Api.Models;
using Lyco.Api.Repositories;

namespace Lyco.Api.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _repo;
    private static readonly HashSet<int> AllowedPageSizes = [10, 20, 50, 100];

    public UserService(IUserRepository repo) => _repo = repo;

    public async Task<PagedResult<UserRegistrationDto>> GetPagedAsync(string? search, string? status, int page, int pageSize)
    {
        pageSize = AllowedPageSizes.Contains(pageSize) ? pageSize : 10;
        page = Math.Max(1, page);

        var (items, total) = await _repo.GetPagedAsync(search, status, page, pageSize);
        var totalPages = (int)Math.Ceiling((double)total / pageSize);

        var dtos = items.Select(MapToDto);

        return new PagedResult<UserRegistrationDto>(dtos, total, page, pageSize, Math.Max(1, totalPages));
    }

    public async Task<UserRegistrationDto?> GetByIdAsync(long id)
    {
        var user = await _repo.GetByIdAsync(id);
        return user != null ? MapToDto(user) : null;
    }

    public async Task<(UserRegistrationDto? Dto, string? Error)> CreateAsync(CreateUserRequest req)
    {
        if (!await _repo.IsUsernameUniqueAsync(req.Username))
            return (null, "Username is already taken.");

        if (!string.IsNullOrWhiteSpace(req.PrimaryEmail) && !await _repo.IsEmailUniqueAsync(req.PrimaryEmail))
            return (null, "Email is already registered to another user.");

        var user = new UserRegistration
        {
            Username = req.Username,
            Password = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Firstname = req.Firstname,
            Lastname = req.Lastname,
            Companyname = req.Companyname,
            PrimaryEmail = req.PrimaryEmail,
            Telephone = req.Telephone,
            City = req.City,
            State = req.State,
            WebsiteUrl = req.WebsiteUrl,
            Address1 = req.Address1,
            Address2 = req.Address2,
            Zipcode = req.Zipcode,
            CountryId = req.CountryId,
            Currency = req.Currency,
            AccountEmail = req.AccountEmail,
            IsActive = req.IsActive,
            UserType = req.UserType,
            IsSecondary = "N",
            UniqueNo = await _repo.GetNextUniqueNoAsync(),
            CreatedDate = DateTime.UtcNow
        };

        var created = await _repo.CreateAsync(user);
        return (MapToDto(created), null);
    }

    public async Task<(UserRegistrationDto? Dto, string? Error)> UpdateAsync(long id, UpdateUserRequest req)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return (null, "User not found");

        if (!await _repo.IsUsernameUniqueAsync(req.Username, id))
            return (null, "Username is already taken by another user.");

        if (!string.IsNullOrWhiteSpace(req.PrimaryEmail) && !await _repo.IsEmailUniqueAsync(req.PrimaryEmail, id))
            return (null, "Email is already registered to another user.");

        user.Username = req.Username;
        user.Firstname = req.Firstname;
        user.Lastname = req.Lastname;
        user.Companyname = req.Companyname;
        user.PrimaryEmail = req.PrimaryEmail;
        user.Telephone = req.Telephone;
        user.City = req.City;
        user.State = req.State;
        user.WebsiteUrl = req.WebsiteUrl;
        user.Address1 = req.Address1;
        user.Address2 = req.Address2;
        user.Zipcode = req.Zipcode;
        user.CountryId = req.CountryId;
        user.Currency = req.Currency;
        user.AccountEmail = req.AccountEmail;
        user.IsActive = req.IsActive;
        user.UserType = req.UserType;

        await _repo.UpdateAsync(user);

        return (MapToDto(user), null);
    }

    public async Task<UserRegistrationDto?> ToggleActiveAsync(long id)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return null;

        user.IsActive = user.IsActive == "Y" ? "N" : "Y";
        await _repo.UpdateAsync(user);

        return MapToDto(user);
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(long id)
    {
        return await _repo.DeleteAsync(id);
    }

    // Handles both "MM/YYYY" and ISO "YYYY-MM-DD" formats stored in the DB
    private static bool CardIsValid(string? expDate)
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
                var year = int.Parse(parts[1]);
                return year > now.Year || (year == now.Year && month >= now.Month);
            }
            // Format: YYYY-MM-DD (or any parseable date)
            if (DateTime.TryParse(expDate, out var dt))
            {
                return dt.Year > now.Year || (dt.Year == now.Year && dt.Month >= now.Month);
            }
            return false;
        }
        catch { return false; }
    }

    private static UserRegistrationDto MapToDto(UserRegistration user)
    {
        // Computed from card data — does NOT touch the database IsActive column
        var hasValidCard = user.CardDetails != null && user.CardDetails.Any(c => CardIsValid(c.ExpDate));

        return new UserRegistrationDto(
            user.UserId,
            user.Username,
            user.Firstname,
            user.Lastname,
            user.Companyname,
            user.PrimaryEmail,
            user.Telephone,
            user.City,
            user.State,
            user.WebsiteUrl,
            user.Address1,
            user.Address2,
            user.Zipcode,
            user.CountryId,
            user.Currency,
            user.AccountEmail,
            user.IsActive,       // ← untouched DB field
            user.UserType,
            user.CreatedDate,
            hasValidCard,        // ← new computed field from card expiry
            user.UniqueNo,
            $"{user.Firstname} {user.Lastname}".Trim()
        );
    }
}
