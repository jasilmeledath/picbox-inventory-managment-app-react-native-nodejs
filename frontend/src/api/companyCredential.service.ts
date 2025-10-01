import { getApiClient, ApiResponse } from './client';

export interface CompanyCredential {
  _id: string;
  company_name: 'Picbox' | 'Echo';
  display_name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  contact: {
    primary_phone: string;
    alternate_phone?: string;
    email?: string;
  };
  bank_details?: {
    account_name?: string;
    account_number?: string;
    ifsc_code?: string;
    bank_name?: string;
    branch?: string;
  };
  upi_details?: {
    upi_id?: string;
    google_pay_number?: string;
    payee_name?: string;
  };
  tax_details?: {
    gstin?: string;
    pan?: string;
  };
  logo?: {
    url: string;
    public_id: string;
  };
  is_active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyCredentialInput {
  company_name: 'Picbox' | 'Echo';
  display_name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  contact: {
    primary_phone: string;
    alternate_phone?: string;
    email?: string;
  };
  bank_details?: {
    account_name?: string;
    account_number?: string;
    ifsc_code?: string;
    bank_name?: string;
    branch?: string;
  };
  upi_details?: {
    upi_id?: string;
    google_pay_number?: string;
    payee_name?: string;
  };
  tax_details?: {
    gstin?: string;
    pan?: string;
  };
  is_active?: boolean;
  notes?: string;
}

class CompanyCredentialService {
  private basePath = '/company-credentials';

  async getCompanyCredentials(params?: {
    company_name?: 'Picbox' | 'Echo';
    is_active?: boolean;
  }): Promise<CompanyCredential[]> {
    const client = await getApiClient();
    const response = await client.get<ApiResponse<CompanyCredential[]>>(
      this.basePath,
      { params }
    );
    return response.data.data;
  }

  async getCompanyCredential(id: string): Promise<CompanyCredential> {
    const client = await getApiClient();
    const response = await client.get<ApiResponse<CompanyCredential>>(
      `${this.basePath}/${id}`
    );
    return response.data.data;
  }

  async getCompanyCredentialByName(companyName: 'Picbox' | 'Echo'): Promise<CompanyCredential> {
    const client = await getApiClient();
    const response = await client.get<ApiResponse<CompanyCredential>>(
      `${this.basePath}/by-name/${companyName}`
    );
    return response.data.data;
  }

  async createCompanyCredential(
    data: CompanyCredentialInput,
    logoFile?: { uri: string; name: string; type: string }
  ): Promise<CompanyCredential> {
    const client = await getApiClient();

    const formData = new FormData();
    
    // Append data as JSON string
    formData.append('company_name', data.company_name);
    formData.append('display_name', data.display_name);
    formData.append('address', JSON.stringify(data.address));
    formData.append('contact', JSON.stringify(data.contact));
    
    if (data.bank_details) {
      formData.append('bank_details', JSON.stringify(data.bank_details));
    }
    if (data.upi_details) {
      formData.append('upi_details', JSON.stringify(data.upi_details));
    }
    if (data.tax_details) {
      formData.append('tax_details', JSON.stringify(data.tax_details));
    }
    if (data.is_active !== undefined) {
      formData.append('is_active', String(data.is_active));
    }
    if (data.notes) {
      formData.append('notes', data.notes);
    }

    // Append logo file if provided
    if (logoFile) {
      formData.append('logo', {
        uri: logoFile.uri,
        name: logoFile.name,
        type: logoFile.type,
      } as any);
    }

    const response = await client.post<ApiResponse<CompanyCredential>>(
      this.basePath,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }

  async updateCompanyCredential(
    id: string,
    data: Partial<CompanyCredentialInput>,
    logoFile?: { uri: string; name: string; type: string }
  ): Promise<CompanyCredential> {
    const client = await getApiClient();

    const formData = new FormData();
    
    if (data.display_name) formData.append('display_name', data.display_name);
    if (data.address) formData.append('address', JSON.stringify(data.address));
    if (data.contact) formData.append('contact', JSON.stringify(data.contact));
    if (data.bank_details) formData.append('bank_details', JSON.stringify(data.bank_details));
    if (data.upi_details) formData.append('upi_details', JSON.stringify(data.upi_details));
    if (data.tax_details) formData.append('tax_details', JSON.stringify(data.tax_details));
    if (data.is_active !== undefined) formData.append('is_active', String(data.is_active));
    if (data.notes) formData.append('notes', data.notes);

    if (logoFile) {
      formData.append('logo', {
        uri: logoFile.uri,
        name: logoFile.name,
        type: logoFile.type,
      } as any);
    }

    const response = await client.patch<ApiResponse<CompanyCredential>>(
      `${this.basePath}/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }

  async deleteCompanyCredential(id: string): Promise<void> {
    const client = await getApiClient();
    await client.delete(`${this.basePath}/${id}`);
  }
}

export const companyCredentialService = new CompanyCredentialService();
