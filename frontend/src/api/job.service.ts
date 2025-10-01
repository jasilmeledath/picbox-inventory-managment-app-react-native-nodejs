import { getApiClient } from './client';
import { ApiResponse, Job, AssignedEmployee, RentedItem, Expense } from '../types';

export const jobService = {
  /**
   * Get all jobs
   */
  async getJobs(params?: {
    page?: number;
    limit?: number;
    status?: 'planned' | 'in-progress' | 'completed';
    date_from?: string;
    date_to?: string;
    search?: string;
  }): Promise<{
    jobs: Job[];
    total: number;
    page: number;
    pages: number;
  }> {
    const client = getApiClient();
    const { data } = await client.get<ApiResponse<Job[]>>('/jobs', {
      params,
    });

    return {
      jobs: data.data,
      total: data.pagination?.total || 0,
      page: data.pagination?.page || 1,
      pages: data.pagination?.pages || 1,
    };
  },

  /**
   * Get single job
   */
  async getJob(id: string): Promise<Job> {
    const client = getApiClient();
    const { data } = await client.get<ApiResponse<Job>>(`/jobs/${id}`);
    return data.data;
  },

  /**
   * Create job (auto-increments employee wages)
   */
  async createJob(job: {
    title: string;
    date: string;
    assigned_employees?: AssignedEmployee[];
    rented_items?: RentedItem[];
    expenses?: Expense[];
    status?: 'planned' | 'in-progress' | 'completed';
  }): Promise<Job> {
    const client = getApiClient();
    const { data } = await client.post<ApiResponse<Job>>('/jobs', job);
    return data.data;
  },

  /**
   * Update job
   */
  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    const client = getApiClient();
    const { data } = await client.patch<ApiResponse<Job>>(
      `/jobs/${id}`,
      updates
    );
    return data.data;
  },

  /**
   * Delete job (reverses wages)
   */
  async deleteJob(id: string): Promise<void> {
    const client = getApiClient();
    await client.delete(`/jobs/${id}`);
  },

  /**
   * Add expense to job
   */
  async addExpense(
    jobId: string,
    expense: {
      type: 'transport' | 'food' | 'misc';
      amount: number;
      date?: string;
      notes?: string;
    }
  ): Promise<Job> {
    const client = getApiClient();
    const { data } = await client.post<ApiResponse<Job>>(
      `/jobs/${jobId}/expenses`,
      expense
    );
    return data.data;
  },
};
