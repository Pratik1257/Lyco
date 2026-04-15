using Lyco.Api.Models;

namespace Lyco.Api.Repositories;

public interface IPriceRepository
{
    // General Prices
    Task<(IEnumerable<PriceMst> Items, int Total)> GetGeneralPagedAsync(string? search, int page, int pageSize);
    Task<PriceMst?> GetGeneralByIdAsync(long id);
    Task<bool> GeneralPriceExistsAsync(long serviceId, string currency, long? excludeId = null);
    Task<PriceMst> CreateGeneralAsync(long serviceId, string currency, decimal price);
    Task UpdateGeneralAsync(PriceMst price);

    // Userwise Prices
    Task<(IEnumerable<UserPriceMst> Items, int Total)> GetUserwisePagedAsync(string? search, int page, int pageSize);
    Task<UserPriceMst?> GetUserwiseByIdAsync(long id);
    Task<bool> UserwisePriceExistsAsync(long userId, long serviceId, string currency, long? excludeId = null);
    Task<UserPriceMst> CreateUserwiseAsync(long userId, long serviceId, string currency, decimal price);
    Task UpdateUserwiseAsync(UserPriceMst price);

    // Users for dropdown
    Task<IEnumerable<UserRegistration>> GetAllUsersAsync();

    // Deletion
    Task DeleteGeneralPriceAsync(long id);
    Task DeleteUserwisePriceAsync(long id);
    Task<bool> AnyServiceOrdersAsync(long serviceId);
    Task DeleteGeneralGroupAsync(long serviceId);
    Task DeleteUserwiseGroupAsync(long userId, long serviceId);
}
