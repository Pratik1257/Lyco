using Lyco.Api.DTOs;

namespace Lyco.Api.Services;

public interface IUserService
{
    Task<PagedResult<UserRegistrationDto>> GetPagedAsync(string? search, int page, int pageSize);
    Task<UserRegistrationDto?> GetByIdAsync(long id);
    Task<(UserRegistrationDto? Dto, string? Error)> CreateAsync(CreateUserRequest req);
    Task<(UserRegistrationDto? Dto, string? Error)> UpdateAsync(long id, UpdateUserRequest req);
    Task<bool> DeleteAsync(long id);
}
