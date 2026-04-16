using Microsoft.AspNetCore.Mvc;
using Lyco.Api.Data;
using Lyco.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Lyco.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CountriesController : ControllerBase
{
    private readonly LycoDbContext _context;

    public CountriesController(LycoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetCountries()
    {
        var countries = await _context.CountryMsts
            .Select(c => new { c.CountryId, c.CountryName })
            .OrderBy(c => c.CountryName)
            .ToListAsync();
        return Ok(countries);
    }
}
