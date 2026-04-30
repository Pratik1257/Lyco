using System.ComponentModel.DataAnnotations;

namespace Lyco.Api.DTOs;

public class OrderCreateDto
{
    [Required(ErrorMessage = "UniqueNo is required")]
    public long UniqueNo { get; set; }

    public string? OrderNo { get; set; }

    [Required(ErrorMessage = "Service is required")]
    public long ServiceId { get; set; }

    [Required(ErrorMessage = "PO / Artwork Name is required")]
    [MaxLength(500)]
    public string? WorkTitle { get; set; }

    public string? Instructions { get; set; }

    public string? FileFormat { get; set; }

    public string? Size { get; set; }
    public string? Sizetype { get; set; }

    [Required(ErrorMessage = "Amount is required")]
    public string? Amount { get; set; }

    public string? Currency { get; set; }

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email address format")]
    public string? Email { get; set; }

    public string? OrderStatus { get; set; }
    public string? ExternalLink { get; set; }
    public string? Note { get; set; }
    public string? Stitches { get; set; }
    public List<long>? FilesToDelete { get; set; }
}
