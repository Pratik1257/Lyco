using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class OrderDetail
{
    public long OrderId { get; set; }

    public string? OrderNo { get; set; }

    public string? Orderuq { get; set; }

    public DateTime? OrderDate { get; set; }

    public string? Ordertype { get; set; }

    public long? ServiceId { get; set; }

    public string? Instructions { get; set; }

    public string? WorkTitle { get; set; }

    public string? Size { get; set; }

    public string? Sizetype { get; set; }

    public string? FileFormat { get; set; }

    public string? ImageUrl { get; set; }

    public string? OrderStatus { get; set; }

    public DateTime? CompletedDate { get; set; }

    public string? Amount { get; set; }

    public string? Currency { get; set; }

    public string? InvoiceNo { get; set; }

    public string? TransactionNo { get; set; }

    public string? InvoiceUrl { get; set; }

    public string? PaymentStatus { get; set; }

    public DateTime? PaymentDate { get; set; }

    public long? UniqueNo { get; set; }

    public string? IsSecondary { get; set; }

    public string? Email { get; set; }

    public string? Stitches { get; set; }

    public string? OrderState { get; set; }

    public long? InvoiceId { get; set; }

    public string? AdditionalInstructions { get; set; }

    public string? EmployeeInstructions { get; set; }

    public string? Note { get; set; }

    public string? Systransactionno { get; set; }

    public virtual ICollection<EmployeeOrderMst> EmployeeOrderMsts { get; set; } = new List<EmployeeOrderMst>();

    public virtual InvoiceMst? Invoice { get; set; }

    public virtual ICollection<InvoiceTransaction> InvoiceTransactions { get; set; } = new List<InvoiceTransaction>();

    public virtual ServiceMst? Service { get; set; }
}
