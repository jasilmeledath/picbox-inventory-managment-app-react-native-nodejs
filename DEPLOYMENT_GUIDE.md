# 🚀 Deployment Guide - PicBox Backend & APK

Complete guide to deploy the backend to Render and build the Android APK.

---

## 📦 Part 1: Backend Deployment to Render

### Prerequisites
- ✅ MongoDB Atlas cluster set up (already done)
- ✅ GitHub account
- ✅ Render.com account (free)

### Step 1: Prepare Repository

1. **Commit all changes:**
   ```bash
   cd /Users/jasilm/Desktop/picboxfullstack
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Verify files are ready:**
   - ✅ `backend/package.json` - Has engines defined
   - ✅ `backend/render.yaml` - Render configuration
   - ✅ `backend/.gitignore` - Excludes .env and sensitive files
   - ✅ `backend/src/index.js` - Entry point configured

### Step 2: Deploy on Render

#### Option A: Using render.yaml (Recommended)

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Blueprint"**
3. **Connect your GitHub repository:**
   - Repository: `jasilmeledath/picbox-inventory-managment-app-react-native-nodejs`
4. **Render will detect `render.yaml`**
5. **Click "Apply"**

#### Option B: Manual Setup

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect GitHub repository**
4. **Configure:**
   ```
   Name: picbox-backend
   Region: Singapore (or closest)
   Branch: main
   Root Directory: backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

### Step 3: Configure Environment Variables

Add these in Render Dashboard → Environment:

```bash
# Required
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://picboxecho_db_user:mItdHR0FzIFhjvDt@picboxapp.oollr5p.mongodb.net/picbox?retryWrites=true&w=majority&appName=PicboxApp

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Admin
ADMIN_EMAILS=navas@echosounds.com

# Optional: Cloudinary (if using image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Step 4: Configure MongoDB Atlas

1. **Go to MongoDB Atlas**
2. **Network Access → Add IP Address**
3. **Add:** `0.0.0.0/0` (allow from anywhere for Render)
4. **Or add Render's IP ranges** (more secure)

### Step 5: Deploy & Test

1. **Render will automatically build and deploy** (3-5 minutes)
2. **You'll get a URL:** `https://picbox-backend.onrender.com`
3. **Test the API:**
   ```bash
   curl https://picbox-backend.onrender.com/health
   # Should return: {"status":"ok"}
   ```

### Step 6: Keep Server Awake (Optional)

Free tier sleeps after 15 min. Use [UptimeRobot](https://uptimerobot.com):

1. **Sign up for free**
2. **Add Monitor:**
   - Type: HTTP(s)
   - URL: `https://picbox-backend.onrender.com/health`
   - Interval: 5 minutes
3. **Server will stay awake!**

---

## 📱 Part 2: Build Android APK

### Prerequisites

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login
```

### Step 1: Configure EAS Build

1. **Navigate to frontend:**
   ```bash
   cd /Users/jasilm/Desktop/picboxfullstack/frontend
   ```

2. **Initialize EAS:**
   ```bash
   eas build:configure
   ```
   This creates `eas.json` file.

3. **Update eas.json:**
   ```json
   {
     "cli": {
       "version": ">= 5.2.0"
     },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         }
       },
       "production": {
         "android": {
           "buildType": "apk"
         }
       }
     },
     "submit": {
       "production": {}
     }
   }
   ```

### Step 2: Update API URL in App

Before building, update the API URL to point to Render:

1. **Open:** `frontend/src/api/apiClient.ts`
2. **Update default URL:**
   ```typescript
   const API_BASE_URL = 'https://picbox-backend.onrender.com/api';
   ```

### Step 3: Update app.json

```json
{
  "expo": {
    "name": "PicBox",
    "slug": "picbox-inventory",
    "version": "1.0.0",
    "orientation": "landscape",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "package": "com.echosounds.picbox",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 34,
            "targetSdkVersion": 34,
            "buildToolsVersion": "34.0.0"
          }
        }
      ]
    ]
  }
}
```

### Step 4: Build APK

#### For Testing (Preview Build):
```bash
eas build --platform android --profile preview
```

#### For Production:
```bash
eas build --platform android --profile production
```

### Step 5: Download APK

1. **Build will take 10-20 minutes**
2. **You'll get a URL** to download the APK
3. **Or download from:** [Expo Dashboard](https://expo.dev)
4. **Install on Android device** and test!

### Build Options Explained:

| Profile | Type | Use Case |
|---------|------|----------|
| `development` | Development client | Testing with hot reload |
| `preview` | APK | Internal testing |
| `production` | APK/AAB | Play Store submission |

---

## 🎯 Post-Deployment Checklist

### Backend (Render)

- [ ] Backend is accessible at `https://picbox-backend.onrender.com`
- [ ] Health check endpoint returns `{"status":"ok"}`
- [ ] Login endpoint works (test with Postman)
- [ ] MongoDB connection is successful
- [ ] Environment variables are set correctly
- [ ] UptimeRobot configured (optional)

### Mobile App

- [ ] APK builds successfully
- [ ] App points to Render backend URL
- [ ] Login works with admin credentials
- [ ] Can create invoices
- [ ] Can generate PDFs
- [ ] Images upload correctly
- [ ] All features work as expected

---

## 🔧 Troubleshooting

### Backend Issues

**Build fails on Render:**
```bash
# Check logs in Render Dashboard
# Common issues:
- Missing environment variables
- Wrong Node version (need 18+)
- Dependencies not installing
```

**502 Bad Gateway:**
```bash
# Backend not listening on PORT from env
# Fix: Ensure src/index.js uses process.env.PORT
const PORT = process.env.PORT || 3000;
```

**MongoDB connection fails:**
```bash
# Check MongoDB Atlas Network Access
# Add: 0.0.0.0/0
# Or specific Render IPs
```

### APK Build Issues

**Build fails:**
```bash
# Clear cache and retry
eas build:configure
eas build --platform android --profile preview --clear-cache
```

**App crashes on launch:**
```bash
# Check logs
adb logcat | grep -i expo

# Common issues:
- Wrong API URL
- Missing permissions
- Native module issues
```

**"Unable to connect to server":**
```bash
# Update API URL in app
# Settings → API Configuration
# Enter: https://picbox-backend.onrender.com/api
```

---

## 📊 Monitoring & Maintenance

### Backend Monitoring

1. **Render Dashboard:**
   - View logs in real-time
   - Monitor CPU/memory usage
   - Check deploy history

2. **MongoDB Atlas:**
   - Monitor database size
   - Check query performance
   - Review connection logs

3. **UptimeRobot:**
   - Email alerts if server down
   - Response time monitoring
   - Uptime statistics

### App Updates

```bash
# Update version in app.json
"version": "1.0.1",
"android": {
  "versionCode": 2  # Increment this
}

# Build new version
eas build --platform android --profile production
```

---

## 🎉 Success!

Once deployed:

1. **Backend URL:** `https://picbox-backend.onrender.com`
2. **APK Location:** Download from Expo dashboard
3. **Admin Login:** navas@echosounds.com / echo@123

### Share APK:

```bash
# APK can be shared via:
- Google Drive
- Email
- Direct download link from Expo
- QR code for easy installation
```

### For Play Store:

```bash
# Build AAB (Android App Bundle)
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/)
- [Play Store Publishing](https://support.google.com/googleplay/android-developer/)

---

**Last Updated:** October 13, 2025
**Status:** Ready for Deployment ✅
