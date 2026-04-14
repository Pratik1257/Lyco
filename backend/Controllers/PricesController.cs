using Microsoft.AspNetCore.Mvc;
using Lyco.Api.DTOs;
using Lyco.Api.Services;

namespace Lyco.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PricesController : ControllerBase
{
    private readonly IPriceService _service;

    public PricesController(IPriceService service) => _service = service;

    // ── General Prices ────────────────────────────────────────────────────────

    [HttpGet("general")]
    public async Task<IActionResult> GetGeneral(
        [FromQuery] string? search = "",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _service.GetGeneralPagedAsync(search, page, pageSize);
        return Ok(result);
    }

    [HttpPost("general")]
    public async Task<IActionResult> CreateGeneral([FromBody] CreateGeneralPriceRequest req)
    {
        var (dto, error) = await _service.CreateGeneralAsync(req);
        if (error is not null) return BadRequest(new { error });
        return Ok(dto);
    }

    [HttpPut("general/{id:long}")]
    public async Task<IActionResult> UpdateGeneral(long id, [FromBody] UpdateGeneralPriceRequest req)
    {
        var (dto, error) = await _service.UpdateGeneralAsync(id, req);
        return error switch
        {
            "not_found" => NotFound(new { error = "Price not found." }),
            not null => BadRequest(new { error }),
            _ => Ok(dto)
        };
    }

    // ── Userwise Prices ───────────────────────────────────────────────────────

    [HttpGet("userwise")]
    public async Task<IActionResult> GetUserwise(
        [FromQuery] string? search = "",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _service.GetUserwisePagedAsync(search, page, pageSize);
        return Ok(result);
    }

    [HttpPost("userwise")]
    public async Task<IActionResult> CreateUserwise([FromBody] CreateUserwisePriceRequest req)
    {
        var (dto, error) = await _service.CreateUserwiseAsync(req);
        if (error is not null) return BadRequest(new { error });
        return Ok(dto);
    }

    [HttpPut("userwise/{id:long}")]
    public async Task<IActionResult> UpdateUserwise(long id, [FromBody] UpdateUserwisePriceRequest req)
    {
        var (dto, error) = await _service.UpdateUserwiseAsync(id, req);
        return error switch
        {
            "not_found" => NotFound(new { error = "Price not found." }),
            not null => BadRequest(new { error }),
            _ => Ok(dto)
        };
    }
}
