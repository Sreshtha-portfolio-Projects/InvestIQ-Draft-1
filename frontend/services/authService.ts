import apiClient from './apiClient';
import { AuthResponse } from '@/types';

export const authService = {
  async signup(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/signup',
      { email, password }
    );
    apiClient.setToken(response.data.token);
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/login',
      { email, password }
    );
    apiClient.setToken(response.data.token);
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get<{ success: boolean; data: any }>('/auth/profile');
    return response.data;
  },

  logout() {
    apiClient.removeToken();
  },

  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  },
};
