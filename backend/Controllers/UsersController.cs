using Microsoft.AspNetCore.Mvc;
using Lyco.Api.Services;
using Lyco.Api.DTOs;

namespace Lyco.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IPriceService _priceService;
    private readonly IUserService _userService;

    public UsersController(IPriceService priceService, IUserService userService)
    {
        _priceService = priceService;
        _userService = userService;
    }

    [HttpGet("dropdown")]
    public async Task<IActionResult> GetUsersForDropdown()
    {
        var result = await _priceService.GetUsersAsync();
        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<UserRegistrationDto>>> GetPaged(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _userService.GetPagedAsync(search, status, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserRegistrationDto>> GetById(long id)
    {
        var result = await _userService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (dto, error) = await _userService.CreateAsync(req);
        if (error != null) return BadRequest(new { Message = error });

        return CreatedAtAction(nameof(GetById), new { id = dto?.UserId }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateUserRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (dto, error) = await _userService.UpdateAsync(id, req);
        if (error != null) return error == "User not found" ? NotFound() : BadRequest(new { Message = error });

        return Ok(dto);
    }

    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(long id)
    {
        var result = await _userService.ToggleActiveAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id)
    {
        var (success, error) = await _userService.DeleteAsync(id);
        if (!success)
        {
            if (error == "User not found.") return NotFound();
            return BadRequest(new { error });
        }

        return NoContent();
    }
}
