import { getApiClient, ApiResponse } from './client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

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
  subtotal: number;
  discount: number;
  discount_percentage: number;
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
   * Generate PDF for invoice and download to device
   */
  async generatePDF(
    id: string,
    invoiceNumber: number,
    customerName: string
  ): Promise<string> {
    try {
      // Get the base URL and auth token
      const client = getApiClient();
      const baseURL = client.defaults.baseURL;
      
      console.log('Step 1: Getting secure storage...');
      const { secureStorage } = await import('../utils/secureStorage');
      
      console.log('Step 2: Retrieving token...');
      const token = await secureStorage.getToken();
      console.log('Token retrieved:', token ? `Yes (length: ${token.length})` : 'No token found');
      
      if (!token) {
        throw new Error('Authentication required - no token in storage');
      }
      
      // Prepare file path
      const fileName = `invoice_${invoiceNumber}_${customerName.replace(/\s+/g, '_')}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      console.log('Step 3: Fetching PDF from server...');
      const url = `${baseURL}/invoices/${id}/generate-pdf`;
      console.log('URL:', url);

      // Use fetch with proper auth header (more reliable than FileSystem.downloadAsync)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(response.headers));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      // Get the PDF blob
      console.log('Step 4: Reading PDF blob...');
      const blob = await response.blob();
      console.log('Blob size:', blob.size);

      // Convert blob to base64
      console.log('Step 5: Converting to base64...');
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data:application/pdf;base64, prefix
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      // Write to file system
      console.log('Step 6: Writing to file system...');
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('Step 7: File saved successfully at:', fileUri);

      // Check if sharing is available and share the file
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        console.log('Step 8: Opening share dialog...');
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Invoice #${invoiceNumber} - ${customerName}`,
          UTI: 'com.adobe.pdf',
        });
      }

      return fileUri;
    } catch (error: any) {
      console.error('PDF Generation Error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
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
