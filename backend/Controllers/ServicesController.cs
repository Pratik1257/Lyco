using Microsoft.AspNetCore.Mvc;
using Lyco.Api.DTOs;
using Lyco.Api.Services;

namespace Lyco.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly IServiceService _service;

    public ServicesController(IServiceService service) => _service = service;

    /// <summary>
    /// Get all services — paginated and searchable.
    /// Matches the frontend's search bar + items-per-page dropdown.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search = "",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _service.GetPagedAsync(search, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Create a new service.
    /// Returns 409 if a service with the same name already exists.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateServiceRequest req)
    {
        var (service, error) = await _service.CreateAsync(req.Name);

        if (error is not null)
            return Conflict(new { error });

        return CreatedAtAction(nameof(GetAll), new { id = service!.Id }, service);
    }

    /// <summary>
    /// Update an existing service name.
    /// Returns 404 if not found, 409 if new name conflicts with another service.
    /// </summary>
    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateServiceRequest req)
    {
        var (service, error) = await _service.UpdateAsync(id, req.Name);

        return error switch
        {
            "not_found" => NotFound(new { error = "Service not found." }),
            not null     => Conflict(new { error }),
            _            => Ok(service)
        };
    }
}
