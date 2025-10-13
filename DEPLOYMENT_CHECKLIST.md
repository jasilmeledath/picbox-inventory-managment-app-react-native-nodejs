# 🚀 Deployment Checklist - PicBox App

Quick reference checklist for deploying backend and building APK.

---

## ✅ Pre-Deployment Checklist

### Backend Files Ready
- [x] `backend/package.json` - Has engines field defined
- [x] `backend/render.yaml` - Render configuration created
- [x] `backend/.gitignore` - Excludes .env and sensitive files
- [x] `backend/.env` - Local environment variables configured
- [x] `backend/src/index.js` - Entry point ready

### Frontend Files Ready
- [x] `frontend/app.json` - Updated with package name and permissions
- [x] `frontend/eas.json` - EAS build configuration created
- [x] `frontend/build-apk.sh` - Build helper script created
- [ ] API URL updated to Render backend (after deployment)

### Accounts Setup
- [ ] MongoDB Atlas account (with cluster)
- [ ] Render.com account (free)
- [ ] Expo account (for EAS builds)
- [ ] GitHub repository pushed

---

## 🌐 Backend Deployment Steps

### 1. Push Code to GitHub
```bash
cd /Users/jasilm/Desktop/picboxfullstack
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 2. Deploy on Render

**Quick Deploy (Blueprint):**
1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect repository: `jasilmeledath/picbox-inventory-managment-app-react-native-nodejs`
4. Render detects `backend/render.yaml`
5. Click "Apply"

**Manual Deploy:**
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect repository
4. Configure:
   - Name: `picbox-backend`
   - Region: `Singapore`
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: `Free`

### 3. Set Environment Variables

In Render Dashboard → Environment tab, add:

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://picboxecho_db_user:mItdHR0FzIFhjvDt@picboxapp.oollr5p.mongodb.net/picbox?retryWrites=true&w=majority&appName=PicboxApp
JWT_SECRET=<generate-32-char-random-string>
JWT_REFRESH_SECRET=<generate-32-char-random-string>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
ADMIN_EMAILS=navas@echosounds.com
```

**Generate secure secrets:**
```bash
# In terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Configure MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Network Access → Add IP Address
3. Add: `0.0.0.0/0` (allow from anywhere)
4. Click "Confirm"

### 5. Deploy & Verify

1. Render automatically deploys (3-5 minutes)
2. Get your URL: `https://picbox-backend.onrender.com`
3. Test:
   ```bash
   curl https://picbox-backend.onrender.com/health
   # Should return: {"status":"ok"}
   ```

### 6. Keep Server Awake (Optional)

Use [UptimeRobot](https://uptimerobot.com) (free):
1. Sign up
2. Add Monitor:
   - Type: HTTP(s)
   - URL: `https://picbox-backend.onrender.com/health`
   - Interval: 5 minutes

---

## 📱 APK Build Steps

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
# Enter your Expo credentials
```

### 3. Update API URL

**Option A: Use API Configuration in App**
- App has Settings → API Configuration
- Users can update URL after installation
- Default: `http://192.168.0.102:3000/api`

**Option B: Hardcode Production URL**

Edit `frontend/src/api/apiClient.ts`:
```typescript
const API_BASE_URL = 'https://picbox-backend.onrender.com/api';
```

### 4. Build APK

**Using the helper script:**
```bash
cd /Users/jasilm/Desktop/picboxfullstack/frontend
./build-apk.sh
# Select option 1 for Preview or 2 for Production
```

**Or manually:**

**For Testing:**
```bash
cd frontend
eas build --platform android --profile preview
```

**For Production:**
```bash
eas build --platform android --profile production
```

### 5. Download APK

- Build takes 10-20 minutes
- Download from: https://expo.dev
- Or check email for download link
- Install on Android device

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] Health endpoint: `curl https://picbox-backend.onrender.com/health`
- [ ] Login: Test with admin credentials
- [ ] Create employee: POST to `/api/employees`
- [ ] Create product: POST to `/api/products`
- [ ] Create invoice: POST to `/api/invoices`
- [ ] Generate PDF: GET `/api/invoices/:id/generate-pdf`

