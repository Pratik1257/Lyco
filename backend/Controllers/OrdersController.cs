using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Lyco.Api.Data;
using Lyco.Api.Models;
using Lyco.Api.DTOs;

namespace Lyco.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OrdersController : ControllerBase
{
    private readonly LycoDbContext _context;

    public OrdersController(LycoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] long? serviceId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var query = _context.OrderDetails
            .Include(o => o.Service)
            .AsQueryable();

        // Joins with UserRegistration via UniqueNo if possible
        // Note: Not every order might have a matching user if data is legacy
        var joinedQuery = from o in query
                         join u in _context.UserRegistrations on o.UniqueNo equals u.UniqueNo into users
                         from user in users.DefaultIfEmpty()
                         select new
                         {
                             o.OrderId,
                             o.OrderNo,
                             o.OrderDate,
                             o.WorkTitle, // PO No.
                             o.Amount,
                             o.Currency,
                             o.OrderStatus,
                             o.CompletedDate,
                             o.Email, // Email from OrderDetail
                             Username = user != null ? user.Username : "--",
                             ServiceName = o.Service != null ? o.Service.ServiceName : "Others",
                             o.ServiceId
                         };

        // Filters
        if (!string.IsNullOrEmpty(search))
        {
            joinedQuery = joinedQuery.Where(o => 
                (o.OrderNo != null && o.OrderNo.Contains(search)) ||
                (o.Username != null && o.Username.Contains(search)) ||
                (o.Email != null && o.Email.Contains(search)) ||
                (o.WorkTitle != null && o.WorkTitle.Contains(search))
            );
        }

        if (!string.IsNullOrEmpty(status) && status != "all")
        {
            joinedQuery = joinedQuery.Where(o => o.OrderStatus == status);
        }

        if (serviceId.HasValue)
        {
            joinedQuery = joinedQuery.Where(o => o.ServiceId == serviceId.Value);
        }

        if (startDate.HasValue)
        {
            joinedQuery = joinedQuery.Where(o => o.OrderDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            // Set to end of day
            var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
            joinedQuery = joinedQuery.Where(o => o.OrderDate <= endOfDay);
        }

        // Sort by date descending
        joinedQuery = joinedQuery.OrderByDescending(o => o.OrderDate);

        var totalCount = await joinedQuery.CountAsync();
        var items = await joinedQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            items,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    [HttpGet("next-number")]
    public async Task<IActionResult> GetNextOrderNumber([FromQuery] long uniqueNo)
    {
        // Find the last order number for this user to determine the next sequence
        var lastOrder = await _context.OrderDetails
            .Where(o => o.UniqueNo == uniqueNo && o.OrderNo != null && o.OrderNo.Contains("-"))
            .OrderByDescending(o => o.OrderId)
            .FirstOrDefaultAsync();

        int sequence = 1;
        if (lastOrder != null && lastOrder.OrderNo != null)
        {
            var parts = lastOrder.OrderNo.Split('-');
            if (parts.Length >= 2 && int.TryParse(parts.Last(), out var lastSeq))
            {
                sequence = lastSeq + 1;
            }
            else
            {
                sequence = await _context.OrderDetails.CountAsync(o => o.UniqueNo == uniqueNo) + 1;
            }
        }
        else
        {
            sequence = await _context.OrderDetails.CountAsync(o => o.UniqueNo == uniqueNo) + 1;
        }

        return Ok(new { orderNo = $"{uniqueNo}-{sequence}" });
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDto dto)
    {
        if (dto == null) return BadRequest();

        // Use OrderNo from frontend if provided, otherwise generate fallback
        var orderNo = dto.OrderNo;
        if (string.IsNullOrEmpty(orderNo))
        {
            var todayStr = DateTime.Now.ToString("yyyyMMdd");
            var countToday = await _context.OrderDetails.CountAsync(o => o.OrderDate >= DateTime.Today);
            orderNo = $"ORD-{todayStr}-{(countToday + 1):D4}";
        }

        var order = new OrderDetail
        {
            OrderNo = orderNo,
            OrderDate = DateTime.Now,
            UniqueNo = dto.UniqueNo,
            ServiceId = dto.ServiceId,
            WorkTitle = dto.WorkTitle,
            Instructions = dto.Instructions,
            FileFormat = dto.FileFormat,
            Size = dto.Size,
            Sizetype = dto.Sizetype,
            Amount = dto.Amount,
            Currency = dto.Currency,
            Email = dto.Email,
            OrderStatus = "In Process",
            Orderuq = Guid.NewGuid().ToString()
        };

        _context.OrderDetails.Add(order);
        await _context.SaveChangesAsync();

        return Ok(order);
    }
}
