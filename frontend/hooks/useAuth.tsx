'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string, fullName?: string) => Promise<User | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    initializeAuth();

    const handleStorageChange = () => {
      const token = localStorage.getItem('access_token');
      if (!token) setUser(null);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await authService.signIn(email, password);
    const nextUser = data.user || null;
    setUser(nextUser);
    return nextUser;
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const data = await authService.signUp(email, password, fullName);
    const nextUser = data.user || null;
    setUser(nextUser);
    return nextUser;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

