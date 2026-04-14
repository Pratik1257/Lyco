using Microsoft.AspNetCore.Mvc;
using Lyco.Api.Services;

namespace Lyco.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IPriceService _service;

    public UsersController(IPriceService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetUsersForDropdown()
    {
        var result = await _service.GetUsersAsync();
        return Ok(result);
    }
}
