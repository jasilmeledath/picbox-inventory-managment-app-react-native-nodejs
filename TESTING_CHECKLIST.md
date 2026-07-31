# ✅ Local Testing Checklist

Quick reference checklist for testing invoice PDF generation locally.

---

## 🖥️ Backend Setup

### Step 1: Environment Setup
- [ ] Created `.env` file in `backend/` folder
- [ ] Added MongoDB connection string (MONGO_URI)
- [ ] Generated encryption key (64 hex characters)
- [ ] Verified all required env variables

### Step 2: Dependencies & Data
- [ ] Ran `npm install` in backend folder
- [ ] Ran `npm run seed:company` (company credentials)
- [ ] Optional: Ran `npm run seed` (sample data)

### Step 3: Get Local IP
- [ ] Ran `ipconfig` in Command Prompt
- [ ] Found IPv4 Address under Wi-Fi adapter
- [ ] Wrote down IP: `192.168.___.___`

### Step 4: Start Backend
- [ ] Ran `npm run dev` in backend folder
- [ ] Saw "Server running on port 8080"
- [ ] Saw "MongoDB connected successfully"
- [ ] Tested health endpoint: `http://localhost:8080/health`

---

## 📱 Mobile App Setup

### Step 5: Update API URL
- [ ] Opened `frontend/src/utils/storage.ts`
- [ ] Changed line 21 to use MY local IP
- [ ] Format: `http://MY_IP:8080/api`
- [ ] Saved file

### Step 6: Frontend Dependencies
- [ ] Opened NEW terminal window
- [ ] Ran `npm install` in frontend folder
- [ ] Waited for completion

### Step 7: Phone Preparation
- [ ] Installed "Expo Go" app from Play Store
- [ ] Opened Expo Go app
- [ ] Confirmed phone on SAME WiFi as PC

### Step 8: Start Frontend
- [ ] Ran `npm start` in frontend folder
- [ ] Saw QR code in terminal
- [ ] Saw "Metro waiting on exp://..."

### Step 9: Connect Phone
- [ ] Opened Expo Go on phone
- [ ] Scanned QR code (or entered URL manually)
- [ ] App started loading on phone
- [ ] Waited for app to fully load (~30-60 seconds)

---

## 🧪 Testing PDF Generation

### Step 10: Login & Navigation
- [ ] Logged in to app (admin@picbox.com / admin123)
- [ ] Saw dashboard load successfully
- [ ] Navigated to Invoices section
- [ ] Can see list of invoices

### Step 11: Create/Select Invoice
- [ ] Selected existing invoice OR
- [ ] Created new test invoice with:
  - [ ] Customer name
  - [ ] At least one item
  - [ ] Total amount
  - [ ] Brand (Picbox or Echo)

### Step 12: Generate PDF
- [ ] Tapped "Generate PDF" button
- [ ] Loading indicator appeared
- [ ] Monitored backend terminal for logs

### Step 13: Verify Success
- [ ] Saw "PDF generated successfully" message
- [ ] Share dialog opened on phone
- [ ] Can view PDF preview
- [ ] PDF contains:
  - [ ] Company logo
  - [ ] Invoice number
  - [ ] Customer name
  - [ ] All items with quantities & prices
  - [ ] Correct total amount
  - [ ] Bank details (for final invoices)
  - [ ] QR code (if final with pending amount)

---

## 🔍 Backend Log Verification

### Expected Success Logs:
- [ ] `=== PDF Generation Started ===`
- [ ] `✅ HTML template generated`
- [ ] `🚀 Launching Puppeteer browser...`
- [ ] `✅ Browser launched successfully`
- [ ] `✅ PDF generated successfully! Size: ___ bytes`
- [ ] `✅ Browser closed`

### If Errors Appear:
- [ ] Noted exact error message
- [ ] Checked which step failed
- [ ] Referred to troubleshooting guide

---

## 📋 Comprehensive Test Scenarios

### Invoice Types:
- [ ] Draft invoice → Generate PDF
- [ ] Estimate invoice → Generate PDF
- [ ] Final invoice → Generate PDF
- [ ] Invoice with discount → Generate PDF
- [ ] Invoice with payment → Generate PDF
- [ ] Invoice fully paid → Generate PDF

### Brand Testing:
- [ ] Picbox brand → Logo shows correctly
- [ ] Echo brand → Logo shows correctly

### Edge Cases:
- [ ] Invoice with single item
- [ ] Invoice with many items (10+)
- [ ] Invoice with large amount (₹1,00,000+)
- [ ] Invoice with zero pending amount
- [ ] Invoice with percentage discount

---

## 🐛 Troubleshooting Quick Checks

If something fails, check:

### Backend Issues:
- [ ] Backend terminal is still running
- [ ] MongoDB is connected (see logs)
- [ ] No error messages in backend terminal
- [ ] Can access `http://localhost:8080/health`

### Network Issues:
- [ ] Phone and PC on SAME WiFi network
- [ ] IP address in `storage.ts` is correct
- [ ] Windows Firewall not blocking port 8080
- [ ] Can ping PC from phone (optional)

### Frontend Issues:
- [ ] Frontend terminal is still running
- [ ] No red error screen on phone
- [ ] Can reload app (shake phone → Reload)
- [ ] Expo Go app is up to date

### PDF Issues:
- [ ] Company credentials exist (run seed:company)
- [ ] Logo files exist in `backend/assets/logos/`
- [ ] Puppeteer/Chrome installed correctly
- [ ] Enough disk space for PDF generation

---

## ✅ Final Verification

Before pushing to production:

- [ ] Generated PDF at least 3 times successfully
- [ ] Tested both Picbox and Echo brands
- [ ] Tested all invoice statuses (draft/estimate/final)
- [ ] PDFs open correctly on phone
- [ ] PDFs have correct data and formatting
- [ ] No errors in backend logs
- [ ] No errors on phone
- [ ] Process takes < 30 seconds per PDF

---

## 🚀 Ready for Production?

All items above checked? ✅

**Next steps:**
1. Stop both servers (Ctrl+C in both terminals)
2. Revert `storage.ts` to production URL (if needed)
3. Commit changes: `git add . && git commit -m "Fix: Invoice PDF generation"`
4. Push to repository: `git push origin main`
5. Render will auto-deploy
6. Run `npm run seed:company` on Render (via Shell)
7. Test from production APK

---

## 📞 Quick Commands Reference

```bash
# Backend
cd backend
npm install
npm run seed:company
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start

# Get IP Address
ipconfig

# Test Backend
curl http://localhost:8080/health

# Windows Firewall (if needed, run as Admin)
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=8080
```

---

**Testing time estimate:** 15-20 minutes  
**Prerequisites:** ~5 minutes  
**Total:** ~25 minutes  

Good luck! 🎯
