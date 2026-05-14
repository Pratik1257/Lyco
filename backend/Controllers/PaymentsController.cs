using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Lyco.Api.Data;
using Lyco.Api.Models;
using System.Net.Http;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace Lyco.Api.Controllers;

[Route("admin/api/[controller]")]
[ApiController]
[Authorize]
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

        if (uniqueNo.HasValue)
            query = query.Where(o => o.UniqueNo == uniqueNo.Value);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(o =>
                (o.OrderNo != null && o.OrderNo.Contains(search)) ||
                (o.Username != null && o.Username.Contains(search)) ||
                (o.CompanyName != null && o.CompanyName.Contains(search)));

        if (serviceId.HasValue)
            query = query.Where(o => o.ServiceId == serviceId.Value);

        if (!string.IsNullOrEmpty(paymentStatus) && !paymentStatus.Equals("all", StringComparison.OrdinalIgnoreCase))
            query = query.Where(o => o.PaymentStatus == paymentStatus);

        if (startDate.HasValue)
            query = query.Where(o => o.OrderDate >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(o => o.OrderDate <= endDate.Value);

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
            return BadRequest("Invalid status. Must be 'Completed', 'Bad Debt', or 'Pending'.");

        if (request.OrderIds == null || !request.OrderIds.Any())
            return BadRequest("No orders selected.");

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
            query = query.Where(q => q.UniqueNo == filterUniqueNo.Value);

        var orders = await query.OrderByDescending(o => o.OrderDate).ToListAsync();
        return Ok(orders);
    }

    public class InitiatePaymentRequest
    {
        public long? UserId { get; set; }
        public List<long> OrderIds { get; set; } = new();
    }

    [HttpPost("initiate")]
    public async Task<IActionResult> InitiatePayment([FromBody] InitiatePaymentRequest request)
    {
        if (request.OrderIds == null || !request.OrderIds.Any())
            return BadRequest(new { error = "No orders selected." });

        var orders = await _context.OrderDetails
            .Where(o => request.OrderIds.Contains(o.OrderId)
                        && (o.PaymentStatus == "Pending" || string.IsNullOrEmpty(o.PaymentStatus))
                        && (o.OrderStatus == "Completed" || o.OrderStatus == "Invoiced"))
            .ToListAsync();

        if (orders.Count != request.OrderIds.Count)
            return BadRequest(new { error = "One or more orders are invalid or are not in Pending payment status." });

        var distinctCurrencies = orders.Select(o => o.Currency).Distinct().ToList();
        if (distinctCurrencies.Count > 1)
            return BadRequest(new { error = "All selected orders must have the same currency for a single PayPal transaction." });

        var firstOrder = orders.First();
        var currency = firstOrder.Currency ?? "USD";

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

        var total = orders.Sum(o => decimal.TryParse(o.Amount, out var a) ? a : 0m);
        if (total <= 0)
            return BadRequest(new { error = "Total amount must be greater than zero." });

        // FIX 1: Stamp BOTH TransactionNo and Systransactionno with the GUID.
        // Systransactionno is the permanent reference used by the IPN webhook for lookup.
        // TransactionNo will be overwritten later by the real PayPal txn_id on confirmation.
        var transactionNumber = Guid.NewGuid().ToString();
        foreach (var order in orders)
        {
            order.TransactionNo    = transactionNumber;
            order.Systransactionno = transactionNumber;
        }
        await _context.SaveChangesAsync();

        var paypalRecord = await _context.BillingPaypalMasters.FirstOrDefaultAsync();
        var paypalEmail  = paypalRecord?.Email ?? string.Empty;

        var isSandbox  = _config.GetValue<bool>("PayPal:IsSandbox", true);
        var paypalBase = isSandbox
            ? _config["PayPal:SandboxUrl"] ?? "https://www.sandbox.paypal.com/cgi-bin/webscr"
            : _config["PayPal:LiveUrl"]    ?? "https://www.paypal.com/cgi-bin/webscr";

        var returnUrl = _config["PayPal:ReturnUrl"] ?? "http://localhost:5173/payment/success";
        // Append GUID to return URL so the success page can call the confirm-redirect fallback
        returnUrl = $"{returnUrl}?txguid={Uri.EscapeDataString(transactionNumber)}";
        var cancelUrl = _config["PayPal:CancelUrl"] ?? "http://localhost:5173/payment/cancel";
        var notifyUrl = _config["PayPal:NotifyUrl"] ?? "";

        // Build item_name: list all order numbers for multi-order payments (PayPal limit: 127 chars)
        string itemName;
        if (orders.Count == 1)
        {
            itemName = $"Order {orders[0].OrderNo}";
        }
        else
        {
            var orderList = string.Join(", ", orders.Select(o => o.OrderNo));
            var candidate = $"Orders {orderList}";
            // Truncate safely to PayPal's 127-character item_name limit
            itemName = candidate.Length <= 127 ? candidate : candidate.Substring(0, 124) + "...";
        }

        var paypalParams = new Dictionary<string, string>
        {
            ["cmd"]           = "_xclick",
            ["business"]      = paypalEmail,
            ["amount"]        = total.ToString("F2"),
            ["currency_code"] = currency,
            ["item_name"]     = itemName,
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

        Console.WriteLine($"[PayPal] Currency: '{firstOrder.Currency}' => '{currency}' | Email: '{paypalEmail}' | Amount: {total:F2}");
        Console.WriteLine($"[PayPal] GUID: {transactionNumber} | URL: {paypalUrl}");

        return Ok(new { paypalUrl, transactionNumber });
    }

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

// ── Separate public controller for PayPal IPN (no admin prefix, no auth) ──────
[Route("api/Payments")]
[ApiController]
[AllowAnonymous]
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

    // ── GET /api/Payments/confirm-redirect?txguid= ────────────────────────────
    // Called by PaymentSuccess.tsx as a synchronous fallback when IPN is delayed or unavailable.
    // Marks Pending orders as Completed based on the GUID embedded in the PayPal return URL.
    [HttpGet("confirm-redirect")]
    public async Task<IActionResult> ConfirmFromRedirect([FromQuery] string txguid)
    {
        LogIpn($"[confirm-redirect] Called with txguid='{txguid}'");

        if (string.IsNullOrWhiteSpace(txguid))
            return BadRequest(new { error = "Missing transaction GUID." });

        var orders = await _context.OrderDetails
            .Where(o => o.Systransactionno == txguid && o.PaymentStatus != "Completed")
            .ToListAsync();

        if (!orders.Any())
        {
            LogIpn($"[confirm-redirect] No pending orders found for GUID: {txguid} — already completed or invalid GUID.");
            return Ok(new { message = "No pending orders found for this transaction. May already be updated." });
        }

        var now = DateTime.Now;
        foreach (var order in orders)
        {
            order.PaymentStatus = "Completed";
            order.PaymentDate   = now;
        }
        await _context.SaveChangesAsync();

        LogIpn($"[confirm-redirect] Confirmed {orders.Count} order(s) via redirect fallback for GUID: {txguid}");

        return Ok(new { message = $"Payment confirmed. {orders.Count} order(s) updated.", count = orders.Count });
    }

    // ── GET /api/Payments/checkout-details/{guid} ─────────────────────────────
    // Public endpoint for the Gateway Page.
    [HttpGet("checkout-details/{guid}")]
    public async Task<IActionResult> GetCheckoutDetails(string guid)
    {
        if (string.IsNullOrWhiteSpace(guid))
            return BadRequest(new { error = "Missing transaction GUID." });

        var orders = await _context.OrderDetails
            .Include(o => o.Service)
            .Where(o => o.Systransactionno == guid)
            .ToListAsync();

        if (!orders.Any())
            return NotFound(new { error = "No orders found for this transaction link." });

        var isPaid = orders.All(o => o.PaymentStatus == "Completed");
        
        // Calculate total of only the Pending orders
        var pendingOrders = orders.Where(o => o.PaymentStatus != "Completed").ToList();
        var totalAmount = pendingOrders.Sum(o => decimal.TryParse(o.Amount, out var a) ? a : 0m);
        
        var firstOrder = orders.First();
        var currency = firstOrder.Currency ?? "USD";

        string? paypalUrl = null;
        if (!isPaid && totalAmount > 0)
        {
            paypalUrl = GeneratePaypalUrl(pendingOrders, totalAmount, guid);
        }

        return Ok(new {
            isPaid,
            amount = totalAmount,
            currency,
            orders = orders.Select(o => new {
                o.OrderNo,
                o.Amount,
                o.PaymentStatus,
                ServiceName = o.Service?.ServiceName ?? "N/A",
                PoNo = o.WorkTitle
            }),
            paypalUrl
        });
    }

    private string GeneratePaypalUrl(List<OrderDetail> orders, decimal total, string guid)
    {
        var paypalRecord = _context.BillingPaypalMasters.FirstOrDefault();
        var paypalEmail = paypalRecord?.Email ?? string.Empty;

        var isSandbox = _config.GetValue<bool>("PayPal:IsSandbox", true);
        var paypalBase = isSandbox
            ? _config["PayPal:SandboxUrl"] ?? "https://www.sandbox.paypal.com/cgi-bin/webscr"
            : _config["PayPal:LiveUrl"] ?? "https://www.paypal.com/cgi-bin/webscr";

        var returnUrl = _config["PayPal:ReturnUrl"] ?? "http://localhost:5173/payment/success";
        returnUrl = $"{returnUrl}?txguid={Uri.EscapeDataString(guid)}";
        var cancelUrl = _config["PayPal:CancelUrl"] ?? "http://localhost:5173/payment/cancel";
        var notifyUrl = _config["PayPal:NotifyUrl"] ?? "";

        var currency = orders.First().Currency ?? "USD";
        var currencyMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["USD"] = "USD", ["EURO"] = "EUR", ["EUR"] = "EUR", ["GBP"] = "GBP", ["AUD"] = "AUD", ["INR"] = "USD", ["CAD"] = "CAD"
        };
        currency = currencyMap.TryGetValue(currency, out var mapped) ? mapped : "USD";

        string itemName = orders.Count == 1 ? $"Order {orders[0].OrderNo}" : $"Multiple Orders ({orders.Count})";

        var paypalParams = new Dictionary<string, string>
        {
            ["cmd"] = "_xclick",
            ["business"] = paypalEmail,
            ["amount"] = total.ToString("F2"),
            ["currency_code"] = currency,
            ["item_name"] = itemName,
            ["custom"] = guid,
            ["no_shipping"] = "1",
            ["no_note"] = "1",
            ["rm"] = "2",
            ["return"] = returnUrl,
            ["cancel_return"] = cancelUrl
        };

        if (!string.IsNullOrEmpty(notifyUrl))
            paypalParams["notify_url"] = notifyUrl;

        var queryString = string.Join("&", paypalParams.Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}"));
        return $"{paypalBase}?{queryString}";
    }

    // ── POST /api/Payments/webhook/paypal ──────────────────────────────────────
    // PUBLIC endpoint — PayPal calls this directly (no JWT auth required)
    [HttpPost("webhook/paypal")]
    public async Task<IActionResult> PayPalIpn()
    {
        // Step 1: Read raw IPN body
        string rawBody;
        using (var reader = new StreamReader(Request.Body, Encoding.ASCII))
        {
            rawBody = await reader.ReadToEndAsync();
        }

        LogIpn($"IPN Raw Data: {rawBody}");

        if (string.IsNullOrEmpty(rawBody))
            return Ok(); // Always return 200 to PayPal

        // Step 2: Re-POST to PayPal for VERIFIED / INVALID response
        var isSandbox = _config.GetValue<bool>("PayPal:IsSandbox", true);
        var paypalVerifyUrl = isSandbox
            ? "https://ipnpb.sandbox.paypal.com/cgi-bin/webscr"
            : "https://ipnpb.paypal.com/cgi-bin/webscr";

        string verifyResponse;
        try
        {
            var client  = _httpClientFactory.CreateClient();
            var content = new StringContent("cmd=_notify-validate&" + rawBody, Encoding.ASCII, "application/x-www-form-urlencoded");
            var resp    = await client.PostAsync(paypalVerifyUrl, content);
            verifyResponse = await resp.Content.ReadAsStringAsync();
        }
        catch (Exception ex)
        {
            LogIpn($"Verification request failed: {ex.Message}");
            return Ok(); // PayPal will retry
        }

        LogIpn($"PayPal Verification Response: {verifyResponse}");

        // Step 3: Parse IPN fields
        var fields = rawBody.Split('&')
            .Select(kv => kv.Split('=', 2))
            .Where(p => p.Length == 2)
            .ToDictionary(
                p => Uri.UnescapeDataString(p[0]),
                p => Uri.UnescapeDataString(p[1].Replace('+', ' '))
            );

        fields.TryGetValue("payment_status", out var paymentStatus);
        fields.TryGetValue("custom",         out var transactionGuid); // Our GUID (stored in Systransactionno)
        fields.TryGetValue("txn_id",         out var txnId);           // PayPal's real transaction ID
        fields.TryGetValue("payment_date",   out var paymentDateStr);

        LogIpn($"Parsed: payment_status='{paymentStatus}' | custom(GUID)='{transactionGuid}' | txn_id='{txnId}'");

        // Step 4: Guard — only proceed if VERIFIED and we have a GUID
        if (verifyResponse != "VERIFIED" || string.IsNullOrEmpty(transactionGuid))
        {
            LogIpn($"Skipped: verifyResponse='{verifyResponse}', GUID='{transactionGuid}'");
            return Ok();
        }

        // FIX 3: Look up by Systransactionno (permanent GUID), not TransactionNo
        // TransactionNo may already be overwritten by a previous txn_id write
        var ordersToUpdate = await _context.OrderDetails
            .Where(o => o.Systransactionno == transactionGuid)
            .ToListAsync();

        if (!ordersToUpdate.Any())
        {
            LogIpn($"No orders found matching GUID: {transactionGuid}");
            return Ok();
        }

        var paymentDate = DateTime.TryParse(paymentDateStr, out var pd) ? pd : DateTime.Now;

        // FIX 4: Handle all relevant PayPal payment_status values
        switch (paymentStatus?.ToLower())
        {
            case "completed":
                // FIX 5: Duplicate guard — skip orders already marked Completed
                var pendingOrders = ordersToUpdate
                    .Where(o => o.PaymentStatus != "Completed")
                    .ToList();

                if (!pendingOrders.Any())
                {
                    LogIpn($"Duplicate IPN: all orders for GUID '{transactionGuid}' already Completed. Skipped.");
                    break;
                }

                foreach (var order in pendingOrders)
                {
                    order.PaymentStatus = "Completed";
                    order.PaymentDate   = paymentDate;
                    // Store the real PayPal txn_id in TransactionNo for reconciliation
                    // Systransactionno still holds the original GUID permanently
                    if (!string.IsNullOrEmpty(txnId))
                        order.TransactionNo = txnId;
                }
                await _context.SaveChangesAsync();
                LogIpn($"Updated {pendingOrders.Count} order(s) to Completed | GUID: {transactionGuid} | TxnId: {txnId}");
                break;

            case "refunded":
            case "reversed":
                // Revert to Pending so customer can be re-billed
                foreach (var order in ordersToUpdate)
                    order.PaymentStatus = "Pending";
                await _context.SaveChangesAsync();
                LogIpn($"Refund/Reversal for GUID '{transactionGuid}' — {ordersToUpdate.Count} order(s) reverted to Pending.");
                break;

            case "failed":
            case "denied":
                // Leave as Pending so the customer can retry
                LogIpn($"Failed/Denied payment for GUID '{transactionGuid}' — no DB change (remains Pending).");
                break;

            case "pending":
                // PayPal "Pending" typically means eCheck — PayPal will send a final IPN once cleared
                LogIpn($"PayPal status is 'Pending' (eCheck?) for GUID '{transactionGuid}' — awaiting cleared IPN.");
                break;

            default:
                LogIpn($"Unhandled PayPal payment_status '{paymentStatus}' for GUID '{transactionGuid}'.");
                break;
        }

        return Ok(); // Always 200 — PayPal retries if it doesn't get 200
    }

    // ── Audit Logger (mirrors legacy ipn_debug.txt pattern) ───────────────────
    private void LogIpn(string message)
    {
        try
        {
            var logPath = Path.Combine(Directory.GetCurrentDirectory(), "ipn_log.txt");
            System.IO.File.AppendAllText(logPath,
                $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} >> {message}{Environment.NewLine}");
        }
        catch
        {
            // Silent fail — logging must never crash the webhook handler
        }
    }
}
