# 🔧 Invoice PDF Generation - Complete Fix Guide

## 📋 Issues Identified & Fixed

### 1. ✅ **Chrome Path Hardcoding Issue (CRITICAL)**
**Problem:** Chrome version was hardcoded, causing "Chrome not found" errors.

**Solution:** Updated `pdfGenerator.js` to use Puppeteer's built-in `executablePath()` method which automatically detects the installed Chrome version.

---

### 2. ✅ **Timeout Issues**
**Problem:** 60-second timeout was too short for Render's free tier (cold starts + Chrome launching).

**Solution:** Increased timeouts to 120 seconds (2 minutes) and added 2-second buffer for logo loading.

---

### 3. ✅ **Missing Company Credentials**
**Problem:** Database might not have company credentials for Picbox/Echo brands.

**Solution:** Created `seedCompanyCredentials.js` script to populate default credentials.

---

### 4. ✅ **Better Error Logging**
**Problem:** Hard to diagnose PDF generation failures.

**Solution:** Added comprehensive console logging at every step of PDF generation.

---

## 🚀 Step-by-Step Fix Instructions

### **STEP 1: Deploy Updated Code to Render**

```bash
# Navigate to backend directory
cd backend

# Commit the changes
git add .
git commit -m "Fix: Invoice PDF generation - Chrome path detection & timeouts"

# Push to trigger Render deployment
git push origin main
```

**Expected Result:** Render will automatically redeploy with the fixes.

---

### **STEP 2: Verify Chrome Installation on Render**

After deployment, check Render logs for:

```
✅ Chrome installed successfully
🔍 Using Puppeteer's detected Chrome path: /path/to/chrome
```

If you see Chrome installation issues, run this in Render Shell:

```bash
npx puppeteer browsers install chrome
```

---

### **STEP 3: Seed Company Credentials**

**Option A: Via Render Shell (Recommended)**

1. Go to Render Dashboard → Your Service → Shell
2. Run:
```bash
npm run seed:company
```

**Option B: Via Local Terminal (with Production DB)**

1. Make sure your `.env` has the production `MONGO_URI`
2. Run:
```bash
cd backend
npm run seed:company
```

**Expected Output:**
```
✅ Connected to MongoDB
✅ Created Picbox company credentials
✅ Created Echo company credentials
✅ Company credentials seeding complete!
```

---

### **STEP 4: Test PDF Generation**

#### **Method 1: Test from Mobile App**

1. Open the PicBox mobile app
2. Navigate to an invoice
3. Tap "Generate PDF" or "Download Invoice"
4. Check for errors in the app

#### **Method 2: Test via API Directly (Recommended for Debugging)**

Using Postman or curl:

```bash
# Replace with your actual values
INVOICE_ID="your_invoice_id_here"
TOKEN="your_jwt_token_here"
API_URL="https://picbox-inventory-managment-app-react.onrender.com"

curl -X POST "${API_URL}/api/invoices/${INVOICE_ID}/generate-pdf" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --output invoice.pdf
```

**Expected Result:** A valid PDF file should be downloaded.

---

### **STEP 5: Monitor Render Logs**

While testing, watch Render logs for:

#### ✅ **Success Indicators:**
```
=== PDF Generation Started ===
Invoice #1234 for Customer Name
✅ HTML template generated
🚀 Launching Puppeteer browser...
✅ Browser launched successfully
✅ New page created
📄 Setting page content...
✅ Page content set
🖨️ Generating PDF...
✅ PDF generated successfully! Size: 123456 bytes
✅ Browser closed
```

#### ❌ **Error Indicators:**
```
❌ PDF Generation Error: [error message]
Error stack: [stack trace]
```

---

## 🐛 Debugging Guide

### **Issue 1: "Company credentials not found"**

**Symptoms:**
- API returns 404 error
- Message: "Company credentials not found for Picbox/Echo"

**Fix:**
```bash
# Run the seeder script
npm run seed:company
```

**Verification:**
```bash
# Check database directly (via MongoDB Compass or mongo shell)
db.companycredentials.find()
```

---

### **Issue 2: "Chrome not found" or "Browser launch failed"**

**Symptoms:**
- Error: `Failed to launch the browser process`
- Error: `Could not find Chrome`

**Fix (Render Shell):**
```bash
# Reinstall Chrome
npx puppeteer browsers install chrome

# Verify installation
ls -la ~/.cache/puppeteer/chrome/
```

**Alternative Fix - Add to Render Environment Variables:**
```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
```

Then redeploy.

---

### **Issue 3: Timeout Errors**

