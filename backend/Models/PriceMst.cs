using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class PriceMst
{
    public long PriceId { get; set; }

    public long? ServiceId { get; set; }

    public string? Price { get; set; }

    public string? Currency { get; set; }

    public string? Show { get; set; }

    public virtual ServiceMst? Service { get; set; }
}
