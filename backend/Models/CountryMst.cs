using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class CountryMst
{
    public long CountryId { get; set; }

    public string? CountryName { get; set; }

    public virtual ICollection<CardDetail> CardDetails { get; set; } = new List<CardDetail>();
}
