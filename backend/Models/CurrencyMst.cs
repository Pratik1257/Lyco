using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class CurrencyMst
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Symbol { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }
}
