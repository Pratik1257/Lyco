using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class InvoiceMst
{
    public long InvoiceId { get; set; }

    public string? InvoiceNo { get; set; }

    public DateTime? InvoiceDate { get; set; }

    public long? SrNo { get; set; }

    public string? Amount { get; set; }

    public string? Description { get; set; }

    public DateTime? CreatedDate { get; set; }

    public long? UserId { get; set; }

    public string? Po { get; set; }

    public string? InvoiceUrl { get; set; }

    public virtual ICollection<InvoiceTransaction> InvoiceTransactions { get; set; } = new List<InvoiceTransaction>();

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    public virtual UserRegistration? User { get; set; }
}
