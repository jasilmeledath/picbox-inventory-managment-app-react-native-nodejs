import { getApiClient, ApiResponse } from './client';

export interface Invoice {
  _id: string;
  invoice_number: number;
  brand_type: 'Picbox' | 'Echo';
  customer_name: string;
  event_name?: string;
  rented_items: Array<{
    product_id: string;
    name: string;
    qty: number;
    rate: number;
  }>;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  status: 'draft' | 'estimate' | 'final';
  date: string;
  pdf?: {
    url: string;
    public_id: string;
  };
  company_credentials?: string;
  createdAt: string;
  updatedAt: string;
}

export const invoiceService = {
  /**
   * Get all invoices
   */
  async getInvoices(params?: {
    page?: number;
    limit?: number;
    brand_type?: 'Picbox' | 'Echo';
    status?: 'draft' | 'estimate' | 'final';
    search?: string;
  }): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    pages: number;
  }> {
    const client = getApiClient();
    const { data } = await client.get<ApiResponse<Invoice[]>>('/invoices', {
      params,
    });

    return {
      invoices: data.data,
      total: data.pagination?.total || 0,
      page: data.pagination?.page || 1,
      pages: data.pagination?.pages || 1,
    };
  },

  /**
   * Get single invoice
   */
  async getInvoice(id: string): Promise<Invoice> {
    const client = getApiClient();
    const { data } = await client.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return data.data;
  },

  /**
   * Create invoice
   */
  async createInvoice(invoice: {
    brand_type: 'Picbox' | 'Echo';
    customer_name: string;
    event_name?: string;
    rented_items: Array<{
      product_id: string;
      name: string;
      qty: number;
      rate: number;
    }>;
    total_amount: number;
    paid_amount?: number;
    status?: 'draft' | 'estimate' | 'final';
    date?: string;
    company_credentials?: string;
  }): Promise<Invoice> {
    const client = getApiClient();
    const { data } = await client.post<ApiResponse<Invoice>>('/invoices', invoice);
    return data.data;
  },

  /**
   * Update invoice
   */
  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const client = getApiClient();
    const { data } = await client.patch<ApiResponse<Invoice>>(
      `/invoices/${id}`,
      updates
    );
    return data.data;
  },

  /**
   * Delete invoice
   */
  async deleteInvoice(id: string): Promise<void> {
    const client = getApiClient();
    await client.delete(`/invoices/${id}`);
  },

  /**
   * Generate PDF for invoice
   */
  async generatePDF(id: string): Promise<Invoice> {
    const client = getApiClient();
    const { data } = await client.post<ApiResponse<Invoice>>(
      `/invoices/${id}/generate-pdf`
    );
    return data.data;
  },

  /**
   * Record payment for invoice
   */
  async recordPayment(
    id: string,
    payment: {
      amount: number;
      method: string;
      notes?: string;
    }
  ): Promise<Invoice> {
    const client = getApiClient();
    const { data } = await client.post<ApiResponse<Invoice>>(
      `/invoices/${id}/payments`,
      payment
    );
    return data.data;
  },
};
