import { getApiClient } from './client';
import { ApiResponse, Product } from '../types';

export const productService = {
  /**
   * Get all products
   */
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    purchase_type?: 'new' | 'existing';
  }): Promise<{
    products: Product[];
    total: number;
    page: number;
    pages: number;
  }> {
    const client = getApiClient();
    const { data } = await client.get<ApiResponse<Product[]>>('/products', {
      params,
    });

    return {
      products: data.data,
      total: data.pagination?.total || 0,
      page: data.pagination?.page || 1,
      pages: data.pagination?.pages || 1,
    };
  },

  /**
   * Get single product
   */
  async getProduct(id: string): Promise<Product> {
    const client = getApiClient();
    const { data } = await client.get<ApiResponse<Product>>(
      `/products/${id}`
    );
    return data.data;
  },

  /**
   * Create product
   */
  async createProduct(product: {
    name: string;
    description?: string;
    sku?: string;
    purchase_type: 'new' | 'existing';
    purchase_cost?: number;
  }): Promise<Product> {
    const client = getApiClient();
    const { data } = await client.post<ApiResponse<Product>>(
      '/products',
      product
    );
    return data.data;
  },

  /**
   * Update product
   */
  async updateProduct(
    id: string,
    updates: Partial<Product>
  ): Promise<Product> {
    const client = getApiClient();
    const { data } = await client.patch<ApiResponse<Product>>(
      `/products/${id}`,
      updates
    );
    return data.data;
  },

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    const client = getApiClient();
    await client.delete(`/products/${id}`);
  },
};
