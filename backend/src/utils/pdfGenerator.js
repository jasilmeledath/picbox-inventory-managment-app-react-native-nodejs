const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

/**
 * Generate UPI QR code as base64
 */
async function generateUPIQRCode(upiId, payeeName, amount) {
  try {
    // UPI payment URI format
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`;
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(upiString, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
}

/**
 * Format currency in Indian Rupee format
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Generate Invoice PDF HTML Template
 */
async function generateInvoiceHTML(invoice, companyCredential) {
  const {
    invoice_number,
    brand_type,
    customer_name,
    event_name,
    rented_items,
    subtotal,
    discount,
    discount_percentage,
    total_amount,
    paid_amount,
    pending_amount,
    status,
    date
  } = invoice;

  // Calculate subtotal if not provided (for backward compatibility)
  const calculatedSubtotal = subtotal || rented_items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const discountAmount = discount || 0;
  
  // Determine logo path based on brand
  const logoPath = path.join(__dirname, '../../assets/logos', 
    brand_type === 'Picbox' ? 'picbox-logo.png' : 'echo-logo.png'
  );
  
  // Read logo and convert to base64
  let logoBase64 = '';
  try {
    const logoBuffer = await fs.readFile(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error reading logo:', error);
  }
  
  // Generate UPI QR Code only for FINAL invoices (not estimates) and if UPI details exist
  let qrCodeDataURL = null;
  if (status === 'final' && companyCredential.upi_details?.upi_id && pending_amount > 0) {
    qrCodeDataURL = await generateUPIQRCode(
      companyCredential.upi_details.upi_id,
      companyCredential.upi_details.payee_name || companyCredential.display_name,
      pending_amount
    );
  }

  // Generate items rows HTML
  const itemsHTML = rented_items.map((item, index) => {
    const amount = item.qty * item.rate;
    return `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${index + 1}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${item.name}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 13px;">${item.qty}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 13px;">${formatCurrency(item.rate)}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; font-size: 13px;">${formatCurrency(amount)}</td>
      </tr>
    `;
  }).join('');

  // Determine brand color
  const brandColor = brand_type === 'Picbox' ? '#7C3AED' : '#8B5CF6';
  
  // Determine document title based on status
  const documentTitle = status === 'estimate' ? 'ESTIMATE' : 'INVOICE';
  
  // Status badge color
  const statusColors = {
    'draft': '#6B7280',
    'estimate': '#F59E0B',
    'final': '#10B981'
  };
  const statusColor = statusColors[status] || '#6B7280';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 30px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 3px solid ${brandColor};
      page-break-after: avoid;
    }
    
    .company-info {
      flex: 1;
    }
    
    .company-logo {
      max-width: 180px;
      height: auto;
      margin-bottom: 10px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: ${brandColor};
      margin-bottom: 5px;
    }
    
    .company-address {
      font-size: 11px;
      color: #6b7280;
      line-height: 1.6;
    }
    
    .invoice-info {
      text-align: right;
    }
    
    .invoice-title {
      font-size: 28px;
      font-weight: bold;
      color: ${brandColor};
      margin-bottom: 8px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      background: ${statusColor};
      color: white;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 15px;
    }
    
    .invoice-details {
      font-size: 13px;
    }
    
    .invoice-detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    
    .label {
      font-weight: 600;
      color: #4b5563;
    }
    
    .value {
      color: #1f2937;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #1f2937;
      background: #f3f4f6;
      padding: 8px 12px;
      margin-bottom: 12px;
      border-left: 4px solid ${brandColor};
    }
    
    .bill-to {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      margin-bottom: 20px;
      page-break-inside: avoid;
      page-break-after: avoid;
    }
    
    .customer-name {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 3px;
    }
    
    .event-name {
      font-size: 13px;
      color: #6b7280;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      page-break-inside: auto;
    }
    
    tbody tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    
    tbody td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    
    thead {
      background: ${brandColor};
      color: white;
    }
    
    thead th {
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
    }
    
    tbody tr:hover {
      background: #f9fafb;
    }
    
    .summary-table {
      margin-top: 20px;
      float: right;
      width: 320px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    
    .summary-row.total {
      background: ${brandColor};
      color: white;
      font-size: 16px;
      font-weight: bold;
      border: none;
      margin-top: 8px;
    }
    
    .summary-row.paid {
      background: #d1fae5;
      color: #065f46;
      font-weight: 600;
      font-size: 13px;
    }
    
    .summary-row.pending {
      background: #fee2e2;
      color: #991b1b;
      font-weight: 600;
      font-size: 13px;
    }
    
    .payment-section {
      clear: both;
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }
    
    .payment-info {
      flex: 1;
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    
    .payment-info h3 {
      font-size: 13px;
      font-weight: 700;
      color: ${brandColor};
      margin-bottom: 12px;
    }
    
    .payment-detail {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 12px;
    }
    
    .qr-section {
      width: 180px;
      text-align: center;
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      border: 2px dashed ${brandColor};
    }
    
    .qr-code {
      width: 150px;
      height: 150px;
      margin: 8px auto;
    }
    
    .qr-label {
      font-size: 11px;
      font-weight: 600;
      color: ${brandColor};
      margin-bottom: 8px;
    }
    
    .qr-amount {
      font-size: 14px;
      font-weight: 700;
      color: #1f2937;
      margin-top: 8px;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
    }
    
    .contact-info {
      margin-bottom: 12px;
      line-height: 1.8;
    }
    
    .contact-info strong {
      color: ${brandColor};
    }
    
    .thank-you {
      font-size: 14px;
      font-weight: 600;
      color: ${brandColor};
      font-style: italic;
      margin-top: 15px;
    }
    
    .notes {
      clear: both;
      background: #fffbeb;
      padding: 12px;
      border-left: 4px solid #f59e0b;
      margin-top: 20px;
      font-size: 11px;
      color: #78350f;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .container {
        padding: 20px;
      }
      
      .header {
        page-break-after: avoid;
      }
      
      .bill-to {
        page-break-inside: avoid;
        page-break-after: avoid;
      }
      
      thead {
        display: table-header-group;
      }
      
      tbody {
        display: table-row-group;
      }
      
      .summary-table {
        page-break-inside: avoid;
      }
      
      .payment-section {
        page-break-inside: avoid;
      }
      
      .footer {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        ${logoBase64 ? `<img src="${logoBase64}" alt="${companyCredential.display_name}" class="company-logo">` : `<div class="company-name">${companyCredential.display_name}</div>`}
        <div class="company-address">
          ${companyCredential.address.line1}<br>
          ${companyCredential.address.line2 ? companyCredential.address.line2 + '<br>' : ''}
          ${companyCredential.address.city}, ${companyCredential.address.state} - ${companyCredential.address.pincode}<br>
          ${companyCredential.tax_details?.gstin ? `<strong>GSTIN:</strong> ${companyCredential.tax_details.gstin}` : ''}
        </div>
      </div>
      
      <div class="invoice-info">
        <div class="invoice-title">${documentTitle}</div>
        <div class="invoice-details">
          <div class="invoice-detail-row">
            <span class="label">${documentTitle} #:</span>
            <span class="value">${invoice_number}</span>
          </div>
          <div class="invoice-detail-row">
            <span class="label">Date:</span>
            <span class="value">${formatDate(date)}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bill To Section -->
    <div class="section">
      <div class="section-title">BILL TO</div>
      <div class="bill-to">
        <div class="customer-name">${customer_name}</div>
        ${event_name ? `<div class="event-name">Event: ${event_name}</div>` : ''}
      </div>
    </div>
    
    <!-- Items Table -->
    <div class="section">
      <div class="section-title">DESCRIPTION</div>
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th>Item Description</th>
            <th style="width: 100px; text-align: center;">Qty</th>
            <th style="width: 120px; text-align: right;">Unit Price</th>
            <th style="width: 120px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    </div>
    
    <!-- Summary -->
    <div class="summary-table">
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(calculatedSubtotal)}</span>
      </div>
      ${discountAmount > 0 ? `
      <div class="summary-row" style="color: #059669;">
        <span>Discount${discount_percentage ? ` (${discount_percentage}%)` : ''}:</span>
        <span>- ${formatCurrency(discountAmount)}</span>
      </div>
      ` : ''}
      <div class="summary-row total">
        <span>TOTAL:</span>
        <span>${formatCurrency(total_amount)}</span>
      </div>
      ${status === 'final' && paid_amount > 0 ? `
      <div class="summary-row paid">
        <span>Paid:</span>
        <span>${formatCurrency(paid_amount)}</span>
      </div>
      ` : ''}
      ${status === 'final' && pending_amount > 0 ? `
      <div class="summary-row pending">
        <span>Balance Due:</span>
        <span>${formatCurrency(pending_amount)}</span>
      </div>
      ` : ''}
    </div>
    
    <!-- Payment Details (Only for FINAL Invoice) -->
    ${status === 'final' ? `
    <div class="payment-section">
      <div class="payment-info">
        <h3>💳 Bank Details</h3>
        ${companyCredential.bank_details?.account_name ? `
        <div class="payment-detail">
          <span class="label">Account Name:</span>
          <span>${companyCredential.bank_details.account_name}</span>
        </div>
        ` : ''}
        ${companyCredential.bank_details?.account_number ? `
        <div class="payment-detail">
          <span class="label">Account Number:</span>
          <span>${companyCredential.bank_details.account_number}</span>
        </div>
        ` : ''}
        ${companyCredential.bank_details?.ifsc_code ? `
        <div class="payment-detail">
          <span class="label">IFSC Code:</span>
          <span>${companyCredential.bank_details.ifsc_code}</span>
        </div>
        ` : ''}
        ${companyCredential.bank_details?.bank_name ? `
        <div class="payment-detail">
          <span class="label">Bank:</span>
          <span>${companyCredential.bank_details.bank_name}</span>
        </div>
        ` : ''}
        ${companyCredential.bank_details?.branch ? `
        <div class="payment-detail">
          <span class="label">Branch:</span>
          <span>${companyCredential.bank_details.branch}</span>
        </div>
        ` : ''}
        
        ${companyCredential.upi_details?.upi_id ? `
        <h3 style="margin-top: 20px;">📱 UPI Payment</h3>
        <div class="payment-detail">
          <span class="label">UPI ID:</span>
          <span>${companyCredential.upi_details.upi_id}</span>
        </div>
        ${companyCredential.upi_details.google_pay_number ? `
        <div class="payment-detail">
          <span class="label">Google Pay:</span>
          <span>${companyCredential.upi_details.google_pay_number}</span>
        </div>
        ` : ''}
        ` : ''}
      </div>
      
      ${qrCodeDataURL && pending_amount > 0 ? `
      <div class="qr-section">
        <div class="qr-label">SCAN TO PAY</div>
        <img src="${qrCodeDataURL}" alt="UPI QR Code" class="qr-code">
        <div class="qr-amount">${formatCurrency(pending_amount)}</div>
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    ${status === 'estimate' ? `
    <div class="notes">
      <strong>Note:</strong> This is an estimate/quotation. Final invoice with payment details will be sent after price confirmation.
    </div>
    ` : ''}
    
    ${status === 'final' && pending_amount > 0 ? `
    <div class="notes" style="background: #dbeafe; border-left-color: #3b82f6;">
      <strong>Payment Instructions:</strong> Please include invoice #${invoice_number} in your payment reference. Scan the QR code above for quick UPI payment.
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      <div class="contact-info">
        ${companyCredential.contact.primary_phone ? `<strong>Phone:</strong> ${companyCredential.contact.primary_phone}` : ''}
        ${companyCredential.contact.alternate_phone ? ` | ${companyCredential.contact.alternate_phone}` : ''}<br>
        ${companyCredential.contact.email ? `<strong>Email:</strong> ${companyCredential.contact.email}` : ''}
      </div>
      <div class="thank-you">Thank You For Your Business!</div>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Generate PDF from Invoice
 */
async function generateInvoicePDF(invoice, companyCredential) {
  let browser;
  
  try {
    // Generate HTML
    const html = await generateInvoiceHTML(invoice, companyCredential);
    
    // Launch browser with production-ready settings
    // Explicitly set executable path for Render.com deployment
    const path = require('path');
    const puppeteerConfig = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    };

    // Set explicit executable path from Puppeteer's cache for Render.com
    // Check if running on Render (RENDER environment variable exists)
    if (process.env.RENDER || process.env.HOME === '/opt/render') {
      const chromePath = path.join(
        process.env.HOME || '/opt/render',
        '.cache/puppeteer/chrome/linux-141.0.7390.76/chrome-linux64/chrome'
      );
      console.log(`🔍 Setting Chrome path for Render: ${chromePath}`);
      puppeteerConfig.executablePath = chromePath;
    }

    browser = await puppeteer.launch(puppeteerConfig);
    
    const page = await browser.newPage();
    
    // Set longer timeout for slow servers (Render free tier)
    page.setDefaultNavigationTimeout(60000); // 60 seconds
    page.setDefaultTimeout(60000); // 60 seconds
    
    // Set content with faster wait condition
    // Use 'domcontentloaded' instead of 'networkidle0' for better performance
    await page.setContent(html, {
      waitUntil: 'domcontentloaded', // Faster than networkidle0
      timeout: 60000 // 60 seconds explicit timeout
    });
    
    // Wait a bit for any images to load
    await page.waitForTimeout(1000); // 1 second buffer
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    
    return pdfBuffer;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

module.exports = {
  generateInvoicePDF,
  generateUPIQRCode
};
