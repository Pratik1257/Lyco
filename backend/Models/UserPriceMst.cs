using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class UserPriceMst
{
    public long UserPriceId { get; set; }

    public long? UserId { get; set; }

    public long? ServiceId { get; set; }

    public string? Price { get; set; }

    public string? Currency { get; set; }

    public string? IsActive { get; set; }

    public long? UniqueNo { get; set; }

    public virtual ServiceMst? Service { get; set; }

    public virtual UserRegistration? User { get; set; }
}