**Symptoms:**
- Error: `TimeoutError: Navigation timeout of 120000 ms exceeded`
- PDF generation takes too long

**Fix 1: Increase Timeouts Further (in `pdfGenerator.js`)**
```javascript
page.setDefaultNavigationTimeout(180000); // 3 minutes
page.setDefaultTimeout(180000);
```

**Fix 2: Upgrade Render Plan**
- Free tier has limited resources
- Paid tier has faster cold starts and more memory

---

### **Issue 4: Logo Not Showing in PDF**

**Symptoms:**
- PDF generates but company logo is missing
- Console shows: `Error reading logo: [error]`

**Fix 1: Verify Assets Deployment**
```bash
# SSH into Render and check
ls -la /app/backend/assets/logos/

# Should show:
# picbox-logo.png
# echo-logo.png
```

**Fix 2: Update .gitignore**

Make sure `backend/.gitignore` does NOT ignore the assets folder:

```bash
# Check if assets are tracked
git ls-files backend/assets/logos/
```

If files are not tracked:
```bash
git add -f backend/assets/logos/*.png
git commit -m "Add logo assets"
git push
```

---

### **Issue 5: Mobile App Shows "Network Error"**

**Symptoms:**
- App shows generic network error
- Logs show successful PDF generation on server

**Fix: Check Mobile App Token**

The issue might be authentication. Verify:

1. Token is being sent correctly
2. Token hasn't expired
3. Check mobile app console logs

**Add logging to `invoice.service.ts`:**
```typescript
console.log('Token:', token);
console.log('Request URL:', url);
console.log('Response status:', response.status);
```

---

## 📱 Testing Checklist

Use this checklist to verify the fix:

### Backend Tests
- [ ] Server starts without errors
- [ ] Chrome is installed (check logs)
- [ ] Company credentials exist in database
- [ ] PDF generation endpoint responds (via Postman/curl)
- [ ] PDF file is valid and opens correctly
- [ ] PDF contains logo
- [ ] PDF contains all invoice data
- [ ] PDF has correct branding (Picbox/Echo)

### Mobile App Tests
- [ ] App can connect to server
- [ ] Authentication works
- [ ] Invoice list loads
- [ ] "Generate PDF" button works
- [ ] PDF downloads to device
- [ ] Share dialog appears
- [ ] PDF opens in external viewer

---

## 🔍 Quick Diagnostics Commands

### Check Render Logs
```bash
# Via Render Dashboard > Logs
# Look for errors after invoice PDF generation attempt
```

### Check Database
```javascript
// Via MongoDB Compass or mongo shell
use picbox

// Check if company credentials exist
db.companycredentials.find().pretty()

// Check if invoices exist
db.invoices.find().limit(5).pretty()
```

### Test Puppeteer Locally
```bash
cd backend

# Create a test file: test-puppeteer.js
node test-puppeteer.js
```

**test-puppeteer.js:**
```javascript
const puppeteer = require('puppeteer');

(async () => {
  console.log('Testing Puppeteer...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  console.log('✅ Browser launched!');
  console.log('Executable path:', puppeteer.executablePath());
  
  const page = await browser.newPage();
  await page.setContent('<h1>Test PDF</h1>');
  const pdf = await page.pdf({ format: 'A4' });
  
  console.log('✅ PDF generated! Size:', pdf.length, 'bytes');
  
  await browser.close();
})();
```

---

## 📞 Support

If issues persist after following this guide:

1. **Check Render Logs** - Most errors will be visible here
2. **Verify Environment Variables** - Ensure all required vars are set
3. **Test Locally First** - Use `npm run dev` and test PDF generation locally
4. **Database Check** - Verify company credentials exist

---

## 🎉 Success Criteria

PDF generation is working correctly when:

✅ Server logs show "PDF generated successfully"  
✅ PDF file downloads to mobile device  
✅ PDF opens without errors  
✅ PDF shows company logo  
✅ PDF contains all invoice items  
✅ PDF has correct total amounts  
✅ QR code appears (for final invoices with pending payment)  
✅ No timeout errors  
✅ Process completes in < 30 seconds  

---

## 📝 Changes Made

### Modified Files:
1. `backend/src/utils/pdfGenerator.js`
   - Fixed Chrome path detection
   - Increased timeouts to 120 seconds
   - Added comprehensive logging

2. `backend/package.json`
   - Added `seed:company` script

### New Files:
1. `backend/src/scripts/seedCompanyCredentials.js`
   - Seeds default company credentials for Picbox & Echo

---

**Last Updated:** {{ current_date }}  
**Status:** Ready for deployment ✅
