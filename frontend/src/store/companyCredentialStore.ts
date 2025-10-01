import { create } from 'zustand';
import { companyCredentialService, CompanyCredential, CompanyCredentialInput } from '../api/companyCredential.service';

interface CompanyCredentialState {
  companyCredentials: CompanyCredential[];
  picboxCredential: CompanyCredential | null;
  echoCredential: CompanyCredential | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCompanyCredentials: () => Promise<void>;
  fetchCredentialByName: (companyName: 'Picbox' | 'Echo') => Promise<CompanyCredential | null>;
  createCompanyCredential: (data: CompanyCredentialInput, logoFile?: any) => Promise<CompanyCredential>;
  updateCompanyCredential: (id: string, data: Partial<CompanyCredentialInput>, logoFile?: any) => Promise<CompanyCredential>;
  deleteCompanyCredential: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCompanyCredentialStore = create<CompanyCredentialState>((set, get) => ({
  companyCredentials: [],
  picboxCredential: null,
  echoCredential: null,
  isLoading: false,
  error: null,

  fetchCompanyCredentials: async () => {
    try {
      set({ isLoading: true, error: null });
      const credentials = await companyCredentialService.getCompanyCredentials({ is_active: true });
      
      const picbox = credentials.find(c => c.company_name === 'Picbox') || null;
      const echo = credentials.find(c => c.company_name === 'Echo') || null;
      
      set({
        companyCredentials: credentials,
        picboxCredential: picbox,
        echoCredential: echo,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch company credentials',
        isLoading: false
      });
    }
  },

  fetchCredentialByName: async (companyName: 'Picbox' | 'Echo') => {
    try {
      set({ isLoading: true, error: null });
      const credential = await companyCredentialService.getCompanyCredentialByName(companyName);
      
      if (companyName === 'Picbox') {
        set({ picboxCredential: credential, isLoading: false });
      } else {
        set({ echoCredential: credential, isLoading: false });
      }
      
      return credential;
    } catch (error: any) {
      set({
        error: error.message || `Failed to fetch ${companyName} credentials`,
        isLoading: false
      });
      return null;
    }
  },

  createCompanyCredential: async (data: CompanyCredentialInput, logoFile?: any) => {
    try {
      set({ isLoading: true, error: null });
      const credential = await companyCredentialService.createCompanyCredential(data, logoFile);
      
      set((state) => ({
        companyCredentials: [...state.companyCredentials, credential],
        ...(credential.company_name === 'Picbox' ? { picboxCredential: credential } : { echoCredential: credential }),
        isLoading: false
      }));
      
      return credential;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create company credential',
        isLoading: false
      });
      throw error;
    }
  },

  updateCompanyCredential: async (id: string, data: Partial<CompanyCredentialInput>, logoFile?: any) => {
    try {
      set({ isLoading: true, error: null });
      const credential = await companyCredentialService.updateCompanyCredential(id, data, logoFile);
      
      set((state) => ({
        companyCredentials: state.companyCredentials.map(c => c._id === id ? credential : c),
        ...(credential.company_name === 'Picbox' ? { picboxCredential: credential } : { echoCredential: credential }),
        isLoading: false
      }));
      
      return credential;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update company credential',
        isLoading: false
      });
      throw error;
    }
  },

  deleteCompanyCredential: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await companyCredentialService.deleteCompanyCredential(id);
      
      set((state) => {
        const credential = state.companyCredentials.find(c => c._id === id);
        return {
          companyCredentials: state.companyCredentials.filter(c => c._id !== id),
          ...(credential?.company_name === 'Picbox' ? { picboxCredential: null } : {}),
          ...(credential?.company_name === 'Echo' ? { echoCredential: null } : {}),
          isLoading: false
        };
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete company credential',
        isLoading: false
      });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));
