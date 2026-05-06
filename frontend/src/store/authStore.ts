import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types';
import apiClient from '../utils/api';

interface AuthStoreState extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/login', { email, password });
          const { user, token } = response.data.data;
          localStorage.setItem('authToken', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/register', { email, password, fullName });
          const { user, token } = response.data.data;
          localStorage.setItem('authToken', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.error || 'Registration failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      initializeAuth: () => {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ user, token, isAuthenticated: true });
          } catch {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);
