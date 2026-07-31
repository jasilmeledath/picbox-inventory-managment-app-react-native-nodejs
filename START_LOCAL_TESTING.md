# 🚀 Quick Start - Local Testing (5 Minutes)

Follow these steps IN ORDER to test on your Android phone.

---

## ⚡ STEP 1: Backend Setup (2 minutes)

### 1.1 Create .env file

```bash
cd backend
copy .env.example .env
```

Open `.env` in Notepad and update **ONLY THIS LINE**:

```
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/picbox?retryWrites=true&w=majority
```

Replace with your actual MongoDB connection string!

### 1.2 Install & Seed

```bash
npm install
npm run seed:company
```

### 1.3 Get Your IP Address

```bash
ipconfig
```

Look for: `IPv4 Address. . . . . . . . . . . : 192.168.X.X`

**Write this down!** Example: `192.168.1.100`

### 1.4 Start Backend

```bash
npm run dev
```

**Expected output:**
```
🚀 Server running on port 8080
✅ MongoDB connected successfully
```

**✅ Keep this terminal open!**

---

## 📱 STEP 2: Frontend Setup (2 minutes)

### 2.1 Update API URL

**Open:** `frontend/src/utils/storage.ts`

**Find line 21** and change to YOUR IP:

```typescript
// Change this line:
return url || 'http://192.168.1.100:8080/api';
//                    ↑↑↑↑↑↑↑↑↑↑↑↑
//                    Use YOUR IP from Step 1.3!
```

Save the file.

### 2.2 Install Dependencies

**Open a NEW terminal:**

```bash
cd frontend
npm install
```

### 2.3 Start Frontend

```bash
npm start
```

**A QR code will appear!**

**✅ Keep this terminal open too!**

---

## 📱 STEP 3: Phone Setup (1 minute)

### 3.1 Install Expo Go

1. Open **Google Play Store**
2. Search "**Expo Go**"
3. Install the app

### 3.2 Connect to App

1. Open **Expo Go** on your phone
2. Tap "**Scan QR code**"
3. Scan the QR code from your terminal
4. Wait for app to load (~30 seconds)

---

## 🧪 STEP 4: Test PDF Generation

### 4.1 Login

- **Email:** `admin@picbox.com`
- **Password:** `admin123`

(Or create a new account if needed)

### 4.2 Generate Test PDF

1. Go to **Invoices**
2. Select an invoice (or create one)
3. Tap "**Generate PDF**"
4. Wait ~15-30 seconds

### 4.3 Verify Success ✅

You should see:
- ✅ Loading indicator
- ✅ "PDF generated successfully" message
- ✅ Share dialog opens
- ✅ PDF can be viewed

**Check backend terminal for:**
```
=== PDF Generation Started ===
✅ PDF generated successfully! Size: 123456 bytes
```

---

## 🎉 Success!

If PDF downloaded and opened correctly, you're done!

**Next steps:**
1. Test a few more PDFs (different invoices)
2. Push to Git when ready

---

## ❌ Something Failed?

### Error: "Cannot connect to server"

**Fix:**
1. Make sure both devices on SAME WiFi
2. Check IP address in `storage.ts` is correct
3. Backend terminal is still running

### Error: "Company credentials not found"

**Fix:**
```bash
cd backend
npm run seed:company
```

### Error: App shows blank screen

**Fix:**
- Shake your phone
- Tap "Reload"

### Need detailed help?

Open: `LOCAL_TESTING_GUIDE.md` for complete troubleshooting.

---

## 📋 Terminal Reference

You should have **2 terminals open**:

### Terminal 1 (Backend):
```
C:\Users\rahul\...\backend> npm run dev
🚀 Server running on port 8080
```

### Terminal 2 (Frontend):
```
C:\Users\rahul\...\frontend> npm start
› Metro waiting on exp://192.168.1.100:8081
[QR code appears here]
```

---

## ⏱️ Time Breakdown

- Backend setup: 2 minutes
- Frontend setup: 2 minutes
- Phone setup: 1 minute
- Testing: 2 minutes
- **Total: ~7 minutes**

---

**Ready? Start with Step 1!** 🚀
