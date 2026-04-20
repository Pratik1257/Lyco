using System.ComponentModel.DataAnnotations;

namespace Lyco.Api.DTOs;

// ── Response DTO ─────────────────────────────────────────────────────────────
public class ExpenseResponseDto
{
    public long ExpenseId { get; set; }
    public long? ServiceId { get; set; }
    public string? ServiceName { get; set; }
    public string? Title { get; set; }
    public decimal? Amount { get; set; }
    public string? Currency { get; set; }
    public DateTime? ExpenseDate { get; set; }
    public string? Notes { get; set; }
    public DateTime? CreatedDate { get; set; }
}

// ── Create Request ───────────────────────────────────────────────────────────
public class CreateExpenseDto
{
    [Required(ErrorMessage = "Service is required.")]
    public long ServiceId { get; set; }

    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(250)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Amount is required.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "Currency is required.")]
    [MaxLength(50)]
    public string Currency { get; set; } = string.Empty;

    [Required(ErrorMessage = "Expense date is required.")]
    public DateTime ExpenseDate { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

// ── Update Request ───────────────────────────────────────────────────────────
public class UpdateExpenseDto
{
    [Required(ErrorMessage = "Service is required.")]
    public long ServiceId { get; set; }

    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(250)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Amount is required.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "Currency is required.")]
    [MaxLength(50)]
    public string Currency { get; set; } = string.Empty;

    [Required(ErrorMessage = "Expense date is required.")]
    public DateTime ExpenseDate { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}
