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
        [FromQuery] long? uniqueNo = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var query = _context.OrderDetails
            .Include(o => o.Service)
            .AsQueryable();

        // Filters
        var filteredQuery = from o in query
                           join u in _context.UserRegistrations on o.UniqueNo equals u.UniqueNo into users
                           from user in users.DefaultIfEmpty()
                           where string.IsNullOrEmpty(search) || 
                                 (o.OrderNo != null && o.OrderNo.Contains(search)) ||
                                 (o.Email != null && o.Email.Contains(search)) ||
                                 (o.WorkTitle != null && o.WorkTitle.Contains(search)) ||
                                 (user != null && user.Username != null && user.Username.Contains(search)) ||
                                 (user != null && user.Firstname != null && user.Firstname.Contains(search)) ||
                                 (user != null && user.Lastname != null && user.Lastname.Contains(search)) ||
                                 (user != null && (user.Firstname + " " + user.Lastname).Contains(search))
                           select new { o, user };

        // Project
        var joinedQuery = filteredQuery.Select(x => new
        {
            x.o.OrderId,
            x.o.OrderNo,
            x.o.OrderDate,
            x.o.WorkTitle, // PO No.
            x.o.Amount,
            x.o.Currency,
            x.o.OrderStatus,
            x.o.CompletedDate,
            x.o.Email, // Email from OrderDetail
            Username = x.user != null ? x.user.Username : "--",
            Fullname = x.user != null ? (x.user.Firstname + " " + x.user.Lastname).Trim() : "--",
            ServiceName = x.o.Service != null ? x.o.Service.ServiceName : "Others",
            x.o.ServiceId,
            x.o.Size,
            x.o.Sizetype,
            x.o.Instructions,
            x.o.Note,
            FileFormat = x.o.FileFormat,
            UniqueNo = x.o.UniqueNo,
            PaymentStatus = x.o.PaymentStatus,
            InvoiceId = x.o.InvoiceId,
            InvoiceNo = x.o.InvoiceNo,
            ExternalLink = _context.OrderFileMsts
               .Where(f => f.OrderNo == x.o.OrderNo && f.FileName == "External Asset Link")
               .Select(f => f.FileUrl)
               .FirstOrDefault()
        });

        if (!string.IsNullOrEmpty(status) && status != "all")
        {
            joinedQuery = joinedQuery.Where(o => o.OrderStatus != null && o.OrderStatus.ToLower() == status.ToLower());
        }

        if (serviceId.HasValue)
        {
            joinedQuery = joinedQuery.Where(o => o.ServiceId == serviceId.Value);
        }

        if (uniqueNo.HasValue)
        {
            joinedQuery = joinedQuery.Where(o => o.UniqueNo == uniqueNo.Value);
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

        // Get external link from files table
        var externalLink = await _context.OrderFileMsts
            .Where(f => f.OrderNo == order.OrderNo && f.FileName == "External Asset Link")
            .Select(f => f.FileUrl)
            .FirstOrDefaultAsync();

        // Fallback removed to allow Note column to store actual notes
        if (string.IsNullOrEmpty(externalLink))
        {
            externalLink = null;
        }

        // Get all other files
        var orderFiles = await _context.OrderFileMsts
            .Where(f => f.OrderNo == order.OrderNo && f.FileName != "External Asset Link")
            .ToListAsync();

        return Ok(new
        {
            order.OrderId,
            order.OrderNo,
            order.OrderDate,
            order.WorkTitle,
            order.Instructions,
            order.Note,
            order.FileFormat,
            order.Size,
            order.Sizetype,
            order.Amount,
            order.Currency,
            order.Email,
            order.UniqueNo,
            order.ServiceId,
            order.OrderStatus,
            ExternalLink = externalLink,
            Files = orderFiles,
            Username = user?.Username ?? "--",
            Fullname = user != null ? $"{user.Firstname} {user.Lastname}".Trim() : "--",
            CompanyName = user?.Companyname ?? "--",
            ServiceName = order.Service?.ServiceName ?? "Others"
        });
    }

    [HttpGet("next-number")]
    public async Task<IActionResult> GetNextOrderNumber([FromQuery] long uniqueNo)
    {
        // Find max sequence in Orders
        var maxOrderSeq = 0;
        var lastOrder = await _context.OrderDetails
            .Where(o => o.UniqueNo == uniqueNo && o.OrderNo != null && o.OrderNo.Contains("-"))
            .OrderByDescending(o => o.OrderId)
            .FirstOrDefaultAsync();

        if (lastOrder?.OrderNo != null)
        {
            var parts = lastOrder.OrderNo.Split('-');
            if (parts.Length >= 2 && int.TryParse(parts.Last(), out var seq))
                maxOrderSeq = seq;
        }

        // Find max sequence in Quotes
        var maxQuoteSeq = 0;
        var lastQuote = await _context.Quotes
            .Where(q => q.UniqueNo == uniqueNo && q.QuoteNo != null && q.QuoteNo.Contains("-"))
            .OrderByDescending(q => q.QuoteId)
            .FirstOrDefaultAsync();

        if (lastQuote?.QuoteNo != null)
        {
            var parts = lastQuote.QuoteNo.Split('-');
            if (parts.Length >= 2 && int.TryParse(parts.Last(), out var seq))
                maxQuoteSeq = seq;
        }

        // Use the highest sequence across both tables + 1
        var nextSequence = Math.Max(maxOrderSeq, maxQuoteSeq) + 1;
        
        // Fallback for cases where string parsing fails but records exist
        if (nextSequence == 1)
        {
            var orderCount = await _context.OrderDetails.CountAsync(o => o.UniqueNo == uniqueNo);
            var quoteCount = await _context.Quotes.CountAsync(q => q.UniqueNo == uniqueNo);
            nextSequence = Math.Max(orderCount, quoteCount) + 1;
        }

        return Ok(new { orderNo = $"{uniqueNo}-{nextSequence}" });
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
            Note = dto.Note,
            FileFormat = dto.FileFormat,
            Size = dto.Size,
            Sizetype = dto.Sizetype,
            Amount = dto.Amount,
            Currency = dto.Currency,
            Email = dto.Email,
            OrderStatus = "In Process",
            PaymentStatus = "Pending",
            OrderState = "New",
            Orderuq = orderNo.Contains('-') ? orderNo.Split('-').Last() : orderNo
        };

        // Manual Validation: Check if User and Service exist
        var userExists = await _context.UserRegistrations.AnyAsync(u => u.UniqueNo == dto.UniqueNo);
        if (!userExists) return BadRequest(new { message = "Selected user does not exist" });

        var serviceExists = await _context.ServiceMsts.AnyAsync(s => s.ServiceId == dto.ServiceId);
        if (!serviceExists) return BadRequest(new { message = "Selected service does not exist" });

        // Validate Amount is numeric
        if (!decimal.TryParse(dto.Amount, out _)) return BadRequest(new { message = "Rate must be a valid number" });

        // Fetch username for audit trail
        var customer = await _context.UserRegistrations.FirstOrDefaultAsync(u => u.UniqueNo == dto.UniqueNo);
        var modifiedBy = customer?.Username ?? "Admin";

        _context.OrderDetails.Add(order);
        await _context.SaveChangesAsync();

        if (files != null && files.Count > 0)
        {
            await SaveFilesAsync(order.OrderNo ?? "", files, modifiedBy);
        }

        if (!string.IsNullOrEmpty(dto.ExternalLink))
        {
            await SaveExternalLinkAsync(order.OrderNo ?? "", dto.ExternalLink, modifiedBy);
        }

        return Ok(order);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateOrder(long id, [FromForm] OrderCreateDto dto, List<IFormFile> files)
    {
        var order = await _context.OrderDetails.Include(o => o.Service).FirstOrDefaultAsync(o => o.OrderId == id);
        if (order == null) return NotFound();

        order.ServiceId = dto.ServiceId;
        order.WorkTitle = dto.WorkTitle;
        order.Instructions = dto.Instructions;
        order.Note = dto.Note;
        order.FileFormat = dto.FileFormat;
        order.Size = dto.Size;
        order.Sizetype = dto.Sizetype;
        order.Amount = dto.Amount;
        order.Currency = dto.Currency;
        order.Email = dto.Email;

        // Manual Validation
        var serviceExistsUpdate = await _context.ServiceMsts.AnyAsync(s => s.ServiceId == dto.ServiceId);
        if (!serviceExistsUpdate) return BadRequest(new { message = "Selected service does not exist" });

        if (!decimal.TryParse(dto.Amount, out _)) return BadRequest(new { message = "Rate must be a valid number" });
        
        // Update Status
        if (!string.IsNullOrEmpty(dto.OrderStatus))
        {
            order.OrderStatus = dto.OrderStatus;
            if (dto.OrderStatus == "Completed")
            {
                order.CompletedDate = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Eastern Standard Time");
                order.OrderState = "Completed";

                // Digitizing Price Recalculation (Legacy Logic)
                if (order.Service?.ServiceName == "Digitizing" && !string.IsNullOrEmpty(dto.Stitches))
                {
                    if (decimal.TryParse(dto.Stitches, out var stitchCount) && decimal.TryParse(dto.Amount, out var rate))
                    {
                        order.Stitches = dto.Stitches;
                        var finalAmount = (stitchCount / 1000m) * rate;
                        order.Amount = finalAmount.ToString("F2");
                    }
                }
            }
            else
            {
                order.CompletedDate = null;
            }
        }

        // Fetch username for audit trail
        var customerUpdate = await _context.UserRegistrations.FirstOrDefaultAsync(u => u.UniqueNo == dto.UniqueNo);
        var modifiedByUpdate = customerUpdate?.Username ?? "Admin";

        await _context.SaveChangesAsync();

        // Save new attachments
        if (files != null && files.Count > 0)
        {
            var fileStatus = dto.OrderStatus == "Completed" ? "Completed" : "Active";
            await SaveFilesAsync(order.OrderNo ?? "", files, modifiedByUpdate, fileStatus);
        }

        // Handle file deletions
        if (dto.FilesToDelete != null && dto.FilesToDelete.Count > 0)
        {
            var filesToRemove = await _context.OrderFileMsts
                .Where(f => dto.FilesToDelete.Contains(f.OrderFileId))
                .ToListAsync();

            if (filesToRemove.Any())
            {
                foreach (var file in filesToRemove)
                {
                    // Delete from physical storage
                    var fullPath = Path.Combine(_env.ContentRootPath, "wwwroot", file.FileUrl?.TrimStart('/') ?? "");
                    if (System.IO.File.Exists(fullPath))
                    {
                        try { System.IO.File.Delete(fullPath); } catch {}
                    }
                }
                _context.OrderFileMsts.RemoveRange(filesToRemove);
                await _context.SaveChangesAsync();
            }
        }

        if (!string.IsNullOrEmpty(dto.ExternalLink))
        {
            await SaveExternalLinkAsync(order.OrderNo ?? "", dto.ExternalLink, modifiedByUpdate);
        }

        return Ok(order);
    }

    private async Task SaveFilesAsync(string orderNo, List<IFormFile> files, string modifiedBy, string fileStatus = "Active")
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
                    FileStatus = fileStatus,
                    LastModifieddate = DateTime.Now,
                    LastModifiedBy = modifiedBy,
                    LastModifiedUserType = "Admin"
                };

                await _context.OrderFileMsts.AddAsync(orderFile);
            }
        }

        await _context.SaveChangesAsync();
    }

    private async Task SaveExternalLinkAsync(string orderNo, string externalLink, string modifiedBy)
    {
        // Check if an external link already exists for this order
        var existingLink = await _context.OrderFileMsts
            .FirstOrDefaultAsync(f => f.OrderNo == orderNo && f.FileName == "External Asset Link");

        if (existingLink != null)
        {
            existingLink.FileUrl = externalLink;
            existingLink.LastModifieddate = DateTime.Now;
        }
        else
        {
            var orderFile = new OrderFileMst
            {
                OrderNo = orderNo,
                FileName = "External Asset Link",
                FileUrl = externalLink,
                FileStatus = "Active",
                LastModifieddate = DateTime.Now,
                LastModifiedBy = modifiedBy,
                LastModifiedUserType = "Admin"
            };
            await _context.OrderFileMsts.AddAsync(orderFile);
        }

        await _context.SaveChangesAsync();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOrder(long id)
    {
        var order = await _context.OrderDetails.FindAsync(id);
        if (order == null) return NotFound();

        if (order.PaymentStatus == "Completed")
            return BadRequest(new { message = "Cannot delete a paid order" });

        // 1. Find all associated files for this order
        if (!string.IsNullOrEmpty(order.OrderNo))
        {
            var filesToRemove = await _context.OrderFileMsts
                .Where(f => f.OrderNo == order.OrderNo)
                .ToListAsync();

            if (filesToRemove.Any())
            {
                // 2. Delete physical files from disk to prevent storage leaks
                foreach (var file in filesToRemove)
                {
                    if (!string.IsNullOrEmpty(file.FileUrl) && !file.FileUrl.StartsWith("http"))
                    {
                        var fullPath = Path.Combine(_env.ContentRootPath, "wwwroot", file.FileUrl.TrimStart('/'));
                        if (System.IO.File.Exists(fullPath))
                        {
                            try { System.IO.File.Delete(fullPath); } catch { }
                        }
                    }
                }
                
                // 3. Remove file records from the database
                _context.OrderFileMsts.RemoveRange(filesToRemove);
            }
        }

        // 4. Remove the order itself
        _context.OrderDetails.Remove(order);
        await _context.SaveChangesAsync();
        
        return Ok(new { message = "Order and associated files deleted successfully" });
    }
}
