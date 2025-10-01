import { getApiClient } from './client';
import { ApiResponse, Employee, Payment } from '../types';

export const employeeService = {
  /**
   * Get all employees
   */
  async getEmployees(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    employees: Employee[];
    total: number;
    page: number;
    pages: number;
  }> {
    const client = getApiClient();
    const { data } = await client.get<ApiResponse<Employee[]>>(
      '/employees',
      { params }
    );

    return {
      employees: data.data,
      total: data.pagination?.total || 0,
      page: data.pagination?.page || 1,
      pages: data.pagination?.pages || 1,
    };
  },

  /**
   * Get single employee
   */
  async getEmployee(id: string): Promise<Employee> {
    const client = getApiClient();
    const { data } = await client.get<ApiResponse<Employee>>(
      `/employees/${id}`
    );
    return data.data;
  },

  /**
   * Create employee
   */
  async createEmployee(employee: {
    name: string;
    role?: string;
    phone?: string;
  }): Promise<Employee> {
    const client = getApiClient();
    const { data } = await client.post<ApiResponse<Employee>>(
      '/employees',
      employee
    );
    return data.data;
  },

  /**
   * Update employee
   */
  async updateEmployee(
    id: string,
    updates: Partial<Employee>
  ): Promise<Employee> {
    const client = getApiClient();
    const { data } = await client.patch<ApiResponse<Employee>>(
      `/employees/${id}`,
      updates
    );
    return data.data;
  },

  /**
   * Delete employee
   */
  async deleteEmployee(id: string): Promise<void> {
    const client = getApiClient();
    await client.delete(`/employees/${id}`);
  },

  /**
   * Record payment for employee
   */
  async recordPayment(
    employeeId: string,
    payment: {
      amount: number;
      date?: string;
      method?: 'cash' | 'bank_transfer' | 'upi' | 'other';
      notes?: string;
    }
  ): Promise<{ payment: Payment; employee: Employee }> {
    const client = getApiClient();
    const { data } = await client.post<
      ApiResponse<{ payment: Payment; employee: Employee }>
    >(`/employees/${employeeId}/payments`, payment);
    return data.data;
  },

  /**
   * Get payment history for employee
   */
  async getPaymentHistory(
    employeeId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    pages: number;
  }> {
    const client = getApiClient();
    const { data } = await client.get<ApiResponse<Payment[]>>(
      `/employees/${employeeId}/payments`,
      { params }
    );

    return {
      payments: data.data,
      total: data.pagination?.total || 0,
      page: data.pagination?.page || 1,
      pages: data.pagination?.pages || 1,
    };
  },
};
