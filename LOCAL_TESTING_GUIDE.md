# 📱 Local Testing Guide - Android Phone with Expo Go

Complete step-by-step guide to test the invoice PDF generation fix on your Android phone before deploying to production.

---

## 📋 Prerequisites

### What You Need:
- ✅ Windows PC (you have this)
- ✅ Android phone
- ✅ Both devices on the **SAME WiFi network** (important!)
- ✅ Node.js installed (check: `node --version`)
- ✅ MongoDB connection (can be local or MongoDB Atlas)

---

## 🔧 PART 1: Setup Backend (Server)

### **Step 1: Create .env File**

Navigate to backend folder and create `.env` file:

```bash
cd C:\Users\rahul\OneDrive\Desktop\picbox\picbox-inventory-managment-app-react-native-nodejs\backend
```

Create a file named `.env` with this content:

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# Database - Use your MongoDB Atlas URI or local MongoDB
MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/picbox?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=local-testing-secret-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=local-testing-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary Configuration (Optional for testing - can leave these as-is)
CLOUDINARY_CLOUD_NAME=demo
CLOUDINARY_API_KEY=demo
CLOUDINARY_API_SECRET=demo

# Security - Generate a random 64-character hex key
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Admin Configuration
ADMIN_EMAILS=admin@picbox.com
```

**Important:** Replace `MONGO_URI` with your actual MongoDB connection string!

---

### **Step 2: Install Backend Dependencies**

```bash
cd backend
npm install
```

Wait for installation to complete (~2-3 minutes).

---

### **Step 3: Seed Company Credentials**

This is crucial for PDF generation:

```bash
npm run seed:company
```

**Expected output:**
```
✅ Connected to MongoDB
✅ Created Picbox company credentials
✅ Created Echo company credentials
```

---

### **Step 4: Get Your Local IP Address**

You need your PC's local IP address so your phone can connect to the backend.

**Method 1 - Command Prompt:**
```bash
ipconfig
```

Look for "Wireless LAN adapter Wi-Fi" → "IPv4 Address":
```
IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

**Method 2 - PowerShell:**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*"} | Select-Object IPAddress
```

**Write down this IP address!** You'll need it. Let's say it's: `192.168.1.100`

---

### **Step 5: Start Backend Server**

```bash
npm run dev
```

**Expected output:**
```
🚀 Server running on port 8080 in development mode
� Local access: http://localhost:8080/api-docs
📱 Network access: http://192.168.1.100:8080/api-docs
✅ MongoDB connected successfully
```

**Keep this terminal window open!** The server must stay running.

---

### **Step 6: Test Backend is Working**

Open a new terminal and test:

```bash
curl http://localhost:8080/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"...","uptime":...}
```

---

## 📱 PART 2: Setup Mobile App (Frontend)

### **Step 7: Update API Base URL**

Open this file in your editor:
```
frontend/src/utils/storage.ts
```

Change line 21 to use YOUR local IP address:

```typescript
// BEFORE (default):
return url || 'http://192.168.0.107:3000/api';

// AFTER (use YOUR IP from Step 4):
return url || 'http://192.168.1.100:8080/api';
```

**Replace `192.168.1.100` with YOUR IP address from Step 4!**

---

### **Step 8: Install Frontend Dependencies**

Open a **NEW terminal window**:

```bash
cd C:\Users\rahul\OneDrive\Desktop\picbox\picbox-inventory-managment-app-react-native-nodejs\frontend
npm install
```

---

### **Step 9: Install Expo Go on Your Android Phone**

1. Open **Google Play Store** on your Android phone
2. Search for "**Expo Go**"
3. Install the official Expo Go app (by Expo)
4. Open the app after installation

---

### **Step 10: Start Expo Development Server**

In the frontend terminal:

```bash
npm start
```

**Expected output:**
```
Metro waiting on exp://192.168.1.100:8081

› Press s │ switch to Expo Go
› Press a │ open Android
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› Press o │ open project code in your editor

› Press ? │ show all commands
```

**A QR code will appear in the terminal!**

---

### **Step 11: Connect Your Android Phone**

**Method 1: Scan QR Code (Easiest)**

1. Open **Expo Go app** on your phone
2. Tap "**Scan QR code**"
3. Scan the QR code from your terminal
4. The app will start loading

**Method 2: Manual Connection**

1. Make sure your phone and PC are on the same WiFi
2. In Expo Go app, tap "**Enter URL manually**"
3. Type: `exp://192.168.1.100:8081` (use YOUR IP!)
4. Tap "**Connect**"

**Wait 30-60 seconds for the app to load on your phone.**

---

## 🧪 PART 3: Test PDF Generation

### **Step 12: Create Test Account & Login**

On your phone (in the Expo Go app):

1. If you see a login screen:
   - **Email:** `admin@picbox.com`
   - **Password:** `admin123` (or create a new account)

2. If registration is needed, create an account first

---

### **Step 13: Create Test Data**

You'll need test data to generate an invoice:

#### **Option A: Use Existing Seed Script**

In backend terminal:
```bash
npm run seed
```

This creates sample products, employees, jobs, and invoices.

#### **Option B: Create Manually via App**

1. Add a product (e.g., "DJ Speaker", rate: 5000)
2. Add an employee (e.g., "Test Worker", role: "Technician")
3. Create a job with the employee and product
4. Create an invoice with the rented items

---

### **Step 14: Generate PDF (The Critical Test!)**

1. **Navigate to Invoices** (in the app)
2. **Select an invoice** (or create a new one)
3. **Tap "Generate PDF"** or "Download Invoice" button
4. **Watch what happens:**

