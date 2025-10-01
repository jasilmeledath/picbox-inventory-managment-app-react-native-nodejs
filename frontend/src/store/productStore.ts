import { create } from 'zustand';
import { Product } from '../types';
import { productService } from '../api/product.service';

interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  searchQuery: string;

  // Actions
  fetchProducts: (search?: string) => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  createProduct: (product: any) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
  page: 1,
  totalPages: 1,
  searchQuery: '',

  fetchProducts: async (search?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { products, pages } = await productService.getProducts({
        page: 1,
        limit: 50,
        search: search || get().searchQuery,
      });
      set({
        products,
        totalPages: pages,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch products',
        isLoading: false,
      });
    }
  },

  fetchProduct: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const product = await productService.getProduct(id);
      set({ selectedProduct: product, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch product',
        isLoading: false,
      });
    }
  },

  createProduct: async (productData: any) => {
    set({ isLoading: true, error: null });
    try {
      const product = await productService.createProduct(productData);
      set((state) => ({
        products: [product, ...state.products],
        isLoading: false,
      }));
      return product;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create product',
        isLoading: false,
      });
      throw error;
    }
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    set({ isLoading: true, error: null });
    try {
      const product = await productService.updateProduct(id, updates);
      set((state) => ({
        products: state.products.map((p) => (p._id === id ? product : p)),
        selectedProduct: product,
        isLoading: false,
      }));
      return product;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update product',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await productService.deleteProduct(id);
      set((state) => ({
        products: state.products.filter((p) => p._id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete product',
        isLoading: false,
      });
      throw error;
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  clearError: () => set({ error: null }),
}));
