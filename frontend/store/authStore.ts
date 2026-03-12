import { create } from 'zustand';
import { User } from '@/types';
import { authService } from '@/services/authService';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => set({ token }),

  login: async (email, password) => {
    const data = await authService.login(email, password);
    set({ user: data.user, token: data.token, isAuthenticated: true });
  },

  signup: async (email, password) => {
    const data = await authService.signup(email, password);
    set({ user: data.user, token: data.token, isAuthenticated: true });
  },

  logout: () => {
    authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  initAuth: () => {
    const isAuth = authService.isAuthenticated();
    set({ isAuthenticated: isAuth });
  },
}));
