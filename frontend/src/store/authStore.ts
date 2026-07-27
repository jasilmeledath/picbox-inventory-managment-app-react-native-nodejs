import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../api/auth.service';
import { secureStorage } from '../utils/secureStorage';

const createDemoUser = (): User => {
  const now = new Date().toISOString();

  return {
    _id: 'demo-user',
    email: 'navas@echosounds.com',
    name: 'Navas',
    isAdmin: true,
    createdAt: now,
    updatedAt: now,
  };
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isDemoMode: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isDemoMode: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.login(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Login failed',
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  loginAsDemo: async () => {
    set({ isLoading: true, error: null });

    const demoUser = createDemoUser();

    set({
      user: demoUser,
      isAuthenticated: true,
      isLoading: false,
      isDemoMode: true,
    });
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.register(email, password, name);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Registration failed',
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isDemoMode: false,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      // Clear state anyway
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isDemoMode: false,
      });
    }
  },

  loadUser: async () => {
    if (get().isDemoMode) {
      set({ isAuthenticated: true, isLoading: false });
      return;
    }

    const token = await secureStorage.getToken();
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await authService.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      console.error('Load user error:', error);
      await secureStorage.clearAll();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isDemoMode: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
