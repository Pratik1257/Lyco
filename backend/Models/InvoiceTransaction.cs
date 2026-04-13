using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class InvoiceTransaction
{
    public long InvoiceTransactionId { get; set; }

    public long InvoiceId { get; set; }

    public long OrderId { get; set; }

    public string? OrderNo { get; set; }

    public string? Amount { get; set; }

    public DateTime? OrderDate { get; set; }

    public virtual InvoiceMst Invoice { get; set; } = null!;

    public virtual OrderDetail Order { get; set; } = null!;
}