**✅ Success Indicators:**
   - Loading spinner appears
   - "PDF generated successfully" message
   - Share dialog opens
   - PDF can be opened and viewed

**❌ Error Indicators:**
   - Error message appears
   - "Company credentials not found"
   - "Network error"
   - App freezes

---

### **Step 15: Monitor Backend Logs**

While generating PDF, watch your backend terminal for logs:

**✅ Expected Success Logs:**
```
=== PDF Generation Started ===
Invoice #1 for Customer Name
Brand: Picbox, Status: final
✅ HTML template generated
🚀 Launching Puppeteer browser...
✅ Browser launched successfully
✅ New page created
📄 Setting page content...
✅ Page content set
🖨️ Generating PDF...
✅ PDF generated successfully! Size: 156789 bytes
✅ Browser closed
```

**❌ Error Logs (if something fails):**
```
❌ PDF Generation Error: [error message]
```

If you see errors, note them down for troubleshooting.

---

## 🔍 PART 4: Verification Checklist

Test all these scenarios:

### Basic Tests:
- [ ] App loads on phone via Expo Go
- [ ] Can login successfully
- [ ] Dashboard loads with data
- [ ] Can view invoice list
- [ ] Can open single invoice

### PDF Generation Tests:
- [ ] Generate PDF for **draft** invoice
- [ ] Generate PDF for **estimate** invoice
- [ ] Generate PDF for **final** invoice
- [ ] PDF contains company logo
- [ ] PDF shows all invoice items
- [ ] PDF shows correct totals
- [ ] PDF has QR code (for final invoices with pending amount)
- [ ] Can share/save PDF to phone
- [ ] PDF opens in external viewer correctly

### Brand Tests:
- [ ] Generate PDF for **Picbox** brand
- [ ] Generate PDF for **Echo** brand
- [ ] Both brands show correct logos

---

## 🐛 Troubleshooting

### Issue 1: "Cannot connect to server"

**Check:**
1. Backend is running (`npm run dev` in backend folder)
2. Both devices on SAME WiFi
3. IP address in `storage.ts` is correct
4. Windows Firewall isn't blocking port 8080

**Fix Windows Firewall:**
```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=8080
```

---

### Issue 2: "Company credentials not found"

**Fix:**
```bash
cd backend
npm run seed:company
```

---

### Issue 3: App shows white screen

**Fix:**
```bash
# In frontend terminal
# Press 'r' to reload
# Or shake your phone and tap "Reload"
```

---

### Issue 4: PDF generation times out

**Check backend terminal for errors.**

**Quick test - Generate PDF via API:**
```bash
# Get a token first by logging in
curl -X POST http://192.168.1.100:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@picbox.com\",\"password\":\"admin123\"}"

# Use the token to generate PDF
curl -X POST http://192.168.1.100:8080/api/invoices/INVOICE_ID/generate-pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output test.pdf
```

---

### Issue 5: Expo Go shows connection error

**Fix:**
```bash
# In frontend terminal, press 's' to switch to Expo Go mode
# Then reconnect on phone
```

---

## 📊 What Each Terminal Should Show

### Terminal 1 (Backend):
```
🚀 Server running on port 8080 in development mode
✅ MongoDB connected successfully
[info]: GET /api/invoices {...}
[info]: POST /api/invoices/123/generate-pdf {...}
=== PDF Generation Started ===
✅ PDF generated successfully!
```

### Terminal 2 (Frontend):
```
› Metro waiting on exp://192.168.1.100:8081
› Using Expo Go
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
  
  iOS: Double tap on your phone
  Android: Shake device or press hardware menu button
```

---

## ✅ Success Criteria

Everything is working if:

✅ Backend server starts without errors  
✅ MongoDB connects successfully  
✅ Company credentials are seeded  
✅ Frontend loads on phone via Expo Go  
✅ Can login to the app  
✅ Can view invoices  
✅ **PDF generates within 30 seconds**  
✅ **PDF downloads to phone**  
✅ **PDF opens correctly**  
✅ **Company logo appears in PDF**  
✅ **All invoice data is correct**  

---

## 🎯 Quick Testing Script

Run this complete test from scratch:

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run seed:company
npm run dev

# Terminal 2 - Frontend (AFTER backend is running)
cd frontend
npm install
npm start

# Then on phone:
# 1. Open Expo Go
# 2. Scan QR code
# 3. Login
# 4. Generate PDF
```

---

## 📞 Next Steps After Successful Testing

Once PDF generation works locally:

1. ✅ Verify all tests pass
2. ✅ Check PDF quality and content
3. ✅ Test on multiple invoices
4. 📤 **Push to Git** (original plan)
5. 🚀 **Deploy to Render**

---

## 💡 Pro Tips

1. **Keep both terminals open** while testing
2. **Watch backend logs** when generating PDFs
3. **Use phone's dev menu** (shake phone) to see React Native errors
4. **Test with real data** not just test data
5. **Try different invoice scenarios** (with/without discounts, paid/unpaid, etc.)

---

## 🔗 Quick Reference

**Backend URL:** `http://YOUR_IP:8080`  
**API Base:** `http://YOUR_IP:8080/api`  
**Health Check:** `http://YOUR_IP:8080/health`  
**API Docs:** `http://YOUR_IP:8080/api-docs`  

**Expo Go:** `exp://YOUR_IP:8081`  

Replace `YOUR_IP` with your actual IP from Step 4.

---

**Ready to start?** Follow from Step 1! 🚀

If you encounter issues, note down:
1. Which step failed
2. Error message shown
3. What you see in backend logs
4. What you see in frontend terminal
