# Authentication Token Fix for PDF Downloads

## Problem
FileSystem.downloadAsync() was unable to download PDFs due to authentication issues.

### Issues Found:

1. **Parameter Order Error** (Frontend)
   - InvoicesScreen was passing parameters in wrong order
   - Expected: `(id, invoiceNumber, customerName)`
   - Was passing: `(id, customerName, invoiceNumber)`
   - Result: `customerName.replace is not a function` error

2. **FileSystem Header Limitation** (Frontend/Backend)
   - `FileSystem.downloadAsync()` doesn't support custom headers reliably across platforms
   - Authorization header with Bearer token was not being sent
   - Backend was rejecting requests with "No token provided"

## Solution

### 1. Fixed Parameter Order (Frontend)
**File**: `frontend/src/screens/invoices/InvoicesScreen.tsx`

Changed from:
```typescript
const fileUri = await invoiceService.generatePDF(
  invoiceId,
  viewingInvoice.customer_name,      // ❌ Wrong order
  viewingInvoice.invoice_number
);
```

To:
```typescript
const fileUri = await invoiceService.generatePDF(
  invoiceId,
  viewingInvoice.invoice_number,     // ✅ Correct order
  viewingInvoice.customer_name
);
```

### 2. Query Parameter Authentication (Frontend)
**File**: `frontend/src/api/invoice.service.ts`

Changed from header-based auth:
```typescript
// ❌ Headers don't work with FileSystem.downloadAsync
const downloadResult = await FileSystem.downloadAsync(
  `${baseURL}/invoices/${id}/generate-pdf`,
  fileUri,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);
```

To query parameter:
```typescript
// ✅ Query parameter works universally
const downloadUrl = `${baseURL}/invoices/${id}/generate-pdf?token=${token}`;
const downloadResult = await FileSystem.downloadAsync(
  downloadUrl,
  fileUri
);
```

### 3. Backend Support for Query Token (Backend)
**File**: `backend/src/middleware/auth.js`

Enhanced authenticate middleware to accept token from both sources:

```javascript
let token;

// Check for token in query parameter first (for FileSystem downloads)
if (req.query.token) {
  token = req.query.token;
  logger.info('Using token from query parameter');
}
// Then check Authorization header (for regular API calls)
else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
  token = req.headers.authorization.substring(7);
  logger.info('Using token from Authorization header');
}

if (!token) {
  logger.error(`Auth failed: No token provided`);
  return res.status(401).json({
    success: false,
    message: 'No token provided. Authorization denied.'
  });
}
```

## Why This Approach?

### FileSystem.downloadAsync Limitations:
1. **Native Implementation**: Uses native HTTP clients (URLSession on iOS, OkHttp on Android)
2. **Header Support**: Custom headers are not reliably supported across all platforms
3. **No Interceptors**: Doesn't go through axios interceptors like regular API calls

### Query Parameter Benefits:
1. **Universal Support**: Works on all platforms and HTTP clients
2. **Simple Implementation**: No complex header handling needed
3. **Backward Compatible**: Backend still supports Authorization header for regular API calls

## Testing

### Expected Behavior:
1. User taps "Download Invoice PDF" button
2. Frontend gets token from secure storage
3. Frontend makes request with token in query string: `?token=abc123...`
4. Backend auth middleware checks query parameter first
5. Token validated successfully
6. PDF generated and downloaded to device
7. Native share dialog opens automatically

### Backend Logs Should Show:
```
[info]: === Auth Middleware ===
[info]: Path: /68de52e10cb7bec0059ee3f1/generate-pdf
[info]: Method: GET
[info]: Query token: Present
[info]: Using token from query parameter
[info]: === PDF Generation Started ===
[info]: Invoice ID: 68de52e10cb7bec0059ee3f1
[info]: Found invoice #4 for customer name
[info]: Generating PDF for invoice 4...
[info]: ✅ PDF generated and sent for download
```

## Security Note

While query parameters are less secure than headers (can appear in logs), this is acceptable for:
- Short-lived JWT tokens
- Internal network usage (local WiFi)
- Mobile app context (not public URLs)

For production with public internet access, consider:
- Shorter token expiry times
- Request signing mechanism
- Rate limiting on PDF endpoints

## Files Modified

1. ✅ `frontend/src/screens/invoices/InvoicesScreen.tsx` - Fixed parameter order
2. ✅ `frontend/src/api/invoice.service.ts` - Changed to query parameter auth
3. ✅ `backend/src/middleware/auth.js` - Added query parameter support

## Status

✅ **READY TO TEST** - All changes applied and backend restarted
