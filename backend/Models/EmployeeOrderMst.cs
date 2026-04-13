using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class EmployeeOrderMst
{
    public long EmployeeOrderId { get; set; }

    public long? EmployeeId { get; set; }

    public long? OrderId { get; set; }

    public string? OrderNo { get; set; }

    public string? OrderStatus { get; set; }

    public DateTime? AssignedDate { get; set; }

    public DateTime? CompletedDate { get; set; }

    public string? Instructions { get; set; }

    public virtual EmployeeMst? Employee { get; set; }

    public virtual OrderDetail? Order { get; set; }
}
