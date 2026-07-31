# 🚨 IMMEDIATE SETUP INSTRUCTIONS

## Your Current Status:

✅ **Your IP Address:** `10.150.42.203`  
❌ **MongoDB:** Not connected (need to add connection string)  
✅ **Backend Port:** 8080  
✅ **Network:** Wi-Fi connected  

---

## 🔧 FIX #1: Add MongoDB Connection String

### **Option A: If You Have MongoDB Atlas Account**

1. Go to: https://cloud.mongodb.com/
2. Login to your account
3. Click "**Connect**" on your cluster
4. Choose "**Connect your application**"
5. Copy the connection string (looks like):
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/picbox?retryWrites=true&w=majority
   ```

6. Open: `backend/.env` (already created for you)
7. **Replace line 10** with your actual connection string:
   ```env
   MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/picbox?retryWrites=true&w=majority
   ```

8. Save the file
9. In terminal, type: `rs` (to restart nodemon)

### **Option B: If You DON'T Have MongoDB Atlas**

**Create a free account (5 minutes):**

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up (free)
3. Create a **FREE cluster** (M0 tier)
4. Create a **database user** with username/password
5. **Whitelist IP:** Add `0.0.0.0/0` (allow all IPs for testing)
6. Click "**Connect**" → "Connect your application"
7. Copy connection string
8. Paste in `backend/.env` file (replace MONGO_URI)

### **Option C: Use Local MongoDB (If Installed)**

If you have MongoDB installed locally:

```env
MONGO_URI=mongodb://localhost:27017/picbox
```

---

## 🎯 Quick Test After Fixing MongoDB

Once you update `.env` with the correct MONGO_URI:

### In backend terminal (where server is running):

1. Type: `rs` (restart)
2. You should see:
   ```
   ✅ MongoDB connected successfully
   ```

### If it works, seed company credentials:

**Open a NEW terminal** and run:

```bash
cd backend
npm run seed:company
```

Expected output:
```
✅ Connected to MongoDB
✅ Created Picbox company credentials
✅ Created Echo company credentials
```

---

## 📱 Frontend Setup (After MongoDB Works)

### Update API URL to YOUR IP

1. Open: `frontend/src/utils/storage.ts`

2. Find line 21:
   ```typescript
   return url || 'http://192.168.0.107:3000/api';
   ```

3. Change to YOUR IP:
   ```typescript
   return url || 'http://10.150.42.203:8080/api';
   ```

4. Save the file

### Start Frontend

**Open a NEW terminal:**

```bash
cd frontend
npm install
npm start
```

---

## 📱 Phone Connection

Your phone needs to connect to: `http://10.150.42.203:8080`

### In Expo Go:

**Manual Connection:**
- Open Expo Go app
- Tap "Enter URL manually"
- Type: `exp://10.150.42.203:8081`
- Tap Connect

**Or scan QR code** when frontend starts.

---

## 🔍 Current Terminal Output Analysis

```
2026-07-31 19:37:30 [info]: 🚀 Server running on port 8080 in undefined mode
2026-07-31 19:37:30 [info]: � Local access: http://localhost:8080/api-docs
2026-07-31 19:37:30 [info]: 📱 Network access: http://192.168.220.35:8080/api-docs
2026-07-31 19:37:30 [error]: ❌ MongoDB connection failed
```

**Issues:**
1. ❌ MongoDB URI is undefined (need to set in .env)
2. ⚠️ NODE_ENV shows "undefined" (fixed in new .env file)
3. ⚠️ Network access shows wrong IP (will auto-update on restart)

**After fixing .env and restarting, you should see:**
```
✅ MongoDB connected successfully
🚀 Server running on port 8080 in development mode
📱 Network access: http://10.150.42.203:8080/api-docs
```

---

## ✅ Step-by-Step Action Plan

### RIGHT NOW:

1. **Get MongoDB connection string** (see Option A or B above)
2. **Update `backend/.env`** file with your MONGO_URI
3. **In backend terminal**, type `rs` to restart
4. **Verify** you see "MongoDB connected successfully"
5. **In NEW terminal**, run: `npm run seed:company`

### THEN:

6. **Update `frontend/src/utils/storage.ts`** with IP: `10.150.42.203`
7. **Start frontend** in new terminal: `npm start`
8. **Connect phone** via Expo Go (scan QR or manual)

### FINALLY:

9. **Login** to app
10. **Generate PDF** from an invoice
11. **Celebrate!** 🎉

---

## 🐛 Troubleshooting

### "MongooseError: The uri parameter must be a string"

→ You need to add your MongoDB connection string to `.env`  
→ See "Option A" or "Option B" above

### "Authentication failed"

→ Check username/password in connection string  
→ Make sure you created a database user in MongoDB Atlas

### "Network timeout"

→ In MongoDB Atlas, whitelist IP: `0.0.0.0/0`  
→ Or add your specific IP: `10.150.42.203`

---

## 📞 Need Help Getting MongoDB?

### Quick MongoDB Atlas Setup:

```
1. https://www.mongodb.com/cloud/atlas/register
2. Sign up (free, no credit card needed)
3. Create FREE cluster (takes 3-5 minutes)
4. Database Access → Add New User:
   - Username: picbox_user
   - Password: (generate secure password)
   - Privileges: Read and write to any database
5. Network Access → Add IP:
   - IP Address: 0.0.0.0/0
   - Description: Allow all (for testing)
6. Clusters → Connect → Connect your application
   - Driver: Node.js
   - Version: 4.1 or later
   - Copy connection string
7. Paste in backend/.env
```

---

## 🎯 Next Step

**Your immediate task:** Get MongoDB connection string and update `.env` file.

**Then:** Type `rs` in your backend terminal to restart the server.

---

**Your IP:** `10.150.42.203` ✅  
**Your Port:** `8080` ✅  
**Need:** MongoDB connection string ⏳  
