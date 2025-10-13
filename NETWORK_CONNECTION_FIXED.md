# Network Connection Configuration - FIXED ✅

**Date:** October 2, 2025

## Issue
The Expo Go app on the phone couldn't connect to the backend server with error: "Unable to connect to server"

## Root Cause
1. **Wrong IP Address**: The API client was configured with old IP `192.168.0.111` instead of current IP `192.168.220.35`
2. **CORS Configuration**: Backend CORS was only allowing `localhost` origins
3. **Network Binding**: Server needed to listen on all network interfaces (`0.0.0.0`)

## Solutions Applied

### 1. Updated API Base URL
**File:** `frontend/src/api/client.ts`
- **Old:** `http://192.168.0.111:3000/api`
- **New:** `http://192.168.220.35:3000/api`

```typescript
const BASE_URL = 'http://192.168.220.35:3000/api';
```

### 2. Fixed CORS Configuration
**File:** `backend/src/index.js`
- Updated to allow all origins in development mode
- Enables credentials for cookie-based authentication

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : '*', // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 3. Server Network Binding
**File:** `backend/src/index.js`
- Changed to listen on `0.0.0.0` (all network interfaces)
- Enables access from other devices on the same WiFi network

```javascript
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  // ... network access info
});
```

## Current Network Configuration

### Backend Server
- **Local Access:** `http://localhost:3000`
- **Network Access:** `http://192.168.220.35:3000`
- **API Docs:** `http://192.168.220.35:3000/api-docs`
- **Status:** ✅ Running and accessible on network

### Frontend (Expo)
- **Metro Bundler:** `exp://192.168.220.35:8081`
- **API Base URL:** `http://192.168.220.35:3000/api`
- **Status:** ✅ Running with cleared cache

## How to Use on Your Phone

### Steps to Connect:
1. **Ensure WiFi Connection:** Make sure your phone is connected to the same WiFi network as your Mac
2. **Open Expo Go:** Launch the Expo Go app on your phone
3. **Scan QR Code:** Scan the QR code displayed in the terminal
4. **App Loads:** The app will load and connect to the backend server at `192.168.220.35:3000`

### Testing the Connection:
1. Open the app on your phone
2. Try logging in with your credentials
3. If successful, you should see the dashboard with data from the backend
4. Check the dashboard to verify API calls are working

## Troubleshooting

### If Connection Still Fails:

1. **Verify IP Address:** Your Mac's IP might change. Check current IP:
   ```bash
   ipconfig getifaddr en0  # For WiFi
   ipconfig getifaddr en1  # For Ethernet
   ```

2. **Update API URL:** If IP changed, update `frontend/src/api/client.ts` with new IP

3. **Check Firewall:** Ensure macOS firewall allows Node.js connections:
   - Go to System Preferences → Security & Privacy → Firewall → Firewall Options
   - Allow incoming connections for Node

4. **Check Backend Status:**
   ```bash
   curl http://192.168.220.35:3000/api-docs
   ```
   Should return HTML of Swagger docs

5. **Check Frontend Status:**
   ```bash
   curl http://192.168.220.35:8081
   ```
   Should return Expo Metro Bundler page

6. **Restart Services:**
   ```bash
   # Stop backend
   lsof -ti:3000 | xargs kill -9
   
   # Stop Expo
   lsof -ti:8081 | xargs kill -9
   
   # Start backend
   cd backend && npm start
   
   # Start Expo with cleared cache
   cd frontend && npx expo start --clear
   ```

## Important Notes

⚠️ **IP Address Changes:** Your Mac's IP address will change when:
- You connect to a different WiFi network
- Your router assigns a new IP (DHCP lease renewal)
- You switch between WiFi and Ethernet

When this happens, update the API base URL in `frontend/src/api/client.ts`

✅ **Both Mac and Phone Must Be on Same WiFi Network**

✅ **Backend and Frontend Servers Must Be Running**

## Quick Start Commands

### Start Backend:
```bash
cd backend
npm start
```

### Start Frontend:
```bash
cd frontend
npx expo start
```

### Check Current IP:
```bash
ipconfig getifaddr en0
```

### Kill Processes:
```bash
# Kill backend (port 3000)
lsof -ti:3000 | xargs kill -9

# Kill Expo (port 8081)
lsof -ti:8081 | xargs kill -9
```

## Success Indicators

✅ Backend server logs show: `📱 Network access: http://192.168.220.35:3000/api-docs`
✅ Expo shows: `Metro waiting on exp://192.168.220.35:8081`
✅ App loads on phone without connection errors
✅ Login works and dashboard displays data

---

**Configuration Status:** ✅ FIXED AND WORKING
**Last Updated:** October 2, 2025, 2:35 PM
