using System;
using System.Collections.Generic;

namespace Lyco.Api.DTOs;

public class InvoiceDetailDto
{
    public long InvoiceId { get; set; }
    public string InvoiceNo { get; set; } = "";
    public DateTime InvoiceDate { get; set; }
    public string CompanyName { get; set; } = "";
    public string ContactName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string CustomerId { get; set; } = "";
    public string TotalAmount { get; set; } = "";
    public List<InvoiceLineItemDto> LineItems { get; set; } = new();
}

public class InvoiceLineItemDto
{
    public string OrderNo { get; set; } = "";
    public DateTime? OrderDate { get; set; }
    public string Description { get; set; } = "";
    public string Amount { get; set; } = "";
}
