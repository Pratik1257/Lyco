using Lyco.Api.DTOs;

namespace Lyco.Api.Services;

public interface IUserService
{
    Task<PagedResult<UserRegistrationDto>> GetPagedAsync(string? search, string? status, int page, int pageSize);
    Task<UserRegistrationDto?> GetByIdAsync(long id);
    Task<(UserRegistrationDto? Dto, string? Error)> CreateAsync(CreateUserRequest req);
    Task<(UserRegistrationDto? Dto, string? Error)> UpdateAsync(long id, UpdateUserRequest req);
    Task<UserRegistrationDto?> ToggleActiveAsync(long id);
    Task<(bool Success, string? Error)> DeleteAsync(long id);
    Task<(LoginResponse? Response, string? Error)> LoginAsync(LoginRequest req);
    Task<(UserRegistrationDto? Dto, string? Error)> AuthRegisterAsync(AuthRegisterRequest req);
    Task<(string? Email, string? Error)> ForgotPasswordAsync(string username);
    Task<(bool Success, string? Error)> ResetPasswordAsync(ResetPasswordRequest req);
}
