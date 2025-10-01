# Logo Integration Guide

## Overview
This document describes how to add your company logos to the PicBox Inventory Management app.

## Logo Files Required

Place the following logo files in the `frontend/assets/logos/` directory:

### 1. **picbox-logo.png**
- **Size**: 512x512 pixels (recommended)
- **Format**: PNG with transparent background
- **Usage**: 
  - Dashboard header
  - Login screen
  - PicBox invoices (when generating PDFs)

### 2. **echo-logo.png**
- **Size**: 512x512 pixels (recommended)
- **Format**: PNG with transparent background
- **Usage**: 
  - Echo invoices (when generating PDFs)

### 3. **app-icon.png**
- **Size**: 1024x1024 pixels (required for app stores)
- **Format**: PNG
- **Usage**: 
  - App icon on device home screen
  - App stores (when publishing)

## Integration Status

### ✅ Completed

1. **Folder Structure Created**
   - Created `frontend/assets/logos/` directory
   - Added README with instructions

2. **Dashboard Screen (DashboardScreen.tsx)**
   - Added `Image` import from React Native
   - Added logo container above welcome header
   - Logo displays at 70px height, centered
   - Responsive with maxWidth: 300px

3. **Login Screen (LoginScreen.tsx)**
   - Added `Image` import from React Native
   - Replaced emoji/text logo with actual logo image
   - Logo displays at 100px height, centered
   - Responsive with maxWidth: 350px

4. **App Configuration (app.json)**
   - Updated app name: "PicBox Inventory"
   - Updated app slug: "picbox-inventory"
   - Updated icon path: `./assets/logos/app-icon.png`
   - Updated Android adaptive icon: `./assets/logos/app-icon.png`
   - Updated web favicon: `./assets/logos/app-icon.png`

### ⏳ Pending

5. **PDF Invoice Generation (Backend)**
   - Need to implement logo embedding in PDF generation
   - Use PicBox logo for `brand_type: 'Picbox'`
   - Use Echo logo for `brand_type: 'Echo'`
   - Location: `backend/src/controllers/invoice.controller.js`

## Next Steps

### For User (Immediate):

1. **Add Logo Files**
   ```bash
   # Navigate to logos directory
   cd /Users/jasilm/Desktop/picboxfullstack/frontend/assets/logos/
   
   # Copy your logo files here:
   # - picbox-logo.png (512x512px)
   # - echo-logo.png (512x512px)
   # - app-icon.png (1024x1024px)
   ```

2. **Restart the App**
   - Stop the current Expo development server (Ctrl+C)
   - Clear cache and restart:
     ```bash
     cd /Users/jasilm/Desktop/picboxfullstack/frontend
     npx expo start -c
     ```
   - The logos should now appear in the Dashboard and Login screen

3. **Verify Logo Display**
   - Open the app on your device
   - Check Login screen for PicBox logo at the top
   - After login, check Dashboard for PicBox logo above "Welcome back"
   - Both logos should be clear and properly sized

### For Developer (Next Phase):

4. **Implement PDF Logo Integration**
   - Upload logos to Cloudinary or serve from backend
   - Modify `generateInvoicePDF()` in `invoice.controller.js`
   - Add logo URL based on `invoice.brand_type`
   - Embed logo at top of PDF invoice template
   - Test PDF generation with both logo types

## File Locations

```
frontend/
├── assets/
│   └── logos/
│       ├── README.md           ✅ Created
│       ├── picbox-logo.png     ⏳ Awaiting file
│       ├── echo-logo.png       ⏳ Awaiting file
│       └── app-icon.png        ⏳ Awaiting file
├── src/
│   └── screens/
│       ├── auth/
│       │   └── LoginScreen.tsx ✅ Updated (Logo added)
│       └── dashboard/
│           └── DashboardScreen.tsx ✅ Updated (Logo added)
└── app.json                    ✅ Updated (App icon path)

backend/
└── src/
    └── controllers/
        └── invoice.controller.js ⏳ TODO (PDF logo integration)
```

## Code Changes Summary

### DashboardScreen.tsx
```tsx
// Added Image import
import { Image } from 'react-native';

// Added logo section
<View style={styles.logoContainer}>
  <Image
    source={require('../../../assets/logos/picbox-logo.png')}
    style={styles.logo}
    resizeMode="contain"
  />
</View>

// Added styles
logoContainer: {
  alignItems: 'center',
  marginBottom: spacing.lg,
  paddingTop: spacing.sm,
},
logo: {
  height: 70,
  width: '100%',
  maxWidth: 300,
},
```

### LoginScreen.tsx
```tsx
// Added Image import
import { Image } from 'react-native';

// Replaced text logo with image
<Image
  source={require('../../../assets/logos/picbox-logo.png')}
  style={styles.logoImage}
  resizeMode="contain"
/>

// Added style
logoImage: {
  height: 100,
  width: '100%',
  maxWidth: 350,
  marginBottom: spacing.md,
},
```

### app.json
```json
{
  "expo": {
    "name": "PicBox Inventory",
    "slug": "picbox-inventory",
    "icon": "./assets/logos/app-icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/logos/app-icon.png"
      }
    }
  }
}
```

## Troubleshooting

### Logo Not Showing
- **Issue**: "Unable to resolve module" error
- **Solution**: Make sure logo files are in the correct directory and restart with cache clear:
  ```bash
  npx expo start -c
  ```

### Logo Size Issues
- **Too Large**: Images are already responsive with maxWidth
- **Too Small**: Check original logo file resolution (should be 512x512 or higher)
- **Distorted**: resizeMode="contain" preserves aspect ratio

### App Icon Not Updating
- **Development**: Expo Go won't show custom icon, only shows after build
- **Production**: Run `eas build` to create APK with custom icon
- **iOS**: May need to clear derived data and rebuild

## Logo Specifications

### Recommended Logo Design
- **PicBox Logo**: 
  - Professional company branding
  - Works well on light and dark backgrounds
  - Clear at small and large sizes
  
- **Echo Logo**: 
  - Clearly differentiated from PicBox logo
  - Professional appearance for invoices
  - PDF-compatible (preferably vector or high-res PNG)

### File Optimization
- Use PNG format with transparency for logos
- Keep file size under 500KB for mobile performance
- Consider using SVG for scalability (requires expo-svg)

## Future Enhancements

1. **Dynamic Logo Switching**
   - Allow users to change logos from Settings screen
   - Store logo URLs in database
   - Upload custom logos via Cloudinary

2. **Multi-Brand Support**
   - Support more than 2 brands
   - Dynamic brand selection per invoice
   - Custom color schemes per brand

3. **Logo Variants**
   - Dark mode logo variants
   - Horizontal vs vertical layouts
   - Small icon vs full logo versions

---

**Status**: Awaiting logo files from user to complete integration.

**Last Updated**: December 2024
