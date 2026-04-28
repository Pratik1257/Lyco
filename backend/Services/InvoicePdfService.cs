using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Lyco.Api.DTOs;
using System;
using System.IO;
using System.Linq;

namespace Lyco.Api.Services;

public interface IInvoicePdfService
{
    byte[] Generate(InvoiceDetailDto invoice);
}

public class InvoicePdfService : IInvoicePdfService
{
    private readonly string _logoPath;

    public InvoicePdfService(IWebHostEnvironment env)
    {
        _logoPath = Path.Combine(env.WebRootPath, "LycoLight_invoice.png");
    }

    public byte[] Generate(InvoiceDetailDto invoice)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(9).FontColor("#222222"));

                page.Content().Column(col =>
                {
                    // ─── HEADER ROW ───────────────────────────────────────
                    col.Item().PaddingBottom(10).Row(row =>
                    {
                        // Logo
                        row.ConstantItem(130).AlignMiddle().Column(logoCol =>
                        {
                            if (File.Exists(_logoPath))
                                logoCol.Item().Image(_logoPath);
                            else
                                logoCol.Item().Text("Lyco Designs").Bold().FontSize(18).FontColor("#333333");
                        });

                        // Contact info (right-aligned)
                        row.RelativeItem().AlignMiddle().AlignRight().Column(contactCol =>
                        {
                            contactCol.Item().Text("Contact: +1 551-339-2530")
                                .FontSize(9).Bold().FontColor("#000000");
                            contactCol.Item().Text("accounting@lycodesigns.com")
                                .FontSize(9).Bold().FontColor("#000000");
                            contactCol.Item().Text("billing@lycodesigns.com")
                                .FontSize(9).Bold().FontColor("#000000");
                            contactCol.Item().Text("www.lycodesigns.com")
                                .FontSize(9).Bold().FontColor("#000000");
                        });
                    });

                    col.Item().LineHorizontal(0.5f).LineColor("#000000");

                    // ─── BILL-TO + INVOICE META ───────────────────────────
                    col.Item().PaddingTop(5).Background("#E6E6E6").Padding(10).Row(row =>
                    {
                        // Invoice To (left)
                        row.RelativeItem().Column(billCol =>
                        {
                            billCol.Item().Text("Invoice To:").Bold().FontSize(10);
                            billCol.Item().PaddingTop(5).Text(invoice.CompanyName).Bold().FontSize(10);
                            billCol.Item().Text(invoice.ContactName).FontSize(10);
                            billCol.Item().Text($"Phone: {invoice.Phone}").FontSize(10);
                            billCol.Item().Text($"Email: {invoice.Email}").FontSize(10);
                        });

                        // Vertical separator
                        row.ConstantItem(1).Background("#999999");

                        // Invoice metadata (right)
                        row.RelativeItem().PaddingLeft(15).Column(metaCol =>
                        {
                            metaCol.Item().Text($"Invoice Number: {invoice.InvoiceNo}").Bold().FontSize(10);
                            metaCol.Item().PaddingTop(5).Text($"Date: {invoice.InvoiceDate:dd MMM yyyy}").FontSize(10).Bold();
                            metaCol.Item().Text($"Customer ID: {invoice.CustomerId}").FontSize(10).Bold();
                        });
                    });

                    col.Item().PaddingTop(15);

                    // ─── ORDER TABLE ───────────────────────────────────────
                    col.Item().Table(table =>
                    {
                        // Column definitions
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(2);   // Order #
                            cols.RelativeColumn(2);   // Order Date
                            cols.RelativeColumn(5);   // Description
                            cols.RelativeColumn(2);   // Total
                        });

                        // Table header
                        static IContainer HeaderCell(IContainer c) =>
                            c.Background("#7030A0").Padding(5).AlignCenter();

                        table.Header(header =>
                        {
                            header.Cell().Element(HeaderCell).Text("Order #").Bold().FontSize(9).FontColor("#FFFFFF");
                            header.Cell().Element(HeaderCell).Text("Order Date").Bold().FontSize(9).FontColor("#FFFFFF");
                            header.Cell().Element(HeaderCell).Text("Description").Bold().FontSize(9).FontColor("#FFFFFF");
                            header.Cell().Element(HeaderCell).Text("Total").Bold().FontSize(9).FontColor("#FFFFFF");
                        });

                        // Data rows
                        var total = 0m;
                        foreach (var item in invoice.LineItems)
                        {
                            decimal.TryParse(item.Amount, out var amt);
                            total += amt;

                            static IContainer BodyCell(IContainer c) =>
                                c.BorderBottom(0.5f).BorderColor("#DDDDDD").Padding(5).AlignCenter();

                            table.Cell().Element(BodyCell).Text(item.OrderNo).FontSize(9);
                            table.Cell().Element(BodyCell).Text(item.OrderDate.HasValue
                                ? item.OrderDate.Value.ToString("MM/dd/yyyy") : "").FontSize(9);
                            table.Cell().Element(BodyCell).Text(item.Description).FontSize(9);
                            table.Cell().Element(BodyCell).Text($"£{amt:F2}").FontSize(9);
                        }

                        // Grand Total row
                        table.Cell().ColumnSpan(3).Padding(5).AlignRight()
                            .Text("GRAND TOTAL").Bold().FontSize(9);
                        table.Cell().Background("#EEEEEE").Padding(5).AlignCenter()
                            .Text($"£{total:F2}").Bold().FontSize(9);
                    });

                    col.Item().PaddingTop(14);

                    // ─── PAYMENT METHODS ──────────────────────────────────
                    col.Item().PaddingTop(10).Column(pmCol =>
                    {
                        pmCol.Item().Background("#FF5733").Padding(3).PaddingLeft(5)
                            .Text("PAYMENT METHODS :").Bold().FontSize(9).FontColor("#FFFFFF");
                        
                        pmCol.Item().PaddingTop(5).PaddingLeft(5).Column(inner => {
                            inner.Item().Text("- PayPal").FontSize(9).Bold();
                            inner.Item().Text("- Account transfer").FontSize(9).Bold();
                            inner.Item().Text("- All leading banks Debit/Credit cards").FontSize(9).Bold();
                        });
                    });

                    col.Item().PaddingTop(15);

                    // ─── TERMS ────────────────────────────────────────────
                    col.Item().Column(termsCol =>
                    {
                        termsCol.Item().Background("#FF5733").Padding(3).PaddingLeft(5)
                            .Text("TERMS :").Bold().FontSize(9).FontColor("#FFFFFF");
                        
                        termsCol.Item().PaddingTop(5).PaddingLeft(5).Column(inner => {
                            inner.Item().Text("- Please clear the invoice within 48 business hours.").Bold().FontSize(9);
                            inner.Item().Text("- Write to us in case you want to opt for a direct debit.").Bold().FontSize(9);
                        });
                    });

                    col.Item().PaddingTop(20);

                    // ─── THANK YOU ────────────────────────────────────────
                    col.Item().AlignCenter()
                        .Text("Thank you for your business")
                        .Italic().FontSize(11).FontColor("#C0504D");
                });
            });
        });

        return document.GeneratePdf();
    }
}
