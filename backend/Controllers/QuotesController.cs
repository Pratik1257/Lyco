using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Lyco.Api.Data;
using Lyco.Api.Models;
using Lyco.Api.DTOs;
using Lyco.Api.Services;
using Microsoft.AspNetCore.Authorization;

namespace Lyco.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class QuotesController : ControllerBase
{
    private readonly LycoDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly IEmailService _email;

    public QuotesController(LycoDbContext context, IWebHostEnvironment env, IEmailService email)
    {
        _context = context;
        _env = env;
        _email = email;
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
        // Filters
        var filteredQuery = from q in query
                           join u in _context.UserRegistrations on q.UniqueNo equals u.UniqueNo into users
                           from user in users.DefaultIfEmpty()
                           where (q.QuoteType == "Quote" || q.QuoteType == "Standard" || string.IsNullOrEmpty(q.QuoteType)) &&
                                 (string.IsNullOrEmpty(search) || 
                                 (q.QuoteNo != null && q.QuoteNo.Contains(search)) ||
                                 (q.Email != null && q.Email.Contains(search)) ||
                                 (q.WorkTitle != null && q.WorkTitle.Contains(search)) ||
                                 (user != null && user.Username != null && user.Username.Contains(search)) ||
                                 (user != null && user.Firstname != null && user.Firstname.Contains(search)) ||
                                 (user != null && user.Lastname != null && user.Lastname.Contains(search)) ||
                                 (user != null && (user.Firstname + " " + user.Lastname).Contains(search)))
                           select new { q, user };

        // Project
        var joinedQuery = filteredQuery.Select(x => new
        {
            x.q.QuoteId,
            x.q.QuoteNo,
            x.q.QuoteDate,
            x.q.WorkTitle, // PO No.
            x.q.Amount,
            x.q.Currency,
            x.q.Email,
            x.q.ServiceId,
            Username = x.user != null ? x.user.Username : "--",
            Fullname = x.user != null ? (x.user.Firstname + " " + x.user.Lastname).Trim() : "--",
            ServiceName = x.q.Service != null ? x.q.Service.ServiceName : "Others",
            x.q.Instructions,
            x.q.Size,
            x.q.Sizetype,
            x.q.FileFormat,
            x.q.UniqueNo
        });

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
            UserId = user?.UserId,
            quote.ServiceId,
            quote.QuoteType,
            quote.ImageUrl,
            Username = user?.Username ?? "--",
            Fullname = user != null ? $"{user.Firstname} {user.Lastname}".Trim() : "--",
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
            QuoteType = string.IsNullOrEmpty(dto.QuoteType) || dto.QuoteType == "Standard" ? "Quote" : dto.QuoteType,
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

        // 11.4 — Fire quote-received email to customer (mirrors RequestQuote.aspx.cs)
        if (!string.IsNullOrWhiteSpace(quote.Email))
        {
            var svc = await _context.ServiceMsts.FirstOrDefaultAsync(s => s.ServiceId == quote.ServiceId);
            _ = _email.SendQuoteReceivedAsync(
                quote.Email,
                quote.QuoteNo ?? "",
                quote.WorkTitle ?? "",
                svc?.ServiceName ?? "",
                quote.Size ?? "",
                quote.Sizetype ?? "",
                quote.FileFormat ?? "",
                quote.Instructions ?? ""
            );
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
    public async Task<IActionResult> ConvertToOrder(long id, [FromBody] ConvertQuoteDto? dto)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        // Use rate from admin input if provided, otherwise fall back to stored quote amount
        var finalAmount = dto?.Amount ?? quote.Amount;
        var finalCurrency = dto?.Currency ?? quote.Currency;

        // Guard: Cannot convert without a rate
        if (string.IsNullOrWhiteSpace(finalAmount) || finalAmount == "0" || finalAmount == "0.00")
        {
            return BadRequest(new { message = "A rate must be set before converting this quote to an order." });
        }

        // Check if an order with this number already exists (without QT-)
        var orderNo = quote.QuoteNo?.Replace("QT-", "") ?? "";
        var orderExists = await _context.OrderDetails.AnyAsync(o => o.OrderNo == orderNo);
        if (orderExists)
        {
            return BadRequest(new { message = "An order with this number already exists. It may have been converted already." });
        }

        // BUG-Q3 fix: use sequence portion of OrderNo, not a GUID
        var orderParts = orderNo.Split('-');
        var orderuq = orderParts.Length >= 1 ? orderParts.Last() : orderNo;

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
            Amount = finalAmount,
            Currency = finalCurrency,
            Email = quote.Email,
            OrderStatus = "In Process",
            OrderState = "New",
            PaymentStatus = "Pending",
            Ordertype = "Order",
            Orderuq = orderuq
        };

        _context.OrderDetails.Add(order);
        
        // Migrate files in OrderFileMst from QuoteNo to OrderNo
        var quoteFiles = await _context.OrderFileMsts
            .Where(f => f.OrderNo == quote.QuoteNo)
            .ToListAsync();

        foreach (var file in quoteFiles)
        {
            file.OrderNo = orderNo;
            file.FileStatus = "Order";
            file.LastModifieddate = DateTime.Now;
        }

        // Preserve quote record but mark as converted
        quote.QuoteType = "Order";

        await _context.SaveChangesAsync();

        return Ok(new { message = "Quote successfully converted to Order", orderId = order.OrderId, orderNo = order.OrderNo });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteQuote(long id)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return NotFound();

        // 1. Find all associated files for this quote
        if (!string.IsNullOrEmpty(quote.QuoteNo))
        {
            var filesToRemove = await _context.OrderFileMsts
                .Where(f => f.OrderNo == quote.QuoteNo)
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

        // 4. Remove the quote itself
        _context.Quotes.Remove(quote);
        await _context.SaveChangesAsync();
        
        return Ok(new { message = "Quote and associated files deleted successfully" });
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
