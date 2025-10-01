import { getApiClient } from './client';
import { ApiResponse, DashboardSummary } from '../types';

export const dashboardService = {
  /**
   * Get dashboard summary with financial metrics
   */
  async getSummary(): Promise<DashboardSummary> {
    const client = getApiClient();
    const { data } = await client.get<ApiResponse<DashboardSummary>>(
      '/dashboard/summary'
    );
    return data.data;
  },
};
