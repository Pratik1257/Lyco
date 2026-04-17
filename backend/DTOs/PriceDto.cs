using System.ComponentModel.DataAnnotations;

namespace Lyco.Api.DTOs;

// ── General Price DTOs ────────────────────────────────────────────────────────

public record GeneralPriceDto(
    long Id,
    long ServiceId,
    string ServiceName,
    string Currency,
    decimal Price,
    bool CanDelete = true
);

public record CreateGeneralPriceRequest
{
    [Required]
    [Range(1, long.MaxValue, ErrorMessage = "A valid service is required.")]
    public long ServiceId { get; init; }

    [Required]
    [StringLength(3, MinimumLength = 3, ErrorMessage = "Currency must be exactly 3 characters.")]
    public string Currency { get; init; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be a positive value.")]
    public decimal Price { get; init; }
}

public record UpdateGeneralPriceRequest
{
    [Required]
    [Range(1, long.MaxValue, ErrorMessage = "A valid service is required.")]
    public long ServiceId { get; init; }

    [Required]
    [StringLength(3, MinimumLength = 3, ErrorMessage = "Currency must be exactly 3 characters.")]
    public string Currency { get; init; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be a positive value.")]
    public decimal Price { get; init; }
}

// ── Userwise Price DTOs ───────────────────────────────────────────────────────

public record UserwisePriceDto(
    long Id,
    long UserId,
    string Username,
    string? Firstname,
    string? Lastname,
    long ServiceId,
    string ServiceName,
    string Currency,
    decimal Price,
    bool CanDelete = true
);

public record CreateUserwisePriceRequest
{
    [Required]
    [Range(1, long.MaxValue, ErrorMessage = "A valid user is required.")]
    public long UserId { get; init; }

    [Required]
    [Range(1, long.MaxValue, ErrorMessage = "A valid service is required.")]
    public long ServiceId { get; init; }

    [Required]
    [StringLength(3, MinimumLength = 3, ErrorMessage = "Currency must be exactly 3 characters.")]
    public string Currency { get; init; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be a positive value.")]
    public decimal Price { get; init; }
}

public record UpdateUserwisePriceRequest
{
    [Required]
    [Range(1, long.MaxValue, ErrorMessage = "A valid user is required.")]
    public long UserId { get; init; }

    [Required]
    [Range(1, long.MaxValue, ErrorMessage = "A valid service is required.")]
    public long ServiceId { get; init; }

    [Required]
    [StringLength(3, MinimumLength = 3, ErrorMessage = "Currency must be exactly 3 characters.")]
    public string Currency { get; init; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be a positive value.")]
    public decimal Price { get; init; }
}

// ── User DTO (for dropdown) ───────────────────────────────────────────────────

public record UserDto(long Id, string Username, string? Firstname, string? Lastname, string? Currency);
