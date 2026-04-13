using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class EmployeeMst
{
    public long EmployeeId { get; set; }

    public string? Email { get; set; }

    public string? Username { get; set; }

    public string? Password { get; set; }

    public DateTime? DateCreated { get; set; }

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public string? Address { get; set; }

    public long? CountryId { get; set; }

    public string? State { get; set; }

    public string? City { get; set; }

    public string? MobileNo { get; set; }

    public string? IsActive { get; set; }

    public string? IsDeleted { get; set; }

    public virtual ICollection<EmployeeOrderMst> EmployeeOrderMsts { get; set; } = new List<EmployeeOrderMst>();
}
