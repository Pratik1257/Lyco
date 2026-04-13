using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class VendorMst
{
    public long VendorId { get; set; }

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public string? CompanyName { get; set; }

    public string? WebsiteUrl { get; set; }

    public string? Email { get; set; }

    public string? Telephone { get; set; }

    public long? UniqueNo { get; set; }

    public virtual ICollection<VendorOrderMst> VendorOrderMsts { get; set; } = new List<VendorOrderMst>();
}
