using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class Quote
{
    public long QuoteId { get; set; }

    public string? QuoteNo { get; set; }

    public string? Quoteuq { get; set; }

    public DateTime? QuoteDate { get; set; }

    public long? ServiceId { get; set; }

    public string? Instructions { get; set; }

    public string? WorkTitle { get; set; }

    public string? Size { get; set; }

    public string? Sizetype { get; set; }

    public string? FileFormat { get; set; }

    public string? ImageUrl { get; set; }

    public string? Amount { get; set; }

    public string? Currency { get; set; }

    public long? UniqueNo { get; set; }

    public string? IsSecondary { get; set; }

    public string? Email { get; set; }

    public string? QuoteType { get; set; }

    public virtual ServiceMst? Service { get; set; }
}
