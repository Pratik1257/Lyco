using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class UserRegistration
{
    public long UserId { get; set; }

    public string? Username { get; set; }

    public string? Password { get; set; }

    public string? Firstname { get; set; }

    public string? Middlename { get; set; }

    public string? Lastname { get; set; }

    public string? Companyname { get; set; }

    public string? WebsiteUrl { get; set; }

    public string? Address1 { get; set; }

    public string? Address2 { get; set; }

    public string? City { get; set; }

    public string? Zipcode { get; set; }

    public long? CountryId { get; set; }

    public string? State { get; set; }

    public string? PrimaryEmail { get; set; }

    public string? IsSecondary { get; set; }

    public string? FirstnameS { get; set; }

    public string? LastnameS { get; set; }

    public string? SecondaryEmail { get; set; }

    public string? Telephone { get; set; }

    public string? HearAbout { get; set; }

    public long? UniqueNo { get; set; }

    public string? IsActive { get; set; }

    public string? UserType { get; set; }

    public DateTime? CreatedDate { get; set; }

    public string? Currency { get; set; }

    public string? VerifyCode { get; set; }

    public string? AccountEmail { get; set; }

    public virtual ICollection<CardDetail> CardDetails { get; set; } = new List<CardDetail>();

    public virtual ICollection<InvoiceMst> InvoiceMsts { get; set; } = new List<InvoiceMst>();

    public virtual ICollection<UserPriceMst> UserPriceMsts { get; set; } = new List<UserPriceMst>();
}
