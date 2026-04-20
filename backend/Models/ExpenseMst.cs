using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class ExpenseMst
{
    public long ExpenseId { get; set; }

    public long? ServiceId { get; set; }

    public string? Title { get; set; }

    public decimal? Amount { get; set; }

    public string? Currency { get; set; }

    public DateTime? ExpenseDate { get; set; }

    public string? Notes { get; set; }

    public DateTime? CreatedDate { get; set; }

    public virtual ServiceMst? Service { get; set; }
}
