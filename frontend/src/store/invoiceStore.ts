import { create } from 'zustand';
import { invoiceService, Invoice } from '../api/invoice.service';

interface InvoiceState {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchInvoices: (params?: {
    page?: number;
    limit?: number;
    brand_type?: 'Picbox' | 'Echo';
    status?: 'draft' | 'estimate' | 'final';
    search?: string;
  }) => Promise<void>;
  clearError: () => void;
}

export const useInvoiceStore = create<InvoiceState>((set) => ({
  invoices: [],
  isLoading: false,
  error: null,

  fetchInvoices: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { invoices } = await invoiceService.getInvoices(params);
      set({ invoices, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch invoices',
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
