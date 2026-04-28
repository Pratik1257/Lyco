using System.ComponentModel.DataAnnotations;

namespace Lyco.Api.DTOs;

public record CardDetailDto(
    long CardId,
    long? UserId,
    string? Username,
    string? CardType,
    string? CardNo,
    string? ExpDate,
    string? Cvv,
    string? AsRegistered,
    string? FirstName,
    string? Middlename,
    string? LastName,
    string? Address1,
    string? Address2,
    string? City,
    string? Postcode,
    long? CountryId,
    string? State,
    string? Currency,
    string? Comments,
    string? CompanyName = null,
    string? Email = null,
    string? Telephone = null,
    string? ClientFullName = null,
    DateTime? LastOrderDate = null
);

public record CreateCardRequest
{
    [Required]
    public long? UserId { get; init; }

    [Required]
    public string? CardType { get; init; }

    [Required]
    [MinLength(13)]
    [MaxLength(19)]
    [RegularExpression(@"^\d+$", ErrorMessage = "Card number must contain only digits.")]
    public string? CardNo { get; init; }

    [Required]
    [RegularExpression(@"^(0[1-9]|1[0-2])\/\d{4}$", ErrorMessage = "Expiry must be in MM/YYYY format")]
    public string? ExpDate { get; init; }

    [Required]
    [MinLength(3)]
    [MaxLength(4)]
    [RegularExpression(@"^\d+$", ErrorMessage = "CVV must contain only digits.")]
    public string? Cvv { get; init; }

    public string? AsRegistered { get; init; }

    [Required]
    [MinLength(3, ErrorMessage = "First Name must be at least 3 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters allowed")]
    public string? FirstName { get; init; }

    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters allowed")]
    public string? Middlename { get; init; }

    [Required]
    [MinLength(3, ErrorMessage = "Last Name must be at least 3 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters allowed")]
    public string? LastName { get; init; }

    [Required]
    [MinLength(5, ErrorMessage = "Address must be at least 5 characters")]
    public string? Address1 { get; init; }

    public string? Address2 { get; init; }

    [Required]
    [MinLength(2, ErrorMessage = "City must be at least 2 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters allowed")]
    public string? City { get; init; }

    [MinLength(4, ErrorMessage = "Postcode too short")]
    [MaxLength(10, ErrorMessage = "Postcode too long")]
    public string? Postcode { get; init; }

    [Required]
    public long? CountryId { get; set; }

    [Required]
    [MinLength(2, ErrorMessage = "State must be at least 2 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters allowed")]
    public string? State { get; init; }

    [Required]
    public string? Currency { get; init; }

    public string? Comments { get; init; }
}

public record UpdateCardRequest
{
    [Required]
    public string? CardType { get; init; }

    [Required]
    [MinLength(13)]
    [MaxLength(19)]
    [RegularExpression(@"^\d+$", ErrorMessage = "Card number must contain only digits.")]
    public string? CardNo { get; init; }

    [Required]
    [RegularExpression(@"^(0[1-9]|1[0-2])\/\d{4}$", ErrorMessage = "Expiry must be in MM/YYYY format")]
    public string? ExpDate { get; init; }

    [Required]
    [MinLength(3)]
    [MaxLength(4)]
    [RegularExpression(@"^\d+$", ErrorMessage = "CVV must contain only digits.")]
    public string? Cvv { get; init; }

    public string? AsRegistered { get; init; }

    [Required]
    [MinLength(3, ErrorMessage = "First Name must be at least 3 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters allowed")]
    public string? FirstName { get; init; }

    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters allowed")]
    public string? Middlename { get; init; }

    [Required]
    [MinLength(3, ErrorMessage = "Last Name must be at least 3 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters allowed")]
    public string? LastName { get; init; }

    [Required]
    [MinLength(5, ErrorMessage = "Address must be at least 5 characters")]
    public string? Address1 { get; init; }

    public string? Address2 { get; init; }

    [Required]
    [MinLength(2, ErrorMessage = "City must be at least 2 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters allowed")]
    public string? City { get; init; }

    [MinLength(4, ErrorMessage = "Postcode too short")]
    [MaxLength(10, ErrorMessage = "Postcode too long")]
    public string? Postcode { get; init; }

    [Required]
    public long? CountryId { get; set; }

    [Required]
    [MinLength(2, ErrorMessage = "State must be at least 2 characters")]
    [RegularExpression(@"^[a-zA-Z\s'-]*$", ErrorMessage = "Only letters allowed")]
    public string? State { get; init; }

    [Required]
    public string? Currency { get; init; }

    public string? Comments { get; init; }
}
