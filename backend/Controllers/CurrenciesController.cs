using Lyco.Api.Data;
using Lyco.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lyco.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CurrenciesController : ControllerBase
{
    private readonly LycoDbContext _context;

    public CurrenciesController(LycoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CurrencyDto>>> GetCurrencies()
    {
        var currencies = await _context.CurrencyMsts
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new CurrencyDto
            {
                Id = c.Id,
                Code = c.Code,
                Name = c.Name,
                Symbol = c.Symbol
            })
            .ToListAsync();

        return Ok(currencies);
    }

    [HttpGet("fix-symbols")]
    public async Task<IActionResult> FixSymbols()
    {
        try
        {
            // 1. Force the database schema to use NVARCHAR so it can physically store Unicode characters
            await _context.Database.ExecuteSqlRawAsync("ALTER TABLE [CurrencyMst] ALTER COLUMN [Code] NVARCHAR(10);");
            await _context.Database.ExecuteSqlRawAsync("ALTER TABLE [CurrencyMst] ALTER COLUMN [Name] NVARCHAR(50);");
            await _context.Database.ExecuteSqlRawAsync("ALTER TABLE [CurrencyMst] ALTER COLUMN [Symbol] NVARCHAR(10);");

            // 2. Now that the columns support Unicode, update the symbols
            var currencies = await _context.CurrencyMsts.ToListAsync();
            foreach (var currency in currencies)
            {
                if (currency.Code == "INR") currency.Symbol = "₹";
                if (currency.Code == "EUR") currency.Symbol = "€";
                if (currency.Code == "GBP") currency.Symbol = "£";
                if (currency.Code == "USD") currency.Symbol = "$";
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Database schema updated to NVARCHAR and symbols updated successfully. Please refresh the page!" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = "Failed to update symbols.", detail = ex.Message });
        }
    }
}
