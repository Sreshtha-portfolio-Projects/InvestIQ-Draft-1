import axios, { AxiosInstance, AxiosError } from 'axios';
import { supabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach auth token to every request
  client.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
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
