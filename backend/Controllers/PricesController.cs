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
            _ => Ok(dto)
        };
    }

    [HttpDelete("general/{id:long}")]
    public async Task<IActionResult> DeleteGeneral(long id)
    {
        await _service.DeleteGeneralPriceAsync(id);
        return NoContent();
    }

    [HttpGet("general/lookup")]
    public async Task<IActionResult> GetGeneralPrice(long serviceId, string currency)
    {
        var price = await _service.GetGeneralPriceAsync(serviceId, currency);
        return Ok(new { price });
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

    [HttpDelete("userwise/{id:long}")]
    public async Task<IActionResult> DeleteUserwise(long id)
    {
        await _service.DeleteUserwisePriceAsync(id);
        return NoContent();
    }

    [HttpGet("userwise/lookup")]
    public async Task<IActionResult> GetUserwisePrice(long userId, long serviceId)
    {
        var price = await _service.GetUserwisePriceAsync(userId, serviceId);
        return Ok(new { price });
    }

    [HttpDelete("general/group/{serviceId:long}")]
    public async Task<IActionResult> DeleteGeneralGroup(long serviceId)
    {
        await _service.DeleteGeneralGroupAsync(serviceId);
        return NoContent();
    }

    [HttpDelete("userwise/group/{userId:long}/{serviceId:long}")]
    public async Task<IActionResult> DeleteUserwiseGroup(long userId, long serviceId)
    {
        await _service.DeleteUserwiseGroupAsync(userId, serviceId);
        return NoContent();
    }
}
