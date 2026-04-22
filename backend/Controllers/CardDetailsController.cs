using Microsoft.AspNetCore.Mvc;
using Lyco.Api.Services;
using Lyco.Api.DTOs;

namespace Lyco.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CardDetailsController : ControllerBase
{
    private readonly ICardDetailService _cardService;

    public CardDetailsController(ICardDetailService cardService)
    {
        _cardService = cardService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<CardDetailDto>>> GetPaged(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _cardService.GetPagedAsync(search, status, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CardDetailDto>> GetById(long id)
    {
        var result = await _cardService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCardRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (dto, error) = await _cardService.CreateAsync(req);
        if (error != null) return BadRequest(new { Message = error });

        return CreatedAtAction(nameof(GetById), new { id = dto?.CardId }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateCardRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (dto, error) = await _cardService.UpdateAsync(id, req);
        if (error != null) return error == "Card not found" ? NotFound() : BadRequest(new { Message = error });

        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id)
    {
        var deleted = await _cardService.DeleteAsync(id);
        if (!deleted) return NotFound();

        return NoContent();
    }
}
