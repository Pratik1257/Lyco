using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Lyco.Api.Data;
using Lyco.Api.Models;
using System.Net.Http;
using System.Text;

namespace Lyco.Api.Controllers;

[Route("admin/api/[controller]")]
[ApiController]
public class PaymentsController : ControllerBase
{
    private readonly LycoDbContext _context;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;

    public PaymentsController(LycoDbContext context, IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet("pending-for-status")]
    public async Task<IActionResult> GetPendingForStatus([FromQuery] long uniqueNo)
    {
        var query = from o in _context.OrderDetails
                    join u in _context.UserRegistrations on o.UniqueNo equals u.UniqueNo
                    where (o.OrderStatus == "Completed" || o.OrderStatus == "Invoiced") 
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
                    where (o.OrderStatus == "Completed" || o.OrderStatus == "Invoiced") 
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
        [FromQuery] long? uniqueNo = null,
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
                        o.UniqueNo,
                        Username = user != null ? user.Username : "N/A",
                        Fullname = user != null ? (user.Firstname + " " + user.Lastname).Trim() : "N/A",
                        CompanyName = user != null ? user.Companyname : "N/A",
                        ServiceName = service != null ? service.ServiceName : "N/A",
                        o.ServiceId
                    };

        // Apply filters
        if (uniqueNo.HasValue)
        {
            query = query.Where(o => o.UniqueNo == uniqueNo.Value);
        }
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
                    where (o.OrderStatus == "Completed" || o.OrderStatus == "Invoiced")
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
                        && (o.OrderStatus == "Completed" || o.OrderStatus == "Invoiced"))
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

        // Normalize currency to PayPal ISO 4217 codes
        var currencyMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["USD"]  = "USD",
            ["EURO"] = "EUR",
            ["EUR"]  = "EUR",
            ["GBP"]  = "GBP",
            ["AUD"]  = "AUD",
            ["INR"]  = "INR",
            ["CAD"]  = "CAD",
        };
        currency = currencyMap.TryGetValue(currency, out var mapped) ? mapped : "USD";

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
        // Build PayPal URL from config
        var isSandbox = _config.GetValue<bool>("PayPal:IsSandbox", true);
        var paypalBase = isSandbox
            ? _config["PayPal:SandboxUrl"] ?? "https://www.sandbox.paypal.com/cgi-bin/webscr"
            : _config["PayPal:LiveUrl"] ?? "https://www.paypal.com/cgi-bin/webscr";

        var returnUrl = _config["PayPal:ReturnUrl"] ?? "http://localhost:5173/payment/success";
        var cancelUrl = _config["PayPal:CancelUrl"] ?? "http://localhost:5173/payment/cancel";
        var notifyUrl = _config["PayPal:NotifyUrl"] ?? "";

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
            ["rm"]            = "2",
            ["return"]        = returnUrl,
            ["cancel_return"] = cancelUrl
        };

        if (!string.IsNullOrEmpty(notifyUrl))
            paypalParams["notify_url"] = notifyUrl;

        var queryString = string.Join("&", paypalParams.Select(kv =>
            $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}"));

        var paypalUrl = $"{paypalBase}?{queryString}";

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

    // ── POST /admin/api/Payments/paypal-config/{id} ───────────────────────────
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

// ── Separate public controller for PayPal IPN (no admin prefix) ────────────────
[Route("api/Payments")]
[ApiController]
public class PaymentsPublicController : ControllerBase
{
    private readonly LycoDbContext _context;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;

    public PaymentsPublicController(LycoDbContext context, IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    // ── POST /api/Payments/webhook/paypal ─────────────────────────────────────
    // This is a PUBLIC endpoint — PayPal calls it directly (no auth required)
    [HttpPost("webhook/paypal")]
    public async Task<IActionResult> PayPalIpn()
    {
        // 1. Read the raw IPN body
        string rawBody;
        using (var reader = new StreamReader(Request.Body, Encoding.ASCII))
        {
            rawBody = await reader.ReadToEndAsync();
        }

        if (string.IsNullOrEmpty(rawBody))
            return Ok(); // Always return 200 to PayPal

        // 2. Re-POST to PayPal for verification
        var isSandbox = _config.GetValue<bool>("PayPal:IsSandbox", true);
        var paypalVerifyUrl = isSandbox
            ? "https://ipnpb.sandbox.paypal.com/cgi-bin/webscr"
            : "https://ipnpb.paypal.com/cgi-bin/webscr";

        var verifyBody = "cmd=_notify-validate&" + rawBody;
        string verifyResponse;

        try
        {
            var client = _httpClientFactory.CreateClient();
            var content = new StringContent(verifyBody, Encoding.ASCII, "application/x-www-form-urlencoded");
            var response = await client.PostAsync(paypalVerifyUrl, content);
            verifyResponse = await response.Content.ReadAsStringAsync();
        }
        catch
        {
            // If we can't reach PayPal, return 200 but do nothing (PayPal will retry)
            return Ok();
        }

        // 3. Parse the IPN fields
        var fields = rawBody.Split('&')
            .Select(kv => kv.Split('=', 2))
            .Where(p => p.Length == 2)
            .ToDictionary(
                p => Uri.UnescapeDataString(p[0]),
                p => Uri.UnescapeDataString(p[1].Replace('+', ' '))
            );

        fields.TryGetValue("payment_status", out var paymentStatus);
        fields.TryGetValue("custom", out var transactionNumber); // The GUID we set before redirect
        fields.TryGetValue("txn_id", out var txnId);             // PayPal's real transaction ID
        fields.TryGetValue("payment_date", out var paymentDateStr);

        // 4. Process only VERIFIED + Completed
        if (verifyResponse == "VERIFIED" &&
            string.Equals(paymentStatus, "Completed", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrEmpty(transactionNumber))
        {
            var ordersToUpdate = await _context.OrderDetails
                .Where(o => o.TransactionNo == transactionNumber)
                .ToListAsync();

            if (ordersToUpdate.Any())
            {
                var paymentDate = DateTime.TryParse(paymentDateStr, out var pd) ? pd : DateTime.Now;

                foreach (var order in ordersToUpdate)
                {
                    order.PaymentStatus = "Completed";
                    order.PaymentDate = paymentDate;
                    // Store PayPal txn_id in TransactionNo, keep GUID in a separate field if available
                    if (!string.IsNullOrEmpty(txnId))
                        order.TransactionNo = txnId;
                }

                await _context.SaveChangesAsync();
            }
        }

        // Always return 200 — PayPal will retry if it doesn't receive 200
        return Ok();
    }
}
