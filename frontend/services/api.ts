import axios, { AxiosInstance, AxiosError } from 'axios';
import { authService } from './authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach auth token from localStorage to every request
  client.interceptors.request.use((config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Normalize error responses
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ error: string }>) => {
      const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
      return Promise.reject(new Error(message));
    }
  );

  return client;
};

export const apiClient = createApiClient();
