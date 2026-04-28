import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface DraftInvoiceData {
  invoiceNo: string;
  invoiceDate: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  customerId: string;
  lineItems: Array<{
    orderNo: string;
    orderDate: string;
    description: string;
    amount: string;
  }>;
}

export function generateDraftPdf(data: DraftInvoiceData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;

  // ── LOGO ─────────────────────────────────────────────────────────────────
  try {
    const img = new Image();
    img.src = '/LycoLight_invoice.png';
    doc.addImage(img, 'PNG', 14, y, 45, 22);
  } catch (_) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor('#333333');
    doc.text('Lyco Designs', 14, y + 10);
  }

  // ── CONTACT INFO (right) ──────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor('#000000');
  doc.text('Contact: +1 551-339-2530', pageW - 14, y + 5, { align: 'right' });
  doc.text('accounting@lycodesigns.com', pageW - 14, y + 10, { align: 'right' });
  doc.text('billing@lycodesigns.com', pageW - 14, y + 15, { align: 'right' });
  doc.text('www.lycodesigns.com', pageW - 14, y + 20, { align: 'right' });

  y += 28;
  doc.setDrawColor('#000000');
  doc.line(14, y, pageW - 14, y);
  y += 5;

  // ── BILL-TO + INVOICE META ────────────────────────────────────────────────
  doc.setFillColor('#E6E6E6');
  doc.rect(14, y, pageW - 28, 35, 'F');
  
  doc.setTextColor('#000000');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Invoice To:', 18, y + 8);
  doc.text(data.companyName, 18, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(data.contactName, 18, y + 20);
  doc.text(`Phone: ${data.phone}`, 18, y + 25);
  doc.text(`Email: ${data.email}`, 18, y + 30);

  // Right column meta
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice Number: ${data.invoiceNo}`, pageW / 2 + 10, y + 8);
  doc.text(`Date: ${data.invoiceDate}`, pageW / 2 + 10, y + 15);
  doc.text(`Customer ID: ${data.customerId}`, pageW / 2 + 10, y + 20);

  y += 45;

  // ── ORDER TABLE ──────────────────────────────────────────────────────────
  const rows = data.lineItems.map(item => [
    item.orderNo,
    item.orderDate,
    item.description,
    `£${parseFloat(item.amount || '0').toFixed(2)}`
  ]);

  const grandTotal = data.lineItems.reduce((s, i) => s + parseFloat(i.amount || '0'), 0);

  autoTable(doc, {
    startY: y,
    head: [['Order #', 'Order Date', 'Description', 'Total']],
    body: [
      ...rows,
      [{ content: 'GRAND TOTAL', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
       { content: `£${grandTotal.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', fillColor: [238, 238, 238] } }]
    ],
    headStyles: {
      fillColor: [112, 48, 160],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: { fontSize: 9, textColor: [34, 34, 34], halign: 'center' },
    columnStyles: { 
      3: { halign: 'center' } 
    },
    didParseCell: (data) => {
      if (data.section === 'head') {
        data.cell.styles.halign = 'center';
      }
      if (data.row.index === data.table.body.length - 1 && data.column.index === 0) {
        // Grand total row label
      }
    },
    theme: 'grid',
    margin: { left: 14, right: 14 }
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // ── PAYMENT METHODS ───────────────────────────────────────────────────────
  doc.setDrawColor('#FF0000');
  doc.setLineWidth(0.5);
  doc.rect(14, y, pageW - 28, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor('#FF0000');
  doc.text('PAYMENT METHODS :', 18, y + 6);
  doc.setTextColor('#222222');
  doc.setFont('helvetica', 'normal');
  doc.text('- PayPal', 18, y + 11);
  doc.text('- Account transfer', 18, y + 16);
  doc.text('- All leading banks Debit/Credit cards', 18, y + 21);
  y += 28;

  // ── TERMS ─────────────────────────────────────────────────────────────────
  doc.setDrawColor('#FF0000');
  doc.rect(14, y, pageW - 28, 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor('#FF0000');
  doc.text('TERMS :', 18, y + 6);
  doc.setTextColor('#222222');
  doc.text('- Please clear the invoice within 48 business hours.', 18, y + 11);
  doc.text('- Write to us in case you want to opt for a direct debit.', 18, y + 16);
  y += 26;

  // ── THANK YOU ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor('#C0504D');
  doc.text('Thank you for your business', pageW / 2, y + 8, { align: 'center' });

  // Download
  doc.save(`${data.invoiceNo}_draft.pdf`);
}
