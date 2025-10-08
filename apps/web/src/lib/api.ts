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

// CFO Assistant Types
export interface PlaidItem {
  id: string;
  tenantId: string;
  userId: string;
  plaidItemId: string;
  institutionName?: string;
  createdAt: string;
  updatedAt: string;
  accounts: Account[];
}

export interface Account {
  id: string;
  plaidItemId: string;
  plaidAccountId: string;
  name: string;
  mask?: string;
  type: string;
  subtype: string;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
  plaidItem?: {
    institutionName?: string;
  };
  _count?: {
    transactions: number;
  };
}

export interface Transaction {
  id: string;
  accountId: string;
  plaidTransactionId: string;
  amount: number;
  description: string;
  date: string;
  pending: boolean;
  createdAt: string;
  updatedAt: string;
  account: {
    id: string;
    name: string;
    mask?: string;
    type: string;
    subtype: string;
    plaidItem: {
      institutionName?: string;
    };
  };
  category?: {
    id: number;
    name: string;
  };
}

export interface TransactionCategory {
  id: number;
  name: string;
  parentId?: number;
  subcategories?: TransactionCategory[];
  _count?: {
    transactions: number;
  };
}

export interface DashboardSummary {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  balance: {
    total: number;
    currency: string;
  };
  cashFlow: {
    income: number;
    expenses: number;
    netCashFlow: number;
    burnRate: number;
    runway: number;
    dailyBreakdown: Array<{
      date: string;
      income: number;
      expenses: number;
      net: number;
    }>;
  };
  accounts: {
    total: number;
    breakdown: Array<{
      id: string;
      name: string;
      mask?: string;
      type: string;
      subtype: string;
      balance: number;
      institution?: string;
    }>;
  };
  transactions: {
    total: number;
    recent: Transaction[];
  };
  categories: {
    breakdown: Array<{
      name: string;
      income: number;
      expenses: number;
      net: number;
      count: number;
    }>;
  };
  trends: {
    monthly: Array<{
      month: string;
      income: number;
      expenses: number;
      netCashFlow: number;
      transactionCount: number;
    }>;
  };
}

export interface HealthScore {
  score: number;
  healthLevel: string;
  factors: Array<{
    name: string;
    score: number;
    max: number;
  }>;
  metrics: {
    totalBalance: number;
    netCashFlow: number;
    burnRate: number;
    transactionCount: number;
    period: number;
  };
  recommendations: string[];
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

  // CFO Assistant
  cfo: {
    // Plaid Integration
    plaid: {
      createLinkToken: async (): Promise<ApiResponse<{ linkToken: string }>> => {
        const response: AxiosResponse<ApiResponse<{ linkToken: string }>> = await apiClient.post('/cfo/plaid/create-link-token');
        return response.data;
      },

      exchangePublicToken: async (publicToken: string): Promise<ApiResponse<{ plaidItem: PlaidItem }>> => {
        const response: AxiosResponse<ApiResponse<{ plaidItem: PlaidItem }>> = await apiClient.post('/cfo/plaid/exchange-public-token', { publicToken });
        return response.data;
      },

      getItems: async (): Promise<ApiResponse<{ plaidItems: PlaidItem[] }>> => {
        const response: AxiosResponse<ApiResponse<{ plaidItems: PlaidItem[] }>> = await apiClient.get('/cfo/plaid/items');
        return response.data;
      },

      syncTransactions: async (plaidItemId: string, startDate?: string, endDate?: string): Promise<ApiResponse<{ syncedCount: number }>> => {
        const response: AxiosResponse<ApiResponse<{ syncedCount: number }>> = await apiClient.post(`/cfo/plaid/sync-transactions/${plaidItemId}`, { startDate, endDate });
        return response.data;
      },

      deleteItem: async (plaidItemId: string): Promise<ApiResponse> => {
        const response: AxiosResponse<ApiResponse> = await apiClient.delete(`/cfo/plaid/items/${plaidItemId}`);
        return response.data;
      },
    },

    // Financial Data
    accounts: async (): Promise<ApiResponse<{ accounts: Account[]; summary: { totalAccounts: number; totalBalance: number; currency: string } }>> => {
      const response: AxiosResponse<ApiResponse<{ accounts: Account[]; summary: { totalAccounts: number; totalBalance: number; currency: string } }>> = await apiClient.get('/cfo/accounts');
      return response.data;
    },

    transactions: async (params?: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      categoryId?: number;
      accountId?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }): Promise<ApiResponse<{
      transactions: Transaction[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
      summary: {
        totalAmount: number;
        incomeAmount: number;
        expenseAmount: number;
        transactionCount: number;
      };
    }>> => {
      const response: AxiosResponse<ApiResponse<{
        transactions: Transaction[];
        pagination: {
          currentPage: number;
          totalPages: number;
          totalCount: number;
          limit: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
        summary: {
          totalAmount: number;
          incomeAmount: number;
          expenseAmount: number;
          transactionCount: number;
        };
      }>> = await apiClient.get('/cfo/transactions', { params });
      return response.data;
    },

    dashboard: async (period?: number): Promise<ApiResponse<DashboardSummary>> => {
      const response: AxiosResponse<ApiResponse<DashboardSummary>> = await apiClient.get('/cfo/dashboard/summary', { 
        params: period ? { period } : {} 
      });
      return response.data;
    },

    categories: async (): Promise<ApiResponse<TransactionCategory[]>> => {
      const response: AxiosResponse<ApiResponse<TransactionCategory[]>> = await apiClient.get('/cfo/categories');
      return response.data;
    },

    healthScore: async (period?: number): Promise<ApiResponse<HealthScore>> => {
      const response: AxiosResponse<ApiResponse<HealthScore>> = await apiClient.get('/cfo/health-score', { 
        params: period ? { period } : {} 
      });
      return response.data;
    },
  },
};

export default apiClient;
