import { getApiClient } from './client';
import { ApiResponse, User, LoginResponse } from '../types';
import { secureStorage } from '../utils/secureStorage';

export const authService = {
  /**
   * Login user
   */
  async login(email: string, password: string): Promise<User> {
    const client = getApiClient();
    const { data } = await client.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      { email, password }
    );

    // Store tokens
    await secureStorage.setToken(data.data.accessToken);
    await secureStorage.setRefreshToken(data.data.refreshToken);

    return data.data.user;
  },

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    name: string
  ): Promise<User> {
    const client = getApiClient();
    const { data } = await client.post<ApiResponse<LoginResponse>>(
      '/auth/register',
      { email, password, name }
    );

    // Store tokens
    await secureStorage.setToken(data.data.accessToken);
    await secureStorage.setRefreshToken(data.data.refreshToken);

    return data.data.user;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const client = getApiClient();
      await client.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await secureStorage.clearAll();
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const client = getApiClient();
    const { data } = await client.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const client = getApiClient();
    const refreshToken = await secureStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const { data } = await client.post<
      ApiResponse<{ accessToken: string; refreshToken: string }>
    >('/auth/refresh', { refreshToken });

    // Update tokens
    await secureStorage.setToken(data.data.accessToken);
    await secureStorage.setRefreshToken(data.data.refreshToken);

    return data.data.accessToken;
  },
};