### Mobile App Tests
- [ ] App installs successfully
- [ ] Login works with: navas@echosounds.com / echo@123
- [ ] Dashboard loads with data
- [ ] Can create employees
- [ ] Can create products
- [ ] Can create jobs
- [ ] Can create invoices
- [ ] Can generate PDF
- [ ] Can share/download PDF
- [ ] Settings backup works

---

## 📊 Post-Deployment Monitoring

### Daily Checks
- [ ] Backend is accessible
- [ ] App can login
- [ ] No errors in Render logs

### Weekly Checks
- [ ] MongoDB storage usage (<512 MB)
- [ ] Backend uptime (via UptimeRobot)
- [ ] App crash reports (if analytics set up)

### Monthly Maintenance
- [ ] Review and archive old data
- [ ] Check for package updates
- [ ] Review security logs
- [ ] Backup database

---

## 🐛 Common Issues & Solutions

### Backend Issues

**"Repository not found"**
```bash
# Make sure repository is pushed to GitHub
git push origin main
```

**"Build failed on Render"**
- Check Node version in `package.json` engines
- Verify all dependencies are in `package.json`
- Check Render logs for specific error

**"502 Bad Gateway"**
- Backend not listening on PORT from environment
- Check logs: Render Dashboard → Logs tab

**"MongoDB connection failed"**
- Verify MONGODB_URI is correct
- Check MongoDB Atlas Network Access (IP whitelist)
- Ensure username/password are correct

### APK Build Issues

**"EAS CLI not found"**
```bash
npm install -g eas-cli
```

**"Project not configured"**
```bash
cd frontend
eas build:configure
```

**"Build failed"**
```bash
# Clear cache and retry
eas build --platform android --profile preview --clear-cache
```

**App crashes on launch**
- Check API URL is correct
- Verify all permissions in app.json
- Check Android Studio logcat for errors

---

## 📝 Important Notes

### Render Free Tier Limitations
- ✅ 512 MB RAM (enough for this app)
- ✅ Free SSL
- ⚠️ Sleeps after 15 min inactivity (30s cold start)
- ⚠️ No persistent file storage (use MongoDB/Cloudinary)

### MongoDB Atlas Free Tier
- ✅ 512 MB storage
- ✅ Good for 30-50 years of data
- ✅ Shared cluster (sufficient)

### APK vs AAB
- **APK**: Direct installation, easy sharing
- **AAB**: Play Store only, optimized size
- Start with APK for testing
- Use AAB for Play Store submission

---

## 🎯 Next Steps After Deployment

### Immediate
1. [ ] Test backend API with Postman
2. [ ] Install APK on test device
3. [ ] Login and test all features
4. [ ] Share APK with team for testing

### Short Term (1 week)
1. [ ] Set up UptimeRobot monitoring
2. [ ] Configure backup schedule
3. [ ] Document any issues found
4. [ ] Train team on app usage

### Long Term (1 month+)
1. [ ] Gather user feedback
2. [ ] Plan feature updates
3. [ ] Consider Play Store submission
4. [ ] Implement analytics (optional)

---

## 📞 Support Resources

- **Render Issues**: https://render.com/docs
- **EAS Build Help**: https://docs.expo.dev/build/introduction/
- **MongoDB Atlas**: https://www.mongodb.com/docs/atlas/
- **Expo Forums**: https://forums.expo.dev/

---

## ✅ Final Checklist

### Before Going Live
- [ ] Backend deployed on Render
- [ ] All environment variables set
- [ ] MongoDB Atlas configured
- [ ] API tested with Postman
- [ ] APK built successfully
- [ ] App tested on device
- [ ] Admin can login
- [ ] All features work
- [ ] PDF generation works
- [ ] Backup feature works

### After Going Live
- [ ] Share APK with users
- [ ] Provide login credentials
- [ ] Set up monitoring
- [ ] Document any issues
- [ ] Plan regular backups

---

**Deployment Date:** _______________
**Backend URL:** https://picbox-backend.onrender.com
**Admin Login:** navas@echosounds.com / echo@123

**Status:** Ready for Deployment ✅
