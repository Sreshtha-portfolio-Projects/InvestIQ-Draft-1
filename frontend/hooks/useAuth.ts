'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount and subscribe to storage changes
  useEffect(() => {
    const initializeAuth = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    initializeAuth();

    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await authService.signIn(email, password);
    setUser(data.user || null);
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const data = await authService.signUp(email, password, fullName);
    setUser(data.user || null);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  return { user, loading, signIn, signUp, signOut };
};
