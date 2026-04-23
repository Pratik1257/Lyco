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
    public string? ExpDate { get; init; }

    [Required]
    [MinLength(3)]
    [MaxLength(4)]
    [RegularExpression(@"^\d+$", ErrorMessage = "CVV must contain only digits.")]
    public string? Cvv { get; init; }

    public string? AsRegistered { get; init; }

    [Required]
    public string? FirstName { get; init; }

    [Required]
    public string? Middlename { get; init; }

    [Required]
    public string? LastName { get; init; }

    [Required]
    public string? Address1 { get; init; }

    public string? Address2 { get; init; }

    [Required]
    public string? City { get; init; }

    public string? Postcode { get; init; }

    [Required]
    public long? CountryId { get; init; }

    [Required]
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
    public string? ExpDate { get; init; }

    [Required]
    [MinLength(3)]
    [MaxLength(4)]
    [RegularExpression(@"^\d+$", ErrorMessage = "CVV must contain only digits.")]
    public string? Cvv { get; init; }

    public string? AsRegistered { get; init; }

    [Required]
    public string? FirstName { get; init; }

    [Required]
    public string? Middlename { get; init; }

    [Required]
    public string? LastName { get; init; }

    [Required]
    public string? Address1 { get; init; }

    public string? Address2 { get; init; }

    [Required]
    public string? City { get; init; }

    public string? Postcode { get; init; }

    [Required]
    public long? CountryId { get; init; }

    [Required]
    public string? State { get; init; }

    [Required]
    public string? Currency { get; init; }

    public string? Comments { get; init; }
}
