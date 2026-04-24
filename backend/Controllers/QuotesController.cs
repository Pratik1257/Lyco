using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Lyco.Api.Data;
using Lyco.Api.Models;
using Lyco.Api.DTOs;

namespace Lyco.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class QuotesController : ControllerBase
{
    private readonly LycoDbContext _context;
    private readonly IWebHostEnvironment _env;

    public QuotesController(LycoDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> GetQuotes(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] long? serviceId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var query = _context.Quotes
            .Include(q => q.Service)
            .AsQueryable();

        // Joins with UserRegistration via UniqueNo
        var joinedQuery = from q in query
                         join u in _context.UserRegistrations on q.UniqueNo equals u.UniqueNo into users
                         from user in users.DefaultIfEmpty()
                         select new
                         {
                             q.QuoteId,
                             q.QuoteNo,
                             q.QuoteDate,
                             q.WorkTitle, // PO No.
                             q.Amount,
                             q.Currency,
                             q.Email,
                             q.ServiceId,
                             Username = user != null ? user.Username : "--",
                             ServiceName = q.Service != null ? q.Service.ServiceName : "Others",
                             q.Instructions,
                             q.Size,
                             q.Sizetype,
                             q.FileFormat,
                             q.UniqueNo
                         };

        // Filters
        if (!string.IsNullOrEmpty(search))
        {
            joinedQuery = joinedQuery.Where(q => 
                (q.QuoteNo != null && q.QuoteNo.Contains(search)) ||
                (q.Username != null && q.Username.Contains(search)) ||
                (q.Email != null && q.Email.Contains(search)) ||
                (q.WorkTitle != null && q.WorkTitle.Contains(search))
            );
        }

        if (serviceId.HasValue)
        {
            joinedQuery = joinedQuery.Where(q => q.ServiceId == serviceId.Value);
        }

        if (startDate.HasValue)
        {
            joinedQuery = joinedQuery.Where(q => q.QuoteDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
            joinedQuery = joinedQuery.Where(q => q.QuoteDate <= endOfDay);
        }

        // Sort by date descending
        joinedQuery = joinedQuery.OrderByDescending(q => q.QuoteDate);

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
    public async Task<IActionResult> GetQuoteById(long id)
    {
        var quote = await _context.Quotes
            .Include(q => q.Service)
            .FirstOrDefaultAsync(q => q.QuoteId == id);

        if (quote == null) return NotFound();

        var user = await _context.UserRegistrations.FirstOrDefaultAsync(u => u.UniqueNo == quote.UniqueNo);

        // Get files from OrderFileMst table using QuoteNo
        var files = await _context.OrderFileMsts
            .Where(f => f.OrderNo == quote.QuoteNo)
            .ToListAsync();

        return Ok(new
        {
            quote.QuoteId,
            quote.QuoteNo,
            quote.QuoteDate,
            quote.WorkTitle,
            quote.Instructions,
            quote.FileFormat,
            quote.Size,
            quote.Sizetype,
            quote.Amount,
            quote.Currency,
            quote.Email,
            quote.UniqueNo,
            quote.ServiceId,
            quote.QuoteType,
            quote.ImageUrl,
            Username = user?.Username ?? "--",
            CompanyName = user?.Companyname ?? "--",
            ServiceName = quote.Service?.ServiceName ?? "Others",
            Files = files
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateQuote([FromForm] QuoteCreateDto dto, List<IFormFile> files)
    {
        var quote = new Quote
        {
            UniqueNo = dto.UniqueNo,
            QuoteNo = dto.QuoteNo,
            ServiceId = dto.ServiceId,
            WorkTitle = dto.WorkTitle,
            Instructions = dto.Instructions,
            FileFormat = dto.FileFormat,
            Size = dto.Size,
            Sizetype = dto.Sizetype,
            Amount = dto.Amount,
            Currency = dto.Currency,
            Email = dto.Email,
            QuoteType = dto.QuoteType,
            ImageUrl = dto.ImageUrl,
            QuoteDate = DateTime.Now,
            Quoteuq = Guid.NewGuid().ToString().Substring(0, 8)
        };

        _context.Quotes.Add(quote);
        await _context.SaveChangesAsync();

        if (files != null && files.Count > 0)
        {
            await SaveFilesAsync(quote.QuoteNo ?? "", files);
        }

        return Ok(quote);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateQuote(long id, [FromForm] QuoteCreateDto dto, List<IFormFile> files)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        quote.ServiceId = dto.ServiceId;
        quote.WorkTitle = dto.WorkTitle;
        quote.Instructions = dto.Instructions;
        quote.FileFormat = dto.FileFormat;
        quote.Size = dto.Size;
        quote.Sizetype = dto.Sizetype;
        quote.Amount = dto.Amount;
        quote.Currency = dto.Currency;
        quote.Email = dto.Email;
        quote.QuoteType = dto.QuoteType;
        quote.ImageUrl = dto.ImageUrl;

        await _context.SaveChangesAsync();

        if (files != null && files.Count > 0)
        {
            await SaveFilesAsync(quote.QuoteNo ?? "", files);
        }

        // Handle file deletions
        if (dto.FilesToDelete != null && dto.FilesToDelete.Count > 0)
        {
            var filesToRemove = await _context.OrderFileMsts
                .Where(f => f.OrderNo == quote.QuoteNo && dto.FilesToDelete.Contains(f.OrderFileId))
                .ToListAsync();

            if (filesToRemove.Any())
            {
                foreach (var file in filesToRemove)
                {
                    var fullPath = Path.Combine(_env.ContentRootPath, "wwwroot", file.FileUrl?.TrimStart('/') ?? "");
                    if (System.IO.File.Exists(fullPath))
                    {
                        try { System.IO.File.Delete(fullPath); } catch { }
                    }
                }
                _context.OrderFileMsts.RemoveRange(filesToRemove);
                await _context.SaveChangesAsync();
            }
        }

        return Ok(quote);
    }

    [HttpGet("next-number")]
    public async Task<IActionResult> GetNextQuoteNumber([FromQuery] long uniqueNo)
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

        return Ok(new { quoteNo = $"QT-{uniqueNo}-{nextSequence}" });
    }

    [HttpPost("{id}/convert")]
    public async Task<IActionResult> ConvertToOrder(long id)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        // Check if an order with this number already exists (without QT-)
        var orderNo = quote.QuoteNo?.Replace("QT-", "") ?? "";
        var orderExists = await _context.OrderDetails.AnyAsync(o => o.OrderNo == orderNo);
        if (orderExists)
        {
            // If it exists, it might be a collision or already converted
            return BadRequest(new { message = "An order with this number already exists. It may have been converted already." });
        }

        var order = new OrderDetail
        {
            OrderNo = orderNo,
            OrderDate = DateTime.Now,
            UniqueNo = quote.UniqueNo,
            ServiceId = quote.ServiceId,
            WorkTitle = quote.WorkTitle,
            Instructions = quote.Instructions,
            FileFormat = quote.FileFormat,
            Size = quote.Size,
            Sizetype = quote.Sizetype,
            Amount = quote.Amount,
            Currency = quote.Currency,
            Email = quote.Email,
            OrderStatus = "In Process",
            Orderuq = Guid.NewGuid().ToString()
        };

        _context.OrderDetails.Add(order);
        
        // Migrate files in OrderFileMst from QuoteNo to OrderNo
        var quoteFiles = await _context.OrderFileMsts
            .Where(f => f.OrderNo == quote.QuoteNo)
            .ToListAsync();

        foreach (var file in quoteFiles)
        {
            file.OrderNo = orderNo;
            file.LastModifieddate = DateTime.Now;
        }

        // Remove the quote
        _context.Quotes.Remove(quote);

        await _context.SaveChangesAsync();

        return Ok(new { message = "Quote successfully converted to Order", orderId = order.OrderId, orderNo = order.OrderNo });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteQuote(long id)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        _context.Quotes.Remove(quote);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Quote deleted successfully" });
    }

    private async Task SaveFilesAsync(string quoteNo, List<IFormFile> files)
    {
        var uploadsPath = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "quotes");
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

                var quoteFile = new OrderFileMst
                {
                    OrderNo = quoteNo,
                    FileName = file.FileName,
                    FileUrl = $"/uploads/quotes/{fileName}",
                    FileStatus = "Active",
                    LastModifieddate = DateTime.Now,
                    LastModifiedBy = "Admin",
                    LastModifiedUserType = "Admin"
                };

                await _context.OrderFileMsts.AddAsync(quoteFile);
            }
        }

        await _context.SaveChangesAsync();
    }
}
