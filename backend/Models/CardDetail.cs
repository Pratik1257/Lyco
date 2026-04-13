using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class CardDetail
{
    public long CardId { get; set; }

    public long? UserId { get; set; }

    public string? CardType { get; set; }

    public string? CardNo { get; set; }

    public string? ExpDate { get; set; }

    public string? Cvv { get; set; }

    public string? AsRegistered { get; set; }

    public string? FirstName { get; set; }

    public string? Middlename { get; set; }

    public string? LastName { get; set; }

    public string? Address1 { get; set; }

    public string? Address2 { get; set; }

    public string? City { get; set; }

    public string? Postcode { get; set; }

    public long? CountryId { get; set; }

    public string? State { get; set; }

    public string? Currency { get; set; }

    public string? Comments { get; set; }

    public virtual CountryMst? Country { get; set; }

    public virtual UserRegistration? User { get; set; }
}
