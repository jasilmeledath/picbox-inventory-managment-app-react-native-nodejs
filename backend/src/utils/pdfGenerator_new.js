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
    total_amount,
    paid_amount,
    pending_amount,
    status,
    date
  } = invoice;

  // Calculate subtotal
  const subtotal = total_amount;
  
  // Determine logo path based on brand
  const logoPath = path.join(__dirname, '../../assets/logos', 
    brand_type === 'Picbox' ? 'picbox-logo.png' : 'echo-logo.png'
  );
  
  // Read logo and convert to base64
  let logoBase64 = '';
  try {
    const logoBuffer = await fs.readFile(logoPath);
    logoBase64 = \`data:image/png;base64,\${logoBuffer.toString('base64')}\`;
  } catch (error) {
    console.error('Error reading logo:', error);
  }
  
  // Generate UPI QR Code only for estimates and if UPI details exist
  let qrCodeDataURL = null;
  if (status === 'estimate' && companyCredential.upi_details?.upi_id && pending_amount > 0) {
    qrCodeDataURL = await generateUPIQRCode(
      companyCredential.upi_details.upi_id,
      companyCredential.upi_details.payee_name || companyCredential.display_name,
      pending_amount
    );
  }

  // Generate items rows HTML
  const itemsHTML = rented_items.map((item, index) => {
    const amount = item.qty * item.rate;
    return \`
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">\${index + 1}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">\${item.name}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 13px;">\${item.qty}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 13px;">\${formatCurrency(item.rate)}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; font-size: 13px;">\${formatCurrency(amount)}</td>
      </tr>
    \`;
  }).join('');

  // Determine brand color
  const brandColor = brand_type === 'Picbox' ? '#7C3AED' : '#8B5CF6';
  
  // Determine document title based on status
  const documentTitle = status === 'estimate' ? 'ESTIMATE' : 'INVOICE';

  const html = \`
