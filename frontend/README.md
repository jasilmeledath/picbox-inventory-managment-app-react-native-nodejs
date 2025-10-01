# PICBOX Frontend - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Backend server running (see backend/README.md)
- Expo Go app on your mobile device (optional)

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd /Users/jasilm/Desktop/picboxfullstack/frontend
   ```

2. **Install dependencies** (if not already done)
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npx expo start
   ```

4. **Run on device**
   - Scan QR code with Expo Go (Android) or Camera app (iOS)
   - OR press `a` for Android emulator
   - OR press `i` for iOS simulator

---

## 📱 Current App Status

### What Works Now
✅ App launches successfully
✅ Navigation structure in place
✅ Placeholder screens visible
✅ State management configured
✅ API integration ready

### What's Next
🔄 Login screen implementation
🔄 Dashboard with financial metrics
🔄 Product management screens
🔄 Employee management with wage tracking
🔄 Job creation wizard

---

## 🏗️ Project Structure

```
frontend/
├── App.tsx                      # Entry point
├── src/
│   ├── api/                     # API services
│   │   ├── client.ts            # Axios instance with JWT
│   │   ├── auth.service.ts      # Login, register, logout
│   │   ├── product.service.ts   # Product CRUD
│   │   ├── employee.service.ts  # Employee + payments
│   │   ├── job.service.ts       # Job management
│   │   └── dashboard.service.ts # Financial metrics
│   │
│   ├── components/              # Reusable UI components
│   │   └── common/
│   │       ├── Button.tsx       # Primary/Secondary/Danger
│   │       ├── Input.tsx        # Text input with validation
│   │       ├── Card.tsx         # Container with shadow
│   │       └── LoadingSpinner.tsx
│   │
│   ├── navigation/              # Navigation setup
│   │   ├── RootNavigator.tsx   # Auth/Main switcher
│   │   ├── AuthNavigator.tsx   # Login/Register stack
│   │   ├── MainNavigator.tsx   # Bottom tabs
│   │   └── types.ts            # Navigation types
│   │
│   ├── screens/                # App screens
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.tsx
│   │   ├── products/
│   │   │   └── ProductsScreen.tsx
│   │   ├── employees/
│   │   │   └── EmployeesScreen.tsx
│   │   ├── jobs/
│   │   │   └── JobsScreen.tsx
│   │   └── settings/
│   │       └── SettingsScreen.tsx
│   │
│   ├── store/                  # Zustand state management
│   │   ├── authStore.ts        # Auth state + actions
│   │   ├── productStore.ts     # Products state
│   │   ├── employeeStore.ts    # Employees + payments
│   │   └── dashboardStore.ts   # Dashboard metrics
│   │
│   ├── theme/                  # Design system
│   │   └── index.ts            # Colors, typography, spacing
│   │
│   ├── types/                  # TypeScript definitions
│   │   └── index.ts            # API entity types
│   │
│   └── utils/                  # Utility functions
│       ├── storage.ts          # AsyncStorage wrapper
│       ├── secureStorage.ts    # Secure token storage
│       └── helpers.ts          # Formatters, validators
│
└── package.json
```

---

## 🔧 Development Commands

### Start Development Server
```bash
npx expo start
```

### Start with Cache Clear
```bash
npx expo start -c
```

### Run on Android Emulator
```bash
npx expo start --android
```

### Run on iOS Simulator
```bash
npx expo start --ios
```

### Type Check
```bash
npx tsc --noEmit
```

---

## 🎨 Using the Theme

```typescript
import { colors, typography, spacing } from '../theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
  },
});
```

---

## 📊 Using State Management

### Example: Products Store

```typescript
import { useProductStore } from '../store/productStore';

function ProductsScreen() {
  const { 
    products, 
    isLoading, 
    error, 
    fetchProducts,
    createProduct 
  } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = async (data) => {
    try {
      await createProduct(data);
      Alert.alert('Success', 'Product created!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  
  return (
    <FlatList
      data={products}
      renderItem={({ item }) => <ProductCard product={item} />}
    />
  );
}
```

---

## 🔐 Authentication Flow

```typescript
import { useAuthStore } from '../store/authStore';

function LoginScreen() {
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      // Navigation happens automatically via RootNavigator
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View>
      <Input label="Email" onChangeText={setEmail} />
      <Input label="Password" secureTextEntry onChangeText={setPassword} />
      <Button 
        title="Login" 
        onPress={() => handleLogin(email, password)}
        loading={isLoading}
      />
    </View>
  );
}
```

---

## 🌐 API Configuration

### Current Setup
- Base URL: `http://localhost:3000/api` (development)
- JWT tokens stored in expo-secure-store
- Automatic token injection on requests

### Changing API URL
Edit `src/api/client.ts`:
```typescript
export const API_BASE_URL = 'https://your-backend.onrender.com/api';
```

Or implement dynamic configuration in Settings screen (planned feature).

---

## 🧪 Testing API Integration

### Test with Backend Running

1. Start backend server:
   ```bash
   cd backend
   npm start
   ```

2. Verify backend is running:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. Test login from app:
   - Use seeded credentials from backend
   - Default: `admin@example.com` / `password123`

---

## 🐛 Troubleshooting

### App won't start
```bash
# Clear cache and restart
npx expo start -c
```

### Module not found errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### TypeScript errors
```bash
# Run type check
npx tsc --noEmit

# Check for missing types
npm install --save-dev @types/react-native
```

### Backend connection issues
- Verify backend is running on port 3000
- Check if API_BASE_URL in client.ts is correct
- For physical device testing, use your machine's IP instead of localhost
  ```typescript
  const API_BASE_URL = 'http://192.168.x.x:3000/api';
  ```

### Expo Go issues
- Make sure device and computer are on same network
- Update Expo Go app to latest version
- Try scanning QR code again

---

## 📦 Building for Production

### Prerequisites
```bash
npm install -g eas-cli
eas login
```

### Configure EAS
```bash
eas build:configure
```

### Build Android APK
```bash
# For testing (APK)
eas build --platform android --profile preview

# For production (AAB for Play Store)
eas build --platform android --profile production
```

### Build iOS
```bash
eas build --platform ios --profile production
```

Download built files from: https://expo.dev

---

## 🎯 Next Development Steps

### 1. Login Screen
**File**: `src/screens/auth/LoginScreen.tsx`

**Tasks**:
- Add email and password inputs
- Form validation with react-hook-form
- Connect to authStore.login
- Error display
- Loading state

### 2. Dashboard Screen
**File**: `src/screens/dashboard/DashboardScreen.tsx`

**Tasks**:
- Fetch dashboard summary on mount
- Display financial metric cards
- Show pending wages
- Recent jobs list
- Pull-to-refresh

### 3. Products Screen
**File**: `src/screens/products/ProductsScreen.tsx`

**Tasks**:
- Product list with search
- Add product modal
- Product detail view
- Edit/delete functionality

### 4. Continue with remaining screens...

See `FRONTEND_PROGRESS.md` for full roadmap.

---

## 📞 Need Help?

### Resources
- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **Zustand**: https://github.com/pmndrs/zustand
- **React Native Paper**: https://reactnativepaper.com

### Common Issues
- Check `FRONTEND_PROGRESS.md` for architecture details
- Review backend API documentation in `backend/README.md`
- Verify wage logic in `backend/VERIFICATION_CHECKLIST.md`

---

**Last Updated**: January 2025
**Version**: 0.1.0 (Foundation Complete)
**Status**: Ready for screen implementation
