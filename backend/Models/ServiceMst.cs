using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class ServiceMst
{
    public long ServiceId { get; set; }

    public string? ServiceName { get; set; }

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    public virtual ICollection<PriceMst> PriceMsts { get; set; } = new List<PriceMst>();

    public virtual ICollection<PromotionMst> PromotionMsts { get; set; } = new List<PromotionMst>();

    public virtual ICollection<Quote> Quotes { get; set; } = new List<Quote>();

    public virtual ICollection<UserPriceMst> UserPriceMsts { get; set; } = new List<UserPriceMst>();

    public virtual ICollection<ExpenseMst> ExpenseMsts { get; set; } = new List<ExpenseMst>();
}
