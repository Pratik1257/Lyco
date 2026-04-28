using System.Collections.Generic;

namespace Lyco.Api.DTOs;

public class InvoiceCreateDto
{
    public long UserId { get; set; }
    public List<long> OrderIds { get; set; } = new();
    public string? InvoiceType { get; set; } // Individual, Combined, Paypal
}
