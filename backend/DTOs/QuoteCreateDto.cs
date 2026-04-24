using System.ComponentModel.DataAnnotations;

namespace Lyco.Api.DTOs;

public class QuoteCreateDto
{
    [Required]
    public long UniqueNo { get; set; }

    public string? QuoteNo { get; set; }

    [Required]
    public long ServiceId { get; set; }

    [Required]
    public string? WorkTitle { get; set; }

    public string? Instructions { get; set; }

    public string? FileFormat { get; set; }

    public string? Size { get; set; }

    public string? Sizetype { get; set; }

    [Required]
    public string? Amount { get; set; }

    public string? Currency { get; set; }

    public string? Email { get; set; }

    public string? QuoteType { get; set; }
    public string? ImageUrl { get; set; }
    public List<long>? FilesToDelete { get; set; }
}
