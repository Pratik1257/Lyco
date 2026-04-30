using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Lyco.Api.Data;
using Lyco.Api.Models;
using Lyco.Api.DTOs;
using Lyco.Api.Services;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Lyco.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class InvoicesController : ControllerBase
{
    private readonly LycoDbContext _context;
    private readonly IInvoicePdfService _pdfService;
    private readonly IWebHostEnvironment _env;

    public InvoicesController(LycoDbContext context, IInvoicePdfService pdfService, IWebHostEnvironment env)
    {
        _context = context;
        _pdfService = pdfService;
        _env = env;
    }

    // ── GET /api/Invoices ─────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetInvoices(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var query = _context.InvoiceMsts
            .Include(i => i.User)
            .Include(i => i.InvoiceTransactions)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(i =>
                (i.InvoiceNo != null && i.InvoiceNo.Contains(search)) ||
                (i.User != null && i.User.Username != null && i.User.Username.Contains(search)) ||
                (i.User != null && i.User.Firstname != null && i.User.Firstname.Contains(search)) ||
                (i.User != null && i.User.Lastname != null && i.User.Lastname.Contains(search)) ||
                (i.User != null && (i.User.Firstname + " " + i.User.Lastname).Contains(search)) ||
                (i.User != null && i.User.Companyname != null && i.User.Companyname.Contains(search))
            );
        }

        if (startDate.HasValue)
        {
            query = query.Where(i => i.InvoiceDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(i => i.InvoiceDate <= endDate.Value);
        }

        var totalCount = await query.CountAsync();
        var rawItems = await query
            .OrderByDescending(i => i.InvoiceDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // For each invoice, derive status from linked orders' PaymentStatus
        var invoiceIds = rawItems.Select(i => i.InvoiceId).ToList();
        var linkedOrders = await _context.OrderDetails
            .Where(o => o.InvoiceId != null && invoiceIds.Contains((long)o.InvoiceId))
            .Select(o => new { o.InvoiceId, o.PaymentStatus, o.OrderNo })
            .ToListAsync();

        var items = rawItems.Select(i =>
        {
            var orders = linkedOrders.Where(o => o.InvoiceId == i.InvoiceId).ToList();
            var derivedStatus = orders.Count > 0 && orders.All(o => o.PaymentStatus == "Completed")
                ? "Completed" : "Pending";
            var orderNos = orders.Select(o => o.OrderNo ?? "").Where(n => n != "").ToList();
            var orderNoDisplay = BuildOrderNoDisplay(orderNos);

            return new
            {
                i.InvoiceId,
                i.InvoiceNo,
                i.InvoiceDate,
                i.Amount,
                i.Po,
                InvoiceType = orders.Count > 1 ? "Combined" : "Individual",
                PdfUrl = i.InvoiceUrl,
                Username = i.User?.Username ?? "--",
                Fullname = i.User != null ? $"{i.User.Firstname} {i.User.Lastname}".Trim() : "--",
                CompanyName = i.User?.Companyname ?? "--",
                CustomerId = i.User?.UniqueNo?.ToString() ?? "--",
                OrderNos = orderNoDisplay,
                Status = derivedStatus
            };
        }).ToList();

        // Filter by derived status if requested
        if (!string.IsNullOrEmpty(status) && status != "all")
        {
            items = items.Where(i => i.Status.Equals(status, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        return Ok(new
        {
            items,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    // ── POST /api/Invoices ────────────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> CreateInvoice([FromBody] InvoiceCreateDto dto)
    {
        if (dto == null || dto.OrderIds.Count == 0)
            return BadRequest(new { message = "No orders selected for invoicing" });

        var user = await _context.UserRegistrations.FindAsync(dto.UserId);
        if (user == null)
            return BadRequest(new { message = "User not found" });

        var orders = await _context.OrderDetails
            .Where(o => dto.OrderIds.Contains(o.OrderId))
            .ToListAsync();

        if (orders.Count == 0)
            return BadRequest(new { message = "Orders not found" });

        // Ensure invoices directory exists
        var invoicesDir = Path.Combine(_env.WebRootPath, "invoices");
        Directory.CreateDirectory(invoicesDir);

        var createdInvoices = new List<object>();

        if (dto.InvoiceType == "Individual")
        {
            // One invoice per order
            foreach (var order in orders)
            {
                var invoiceNo = await GenerateInvoiceNo();
                var orderAmount = decimal.TryParse(order.Amount, out var amt) ? amt : 0m;

                var invoice = new InvoiceMst
                {
                    InvoiceNo = invoiceNo,
                    InvoiceDate = DateTime.Now,
                    CreatedDate = DateTime.Now,
                    UserId = dto.UserId,
                    Amount = orderAmount.ToString("F2"),
                    Po = order.WorkTitle ?? "",
                    Description = $"Individual invoice for order {order.OrderNo}"
                };

                _context.InvoiceMsts.Add(invoice);
                await _context.SaveChangesAsync();

                // Transaction
                _context.InvoiceTransactions.Add(new InvoiceTransaction
                {
                    InvoiceId = invoice.InvoiceId,
                    OrderId = order.OrderId,
                    OrderNo = order.OrderNo,
                    Amount = order.Amount,
                    OrderDate = order.OrderDate
                });

                // Update order
                order.PaymentStatus = "Pending";
                order.InvoiceId = invoice.InvoiceId;
                order.InvoiceNo = invoice.InvoiceNo;

                // Generate PDF
                var detail = BuildInvoiceDetail(invoice, user, new List<OrderDetail> { order });
                var pdfBytes = _pdfService.Generate(detail);
                var pdfFileName = $"{invoiceNo}.pdf";
                var pdfPath = Path.Combine(invoicesDir, pdfFileName);
                await System.IO.File.WriteAllBytesAsync(pdfPath, pdfBytes);
                invoice.InvoiceUrl = $"/invoices/{pdfFileName}";

                await _context.SaveChangesAsync();

                createdInvoices.Add(new
                {
                    invoiceNo = invoice.InvoiceNo,
                    invoiceId = invoice.InvoiceId,
                    pdfUrl = invoice.InvoiceUrl
                });
            }
        }
        else // Combined
        {
            var invoiceNo = await GenerateInvoiceNo();
            var totalAmount = orders.Sum(o => decimal.TryParse(o.Amount, out var a) ? a : 0m);

            var invoice = new InvoiceMst
            {
                InvoiceNo = invoiceNo,
                InvoiceDate = DateTime.Now,
                CreatedDate = DateTime.Now,
                UserId = dto.UserId,
                Amount = totalAmount.ToString("F2"),
                Po = string.Join(", ", orders.Select(o => o.WorkTitle).Where(t => !string.IsNullOrEmpty(t))),
                Description = $"Combined invoice for {orders.Count} orders"
            };

            _context.InvoiceMsts.Add(invoice);
            await _context.SaveChangesAsync();

            foreach (var order in orders)
            {
                _context.InvoiceTransactions.Add(new InvoiceTransaction
                {
                    InvoiceId = invoice.InvoiceId,
                    OrderId = order.OrderId,
                    OrderNo = order.OrderNo,
                    Amount = order.Amount,
                    OrderDate = order.OrderDate
                });

                order.PaymentStatus = "Pending";
                order.InvoiceId = invoice.InvoiceId;
                order.InvoiceNo = invoice.InvoiceNo;
            }

            // Generate PDF
            var detail = BuildInvoiceDetail(invoice, user, orders);
            var pdfBytes = _pdfService.Generate(detail);
            var pdfFileName = $"{invoiceNo}.pdf";
            var pdfPath = Path.Combine(invoicesDir, pdfFileName);
            await System.IO.File.WriteAllBytesAsync(pdfPath, pdfBytes);
            invoice.InvoiceUrl = $"/invoices/{pdfFileName}";

            await _context.SaveChangesAsync();

            createdInvoices.Add(new
            {
                invoiceNo = invoice.InvoiceNo,
                invoiceId = invoice.InvoiceId,
                pdfUrl = invoice.InvoiceUrl
            });
        }

        return Ok(new { invoices = createdInvoices });
    }

    // ── PUT /api/Invoices/{id}/status ─────────────────────────────────────────
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateInvoiceStatusDto dto)
    {
        if (dto.Status != "Completed" && dto.Status != "Pending")
            return BadRequest(new { message = "Status must be 'Completed' or 'Pending'" });

        var orders = await _context.OrderDetails
            .Where(o => o.InvoiceId == id)
            .ToListAsync();

        if (orders.Count == 0)
            return NotFound(new { message = "No orders linked to this invoice" });

        foreach (var order in orders)
            order.PaymentStatus = dto.Status;

        await _context.SaveChangesAsync();
        return Ok(new { message = $"Invoice status updated to {dto.Status}" });
    }

    // ── GET /api/Invoices/next-number ─────────────────────────────────────────
    [HttpGet("next-number")]
    public async Task<IActionResult> GetNextInvoiceNumber()
    {
        var nextNo = await GenerateInvoiceNo();
        return Ok(new { invoiceNo = nextNo });
    }

    // ── GET /api/Invoices/{id}/pdf ────────────────────────────────────────────
    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> DownloadPdf(long id)
    {
        var invoice = await _context.InvoiceMsts
            .Include(i => i.User)
            .Include(i => i.InvoiceTransactions)
            .FirstOrDefaultAsync(i => i.InvoiceId == id);

        if (invoice == null) return NotFound();

        var orders = await _context.OrderDetails
            .Where(o => o.InvoiceId == id)
            .ToListAsync();

        var detail = BuildInvoiceDetail(invoice, invoice.User!, orders);
        var pdfBytes = _pdfService.Generate(detail);

        return File(pdfBytes, "application/pdf", $"{invoice.InvoiceNo}.pdf");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private static InvoiceDetailDto BuildInvoiceDetail(InvoiceMst invoice, UserRegistration user, List<OrderDetail> orders)
    {
        return new InvoiceDetailDto
        {
            InvoiceId = invoice.InvoiceId,
            InvoiceNo = invoice.InvoiceNo ?? "",
            InvoiceDate = invoice.InvoiceDate ?? DateTime.Now,
            CompanyName = user.Companyname ?? "",
            ContactName = $"{user.Firstname ?? ""} {user.Lastname ?? ""}".Trim(),
            Phone = user.Telephone ?? "",
            Email = user.PrimaryEmail ?? "",
            CustomerId = user.UniqueNo?.ToString() ?? "",
            TotalAmount = invoice.Amount ?? "0.00",
            LineItems = orders.Select(o => new InvoiceLineItemDto
            {
                OrderNo = o.OrderNo ?? "",
                OrderDate = o.OrderDate,
                Description = o.WorkTitle ?? "",
                Amount = o.Amount ?? "0.00"
            }).ToList()
        };
    }

    private async Task<string> GenerateInvoiceNo()
    {
        var lastInvoice = await _context.InvoiceMsts
            .Where(i => i.InvoiceNo != null && i.InvoiceNo.StartsWith("SMIN"))
            .OrderByDescending(i => i.InvoiceId)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastInvoice?.InvoiceNo != null)
        {
            var numericPart = lastInvoice.InvoiceNo.Replace("SMIN", "");
            if (int.TryParse(numericPart, out int lastNumber))
                nextNumber = lastNumber + 1;
        }

        return $"SMIN{nextNumber}";
    }

    private static string BuildOrderNoDisplay(List<string> orderNos)
    {
        if (orderNos.Count == 0) return "--";
        if (orderNos.Count == 1) return orderNos[0];

        // Extract numeric suffixes: "113-61" → 61
        var nums = orderNos
            .Select(n => { var p = n.Split('-'); return int.TryParse(p.Last(), out int v) ? v : -1; })
            .Where(v => v >= 0)
            .OrderBy(v => v)
            .ToList();

        return nums.Count >= 2 ? $"{nums.First()} to {nums.Last()}" : string.Join(", ", orderNos);
    }
}

public class UpdateInvoiceStatusDto
{
    public string Status { get; set; } = "Pending";
}
