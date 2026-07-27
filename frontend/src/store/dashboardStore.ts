import { create } from 'zustand';
import { DashboardSummary } from '../types';
import { dashboardService } from '../api/dashboard.service';
import { useAuthStore } from './authStore';

const demoDashboardSummary: DashboardSummary = {
  totalRevenue: 184500,
  totalExpenses: 109200,
  totalWagesPending: 18400,
  totalWagesPaid: 42600,
  profit: 75300,
  breakdowns: {
    wagesPending: 18400,
    wagesPaid: 42600,
    jobExpenses: 24800,
    purchaseCosts: 42000,
  },
  recentJobs: [
    {
      _id: 'demo-job-1',
      title: 'Corporate Event Setup',
      date: '2026-07-10T08:30:00.000Z',
      assigned_employees: [],
      rented_items: [],
      expenses: [],
      status: 'completed',
      total_cost: 48500,
      createdAt: '2026-07-10T08:30:00.000Z',
      updatedAt: '2026-07-10T08:30:00.000Z',
    },
    {
      _id: 'demo-job-2',
      title: 'Studio Lighting Package',
      date: '2026-07-09T11:00:00.000Z',
      assigned_employees: [],
      rented_items: [],
      expenses: [],
      status: 'in-progress',
      total_cost: 36800,
      createdAt: '2026-07-09T11:00:00.000Z',
      updatedAt: '2026-07-09T11:00:00.000Z',
    },
    {
      _id: 'demo-job-3',
      title: 'Wedding Audio Package',
      date: '2026-07-08T17:15:00.000Z',
      assigned_employees: [],
      rented_items: [],
      expenses: [],
      status: 'planned',
      total_cost: 29600,
      createdAt: '2026-07-08T17:15:00.000Z',
      updatedAt: '2026-07-08T17:15:00.000Z',
    },
  ],
};

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
    if (useAuthStore.getState().isDemoMode) {
      set({
        summary: demoDashboardSummary,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
      return;
    }

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
    if (useAuthStore.getState().isDemoMode) {
      set({
        summary: demoDashboardSummary,
        lastUpdated: new Date(),
        error: null,
      });
      return;
    }

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
