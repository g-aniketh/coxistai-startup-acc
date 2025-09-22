import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Types
export interface User {
  id: string;
  email: string;
  role: string;
  tenant: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Tenant {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  users: User[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: string;
  tenantId: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: AuthTokens;
  };
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API Methods
export const api = {
  // Authentication
  auth: {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
      const response: AxiosResponse<AuthResponse> = await apiClient.post('/auth/login', credentials);
      return response.data;
    },

    register: async (userData: RegisterRequest): Promise<AuthResponse> => {
      const response: AxiosResponse<AuthResponse> = await apiClient.post('/auth/register', userData);
      return response.data;
    },

    refresh: async (refreshToken: string): Promise<AuthResponse> => {
      const response: AxiosResponse<AuthResponse> = await apiClient.post('/auth/refresh', { refreshToken });
      return response.data;
    },

    me: async (): Promise<ApiResponse<{ user: User }>> => {
      const response: AxiosResponse<ApiResponse<{ user: User }>> = await apiClient.get('/auth/me');
      return response.data;
    },

    logout: async (): Promise<ApiResponse> => {
      const response: AxiosResponse<ApiResponse> = await apiClient.post('/auth/logout');
      return response.data;
    },
  },

  // Tenants
  tenants: {
    list: async (): Promise<ApiResponse<Tenant[]>> => {
      const response: AxiosResponse<ApiResponse<Tenant[]>> = await apiClient.get('/tenants');
      return response.data;
    },

    create: async (name: string): Promise<ApiResponse<Tenant>> => {
      const response: AxiosResponse<ApiResponse<Tenant>> = await apiClient.post('/tenants', { name });
      return response.data;
    },
  },

  // Users
  users: {
    list: async (): Promise<ApiResponse<User[]>> => {
      const response: AxiosResponse<ApiResponse<User[]>> = await apiClient.get('/users');
      return response.data;
    },
  },

  // Health check
  health: async (): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await apiClient.get('/health');
    return response.data;
  },
};

export default apiClient;
