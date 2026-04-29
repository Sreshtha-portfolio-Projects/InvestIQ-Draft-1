import axios from 'axios';
import { User } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const isLikelyExpiredJwt = (token: string): boolean => {
  // Supabase access tokens are JWTs. If we can read `exp` and it's in the past,
  // skip the network call and treat as signed out.
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Base64url decode
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as { exp?: number };
    if (!payload?.exp) return false;

    const nowSec = Math.floor(Date.now() / 1000);
    // Small skew to avoid edge flakiness
    return payload.exp <= nowSec + 10;
  } catch {
    return false;
  }
};

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
    try {
      const response = await client.post('/auth/signup', {
        email,
        password,
        fullName,
      });

      console.log('Signup response:', response.data);

      // Store token in localStorage
      if (response.data.data?.access_token) {
        console.log('Storing access token from signup');
        localStorage.setItem('access_token', response.data.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      } else {
        console.warn('No access_token in signup response:', response.data.data);
      }

      return response.data.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  async signIn(email: string, password: string) {
    const client = createAuthClient();
    try {
      const response = await client.post('/auth/signin', {
        email,
        password,
      });

      console.log('Signin response:', response.data);

      // Store token in localStorage
      if (response.data.data?.access_token) {
        console.log('Storing access token from signin');
        localStorage.setItem('access_token', response.data.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      } else {
        console.warn('No access_token in signin response:', response.data.data);
      }

      return response.data.data;
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
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
      console.log('Getting current user, token exists:', !!token);
      
      if (!token) {
        console.log('No token in localStorage');
        return null;
      }

      if (isLikelyExpiredJwt(token)) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        return null;
      }

      const client = createAuthClient();
      console.log('Calling /auth/me with token:', token.substring(0, 20) + '...');
      
      const response = await client.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('getCurrentUser response:', response.data);
      return response.data.data?.user || null;
    } catch (error) {
      // Treat 401 during bootstrap as "not signed in" (commonly a stale token).
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        return null;
      }

      console.error('getCurrentUser error:', error);
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
