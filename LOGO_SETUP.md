# Quick Start: Adding Your Logos

## What I've Done ✅

1. **Created logos folder**: `frontend/assets/logos/`
2. **Updated Dashboard**: Added logo display at the top
3. **Updated Login Screen**: Replaced text logo with image logo
4. **Updated app.json**: Configured custom app icon
5. **Created documentation**: See `LOGO_INTEGRATION.md` for full details

## What You Need to Do 🎯

### Step 1: Add Your Logo Files

Copy your 3 logo files into: `frontend/assets/logos/`

Required files:
- **picbox-logo.png** (512x512px) - Main company logo
- **echo-logo.png** (512x512px) - Secondary brand logo  
- **app-icon.png** (1024x1024px) - App icon

### Step 2: Restart the App

```bash
# Stop current server (Ctrl+C)

# Clear cache and restart
cd /Users/jasilm/Desktop/picboxfullstack/frontend
npx expo start -c
```

### Step 3: Test

1. Open app on your device
2. **Login Screen**: Should show PicBox logo at top (large, centered)
3. **Dashboard**: Should show PicBox logo above "Welcome back"
4. Both logos should be clear and properly sized

## Logo Specifications

| Logo | Size | Usage |
|------|------|-------|
| picbox-logo.png | 512x512px | Dashboard, Login, PicBox invoices |
| echo-logo.png | 512x512px | Echo invoices (PDFs) |
| app-icon.png | 1024x1024px | App icon (home screen) |

All logos should be PNG format with transparent background.

## Where Logos Appear

✅ **Login Screen** - Large logo at top (100px height)  
✅ **Dashboard** - Logo above welcome message (70px height)  
⏳ **Invoice PDFs** - TODO: Need to implement backend PDF generation with logos  
✅ **App Icon** - Shows on device home screen (after build)

## Notes

- **App Icon**: Won't show in Expo Go, only in built APK
- **PDF Integration**: Next step is to add logo embedding to PDF generation in backend
- **Responsive**: Logos automatically scale for different screen sizes

## Troubleshooting

**"Cannot find module" error?**  
- Make sure logo files are in correct location: `frontend/assets/logos/`
- Restart with cache clear: `npx expo start -c`

**Logo not showing?**  
- Check file names exactly match: `picbox-logo.png`, `echo-logo.png`, `app-icon.png`
- Check files are in PNG format
- Try force reload in Expo Go (shake device → Reload)

---

**Ready to test!** Just add your logo files and restart the app. 🚀
