import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.login(email, password);

      // Store in localStorage
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      set({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  register: async (email: string, password: string, full_name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.register(email, password, full_name);

      // Store in localStorage
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      set({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  initAuth: async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      set({ isAuthenticated: false });
      return;
    }

    try {
      // Verify token is still valid by fetching current user
      const user = await api.getCurrentUser();
      set({
        user,
        token,
        isAuthenticated: true,
      });
    } catch (error) {
      // Token is invalid, clear everything
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },
}));
