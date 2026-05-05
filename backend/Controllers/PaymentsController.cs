using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Lyco.Api.Data;
using Lyco.Api.Models;

namespace Lyco.Api.Controllers;

[Route("admin/api/[controller]")]
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
                          && (o.PaymentStatus == "Pending" || string.IsNullOrEmpty(o.PaymentStatus))
                          && (o.Ordertype == "Order" || string.IsNullOrEmpty(o.Ordertype))
                          && o.UniqueNo == uniqueNo
                    select new 
                    {
                        o.OrderId,
                        o.OrderNo,
                        o.OrderDate,
                        o.Amount,
                        Currency = o.Currency ?? u.Currency,
                        PoNo = o.WorkTitle
                    };

        var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync();
        return Ok(orders);
    }
    
    [HttpGet("bad-debt")]
    public async Task<IActionResult> GetBadDebtOrders([FromQuery] long uniqueNo)
    {
        var query = from o in _context.OrderDetails
                    join u in _context.UserRegistrations on o.UniqueNo equals u.UniqueNo
                    where o.OrderStatus == "Completed" 
                          && o.PaymentStatus == "Bad Debt" 
                          && o.UniqueNo == uniqueNo
                    select new 
                    {
                        o.OrderId,
                        o.OrderNo,
                        o.OrderDate,
                        o.Amount,
                        o.WorkTitle,
                        Currency = o.Currency ?? u.Currency
                    };

        var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync();
        return Ok(orders);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetPaymentSummary(
        [FromQuery] string? search = null,
        [FromQuery] long? serviceId = null,
        [FromQuery] string? paymentStatus = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = from o in _context.OrderDetails
                    join u in _context.UserRegistrations on o.UniqueNo equals u.UniqueNo into users
                    from user in users.DefaultIfEmpty()
                    join s in _context.ServiceMsts on o.ServiceId equals s.ServiceId into services
                    from service in services.DefaultIfEmpty()
                    select new
                    {
                        o.OrderId,
                        o.OrderNo,
                        o.OrderDate,
                        o.Amount,
                        o.Currency,
                        o.PaymentStatus,
                        o.PaymentDate,
                        o.InvoiceNo,
                        o.OrderStatus,
                        o.CompletedDate,
                        o.WorkTitle,
                        Username = user != null ? user.Username : "N/A",
                        Fullname = user != null ? (user.Firstname + " " + user.Lastname).Trim() : "N/A",
                        CompanyName = user != null ? user.Companyname : "N/A",
                        ServiceName = service != null ? service.ServiceName : "N/A",
                        o.ServiceId
                    };

        // Apply filters
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(o => 
                (o.OrderNo != null && o.OrderNo.Contains(search)) || 
                (o.Username != null && o.Username.Contains(search)) ||
                (o.CompanyName != null && o.CompanyName.Contains(search)));
        }

        if (serviceId.HasValue)
        {
            query = query.Where(o => o.ServiceId == serviceId.Value);
        }

        if (!string.IsNullOrEmpty(paymentStatus) && !paymentStatus.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(o => o.PaymentStatus == paymentStatus);
        }

        if (startDate.HasValue)
        {
            query = query.Where(o => o.OrderDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(o => o.OrderDate <= endDate.Value);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(o => o.OrderDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { items, totalCount });
    }

    public class UpdateStatusRequest
    {
        public List<long> OrderIds { get; set; } = new();
        public string Status { get; set; } = string.Empty;
    }

    [HttpPut("status")]
    public async Task<IActionResult> UpdateStatus([FromBody] UpdateStatusRequest request)
    {
        if (request.Status != "Completed" && request.Status != "Bad Debt" && request.Status != "Pending")
        {
            return BadRequest("Invalid status. Must be 'Completed', 'Bad Debt', or 'Pending'.");
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

    // ── GET /admin/api/Payments/pending-for-payment?userId= ─────────────────
    [HttpGet("pending-for-payment")]
    public async Task<IActionResult> GetPendingForPayment([FromQuery] long? userId)
    {
        long? filterUniqueNo = null;

        if (userId.HasValue)
        {
            var user = await _context.UserRegistrations
                .FirstOrDefaultAsync(u => u.UserId == userId.Value);
            
            if (user == null) 
                return NotFound(new { error = "User not found." });
            
            filterUniqueNo = user.UniqueNo;
        }

        var query = from o in _context.OrderDetails
                    join u in _context.UserRegistrations on o.UniqueNo equals u.UniqueNo into userGroup
                    from user in userGroup.DefaultIfEmpty()
                    join s in _context.ServiceMsts on o.ServiceId equals s.ServiceId into serviceGroup
                    from service in serviceGroup.DefaultIfEmpty()
                    where o.OrderStatus == "Completed"
                          && (o.PaymentStatus == "Pending" || string.IsNullOrEmpty(o.PaymentStatus))
                          && (o.Ordertype == "Order" || string.IsNullOrEmpty(o.Ordertype))
                    select new
                    {
                        o.OrderId,
                        o.OrderNo,
                        o.OrderDate,
                        o.Amount,
                        Currency = o.Currency ?? (user != null ? user.Currency : null) ?? "USD",
                        PoNo = o.WorkTitle,
                        ServiceName = service != null ? service.ServiceName : "N/A",
                        Username = user != null ? user.Username : "Unknown",
                        Fullname = user != null ? (user.Firstname + " " + user.Lastname).Trim() : "Unknown",
                        UniqueNo = o.UniqueNo
                    };

        if (filterUniqueNo.HasValue)
        {
            query = query.Where(q => q.UniqueNo == filterUniqueNo.Value);
        }

        var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync();
        return Ok(orders);
    }

    // ── POST /admin/api/Payments/initiate ────────────────────────────────────
    public class InitiatePaymentRequest
    {
        public long? UserId { get; set; } // Optional now
        public List<long> OrderIds { get; set; } = new();
    }

    [HttpPost("initiate")]
    public async Task<IActionResult> InitiatePayment([FromBody] InitiatePaymentRequest request)
    {
        if (request.OrderIds == null || !request.OrderIds.Any())
            return BadRequest(new { error = "No orders selected." });

        // Fetch and validate orders
        var orders = await _context.OrderDetails
            .Where(o => request.OrderIds.Contains(o.OrderId)
                        && (o.PaymentStatus == "Pending" || string.IsNullOrEmpty(o.PaymentStatus))
                        && o.OrderStatus == "Completed")
            .ToListAsync();

        if (orders.Count != request.OrderIds.Count)
            return BadRequest(new { error = "One or more orders are invalid or are not in Pending payment status." });

        // Ensure all orders have the same currency
        var firstOrder = orders.First();
        // We need to resolve currency carefully. If order.Currency is null, we'd ideally need the user's currency.
        // For simplicity in this bulk context, we'll fetch currencies if needed or assume order.Currency is populated.
        var distinctCurrencies = orders.Select(o => o.Currency).Distinct().ToList();
        if (distinctCurrencies.Count > 1)
            return BadRequest(new { error = "All selected orders must have the same currency for a single PayPal transaction." });

        var currency = firstOrder.Currency ?? "USD";

        // Compute total
        var total = orders.Sum(o => decimal.TryParse(o.Amount, out var a) ? a : 0m);
        if (total <= 0)
            return BadRequest(new { error = "Total amount must be greater than zero." });

        // Generate transaction number and stamp orders
        var transactionNumber = Guid.NewGuid().ToString();
        foreach (var order in orders)
        {
            order.TransactionNo = transactionNumber;
        }
        await _context.SaveChangesAsync();

        // Fetch PayPal business email
        var paypalRecord = await _context.BillingPaypalMasters.FirstOrDefaultAsync();
        var paypalEmail = paypalRecord?.Email ?? string.Empty;

        // Build PayPal URL
        var paypalParams = new Dictionary<string, string>
        {
            ["cmd"]           = "_xclick",
            ["business"]      = paypalEmail,
            ["amount"]        = total.ToString("F2"),
            ["currency_code"] = currency,
            ["item_name"]     = "Order Payment",
            ["custom"]        = transactionNumber,
            ["no_shipping"]   = "1",
            ["no_note"]       = "1",
            ["rm"]            = "2"
        };

        var queryString = string.Join("&", paypalParams.Select(kv =>
            $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}"));

        var paypalUrl = $"https://www.paypal.com/cgi-bin/webscr?{queryString}";

        return Ok(new { paypalUrl, transactionNumber });
    }
    // ── GET /admin/api/Payments/paypal-config ──────────────────────────────
    [HttpGet("paypal-config")]
    public async Task<IActionResult> GetPaypalConfig()
    {
        var config = await _context.BillingPaypalMasters.ToListAsync();
        return Ok(config);
    }

    public class PaypalConfigRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    // ── PUT /admin/api/Payments/paypal-config/{id} ───────────────────────────
    [HttpPut("paypal-config/{id}")]
    public async Task<IActionResult> UpdatePaypalConfig(long id, [FromBody] PaypalConfigRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { Message = "Email is required." });

        var config = await _context.BillingPaypalMasters.FindAsync(id);
        if (config == null)
            return NotFound(new { Message = "Configuration not found." });

        config.Email = request.Email;
        await _context.SaveChangesAsync();

        return Ok(new { Message = "PayPal email updated successfully." });
    }
}
