# PDF Generator Update Instructions

## Critical Changes Needed in `/backend/src/utils/pdfGenerator.js`

### Change 1: Add logo reading functionality (around line 65)

**FIND** this section (after the subtotal calculation):
```javascript
  // Calculate subtotal and tax if applicable
  const subtotal = total_amount;
  const gstRate = 18; // 18% GST
  const gstAmount = 0; // Not calculating GST separately for now
  
  // Generate UPI QR Code if UPI details exist
```

**REPLACE WITH**:
```javascript
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
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error reading logo:', error);
  }
  
  // Generate UPI QR Code only for estimates and if UPI details exist
```

### Change 2: Update QR Code generation condition (around line 70)

**FIND**:
```javascript
  // Generate UPI QR Code if UPI details exist
  let qrCodeDataURL = null;
  if (companyCredential.upi_details?.upi_id && pending_amount > 0) {
```

**REPLACE WITH**:
```javascript
  // Generate UPI QR Code only for estimates
  let qrCodeDataURL = null;
  if (status === 'estimate' && companyCredential.upi_details?.upi_id && pending_amount > 0) {
```

### Change 3: Add document title logic (around line 100)

**FIND** (just before the HTML template starts):
```javascript
  // Determine brand color
  const brandColor = brand_type === 'Picbox' ? '#7C3AED' : '#8B5CF6';
  
  // Status badge color
  const statusColors = {
```

**REPLACE WITH**:
```javascript
  // Determine brand color
  const brandColor = brand_type === 'Picbox' ? '#7C3AED' : '#8B5CF6';
  
  // Determine document title based on status
  const documentTitle = status === 'estimate' ? 'ESTIMATE' : 'INVOICE';
```

**AND DELETE** these lines (remove status badge completely):
```javascript
  // Status badge color
  const statusColors = {
    'draft': '#6B7280',
    'estimate': '#F59E0B',
    'final': '#10B981'
  };
  const statusColor = statusColors[status] || '#6B7280';
```

### Change 4: Update logo display in HTML (around line 410)

**FIND**:
```javascript
        ${companyCredential.logo?.url ? `<img src="${companyCredential.logo.url}" alt="${companyCredential.display_name}" class="company-logo">` : `<div class="company-name">${companyCredential.display_name}</div>`}
```

**REPLACE WITH**:
```javascript
        ${logoBase64 ? `<img src="${logoBase64}" alt="${companyCredential.display_name}" class="company-logo">` : `<div class="company-name">${companyCredential.display_name}</div>`}
```

### Change 5: Update invoice title (around line 425)

**FIND**:
```javascript
      <div class="invoice-info">
        <div class="invoice-title">INVOICE</div>
        <div class="status-badge">${status.toUpperCase()}</div>
        <div class="invoice-details">
          <div class="invoice-detail-row">
            <span class="label">Invoice #:</span>
```

**REPLACE WITH**:
```javascript
      <div class="invoice-info">
        <div class="invoice-title">${documentTitle}</div>
        <div class="invoice-details">
          <div class="invoice-detail-row">
            <span class="label">${documentTitle} #:</span>
```

### Change 6: Wrap payment section conditionally (around line 520)

**FIND**:
```javascript
    <!-- Payment Details -->
    <div class="payment-section">
      <div class="payment-info">
```

**REPLACE WITH**:
```javascript
    <!-- Payment Details (Only for Estimate) -->
    ${status === 'estimate' ? `
    <div class="payment-section">
      <div class="payment-info">
```

**AND FIND** (end of payment section, around line 590):
```javascript
      ` : ''}
    </div>
    
    ${status === 'estimate' ? `
```

**REPLACE WITH**:
```javascript
      ` : ''}
    </div>
    ` : ''}
    
    ${status === 'estimate' ? `
```

## Quick Apply Script

You can apply these changes manually, or I can help you with a specific section. The key changes are:

1. ✅ **Logos copied** to `backend/assets/logos/`
2. ⚠️ **Need to update** `pdfGenerator.js` with 6 changes above
3. ✅ **Documentation created** in `INVOICE_PDF_IMPROVEMENTS.md`

## Testing After Changes

```bash
# Restart backend
cd backend
npm start

# Then test PDF generation from mobile app
```

## Expected Results

- **Estimate PDFs**: Show "ESTIMATE" title, company logo, payment details + QR code
- **Final PDFs**: Show "INVOICE" title, company logo, NO payment details
- **All PDFs**: Better layout, fit on one page (unless many items)

---

Would you like me to:
1. Apply these changes section by section?
2. Create a complete new file you can copy-paste?
3. Guide you through manual editing?
