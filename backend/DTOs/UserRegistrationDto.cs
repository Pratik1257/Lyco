using System.ComponentModel.DataAnnotations;

namespace Lyco.Api.DTOs;

public record UserRegistrationDto(
    long UserId,
    string? Username,
    string? Firstname,
    string? Lastname,
    string? Companyname,
    string? PrimaryEmail,
    string? Telephone,
    string? City,
    string? State,
    string? WebsiteUrl,
    string? Address1,
    string? Address2,
    string? Zipcode,
    long? CountryId,
    string? Currency,
    string? AccountEmail,
    string? IsActive,
    string? UserType,
    DateTime? CreatedDate,
    bool HasValidCard = false
);

public record CreateUserRequest
{
    [Required]
    public string Username { get; init; } = string.Empty;
    public string? Password { get; init; }
    public string? Firstname { get; init; }
    public string? Lastname { get; init; }
    public string? Companyname { get; init; }
    public string? PrimaryEmail { get; init; }
    public string? Telephone { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? WebsiteUrl { get; init; }
    public string? Address1 { get; init; }
    public string? Address2 { get; init; }
    public string? Zipcode { get; init; }
    public long? CountryId { get; set; }
    public string? Currency { get; init; }
    public string? AccountEmail { get; init; }
    public string? IsActive { get; init; } = "Y";
    public string? UserType { get; init; }
}

public record UpdateUserRequest
{
    [Required]
    public string Username { get; init; } = string.Empty;
    public string? Firstname { get; init; }
    public string? Lastname { get; init; }
    public string? Companyname { get; init; }
    public string? PrimaryEmail { get; init; }
    public string? Telephone { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? WebsiteUrl { get; init; }
    public string? Address1 { get; init; }
    public string? Address2 { get; init; }
    public string? Zipcode { get; init; }
    public long? CountryId { get; set; }
    public string? Currency { get; init; }
    public string? AccountEmail { get; init; }
    public string? IsActive { get; init; } = "Y";
    public string? UserType { get; init; }
}
