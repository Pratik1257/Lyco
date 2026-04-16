using System.ComponentModel.DataAnnotations;

namespace Lyco.Api.DTOs;

public record CardDetailDto(
    long CardId,
    long? UserId,
    string? Username,
    string? CardType,
    string? CardNo,
    string? ExpDate,
    string? Cvv,
    string? AsRegistered,
    string? FirstName,
    string? Middlename,
    string? LastName,
    string? Address1,
    string? Address2,
    string? City,
    string? Postcode,
    long? CountryId,
    string? State,
    string? Currency,
    string? Comments
);

public record CreateCardRequest
{
    public long? UserId { get; init; }
    public string? CardType { get; init; }
    public string? CardNo { get; init; }
    public string? ExpDate { get; init; }
    public string? Cvv { get; init; }
    public string? AsRegistered { get; init; }
    public string? FirstName { get; init; }
    public string? Middlename { get; init; }
    public string? LastName { get; init; }
    public string? Address1 { get; init; }
    public string? Address2 { get; init; }
    public string? City { get; init; }
    public string? Postcode { get; init; }
    public long? CountryId { get; init; }
    public string? State { get; init; }
    public string? Currency { get; init; }
    public string? Comments { get; init; }
}

public record UpdateCardRequest
{
    public string? CardType { get; init; }
    public string? CardNo { get; init; }
    public string? ExpDate { get; init; }
    public string? Cvv { get; init; }
    public string? AsRegistered { get; init; }
    public string? FirstName { get; init; }
    public string? Middlename { get; init; }
    public string? LastName { get; init; }
    public string? Address1 { get; init; }
    public string? Address2 { get; init; }
    public string? City { get; init; }
    public string? Postcode { get; init; }
    public long? CountryId { get; init; }
    public string? State { get; init; }
    public string? Currency { get; init; }
    public string? Comments { get; init; }
}
