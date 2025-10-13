# PDF Download Fix - GET Route Support ✅

**Date:** October 2, 2025  
**Issue:** "Failed to download PDF" error when downloading invoice PDFs

## Problem

The PDF download was failing with "Failed to download PDF" error because:

1. **Route Mismatch:** Backend route was POST-only, but `FileSystem.downloadAsync` only supports GET requests
2. **Header Passing:** Auth headers weren't being passed correctly
3. **Error Handling:** Limited error information made debugging difficult

## Server Logs Showed

```
2025-10-02 15:59:33 [info]: GET /api/invoices/68de52e10cb7bec0059ee3f1/generate-pdf
```

The app was making a GET request but the route only accepted POST.

## Solutions Applied

### 1. Backend - Support Both GET and POST

**File:** `backend/src/routes/invoice.routes.js`

Added GET route alongside POST:

```javascript
// Support both GET and POST for PDF generation
router.get('/:id/generate-pdf', invoiceController.generatePDF);  // NEW - for downloads
router.post('/:id/generate-pdf', invoiceController.generatePDF); // Existing - for API
```

**Why Both?**
- GET: Used by FileSystem.downloadAsync for direct file downloads
- POST: Can be used by other API clients or future features

### 2. Frontend - Fixed Auth Headers

**File:** `frontend/src/api/invoice.service.ts`

**Before:**
```typescript
headers: client.defaults.headers.common as Record<string, string>
```

**After:**
```typescript
const authHeader = client.defaults.headers.common['Authorization'];

headers: {
  'Authorization': authHeader as string,
}
```

### 3. Added Detailed Logging

Added console logs at key points:

```typescript
console.log('Downloading PDF from:', url);
console.log('Download result:', downloadResult);
console.log('PDF generated successfully at:', fileUri);
```

This helps debug issues by showing:
- What URL is being called
- What status code is returned
- Where the file is saved

### 4. Improved Error Messages

**File:** `frontend/src/screens/invoices/InvoicesScreen.tsx`

**Before:**
```
'Failed to generate PDF. Make sure company credentials are configured.'
```

**After:**
```
'Failed to generate PDF. Please check:

1. Company credentials are configured
2. You have internet connection
3. Server is running'
```

## How It Works Now

### Request Flow:

```
1. User taps "Download Invoice PDF"
   ↓
2. Frontend calls invoiceService.generatePDF()
   ↓
3. FileSystem.downloadAsync makes GET request:
   GET http://192.168.220.35:3000/api/invoices/:id/generate-pdf
   Headers: { Authorization: 'Bearer token' }
   ↓
4. Backend receives GET request
   ↓
5. invoiceController.generatePDF() executes:
   - Fetches invoice from MongoDB
   - Fetches company credentials
   - Generates PDF with Puppeteer
   - Returns PDF binary with headers:
     Content-Type: application/pdf
     Content-Disposition: attachment; filename="invoice_4_Hadil.pdf"
   ↓
6. FileSystem saves PDF to device:
   file:///data/user/0/.../invoice_4_Hadil.pdf
   ↓
7. Share dialog opens automatically
   ↓
8. User chooses where to save/share
```

## Testing Checklist

Before testing, verify:

✅ **Backend server running**
```bash
http://192.168.220.35:3000/api-docs
```

✅ **Company credentials configured**
- Go to Settings → Company Credentials
- Ensure Picbox or Echo has all required fields

✅ **Invoice exists**
- At least one invoice in the list
- Invoice has customer name and items

✅ **Internet connection**
- Phone/tablet connected to same WiFi as Mac

## Try Again Now

1. **Reload the app** (changes should hot-reload)
2. **Open Expo Go** and shake device if needed
3. **Go to Invoices tab**
4. **Tap any invoice** to view details
5. **Scroll to "Download Invoice PDF"**
6. **Tap "Download Invoice PDF"** button
7. **Wait 5-10 seconds** for generation
8. **Check Expo logs** for console output
9. **Share dialog should open** ✅

## Debugging

If it still fails, check the console logs:

### What to Look For:

```javascript
// Good logs:
"Downloading PDF from: http://192.168.220.35:3000/api/invoices/abc123/generate-pdf"
"Download result: { status: 200, uri: 'file://...' }"
"PDF generated successfully at: file://..."

// Bad logs (indicates problem):
"Download result: { status: 404, ... }"  → Invoice not found
"Download result: { status: 401, ... }"  → Auth failed
"Download result: { status: 500, ... }"  → Server error
```

### Backend Logs:

Check the backend terminal for:

```bash
# Good:
2025-10-02 16:03:XX [info]: GET /api/invoices/:id/generate-pdf
2025-10-02 16:03:XX [info]: Generating PDF for invoice 4...
2025-10-02 16:03:XX [info]: PDF generated and sent for download: invoice_4_Hadil.pdf

# Bad:
2025-10-02 16:03:XX [error]: Missing required parameter - api_key
2025-10-02 16:03:XX [error]: Invoice not found
2025-10-02 16:03:XX [error]: Company credentials not found
```

## Common Issues & Fixes

### Issue 1: "Status: 401" (Unauthorized)

**Cause:** Auth token not being passed

**Fix:**
- Log out and log back in
- Token might have expired

### Issue 2: "Status: 404" (Not Found)

**Cause:** Invoice ID incorrect or route not registered

**Fix:**
- Backend server needs restart
- Check invoice ID is correct

### Issue 3: "Status: 500" (Server Error)

**Cause:** Company credentials missing or PDF generation failed

**Fix:**
- Configure company credentials in Settings
- Check backend logs for specific error
- Verify Puppeteer is installed: `cd backend && npm list puppeteer`

### Issue 4: Share Dialog Doesn't Open

**Cause:** Sharing not available on device

**Fix:**
- Check app permissions
- Update Expo Go
- Try on a different device

## Status

✅ **Backend Route:** GET endpoint added
✅ **Auth Headers:** Fixed  
✅ **Error Handling:** Improved with detailed logs
✅ **Server:** Restarted and running on port 3000
✅ **Ready for Testing**

---

**Last Updated:** October 2, 2025, 4:05 PM
