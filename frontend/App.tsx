import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from './src/navigation/RootNavigator';
import { initializeApiClient } from './src/api/client';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeApiClient();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize API client:', error);
        setIsInitialized(true); // Continue anyway
      }
    };

    initialize();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isInitialized) {
      // Hide the splash screen after app is initialized
      await SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  if (!isInitialized) {
    return null; // Splash screen will remain visible
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <RootNavigator />
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}
