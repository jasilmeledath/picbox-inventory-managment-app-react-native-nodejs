# Opening PICBOX Frontend in Emulator

## 🚀 Quick Start - Your Expo Server is Already Running!

Your frontend is currently running. Here's how to view it:

---

## Option 1: Android Emulator (Recommended)

### Step 1: Check if Android Studio is Installed
```bash
# Check if Android Studio is installed
which adb
```

If this returns a path, you have Android tools installed. If not, you need to install Android Studio first.

### Step 2: Open Android Emulator in Expo
Since your Expo server is already running, look at the terminal output and:

**Press `a` to open in Android emulator**

Or manually run:
```bash
cd frontend
npx expo start --android
```

### Step 3: What You'll See
The emulator will open and you'll see the PICBOX app with:
- ✅ Bottom navigation tabs (Dashboard, Products, Employees, Jobs, Settings)
- ✅ Placeholder screens with "Coming soon..." text
- ✅ Navigation working between screens

---

## Option 2: iOS Simulator (macOS Only)

### Open iOS Simulator in Expo
In the terminal where Expo is running:

**Press `i` to open in iOS simulator**

Or manually run:
```bash
cd frontend
npx expo start --ios
```

**Note**: iOS Simulator requires Xcode to be installed on macOS.

---

## Option 3: Physical Device (Easiest!)

### Step 1: Install Expo Go App
- **Android**: https://play.google.com/store/apps/details?id=host.exp.exponent
- **iOS**: https://apps.apple.com/app/expo-go/id982107779

### Step 2: Connect to Same Network
Make sure your phone and computer are on the **same WiFi network**.

### Step 3: Scan QR Code
Look at your terminal where Expo is running - you'll see a QR code.

- **Android**: Open Expo Go app → Tap "Scan QR Code"
- **iOS**: Open Camera app → Point at QR code → Tap notification

### Step 4: App Loads
The PICBOX app will load on your device instantly!

---

## Option 4: Web Browser (Limited Functionality)

**Press `w` in the Expo terminal** to open in web browser.

Or manually run:
```bash
cd frontend
npx expo start --web
```

**⚠️ Note**: Web version has limited React Native features. Use for quick testing only.

---

## 🔧 Installing Android Studio (If Not Installed)

### For macOS:

1. **Download Android Studio**
   ```
   https://developer.android.com/studio
   ```

2. **Install Android Studio**
   - Open the downloaded DMG
   - Drag Android Studio to Applications
   - Open Android Studio

3. **Setup Android SDK**
   - Open Android Studio
   - Go to: Preferences → Appearance & Behavior → System Settings → Android SDK
   - Install:
     - Android 13.0 (API 33)
     - Android SDK Platform-Tools
     - Android SDK Build-Tools

4. **Create Virtual Device**
   - Open Android Studio
   - Click: More Actions → Virtual Device Manager
   - Click: Create Device
   - Select: Pixel 5 (or any tablet for better experience)
   - Select System Image: Android 13 (API 33)
   - Click: Finish

5. **Add to PATH** (Add to ~/.zshrc):
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

6. **Reload Terminal**
   ```bash
   source ~/.zshrc
   ```

7. **Test ADB**
   ```bash
   adb devices
   ```

---

## 🐛 Troubleshooting

### Issue: "Port 8081 already in use"
**Solution**: 
```bash
# Option 1: Use existing server (already running!)
# Just press 'a' or 'i' in the terminal

# Option 2: Kill existing server and restart
pkill -f "expo start"
cd frontend
npx expo start
```

### Issue: "Unable to open Android emulator"
**Solution**:
```bash
# Check if emulator is accessible
emulator -list-avds

# Start emulator manually first
emulator -avd Pixel_5_API_33

# Then in another terminal
cd frontend
npx expo start --android
```

### Issue: "No devices found"
**Solution**:
```bash
# For Android
adb devices

# If no devices, restart adb
adb kill-server
adb start-server
```

### Issue: "Metro bundler error"
**Solution**:
```bash
# Clear cache and restart
cd frontend
npx expo start -c
```

### Issue: "App crashes on load"
**Solution**:
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules
npm install
npx expo start
```

---

## 📱 What You Should See Now

When the app loads in the emulator/device, you'll see:

### 1. **Bottom Navigation Bar** (5 Tabs)
- 📊 Dashboard
- 📦 Products  
- 👷 Employees
- 💼 Jobs
- ⚙️ Settings

### 2. **Placeholder Screens**
Each screen shows:
- Screen title (e.g., "Dashboard", "Products")
- "Coming soon..." message
- Styled with your theme colors

### 3. **Navigation Works**
- Tap each tab → Screen changes
- Icons change color on active tab
- Smooth transitions

### 4. **What's NOT Working Yet** (Expected)
- ❌ Login screen (placeholder only)
- ❌ Actual data display
- ❌ Forms and inputs
- ❌ API calls (need backend running)

---

## 🎯 Next Steps After Opening

Once you see the app running:

### 1. **Verify Navigation**
Tap through all 5 tabs to ensure navigation works.

### 2. **Check Theme**
- Primary color (Deep Blue #2C3E50) should be visible in headers
- Accent orange (#E67E22) on active tab icons
- Clean, professional look

### 3. **Hot Reload Test**
Try editing a file to test hot reload:
```typescript
// Edit: frontend/src/screens/dashboard/DashboardScreen.tsx
// Change the subtitle text
<Text style={styles.subtitle}>Testing hot reload!</Text>
```
Save → App should update instantly without full reload.

### 4. **Start Building**
Once verified, start implementing actual screens:
- Begin with Login Screen
- Then Dashboard with real data
- Continue per FRONTEND_PROGRESS.md

---

## 🎨 Current UI Preview

```
┌─────────────────────────────────────┐
│  📊 Dashboard                  [≡]  │  ← Header (Deep Blue)
├─────────────────────────────────────┤
│                                     │
│                                     │
│         Dashboard                   │  ← Title
│    Coming soon...                   │  ← Subtitle
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  📊  📦  👷  💼  ⚙️               │  ← Bottom Tabs
│  Dash Prod Emp Jobs Set            │
└─────────────────────────────────────┘
```

---

## 💡 Pro Tips

1. **Use Physical Device**: Often faster and more reliable than emulators
2. **Enable Fast Refresh**: Already enabled by default in Expo
3. **Use React DevTools**: Press `Shift + M` in terminal for more options
4. **Debug Menu**: Shake device or press `Cmd + D` (iOS) / `Cmd + M` (Android)
5. **Element Inspector**: Press `Shift + M` → Enable element inspector

---

## 🔗 Useful Commands

```bash
# Start normally
npx expo start

# Start with cache clear
npx expo start -c

# Start on specific platform
npx expo start --android
npx expo start --ios
npx expo start --web

# Start on different port
npx expo start --port 8082

# Open DevTools
npx expo start --devClient
```

---

## 📞 Need Help?

If you're stuck, check:
1. Expo is running (should see QR code in terminal)
2. Same network (device + computer)
3. Emulator is running (for Android)
4. No firewall blocking port 8081/19000/19001

---

**Current Status**: ✅ Expo server running on port 8081  
**Next Action**: Press `a` for Android or `i` for iOS in your terminal  
**Or**: Install Expo Go on your phone and scan QR code

---

*Generated: October 2025*  
*Project: PICBOX Frontend*
