import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import { secureStorage } from '../utils/secureStorage';
import { ApiError } from '../types';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    pages: number;
  };
}

// Create axios instance
let apiClient: AxiosInstance;

export const initializeApiClient = async (): Promise<AxiosInstance> => {
  const baseURL = await storage.getApiBaseUrl();

  apiClient = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add JWT token
  apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await secureStorage.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      const networkError: ApiError = {
        success: false,
        message: 'Unable to connect to server. Please check if the backend is running.',
        errors: [{ field: 'network', message: error.message }],
      };
      return Promise.reject(networkError);
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear tokens
      await secureStorage.clearAll();
      
      // Optionally navigate to login (handled by RootNavigator)
      console.log('Unauthorized - clearing tokens');
    }

    // Format error response
    const apiError: ApiError = {
      success: false,
      message: error.response?.data?.message || 'An error occurred',
      errors: error.response?.data?.errors || [],
    };

    return Promise.reject(apiError);
  }
);

  return apiClient;
};

// Get API client instance
export const getApiClient = (): AxiosInstance => {
  if (!apiClient) {
    throw new Error('API client not initialized. Call initializeApiClient first.');
  }
  return apiClient;
};

// Update base URL dynamically
export const updateApiBaseUrl = async (newUrl: string): Promise<void> => {
  await storage.setApiBaseUrl(newUrl);
  await initializeApiClient();
};
