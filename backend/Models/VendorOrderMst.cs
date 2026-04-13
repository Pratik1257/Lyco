using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class VendorOrderMst
{
    public long VenderOrderId { get; set; }

    public long? VendorId { get; set; }

    public string? OrderNo { get; set; }

    public string? Email { get; set; }

    public string? Instructions { get; set; }

    public string? FileType { get; set; }

    public string? Stitches { get; set; }

    public string? Rate { get; set; }

    public string? OrderStatus { get; set; }

    public DateTime? OrderDate { get; set; }

    public DateTime? CompletedDate { get; set; }

    public virtual VendorMst? Vendor { get; set; }
}
