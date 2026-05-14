using System.Net.Http.Headers;
using System.Text;
using Lyco.Api.DTOs;

namespace Lyco.Api.Services;

/// <summary>
/// Sends transactional emails via Mailgun's HTTP API (no SMTP required).
/// Mirrors all email notifications from LycoCustomerPanel.
/// 
/// Configuration (appsettings.json → "Mailgun"):
///   ApiKey  – Mailgun private API key (starts with "key-")
///   Domain  – Your Mailgun sending domain (e.g. "mg.lycodesigns.com")
///   BaseUrl – Mailgun API base URL (default: "https://api.mailgun.net/v3")
/// </summary>
public class MailgunEmailService : IEmailService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<MailgunEmailService> _logger;

    private string ApiKey => _config["Mailgun:ApiKey"] ?? "";
    private string Domain => _config["Mailgun:Domain"] ?? "";
    private string BaseUrl => _config["Mailgun:BaseUrl"] ?? "https://api.mailgun.net/v3";
    private string FromEmail => _config["Mailgun:FromEmail"] ?? "noreply@lycodesigns.com";
    private string FromName => _config["Mailgun:FromName"] ?? "Lyco Designs";
    private string BccEmail => _config["Mailgun:BccEmail"] ?? "";

    public MailgunEmailService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<MailgunEmailService> logger)
    {
        _httpFactory = httpFactory;
        _config = config;
        _logger = logger;
    }

    // ── Core send method ──────────────────────────────────────────────────────
    private async Task SendAsync(string to, string subject, string htmlBody,
        string? fromEmail = null, string? fromName = null, string? bcc = null,
        IEnumerable<EmailAttachment>? attachments = null)
    {
        if (string.IsNullOrWhiteSpace(ApiKey) || ApiKey == "YOUR_MAILGUN_API_KEY")
        {
            _logger.LogWarning("[Email] Mailgun not configured. Skipping email to {To} — Subject: {Subject}", to, subject);
            return;
        }

        try
        {
            var client = _httpFactory.CreateClient();
            var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"api:{ApiKey}"));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

            var url = $"{BaseUrl}/{Domain}/messages";

            using var form = new MultipartFormDataContent();
            form.Add(new StringContent($"{fromName ?? FromName} <{fromEmail ?? FromEmail}>"), "from");
            form.Add(new StringContent(to), "to");
            form.Add(new StringContent(subject), "subject");
            form.Add(new StringContent(htmlBody), "html");

            if (!string.IsNullOrWhiteSpace(bcc ?? BccEmail))
                form.Add(new StringContent(bcc ?? BccEmail!), "bcc");

            if (attachments != null)
            {
                foreach (var attachment in attachments)
                {
                    if (attachment.Content != null && attachment.Content.Length > 0)
                    {
                        var fileContent = new ByteArrayContent(attachment.Content);
                        fileContent.Headers.ContentType = new MediaTypeHeaderValue(attachment.ContentType);
                        form.Add(fileContent, "attachment", attachment.FileName);
                    }
                }
            }

            var response = await client.PostAsync(url, form);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogError("[Email] Mailgun error {Status}: {Body}", response.StatusCode, body);
            }
            else
            {
                _logger.LogInformation("[Email] Sent to {To} — Subject: {Subject}", to, subject);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Email] Failed to send email to {To}", to);
        }
    }

    private static string Signature(string dept = "Customer Service") =>
        $"""
        <p style="font-family:'Inter',system-ui,-apple-system,sans-serif;color:#0b5394;font-size:14px;line-height:1.6;margin-top:25px;">
          Regards,<br/>
          <strong style="font-size:15px;">{dept}</strong><br/>
          <span style="text-transform:uppercase;letter-spacing:1px;font-weight:800;font-size:13px;">LYCO DESIGNS LLC.</span><br/>
          <a href="tel:+15513392530" style="color:#0b5394;text-decoration:none;">+1-551-339-2530</a><br/>
          <a href="https://www.lycodesigns.com" style="color:#0b5394;text-decoration:none;font-weight:bold;border-bottom:1px solid #0b5394;">www.lycodesigns.com</a>
        </p>
        """;

    // ── 1. Registration Welcome (mirrors Registration.aspx.cs) ───────────────
    public async Task SendRegistrationWelcomeAsync(string toEmail, string username, long uniqueNo)
    {
        var subject = "Lyco Designs Registration | Verified";
        var uniqueId = Guid.NewGuid().ToString("N").Substring(0, 8); // Prevents Gmail threading/collapsing
        var body = $"""
            <div style="font-family:'Comic Sans MS',sans-serif;color:#444;font-size:13px;line-height:1.6;width:100%;min-width:800px;">
              <p style="margin-bottom:15px;white-space:nowrap;display:block;">Thank you for registering with Lyco Designs! We're excited to be your one-stop shop for all your graphic and embroidery needs.</p>

              <p style="margin-bottom:10px;">Below are your registration details:</p>

              <p style="margin-left:5px;margin-bottom:15px;">
                Username: {username}<br/>
                Customer ID: {uniqueNo}
              </p>

              <p style="margin-bottom:10px;">You now have full access to our <i>Client Center</i>, where you can:</p>

              <ul style="list-style-type:none;padding-left:0;margin:0 0 15px 0;">
                <li>* Place Orders</li>
                <li>* Place Quote Requests</li>
                <li>* Make Payments</li>
                <li>* Register or edit your Debit/Credit Card details</li>
                <li>* Update your profile</li>
                <li>* View order summaries (daily, monthly, yearly)</li>
                <li>* Download Invoices</li>
                <li>* See ongoing promotions</li>
                <li>* See your package details</li>
                <li>* And much more!</li>
              </ul>

              <p style="margin-bottom:15px;white-space:nowrap;display:block;">We're available 24/7 and guarantee the lowest rates, superfast turnaround times, and the best quality. Place your order with us now!</p>

              <p style="margin-bottom:20px;">Thanks again for choosing Lyco Designs.</p>

              {Signature()}
              
              <span style="display:none !important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:0;">{uniqueId}</span>
            </div>
            """;

        Console.WriteLine($"[WelcomeEmail] Dispatching to: {toEmail} (BCC: parmarpratikp1406@gmail.com)");
        await SendAsync(toEmail, subject, body, fromEmail: "cs@lycodesigns.com",
            fromName: "Customer Service | Lyco Designs", bcc: "parmarpratikp1406@gmail.com");
    }

    // ── 2. Order Received (mirrors OrderForm.aspx.cs) ────────────────────────
    public async Task SendOrderReceivedAsync(string toEmail, string orderNo, string poName,
        string service, string size, string sizeType, string fileFormat, string instructions)
    {
        var subject = $"Received Order # {orderNo} | {poName}";
        var body = $"""
            <p style="font-family:'Comic Sans MS',sans-serif;color:#444;">
              Hello,<br/><br/>
              We have received your order and it is in process.<br/>
              The completed files will be sent to you soon.
            </p>
            <table style="width:80%;border-collapse:collapse;" cellpadding="6">
              <tr>
                <td><b>Order No:</b> {orderNo}</td>
                <td><b>Date:</b> {DateTime.Now.ToShortDateString()}</td>
              </tr>
              <tr>
                <td><b>PO/Artwork Name:</b> {poName}</td>
                <td><b>Service:</b> {service}</td>
              </tr>
              <tr>
                <td><b>Size:</b> {size} {sizeType}</td>
                <td><b>File Format:</b> {fileFormat}</td>
              </tr>
              <tr>
                <td colspan="2"><b>Instructions:</b><br/>{instructions.Replace("\n", "<br/>")}</td>
              </tr>
            </table>
            {Signature("Orders")}
            """;

        await SendAsync(toEmail, subject, body, fromEmail: "orders@lycodesigns.com",
            fromName: "Orders | Lyco Designs", bcc: "parmarpratikp1406@gmail.com");
    }

    // ── 3. Quote Received (mirrors RequestQuote.aspx.cs) ────────────────────
    public async Task SendQuoteReceivedAsync(string toEmail, string quoteNo, string poName,
        string service, string size, string sizeType, string fileFormat, string instructions)
    {
        var subject = $"Quote Request | {quoteNo} - {poName}";
        var body = $"""
            <p style="font-family:'Comic Sans MS',sans-serif;color:#444;">
              Hello,<br/><br/>
              We have received your quote request.<br/>
              We will get back to you with the lowest quote soon.
            </p>
            <table style="width:80%;border-collapse:collapse;" cellpadding="6">
              <tr>
                <td><b>Date:</b> {DateTime.Now.ToShortDateString()}</td>
                <td><b>PO / Artwork Name:</b> {poName}</td>
              </tr>
              <tr>
                <td><b>Service:</b> {service}</td>
                <td><b>Size:</b> {size}&nbsp;&nbsp;{sizeType}</td>
              </tr>
              <tr>
                <td colspan="2"><b>File Format:</b> {fileFormat}</td>
              </tr>
              <tr>
                <td colspan="2"><b>Instructions:</b><br/>{instructions.Replace("\n", "<br/>")}</td>
              </tr>
            </table>
            {Signature("Customer Service")}
            """;

        await SendAsync(toEmail, subject, body, fromEmail: "cs@lycodesigns.com",
            fromName: "Customer Service | Lyco Designs", bcc: "parmarpratikp1406@gmail.com");
    }

    // ── 4. Order Completed (mirrors CompleteOrder.aspx.cs) ───────────────────
    public async Task SendOrderCompletedAsync(string toEmail, string orderNo, string poName,
        string price, string completedDate, string note, List<EmailAttachment>? attachments = null)
    {
        var subject = $"Completed Order # {orderNo} | {poName}";
        var body = $"""
            <p style="font-family:'Comic Sans MS',sans-serif;color:#444;">
              Hello,<br/><br/>
              Thank you for waiting.<br/><br/>
              Your order has been completed.
            </p>
            <table style="width:100%;border-collapse:collapse;" cellpadding="6">
              <tr>
                <td><b>Order No:</b> {orderNo}</td>
                <td><b>Complete Date:</b> {completedDate}</td>
              </tr>
              <tr>
                <td><b>Price:</b> {price}</td>
                <td><b>PO/Artwork Name:</b> {poName}</td>
              </tr>
              {(string.IsNullOrWhiteSpace(note) ? "" : $"<tr><td colspan='2'><b>Note:</b> {note}</td></tr>")}
            </table>
            <p style="font-family:'Comic Sans MS',sans-serif;color:#444;">
              If you need any revisions, please don't hesitate to contact us. Minor revisions are free of charge.<br/>
              Please carefully review the files for any errors, including colors and spellings.
            </p>
            {Signature("Orders")}
            """;

        await SendAsync(toEmail, subject, body, fromEmail: "orders@lycodesigns.com",
            fromName: "Orders | Lyco Designs", bcc: "parmarpratikp1406@gmail.com",
            attachments: attachments);
    }

    // ── 4. Invoice Email with PDF attachment (mirrors Invoice.aspx.cs) ────────
    public async Task SendInvoiceAsync(string toEmail, string subject,
        byte[]? pdfBytes, string? pdfFileName)
    {
        var body = $"""
            <p style="font-family:'Comic Sans MS',sans-serif;color:#444;">
              Hello,<br/><br/>
              Attached is your invoice.<br/><br/>
              You will shortly receive a PayPal Payment Request for making the payment through
              your PayPal account or by your debit or credit card.<br/><br/>
              You can also write to us for Direct Debit.<br/><br/>
              Thank you for your business with Lyco Designs.
            </p>
            {Signature("Billing")}
            """;

        var attachments = new List<EmailAttachment>();
        if (pdfBytes != null && !string.IsNullOrEmpty(pdfFileName))
        {
            attachments.Add(new EmailAttachment 
            { 
                FileName = pdfFileName, 
                Content = pdfBytes, 
                ContentType = "application/pdf" 
            });
        }

        await SendAsync(toEmail, subject, body, fromEmail: "billing@lycodesigns.com",
            fromName: "Billing | Lyco Designs", bcc: "parmarpratikp1406@gmail.com",
            attachments: attachments);
    }

    // ── 5. PayPal Payment Request Link (mirrors Invoice.aspx.cs btnSendPaypalLink) ──
    public async Task SendPaymentLinkAsync(string toEmail, string paypalUrl, string orderList)
    {
        var subject = "Lyco Designs Payment Request";
        var body = $"""
            <p style="font-family:'Comic Sans MS',sans-serif;color:#444;">
              Hello,<br/><br/>
              Thank you for your orders. Click below to review your invoice and proceed to payment:<br/><br/>
              <a href="{paypalUrl}" style="background:#0b5394;color:#fff;padding:10px 24px;
                 border-radius:6px;text-decoration:none;font-weight:bold;">
                Pay Now
              </a><br/><br/>
              <small>Or copy this link: <a href="{paypalUrl}">{paypalUrl}</a></small><br/><br/>
              Orders: {orderList}<br/><br/>
              Please contact us at <a href="mailto:billing@lycodesigns.com">billing@lycodesigns.com</a>
              if you have any questions.
            </p>
            {Signature("Billing")}
            """;

        await SendAsync(toEmail, subject, body, fromEmail: "billing@lycodesigns.com",
            fromName: "Billing | Lyco Designs", bcc: "parmarpratikp1406@gmail.com");
    }

    // ── 6. Email Verification Code ────────────────────────────────────────────
    public async Task SendVerificationCodeAsync(string toEmail, string code)
    {
        var subject = "Lyco Designs | Email Verification Code";
        var body = $"""
            <div style="font-family:'Inter',system-ui,-apple-system,Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #eef2f7;border-radius:16px;padding:40px;color:#334155;background-color:#ffffff;text-align:center;">
              <h2 style="color:#0b5394;margin-top:0;font-size:22px;font-weight:800;letter-spacing:-0.025em;">Verify your email</h2>
              <p style="color:#64748b;font-size:15px;line-height:1.6;">Use the secure code below to complete your registration. It is valid for 10 minutes.</p>
              
              <div style="font-size:42px;font-weight:900;letter-spacing:10px;
                          background-color:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;
                          padding:30px;text-align:center;color:#0b5394;margin:32px 0;font-family:monospace;">
                {code}
              </div>
              
              <p style="color:#94a3b8;font-size:12px;margin-bottom:32px;">
                If you did not request this code, you can safely ignore this email.
              </p>
              
              <div style="text-align:left;border-top:1px solid #f1f5f9;padding-top:20px;">
                {Signature()}
              </div>
            </div>
            """;

        await SendAsync(toEmail, subject, body, fromEmail: "cs@lycodesigns.com",
            fromName: "Customer Service | Lyco Designs");
    }

    // ── 7. Password Reset (mirrors Forgotpassword.aspx.cs) ───────────────────
    public async Task SendPasswordResetAsync(string toEmail, string firstName, string tempPassword)
    {
        var subject = "Lyco Designs | Password Reset Request";
        var body = $"""
            <p style="font-family:'Comic Sans MS',sans-serif;color:#444;">
              Hello {firstName},<br/><br/>
              Below is the temporary password for your account.
              Change it once you login into the Client Center.<br/><br/>
              <b>Password:</b> {tempPassword}
            </p>
            {Signature()}
            """;

        await SendAsync(toEmail, subject, body, fromEmail: "cs@lycodesigns.com",
            fromName: "Customer Service | Lyco Designs");
    }
    // ── 8. Password Reset Link (Modern Flow) ──────────────────────────────────
    public async Task SendPasswordResetLinkAsync(string toEmail, string username, string resetUrl)
    {
        var subject = "Reset Your Lyco Designs Password";
        var body = $"""
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;padding:40px;color:#333;">
              <h2 style="color:#0b5394;margin-top:0;">Password Reset Request</h2>
              <p>Hello <strong>{username}</strong>,</p>
              <p>We received a request to reset the password for your Lyco Designs account. Click the button below to choose a new password:</p>
              
              <div style="text-align:center;margin:35px 0;">
                <a href="{resetUrl}" style="background-color:#4F46E5;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;box-shadow:0 4px 6px rgba(79,70,229,0.2);">
                  Reset Password
                </a>
              </div>
              
              <p style="font-size:13px;color:#666;line-height:1.6;">
                This link will expire in 1 hour. If you did not request this change, you can safely ignore this email.
              </p>
              
              <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;">
                <p style="font-size:11px;color:#999;">
                  If the button doesn't work, copy and paste this URL into your browser:<br/>
                  <a href="{resetUrl}" style="color:#4F46E5;">{resetUrl}</a>
                </p>
              </div>
              
              {Signature()}
            </div>
            """;

        await SendAsync(toEmail, subject, body, fromEmail: "cs@lycodesigns.com",
            fromName: "Customer Service | Lyco Designs");
    }
}
