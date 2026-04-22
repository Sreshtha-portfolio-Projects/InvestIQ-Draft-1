import axios from 'axios';
import { User } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Create a separate axios instance for auth requests (no token required initially)
const createAuthClient = () => {
  return axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const authService = {
  async signUp(email: string, password: string, fullName?: string) {
    const client = createAuthClient();
    const response = await client.post('/auth/signup', {
      email,
      password,
      fullName,
    });

    // Store token in localStorage
    if (response.data.data?.access_token) {
      localStorage.setItem('access_token', response.data.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data.data;
  },

  async signIn(email: string, password: string) {
    const client = createAuthClient();
    const response = await client.post('/auth/signin', {
      email,
      password,
    });

    // Store token in localStorage
    if (response.data.data?.access_token) {
      localStorage.setItem('access_token', response.data.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data.data;
  },

  async signOut() {
    try {
      const client = createAuthClient();
      const token = localStorage.getItem('access_token');
      if (token) {
        await client.post('/auth/signout', {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } finally {
      // Clear token from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;

      const client = createAuthClient();
      const response = await client.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.data?.user || null;
    } catch {
      return null;
    }
  },

  async getSession() {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');

    return {
      access_token: token,
      user: user ? JSON.parse(user) : null,
    };
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },
};
