using Lyco.Api.DTOs;
using Lyco.Api.Models;
using Lyco.Api.Repositories;

namespace Lyco.Api.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _repo;
    private static readonly HashSet<int> AllowedPageSizes = [10, 20, 50, 100];

    public UserService(IUserRepository repo) => _repo = repo;

    public async Task<PagedResult<UserRegistrationDto>> GetPagedAsync(string? search, int page, int pageSize)
    {
        pageSize = AllowedPageSizes.Contains(pageSize) ? pageSize : 10;
        page = Math.Max(1, page);

        var (items, total) = await _repo.GetPagedAsync(search, page, pageSize);
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
        // Example basic validation, can be extended
        var user = new UserRegistration
        {
            Username = req.Username,
            Password = req.Password, // Ensure hashing in a real scenario
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
            CreatedDate = DateTime.UtcNow
        };

        var created = await _repo.CreateAsync(user);
        return (MapToDto(created), null);
    }

    public async Task<(UserRegistrationDto? Dto, string? Error)> UpdateAsync(long id, UpdateUserRequest req)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return (null, "User not found");

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

    public async Task<bool> DeleteAsync(long id)
    {
        if (!await _repo.ExistsAsync(id)) return false;
        await _repo.DeleteAsync(id);
        return true;
    }

    private static UserRegistrationDto MapToDto(UserRegistration user) =>
        new UserRegistrationDto(
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
            user.IsActive,
            user.UserType,
            user.CreatedDate
        );
}
