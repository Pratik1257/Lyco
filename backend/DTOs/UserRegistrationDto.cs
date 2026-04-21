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
    bool HasValidCard = false,
    long? UniqueNo = null
);

public record CreateUserRequest
{
    [Required]
    [MinLength(3, ErrorMessage = "Username must be at least 3 characters")]
    [MaxLength(50, ErrorMessage = "Username cannot exceed 50 characters")]
    public string Username { get; init; } = string.Empty;

    [Required]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters")]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*]).{8,100}$", 
        ErrorMessage = "Password must include at least one uppercase letter, one number, and one special character (@#$%^&*)")]
    public string? Password { get; init; }

    [Required]
    [MinLength(3, ErrorMessage = "First Name must be at least 3 characters")]
    [MaxLength(100, ErrorMessage = "First Name cannot exceed 100 characters")]
    public string? Firstname { get; init; }

    [Required]
    [MinLength(3, ErrorMessage = "Last Name must be at least 3 characters")]
    [MaxLength(100, ErrorMessage = "Last Name cannot exceed 100 characters")]
    public string? Lastname { get; init; }

    [Required]
    [MinLength(3, ErrorMessage = "Company Name must be at least 3 characters")]
    [MaxLength(200, ErrorMessage = "Company Name cannot exceed 200 characters")]
    public string? Companyname { get; init; }

    [Required]
    [EmailAddress(ErrorMessage = "Invalid email address format")]
    [MaxLength(150, ErrorMessage = "Email cannot exceed 150 characters")]
    public string? PrimaryEmail { get; init; }

    [Required]
    [MaxLength(25, ErrorMessage = "Telephone cannot exceed 25 characters")]
    public string? Telephone { get; init; }

    [Required]
    [MaxLength(100, ErrorMessage = "City cannot exceed 100 characters")]
    public string? City { get; init; }

    [Required]
    [MaxLength(100, ErrorMessage = "State cannot exceed 100 characters")]
    public string? State { get; init; }

    [MaxLength(200, ErrorMessage = "Website URL cannot exceed 200 characters")]
    public string? WebsiteUrl { get; init; }

    [Required]
    [MaxLength(255, ErrorMessage = "Address cannot exceed 255 characters")]
    public string? Address1 { get; init; }

    [MaxLength(255, ErrorMessage = "Address cannot exceed 255 characters")]
    public string? Address2 { get; init; }

    [Required]
    [MaxLength(20, ErrorMessage = "ZIP/Postcode cannot exceed 20 characters")]
    public string? Zipcode { get; init; }

    [Required]
    public long? CountryId { get; set; }

    [Required]
    [MaxLength(10, ErrorMessage = "Currency cannot exceed 10 characters")]
    public string? Currency { get; init; }

    [MaxLength(150, ErrorMessage = "Email cannot exceed 150 characters")]
    public string? AccountEmail { get; init; }

    public string? IsActive { get; init; } = "Y";
    public string? UserType { get; init; }
}

public record UpdateUserRequest
{
    [Required]
    [MinLength(3, ErrorMessage = "Username must be at least 3 characters")]
    [MaxLength(50, ErrorMessage = "Username cannot exceed 50 characters")]
    public string Username { get; init; } = string.Empty;

    [Required]
    [MinLength(3, ErrorMessage = "First Name must be at least 3 characters")]
    [MaxLength(100, ErrorMessage = "First Name cannot exceed 100 characters")]
    public string? Firstname { get; init; }

    [Required]
    [MinLength(3, ErrorMessage = "Last Name must be at least 3 characters")]
    [MaxLength(100, ErrorMessage = "Last Name cannot exceed 100 characters")]
    public string? Lastname { get; init; }

    [Required]
    [MinLength(3, ErrorMessage = "Company Name must be at least 3 characters")]
    [MaxLength(200, ErrorMessage = "Company Name cannot exceed 200 characters")]
    public string? Companyname { get; init; }

    [Required]
    [EmailAddress(ErrorMessage = "Invalid email address format")]
    [MaxLength(150, ErrorMessage = "Email cannot exceed 150 characters")]
    public string? PrimaryEmail { get; init; }

    [Required]
    [MaxLength(25, ErrorMessage = "Telephone cannot exceed 25 characters")]
    public string? Telephone { get; init; }

    [Required]
    [MaxLength(100, ErrorMessage = "City cannot exceed 100 characters")]
    public string? City { get; init; }

    [Required]
    [MaxLength(100, ErrorMessage = "State cannot exceed 100 characters")]
    public string? State { get; init; }

    [MaxLength(200, ErrorMessage = "Website URL cannot exceed 200 characters")]
    public string? WebsiteUrl { get; init; }

    [Required]
    [MaxLength(255, ErrorMessage = "Address cannot exceed 255 characters")]
    public string? Address1 { get; init; }

    [MaxLength(255, ErrorMessage = "Address cannot exceed 255 characters")]
    public string? Address2 { get; init; }

    [Required]
    [MaxLength(20, ErrorMessage = "ZIP/Postcode cannot exceed 20 characters")]
    public string? Zipcode { get; init; }

    [Required]
    public long? CountryId { get; set; }

    [Required]
    [MaxLength(10, ErrorMessage = "Currency cannot exceed 10 characters")]
    public string? Currency { get; init; }

    [MaxLength(150, ErrorMessage = "Email cannot exceed 150 characters")]
    public string? AccountEmail { get; init; }

    public string? IsActive { get; init; } = "Y";
    public string? UserType { get; init; }
}
