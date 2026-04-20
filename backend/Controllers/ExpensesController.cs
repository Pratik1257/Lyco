using Microsoft.AspNetCore.Mvc;
using Lyco.Api.DTOs;
using Lyco.Api.Services;

namespace Lyco.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _service;

    public ExpensesController(IExpenseService service) => _service = service;

    /// <summary>
    /// Get all expenses — paginated, searchable, and filterable by service.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search = "",
        [FromQuery] long? serviceId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _service.GetPagedAsync(search, serviceId, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Get a single expense by ID.
    /// </summary>
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var expense = await _service.GetByIdAsync(id);
        if (expense == null) return NotFound(new { error = "Expense not found." });
        return Ok(expense);
    }

    /// <summary>
    /// Create a new expense.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExpenseDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.ExpenseId }, created);
    }

    /// <summary>
    /// Update an existing expense.
    /// </summary>
    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateExpenseDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (result, error) = await _service.UpdateAsync(id, dto);

        return error switch
        {
            "not_found" => NotFound(new { error = "Expense not found." }),
            not null => Conflict(new { error }),
            _ => Ok(result)
        };
    }

    /// <summary>
    /// Delete an expense.
    /// </summary>
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var error = await _service.DeleteAsync(id);
        if (error != null)
            return NotFound(new { error });

        return NoContent();
    }
}
