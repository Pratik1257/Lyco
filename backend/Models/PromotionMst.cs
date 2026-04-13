using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class PromotionMst
{
    public long PromotionId { get; set; }

    public long? ServiceId { get; set; }

    public string? Price { get; set; }

    public string? Currency { get; set; }

    public string? PromoCode { get; set; }

    public virtual ServiceMst? Service { get; set; }
}
