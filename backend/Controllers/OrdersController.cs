using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Lyco.Api.Data;
using Lyco.Api.Models;
using Lyco.Api.DTOs;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace Lyco.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OrdersController : ControllerBase
{
    private readonly LycoDbContext _context;
    private readonly IWebHostEnvironment _env;

    public OrdersController(LycoDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
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
                             o.ServiceId,
                             o.Size,
                             o.Sizetype,
                             o.Instructions,
                             o.FileFormat
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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrderById(long id)
    {
        var order = await _context.OrderDetails
            .Include(o => o.Service)
            .FirstOrDefaultAsync(o => o.OrderId == id);

        if (order == null) return NotFound();

        // Also get user info
        var user = await _context.UserRegistrations.FirstOrDefaultAsync(u => u.UniqueNo == order.UniqueNo);

        return Ok(new
        {
            order.OrderId,
            order.OrderNo,
            order.OrderDate,
            order.WorkTitle,
            order.Instructions,
            order.FileFormat,
            order.Size,
            order.Sizetype,
            order.Amount,
            order.Currency,
            order.Email,
            order.UniqueNo,
            order.ServiceId,
            order.OrderStatus,
            Username = user?.Username ?? "--",
            CompanyName = user?.Companyname ?? "--"
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
    public async Task<IActionResult> CreateOrder([FromForm] OrderCreateDto dto, List<IFormFile> files)
    {
        if (dto == null) return BadRequest();

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

        if (files != null && files.Count > 0)
        {
            await SaveFilesAsync(order.OrderNo ?? "", files);
        }

        return Ok(order);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateOrder(long id, [FromForm] OrderCreateDto dto, List<IFormFile> files)
    {
        var order = await _context.OrderDetails.FindAsync(id);
        if (order == null) return NotFound();

        order.ServiceId = dto.ServiceId;
        order.WorkTitle = dto.WorkTitle;
        order.Instructions = dto.Instructions;
        order.FileFormat = dto.FileFormat;
        order.Size = dto.Size;
        order.Sizetype = dto.Sizetype;
        order.Amount = dto.Amount;
        order.Currency = dto.Currency;
        order.Email = dto.Email;
        
        // Update Status
        if (!string.IsNullOrEmpty(dto.OrderStatus))
        {
            order.OrderStatus = dto.OrderStatus;
            if (dto.OrderStatus == "Completed")
            {
                order.CompletedDate = DateTime.Now;
            }
            else
            {
                order.CompletedDate = null;
            }
        }

        await _context.SaveChangesAsync();

        // Save new attachments
        if (files != null && files.Count > 0)
        {
            await SaveFilesAsync(order.OrderNo ?? "", files);
        }

        return Ok(order);
    }

    private async Task SaveFilesAsync(string orderNo, List<IFormFile> files)
    {
        var uploadsPath = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "orders");
        if (!Directory.Exists(uploadsPath))
        {
            Directory.CreateDirectory(uploadsPath);
        }

        foreach (var file in files)
        {
            if (file.Length > 0)
            {
                var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadsPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var orderFile = new OrderFileMst
                {
                    OrderNo = orderNo,
                    FileName = file.FileName,
                    FileUrl = $"/uploads/orders/{fileName}",
                    FileStatus = "Active",
                    LastModifieddate = DateTime.Now,
                    LastModifiedBy = "Admin", // Should come from auth
                    LastModifiedUserType = "Admin"
                };

                await _context.OrderFileMsts.AddAsync(orderFile);
            }
        }

        await _context.SaveChangesAsync();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOrder(long id)
    {
        var order = await _context.OrderDetails.FindAsync(id);
        if (order == null) return NotFound();

        _context.OrderDetails.Remove(order);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Order deleted successfully" });
    }
}
