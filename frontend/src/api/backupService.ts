import { getApiClient } from './client';

export interface BackupInfo {
  total_collections: number;
  total_records: number;
  collections: {
    users: number;
    employees: number;
    products: number;
    jobs: number;
    invoices: number;
    payments: number;
    companyCredentials: number;
    counters: number;
  };
  last_checked: string;
}

export interface BackupData {
  metadata: {
    backup_date: string;
    backup_version: string;
    database_name: string;
    total_collections: number;
    record_counts: {
      users: number;
      employees: number;
      products: number;
      jobs: number;
      invoices: number;
      payments: number;
      companyCredentials: number;
      counters: number;
    };
  };
  data: any;
}

class BackupService {
  /**
   * Get backup information (record counts)
   */
  async getBackupInfo(): Promise<BackupInfo> {
    const api = getApiClient();
    const response = await api.get<{ success: boolean; data: BackupInfo }>('/backup/info');
    return response.data.data;
  }

  /**
   * Download database backup
   */
  async downloadBackup(): Promise<BackupData> {
    const api = getApiClient();
    const response = await api.get<BackupData>('/backup/download');
    return response.data;
  }
}

export default new BackupService();
