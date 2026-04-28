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
    [RegularExpression(@"^(?!.*__)[a-zA-Z0-9][a-zA-Z0-9._]*$", ErrorMessage = "Username must start with a letter or number, and cannot contain spaces or double underscores")]
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
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters are allowed")]
    public string? Firstname { get; init; }

    [Required]
    [MinLength(3, ErrorMessage = "Last Name must be at least 3 characters")]
    [MaxLength(100, ErrorMessage = "Last Name cannot exceed 100 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters are allowed")]
    public string? Lastname { get; init; }

    [Required]
    [MinLength(3, ErrorMessage = "Company Name must be at least 3 characters")]
    [MaxLength(200, ErrorMessage = "Company Name cannot exceed 200 characters")]
    [RegularExpression(@"^[a-zA-Z0-9\s&.,'-]*$", ErrorMessage = "Invalid characters in company name")]
    public string? Companyname { get; init; }

    [Required(ErrorMessage = "Please enter email")]
    [EmailAddress(ErrorMessage = "Invalid email address format")]
    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", ErrorMessage = "Invalid email address format")]
    [MaxLength(150, ErrorMessage = "Email cannot exceed 150 characters")]
    public string? PrimaryEmail { get; init; }

    [Required]
    [MaxLength(25, ErrorMessage = "Telephone cannot exceed 25 characters")]
    public string? Telephone { get; init; }

    [Required(ErrorMessage = "Please enter City")]
    [MinLength(2, ErrorMessage = "Too short")]
    [MaxLength(100, ErrorMessage = "City cannot exceed 100 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters are allowed")]
    public string? City { get; init; }

    [Required(ErrorMessage = "Please enter State")]
    [MinLength(2, ErrorMessage = "Too short")]
    [MaxLength(100, ErrorMessage = "State cannot exceed 100 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters are allowed")]
    public string? State { get; init; }

    [RegularExpression(@"^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$", ErrorMessage = "Invalid Website URL format")]
    [MaxLength(200, ErrorMessage = "Website URL cannot exceed 200 characters")]
    public string? WebsiteUrl { get; init; }

    [Required(ErrorMessage = "Please enter Address")]
    [MinLength(5, ErrorMessage = "Too short")]
    [MaxLength(255, ErrorMessage = "Address cannot exceed 255 characters")]
    public string? Address1 { get; init; }

    [MaxLength(255, ErrorMessage = "Address cannot exceed 255 characters")]
    public string? Address2 { get; init; }

    [Required(ErrorMessage = "Please enter ZIP / Postal code")]
    [MinLength(4, ErrorMessage = "Too short")]
    [MaxLength(10, ErrorMessage = "Too long")]
    public string? Zipcode { get; init; }

    [Required]
    public long? CountryId { get; set; }

    [Required]
    [MaxLength(10, ErrorMessage = "Currency cannot exceed 10 characters")]
    public string? Currency { get; init; }

    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", ErrorMessage = "Invalid account email address format")]
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
    [RegularExpression(@"^(?!.*__)[a-zA-Z0-9][a-zA-Z0-9._]*$", ErrorMessage = "Username must start with a letter or number, and cannot contain spaces or double underscores")]
    public string Username { get; init; } = string.Empty;

    [Required]
    [MinLength(3, ErrorMessage = "First Name must be at least 3 characters")]
    [MaxLength(100, ErrorMessage = "First Name cannot exceed 100 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters are allowed")]
    public string? Firstname { get; init; }

    [Required]
    [MinLength(3, ErrorMessage = "Last Name must be at least 3 characters")]
    [MaxLength(100, ErrorMessage = "Last Name cannot exceed 100 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters are allowed")]
    public string? Lastname { get; init; }

    [Required]
    [MinLength(3, ErrorMessage = "Company Name must be at least 3 characters")]
    [MaxLength(200, ErrorMessage = "Company Name cannot exceed 200 characters")]
    [RegularExpression(@"^[a-zA-Z0-9\s&.,'-]*$", ErrorMessage = "Invalid characters in company name")]
    public string? Companyname { get; init; }

    [Required(ErrorMessage = "Please enter email")]
    [EmailAddress(ErrorMessage = "Invalid email address format")]
    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", ErrorMessage = "Invalid email address format")]
    [MaxLength(150, ErrorMessage = "Email cannot exceed 150 characters")]
    public string? PrimaryEmail { get; init; }

    [Required]
    [MaxLength(25, ErrorMessage = "Telephone cannot exceed 25 characters")]
    public string? Telephone { get; init; }

    [Required(ErrorMessage = "Please enter City")]
    [MinLength(2, ErrorMessage = "Too short")]
    [MaxLength(100, ErrorMessage = "City cannot exceed 100 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters are allowed")]
    public string? City { get; init; }

    [Required(ErrorMessage = "Please enter State")]
    [MinLength(2, ErrorMessage = "Too short")]
    [MaxLength(100, ErrorMessage = "State cannot exceed 100 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters are allowed")]
    public string? State { get; init; }

    [RegularExpression(@"^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$", ErrorMessage = "Invalid Website URL format")]
    [MaxLength(200, ErrorMessage = "Website URL cannot exceed 200 characters")]
    public string? WebsiteUrl { get; init; }

    [Required(ErrorMessage = "Please enter Address")]
    [MinLength(5, ErrorMessage = "Too short")]
    [MaxLength(255, ErrorMessage = "Address cannot exceed 255 characters")]
    public string? Address1 { get; init; }

    [MaxLength(255, ErrorMessage = "Address cannot exceed 255 characters")]
    public string? Address2 { get; init; }

    [Required(ErrorMessage = "Please enter ZIP / Postal code")]
    [MinLength(4, ErrorMessage = "Too short")]
    [MaxLength(10, ErrorMessage = "Too long")]
    public string? Zipcode { get; init; }

    [Required]
    public long? CountryId { get; set; }

    [Required]
    [MaxLength(10, ErrorMessage = "Currency cannot exceed 10 characters")]
    public string? Currency { get; init; }

    [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", ErrorMessage = "Invalid account email address format")]
    [MaxLength(150, ErrorMessage = "Email cannot exceed 150 characters")]
    public string? AccountEmail { get; init; }

    public string? IsActive { get; init; } = "Y";
    public string? UserType { get; init; }
}
