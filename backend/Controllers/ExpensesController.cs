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
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _service.GetPagedAsync(search, serviceId, startDate, endDate, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Export expenses to XLSX — searchable and filterable by service and date.
    /// </summary>
    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] string? search = "",
        [FromQuery] long? serviceId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var result = (dynamic)await _service.GetPagedAsync(search, serviceId, startDate, endDate, 1, 1000000);
        var items = (IEnumerable<ExpenseResponseDto>)result.items;

        using var workbook = new ClosedXML.Excel.XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Expenses");

        // Headers
        worksheet.Cell(1, 1).Value = "ID";
        worksheet.Cell(1, 2).Value = "Date";
        worksheet.Cell(1, 3).Value = "Service";
        worksheet.Cell(1, 4).Value = "Title";
        worksheet.Cell(1, 5).Value = "Amount";
        worksheet.Cell(1, 6).Value = "Currency";
        worksheet.Cell(1, 7).Value = "Notes";

        // Styling headers
        var headerRange = worksheet.Range(1, 1, 1, 7);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.LightCyan;
        headerRange.Style.Border.OutsideBorder = ClosedXML.Excel.XLBorderStyleValues.Thin;

        int row = 2;
        foreach (var item in items)
        {
            worksheet.Cell(row, 1).Value = item.ExpenseId;
            worksheet.Cell(row, 2).Value = item.ExpenseDate;
            worksheet.Cell(row, 3).Value = item.ServiceName;
            worksheet.Cell(row, 4).Value = item.Title;
            worksheet.Cell(row, 5).Value = item.Amount;
            worksheet.Cell(row, 6).Value = item.Currency;
            worksheet.Cell(row, 7).Value = item.Notes;
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new System.IO.MemoryStream();
        workbook.SaveAs(stream);
        var content = stream.ToArray();

        return File(
            content, 
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
            $"Expenses_{DateTime.Now:MMddyyyy}.xlsx");
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
