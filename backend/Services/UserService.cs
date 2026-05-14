using Lyco.Api.DTOs;
using Lyco.Api.Models;
using Lyco.Api.Repositories;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Lyco.Api.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _repo;
    private readonly ICardDetailRepository _cardRepo;
    private readonly IConfiguration _config;
    private readonly IEmailService _email;
    private static readonly HashSet<int> AllowedPageSizes = [10, 20, 50, 100];

    public UserService(IUserRepository repo, ICardDetailRepository cardRepo,
        IConfiguration config, IEmailService email)
    {
        _repo = repo;
        _cardRepo = cardRepo;
        _config = config;
        _email = email;
    }

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

    public async Task<(LoginResponse? Response, string? Error)> LoginAsync(LoginRequest req)
    {
        var user = await _repo.GetByUsernameAsync(req.Username);
        if (user == null) return (null, "Invalid username or password.");

        if (user.IsActive != "Y") return (null, "Your account is inactive. Please contact administrator.");

        try 
        {
            if (!BCrypt.Net.BCrypt.Verify(req.Password, user.Password))
                return (null, "Invalid username or password.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Login Error] Password verification failed for {user.Username}: {ex.Message}");
            return (null, "Invalid username or password.");
        }

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured"));
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username ?? string.Empty),
                new Claim(ClaimTypes.Role, user.UserType ?? "Customer")
            }),
            Expires = DateTime.UtcNow.AddHours(24),
            Issuer = _config["Jwt:Issuer"],
            Audience = _config["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);

        var response = new LoginResponse(
            user.UserId,
            user.Username ?? string.Empty,
            $"{user.Firstname} {user.Lastname}".Trim(),
            user.UserType ?? "Customer",
            tokenHandler.WriteToken(token),
            user.UniqueNo,
            user.PrimaryEmail,
            user.Currency,
            user.Companyname
        );

        return (response, null);
    }

    public async Task<(UserRegistrationDto? Dto, string? Error)> AuthRegisterAsync(AuthRegisterRequest req)
    {
        if (!await _repo.IsUsernameUniqueAsync(req.Username))
            return (null, "Username is already taken.");

        if (!string.IsNullOrWhiteSpace(req.Email) && !await _repo.IsEmailUniqueAsync(req.Email))
            return (null, "Email is already registered to another user.");

        var user = new UserRegistration
        {
            Username = req.Username,
            Password = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Firstname = req.Firstname,
            Lastname = req.Lastname,
            Companyname = req.Companyname,
            PrimaryEmail = req.Email,
            WebsiteUrl = req.Website,
            Address1 = req.Address1,
            Address2 = req.Address2,
            City = req.City,
            State = req.State,
            CountryId = req.CountryId,
            Zipcode = req.Zipcode,
            Telephone = req.Telephone,
            Currency = req.Currency,
            IsActive = "Y",
            UserType = "Customer",
            IsSecondary = "N",
            UniqueNo = await _repo.GetNextUniqueNoAsync(),
            VerifyCode = req.Email,
            CreatedDate = DateTime.UtcNow
        };

        var created = await _repo.CreateAsync(user);

        // If card details provided, create card record
        if (!string.IsNullOrEmpty(req.CardNo))
        {
            var card = new CardDetail
            {
                UserId = created.UserId,
                CardType = req.CardType ?? "Visa",
                CardNo = req.CardNo,
                ExpDate = req.ExpDate,
                Cvv = req.Cvv,
                AsRegistered = "Y",
                FirstName = req.Firstname,
                LastName = req.Lastname,
                Address1 = req.BillingAddress1 ?? req.Address1,
                Address2 = req.BillingAddress2 ?? req.Address2,
                City = req.BillingCity ?? req.City,
                State = req.BillingState ?? req.State,
                Postcode = req.BillingZipcode ?? req.Zipcode,
                CountryId = req.BillingCountryId ?? req.CountryId,
                Currency = req.Currency,
                Comments = "Added during registration"
            };
            await _cardRepo.CreateAsync(card);
        }

        // Send welcome email (fire-and-forget)
        var emailTo = created.PrimaryEmail;
        var emailUser = created.Username;
        var emailId = created.UniqueNo ?? 0;
        Console.WriteLine($"[Registration] Sending welcome email to: '{emailTo}' for user '{emailUser}' (ID: {emailId})");
        if (string.IsNullOrWhiteSpace(emailTo))
        {
            Console.WriteLine("[Registration] WARNING: PrimaryEmail is null/empty — skipping welcome email.");
        }
        else
        {
            _ = _email.SendRegistrationWelcomeAsync(emailTo, emailUser!, emailId);
        }

        return (MapToDto(created), null);
    }

    public async Task<(bool Success, string? Code, string? Error)> SendVerificationCodeAsync(string emailAddress)
    {
        if (string.IsNullOrWhiteSpace(emailAddress)) return (false, null, "Email is required.");

        // Generate a 6-digit code and send it via Mailgun
        var code = new Random().Next(100000, 999999).ToString();
        Console.WriteLine($"[Verification] Generated code for {emailAddress}: {code}");

        // Fire-and-forget – don't block the HTTP response
        _ = _email.SendVerificationCodeAsync(emailAddress, code);

        return (true, code, null);
    }

    public async Task<(string? Email, string? Error)> ForgotPasswordAsync(string username)
    {
        Console.WriteLine($"[UserService] Looking up username: '{username}'");
        var user = await _repo.GetByUsernameAsync(username);
        
        if (user == null) 
        {
            Console.WriteLine($"[UserService] No user found for: '{username}'");
            return (null, "Invalid username. This account does not exist.");
        }

        if (string.IsNullOrWhiteSpace(user.PrimaryEmail))
        {
            Console.WriteLine($"[UserService] User '{username}' has no primary email.");
            return (null, "No email address found for this user. Please contact support.");
        }

        Console.WriteLine($"[UserService] Found user: {user.Username}, Email: {user.PrimaryEmail}");

        // For now, using a simple timestamp-based token for parity with frontend expectation
        var token = Guid.NewGuid().ToString("N");
        var baseUrl = "http://localhost:5173"; // Should ideally come from config
        var resetUrl = $"{baseUrl}/reset-password?username={user.Username}&token={token}";

        // Send reset email (fire-and-forget)
        _ = _email.SendPasswordResetLinkAsync(user.PrimaryEmail, user.Username!, resetUrl);

        return (user.PrimaryEmail, null);
    }

    public async Task<(bool Success, string? Error)> ResetPasswordAsync(ResetPasswordRequest req)
    {
        var user = await _repo.GetByUsernameAsync(req.Username);
        if (user == null) return (false, "User not found.");

        if (BCrypt.Net.BCrypt.Verify(req.NewPassword, user.Password))
            return (false, "New password cannot be the same as your current password.");

        user.Password = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await _repo.UpdateAsync(user);

        // Notify the user that their password was changed (fire-and-forget)
        if (!string.IsNullOrWhiteSpace(user.PrimaryEmail))
            _ = _email.SendPasswordResetAsync(user.PrimaryEmail, user.Firstname ?? user.Username ?? "", "[set by user]");

        return (true, null);
    }

    public async Task<bool> UsernameExistsAsync(string username)
    {
        return !await _repo.IsUsernameUniqueAsync(username);
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return !await _repo.IsEmailUniqueAsync(email);
    }

    public async Task<bool> CardExistsAsync(string cardNo)
    {
        return !await _cardRepo.IsCardNoUniqueAsync(cardNo);
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
