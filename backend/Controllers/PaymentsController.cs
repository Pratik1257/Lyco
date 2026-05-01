using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Lyco.Api.Data;
using Lyco.Api.Models;

namespace Lyco.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PaymentsController : ControllerBase
{
    private readonly LycoDbContext _context;

    public PaymentsController(LycoDbContext context)
    {
        _context = context;
    }

    [HttpGet("pending-for-status")]
    public async Task<IActionResult> GetPendingForStatus([FromQuery] long uniqueNo)
    {
        var query = from o in _context.OrderDetails
                    join u in _context.UserRegistrations on o.UniqueNo equals u.UniqueNo
                    where o.OrderStatus == "Completed" 
                          && o.PaymentStatus == "Pending" 
                          && o.Ordertype == "Order"
                          && o.UniqueNo == uniqueNo
                    select new 
                    {
                        o.OrderId,
                        o.OrderNo,
                        o.OrderDate,
                        o.Amount,
                        Currency = o.Currency ?? u.Currency,
                        PoNo = o.Orderuq // Using Orderuq for PO Number based on legacy conventions
                    };

        var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync();
        return Ok(orders);
    }

    public class UpdateStatusRequest
    {
        public List<long> OrderIds { get; set; } = new();
        public string Status { get; set; } = string.Empty;
    }

    [HttpPut("status")]
    public async Task<IActionResult> UpdateStatus([FromBody] UpdateStatusRequest request)
    {
        if (request.Status != "Completed" && request.Status != "Bad Debt")
        {
            return BadRequest("Invalid status. Must be 'Completed' or 'Bad Debt'.");
        }

        if (request.OrderIds == null || !request.OrderIds.Any())
        {
            return BadRequest("No orders selected.");
        }

        var ordersToUpdate = await _context.OrderDetails
            .Where(o => request.OrderIds.Contains(o.OrderId))
            .ToListAsync();

        foreach (var order in ordersToUpdate)
        {
            order.PaymentStatus = request.Status;
            order.PaymentDate = DateTime.Now;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"Successfully updated {ordersToUpdate.Count} orders to {request.Status}." });
    }
}
