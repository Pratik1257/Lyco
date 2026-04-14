using System.ComponentModel.DataAnnotations;

namespace Lyco.Api.DTOs;

// ── General Price DTOs ────────────────────────────────────────────────────────

public record GeneralPriceDto(
    long Id,
    long ServiceId,
    string ServiceName,
    string Currency,
    decimal Price
);

public record CreateGeneralPriceRequest
{
    [Required]
    public long ServiceId { get; init; }

    [Required, MaxLength(50)]
    public string Currency { get; init; } = string.Empty;

    [Required, Range(0, double.MaxValue)]
    public decimal Price { get; init; }
}

public record UpdateGeneralPriceRequest
{
    [Required]
    public long ServiceId { get; init; }

    [Required, MaxLength(50)]
    public string Currency { get; init; } = string.Empty;

    [Required, Range(0, double.MaxValue)]
    public decimal Price { get; init; }
}

// ── Userwise Price DTOs ───────────────────────────────────────────────────────

public record UserwisePriceDto(
    long Id,
    long UserId,
    string Username,
    long ServiceId,
    string ServiceName,
    string Currency,
    decimal Price
);

public record CreateUserwisePriceRequest
{
    [Required]
    public long UserId { get; init; }

    [Required]
    public long ServiceId { get; init; }

    [Required, MaxLength(50)]
    public string Currency { get; init; } = string.Empty;

    [Required, Range(0, double.MaxValue)]
    public decimal Price { get; init; }
}

public record UpdateUserwisePriceRequest
{
    [Required]
    public long UserId { get; init; }

    [Required]
    public long ServiceId { get; init; }

    [Required, MaxLength(50)]
    public string Currency { get; init; } = string.Empty;

    [Required, Range(0, double.MaxValue)]
    public decimal Price { get; init; }
}

// ── User DTO (for dropdown) ───────────────────────────────────────────────────

public record UserDto(long Id, string Username);
