# API Configuration Guide

## Overview
The login screen now includes an API configuration setting that allows you to easily change the backend server URL. This is especially useful when testing the app on different networks.

## Features

### 🎯 Quick Access
- **Settings Icon**: Tap the ⚙️ icon in the top-right corner of the login screen
- **Current URL Display**: The current API URL is displayed below the logo

### 🔧 Configuration Modal

The settings modal provides:
1. **URL Input Field**: Enter your backend server URL
2. **Helpful Tips**: Instructions on how to find your Mac's IP address
3. **Reset Button**: Quick reset to default IP (192.168.0.102)
4. **Save & Restart**: Saves the configuration (requires app restart)

## How to Use

### Step 1: Find Your Network IP Address

#### On macOS:
```bash
# In Terminal
ipconfig getifaddr en0

# Or via System Settings
System Settings → Network → WiFi → Details → TCP/IP
```

#### On Windows:
```cmd
ipconfig
```

### Step 2: Update API Configuration

1. Open the app on your device
2. On the login screen, tap the ⚙️ icon (top-right)
3. Enter your backend URL in the format:
   ```
   http://YOUR_IP_ADDRESS:3000/api
   ```
   Example: `http://192.168.0.102:3000/api`
4. Tap "Save & Restart"
5. Close and reopen the app completely

### Step 3: Test Connection

1. After restarting, you should see the new URL displayed below the logo
2. Try logging in with demo credentials:
   - Email: `admin@picbox.com`
   - Password: `admin123`
3. If connection fails, check that:
   - Backend server is running
   - Both devices are on the same WiFi network
   - Firewall is not blocking port 3000

## Default Configuration

```
Default URL: http://192.168.0.102:3000/api
Port: 3000
Protocol: HTTP (for local development)
```

## Network Requirements

### For Development:
- ✅ Both Mac and mobile device must be on the **same WiFi network**
- ✅ Backend server must be running on port 3000
- ✅ Mac's firewall must allow connections on port 3000

### Common Network Setups:

#### Home Network:
```
Mac IP: 192.168.0.x or 192.168.1.x
Phone/Tablet: Same subnet
```

#### Office Network:
```
Mac IP: 10.x.x.x or 172.16.x.x
Phone/Tablet: Same subnet
```

## Troubleshooting

### Issue: "Unable to connect to server"

**Solution 1**: Verify IP Address
```bash
# On Mac, run in Terminal:
ipconfig getifaddr en0

# Update the app with the correct IP
```

**Solution 2**: Check Backend Server
```bash
# In backend directory
cd /Users/jasilm/Desktop/picboxfullstack/backend
npm start

# Should show:
# 📱 Network access: http://YOUR_IP:3000/api-docs
```

**Solution 3**: Verify Network
- Ensure both devices are on the same WiFi
- Check that no VPN is active on either device
- Temporarily disable Mac firewall for testing

**Solution 4**: Test Backend
```bash
# From Mac, test backend is responding:
curl http://localhost:3000/api/auth/health

# From mobile device's browser:
http://YOUR_MAC_IP:3000/api-docs
```

### Issue: "Auth failed: No token provided"

This means connection is working but authentication failed. Check:
- Backend is running the latest code
- You're logged in with valid credentials
- Try logging out and back in

### Issue: Changes not taking effect

**Solution**: Complete app restart required
1. Close the app completely (swipe up from app switcher)
2. Force quit if needed
3. Reopen the app fresh

## API URL Format

### Correct Formats:
```
✅ http://192.168.0.102:3000/api
✅ http://10.0.0.50:3000/api
✅ https://api.yourserver.com/api
```

### Incorrect Formats:
```
❌ 192.168.0.102:3000/api (missing http://)
❌ http://192.168.0.102/api (missing port)
❌ http://192.168.0.102:3000 (missing /api)
❌ localhost:3000/api (use actual IP)
```

## Development Tips

### Quick IP Switching Script
Create a script to quickly get your IP:
```bash
#!/bin/bash
# save as get-ip.sh
echo "Your IP: $(ipconfig getifaddr en0)"
echo "Update app to: http://$(ipconfig getifaddr en0):3000/api"
```

### Backend Network Info
The backend shows network info on startup:
```
📱 Network access: http://192.168.0.102:3000/api-docs
```
Use this URL (replace /api-docs with /api) in the app settings.

### Testing Multiple Devices
You can test on multiple devices simultaneously:
- All devices use the same backend URL
- Each device maintains its own auth token
- Network activity is logged in backend console

## Security Notes

### Development (Current):
- Uses HTTP (not HTTPS) for simplicity
- Runs on local network only
- No SSL certificate needed

### Production (Future):
- Should use HTTPS
- Should use proper domain name
- Should implement SSL/TLS certificates
- Should use environment-based configuration

## Related Files

- **Frontend Config**: `frontend/src/utils/storage.ts`
- **Backend Server**: `backend/src/index.js`
- **Login Screen**: `frontend/src/screens/auth/LoginScreen.tsx`

## Quick Reference

| Scenario | Action |
|----------|--------|
| New Network | Tap ⚙️ → Enter new IP → Save |
| IP Changed | Tap ⚙️ → Reset to Default → Update IP → Save |
| Connection Issues | Check IP, restart backend, restart app |
| Reset Settings | Tap ⚙️ → Reset to Default → Save |

## Support

If issues persist:
1. Check backend logs for errors
2. Check mobile app console for errors
3. Verify network connectivity
4. Try backend Swagger UI at `http://YOUR_IP:3000/api-docs`
5. Restart both backend and mobile app

---

**Last Updated**: October 10, 2025  
**Version**: 0.1.0
