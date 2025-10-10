import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, User, SignupRequest } from '@/lib/api';
import toast from 'react-hot-toast';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupRequest) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.auth.login({ email, password });
          
          if (response.success && response.data) {
            const { user, token } = response.data;
            
            // Store token in localStorage
            localStorage.setItem('authToken', token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            toast.success('Login successful!');
            return true;
          } else {
            const errorMsg = response.message || 'Login failed';
            set({
              error: errorMsg,
              isLoading: false,
            });
            toast.error(errorMsg);
            return false;
          }
        } catch (error: any) {
          const errorMessage = 
            error.response?.data?.message || 
            error.response?.data?.error || 
            error.message || 
            'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
          });
          toast.error(errorMessage);
          return false;
        }
      },

      signup: async (data: SignupRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.auth.signup(data);
          
          if (response.success && response.data) {
            const { user, token } = response.data;
            
            // Store token in localStorage
            localStorage.setItem('authToken', token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            toast.success(response.message || 'Account created successfully!');
            return true;
          } else {
            const errorMsg = response.message || 'Signup failed';
            set({
              error: errorMsg,
              isLoading: false,
            });
            toast.error(errorMsg);
            return false;
          }
        } catch (error: any) {
          const errorMessage = 
            error.response?.data?.message || 
            error.response?.data?.error || 
            error.message || 
            'Signup failed';
          set({
            error: errorMessage,
            isLoading: false,
          });
          toast.error(errorMessage);
          return false;
        }
      },

      logout: () => {
        // Clear localStorage
        localStorage.removeItem('authToken');
        
        // Reset state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        
        toast.success('Logged out successfully');
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

      checkAuth: async () => {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return false;
        }
        
        set({ isLoading: true });
        
        try {
          const response = await apiClient.auth.me();
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              token,
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
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
