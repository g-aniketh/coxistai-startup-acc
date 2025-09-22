import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, User, AuthTokens } from '@/lib/api';

interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, tenantId: string, role?: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.auth.login({ email, password });
          
          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            // Store tokens in localStorage
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
            
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            return true;
          } else {
            set({
              error: response.error || 'Login failed',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return false;
        }
      },

      register: async (email: string, password: string, tenantId: string, role = 'member') => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.auth.register({ email, password, tenantId, role });
          
          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            // Store tokens in localStorage
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
            
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            return true;
          } else {
            set({
              error: response.error || 'Registration failed',
              isLoading: false,
            });
            return false;
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return false;
        }
      },

      logout: () => {
        // Clear localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Reset state
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      refreshToken: async () => {
        const { tokens } = get();
        
        if (!tokens?.refreshToken) {
          return false;
        }
        
        try {
          const response = await api.auth.refresh(tokens.refreshToken);
          
          if (response.success) {
            const { user, tokens: newTokens } = response.data;
            
            // Update localStorage
            localStorage.setItem('accessToken', newTokens.accessToken);
            localStorage.setItem('refreshToken', newTokens.refreshToken);
            
            set({
              user,
              tokens: newTokens,
              isAuthenticated: true,
            });
            
            return true;
          } else {
            get().logout();
            return false;
          }
        } catch (error) {
          get().logout();
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      setTokens: (tokens: AuthTokens | null) => {
        set({ tokens });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          set({ isAuthenticated: false, user: null, tokens: null });
          return false;
        }
        
        set({ isLoading: true });
        
        try {
          const response = await api.auth.me();
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            get().logout();
            return false;
          }
        } catch (error) {
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
