import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  API_BASE_URL: '@picbox:api_base_url',
  ONBOARDING_COMPLETED: '@picbox:onboarding_completed',
  USER_PREFERENCES: '@picbox:user_preferences',
};

export const storage = {
  // API Base URL
  async getApiBaseUrl(): Promise<string> {
    try {
      const url = await AsyncStorage.getItem(KEYS.API_BASE_URL);
      // Using your Mac's IP address for physical device testing
      return url || 'http://192.168.0.107:3000/api';
    } catch (error) {
      console.error('Error getting API base URL:', error);
      return 'http://192.168.0.107:3000/api';
    }
  },

  async setApiBaseUrl(url: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.API_BASE_URL, url);
    } catch (error) {
      console.error('Error setting API base URL:', error);
    }
  },

  // Onboarding
  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETED);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  },

  async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETED, 'true');
    } catch (error) {
      console.error('Error setting onboarding completed:', error);
    }
  },

  // User preferences
  async getUserPreferences(): Promise<Record<string, any>> {
    try {
      const prefs = await AsyncStorage.getItem(KEYS.USER_PREFERENCES);
      return prefs ? JSON.parse(prefs) : {};
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {};
    }
  },

  async setUserPreferences(preferences: Record<string, any>): Promise<void> {
    try {
      await AsyncStorage.setItem(
        KEYS.USER_PREFERENCES,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Error setting user preferences:', error);
    }
  },

  // Clear all storage
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};
