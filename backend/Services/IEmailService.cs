using Lyco.Api.DTOs;

namespace Lyco.Api.Services;

public interface IEmailService
{
    /// <summary>
    /// Sent on registration – welcome email with account details (mirrors Registration.aspx.cs).
    /// </summary>
    Task SendRegistrationWelcomeAsync(string toEmail, string username, long uniqueNo);

    /// <summary>
    /// Sent when admin places / confirms an order – order received confirmation (mirrors OrderForm.aspx.cs).
    /// </summary>
    Task SendOrderReceivedAsync(string toEmail, string orderNo, string poName, string service,
        string size, string sizeType, string fileFormat, string instructions);

    /// <summary>
    /// Sent when a customer submits a quote request – quote received confirmation (mirrors RequestQuote.aspx.cs).
    /// </summary>
    Task SendQuoteReceivedAsync(string toEmail, string quoteNo, string poName, string service,
        string size, string sizeType, string fileFormat, string instructions);

    /// <summary>
    /// Sent when admin marks an order as Complete – delivers completed files notice (mirrors CompleteOrder.aspx.cs).
    /// </summary>
    Task SendOrderCompletedAsync(string toEmail, string orderNo, string poName,
        string price, string completedDate, string note, List<EmailAttachment>? attachments = null);

    /// <summary>
    /// Sent when an invoice PDF is generated and emailed to the customer (mirrors Invoice.aspx.cs).
    /// </summary>
    Task SendInvoiceAsync(string toEmail, string subject, byte[]? pdfBytes, string? pdfFileName);

    /// <summary>
    /// Sends a PayPal payment request link to the customer (mirrors Invoice.aspx.cs btnSendPaypalLink_Click).
    /// </summary>
    Task SendPaymentLinkAsync(string toEmail, string paypalUrl, string orderList);

    /// <summary>
    /// Sends a 6-digit email verification code on registration Step 2.
    /// </summary>
    Task SendVerificationCodeAsync(string toEmail, string code);

    /// <summary>
    /// Sends a temporary password reset email (mirrors Forgotpassword.aspx.cs).
    /// </summary>
    Task SendPasswordResetAsync(string toEmail, string firstName, string tempPassword);
    /// <summary>
    /// Sends a password reset link to the customer.
    /// </summary>
    Task SendPasswordResetLinkAsync(string toEmail, string username, string resetUrl);
}
