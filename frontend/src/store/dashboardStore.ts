import { create } from 'zustand';
import { DashboardSummary } from '../types';
import { dashboardService } from '../api/dashboard.service';

interface DashboardState {
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  fetchSummary: () => Promise<void>;
  refreshSummary: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const summary = await dashboardService.getSummary();
      set({
        summary,
        isLoading: false,
        lastUpdated: new Date(),
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch dashboard summary',
        isLoading: false,
      });
    }
  },

  refreshSummary: async () => {
    // Refresh without setting loading state for pull-to-refresh
    try {
      const summary = await dashboardService.getSummary();
      set({
        summary,
        lastUpdated: new Date(),
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to refresh dashboard',
      });
    }
  },

  clearError: () => set({ error: null }),
}));
