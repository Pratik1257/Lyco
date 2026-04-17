using Lyco.Api.DTOs;
using Lyco.Api.Models;
using Lyco.Api.Repositories;

namespace Lyco.Api.Services;

public class CardDetailService : ICardDetailService
{
    private readonly ICardDetailRepository _cardRepository;

    public CardDetailService(ICardDetailRepository cardRepository)
    {
        _cardRepository = cardRepository;
    }

    public async Task<PagedResult<CardDetailDto>> GetPagedAsync(string? search, int page, int pageSize)
    {
        var (items, total) = await _cardRepository.GetPagedAsync(search, page, pageSize);
        var dtos = items.Select(MapToDto).ToList();

        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        return new PagedResult<CardDetailDto>(dtos, total, page, pageSize, totalPages);
    }

    public async Task<CardDetailDto?> GetByIdAsync(long id)
    {
        var card = await _cardRepository.GetByIdAsync(id);
        return card != null ? MapToDto(card) : null;
    }

    public async Task<(CardDetailDto? Dto, string? Error)> CreateAsync(CreateCardRequest req)
    {
        var card = new CardDetail
        {
            UserId = req.UserId,
            CardType = req.CardType,
            CardNo = req.CardNo,
            ExpDate = req.ExpDate,
            Cvv = req.Cvv,
            AsRegistered = req.AsRegistered,
            FirstName = req.FirstName,
            Middlename = req.Middlename,
            LastName = req.LastName,
            Address1 = req.Address1,
            Address2 = req.Address2,
            City = req.City,
            Postcode = req.Postcode,
            CountryId = req.CountryId,
            State = req.State,
            Currency = req.Currency,
            Comments = req.Comments
        };

        var created = await _cardRepository.CreateAsync(card);
        // Re-fetch to get Joined data (User)
        var fullCard = await _cardRepository.GetByIdAsync(created.CardId);
        return (MapToDto(fullCard!), null);
    }

    public async Task<(CardDetailDto? Dto, string? Error)> UpdateAsync(long id, UpdateCardRequest req)
    {
        var card = await _cardRepository.GetByIdAsync(id);
        if (card == null) return (null, "Card not found");

        card.CardType = req.CardType;
        card.CardNo = req.CardNo;
        card.ExpDate = req.ExpDate;
        card.Cvv = req.Cvv;
        card.AsRegistered = req.AsRegistered;
        card.FirstName = req.FirstName;
        card.Middlename = req.Middlename;
        card.LastName = req.LastName;
        card.Address1 = req.Address1;
        card.Address2 = req.Address2;
        card.City = req.City;
        card.Postcode = req.Postcode;
        card.CountryId = req.CountryId;
        card.State = req.State;
        card.Currency = req.Currency;
        card.Comments = req.Comments;

        await _cardRepository.UpdateAsync(card);
        return (MapToDto(card), null);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var exists = await _cardRepository.ExistsAsync(id);
        if (!exists) return false;

        await _cardRepository.DeleteAsync(id);
        return true;
    }

    private static CardDetailDto MapToDto(CardDetail c) => new(
        c.CardId,
        c.UserId,
        c.User?.Username,
        c.CardType,
        c.CardNo,
        c.ExpDate,
        c.Cvv,
        c.AsRegistered,
        c.FirstName,
        c.Middlename,
        c.LastName,
        c.Address1,
        c.Address2,
        c.City,
        c.Postcode,
        c.CountryId,
        c.State,
        c.Currency,
        c.Comments,
        c.User?.Companyname,
        c.User?.PrimaryEmail,
        c.User?.Telephone,
        c.User != null ? $"{c.User.Firstname} {c.User.Lastname}".Trim() : null
    );
}
