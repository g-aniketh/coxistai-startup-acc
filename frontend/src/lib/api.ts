import axios, { AxiosInstance } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  startupId: string;
  startup: Startup;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Startup {
  id: string;
  name: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  trialEndsAt?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  startupName: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  date: string;
  startupId: string;
  accountId: string;
  account?: {
    id: string;
    accountName: string;
  };
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  quantity: number;
  price: number;
  cost?: number;
  sku?: string;
  reorderLevel?: number;
  maxStock?: number;
  supplier?: string;
  lastRestocked?: string;
  salesCount?: number;
  startupId: string;
  createdAt: string;
  updatedAt: string;
  sales?: Sale[];
}

// Sale Types
export interface Sale {
  id: string;
  quantitySold: number;
  totalPrice: number;
  saleDate: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
  transactionId: string;
  transaction: {
    id: string;
    amount: number;
    date: string;
  };
}

// Bank Account Types
export interface BankAccount {
  id: string;
  accountName: string;
  balance: number;
  startupId: string;
  createdAt: string;
  updatedAt: string;
  transactions?: Transaction[];
}

// Dashboard Types
export interface DashboardSummary {
  financial: {
    totalBalance: number;
    monthlyBurn: number;
    monthlyRevenue: number;
    netCashflow: number;
    runwayMonths: number | null;
    income: number;
    expenses: number;
  };
  inventory: {
    totalProducts: number;
    totalInventoryValue: number;
    lowStockProducts: number;
  };
  sales: {
    totalSales30Days: number;
    unitsSold30Days: number;
    salesCount: number;
  };
  accounts: number;
}

export interface CashflowChartData {
  date: string;
  income: number;
  expenses: number;
  netCashflow: number;
}

export interface RecentActivity {
  type: 'transaction' | 'sale';
  id: string;
  description: string;
  amount: number;
  transactionType: 'CREDIT' | 'DEBIT';
  date: string;
  account?: string;
  product?: string;
}

// Team Member Types
export interface TeamMember {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// API METHODS
// ============================================================================

export const apiClient = {
  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  
  auth: {
    signup: async (data: SignupRequest): Promise<AuthResponse> => {
      const response = await api.post('/auth/signup', data);
      return response.data;
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
      const response = await api.post('/auth/login', data);
      return response.data;
    },

    me: async (): Promise<ApiResponse<{ user: User; startup: Startup }>> => {
      const response = await api.get('/auth/me');
      return response.data;
    },

    logout: async (): Promise<ApiResponse> => {
      const response = await api.post('/auth/logout');
      return response.data;
    },
  },

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================
  
  transactions: {
    create: async (data: {
      amount: number;
      type: 'CREDIT' | 'DEBIT';
      description: string;
      accountId: string;
    }): Promise<ApiResponse<Transaction>> => {
      const response = await api.post('/transactions', data);
      return response.data;
    },

    list: async (params?: {
      accountId?: string;
      type?: 'CREDIT' | 'DEBIT';
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }): Promise<ApiResponse<Transaction[]>> => {
      const response = await api.get('/transactions', { params });
      return response.data;
    },

    getById: async (id: string): Promise<ApiResponse<Transaction>> => {
      const response = await api.get(`/transactions/${id}`);
      return response.data;
    },

    delete: async (id: string): Promise<ApiResponse> => {
      const response = await api.delete(`/transactions/${id}`);
      return response.data;
    },
  },

  // ============================================================================
  // DASHBOARD
  // ============================================================================
  
  dashboard: {
    summary: async (): Promise<ApiResponse<DashboardSummary>> => {
      const response = await api.get('/dashboard/summary');
      return response.data;
    },

    cashflowChart: async (months?: number): Promise<ApiResponse<CashflowChartData[]>> => {
      const response = await api.get('/dashboard/cashflow-chart', {
        params: months ? { months } : {},
      });
      return response.data;
    },

    recentActivity: async (limit?: number): Promise<ApiResponse<RecentActivity[]>> => {
      const response = await api.get('/dashboard/recent-activity', {
        params: limit ? { limit } : {},
      });
      return response.data;
    },
  },

  // ============================================================================
  // INVENTORY
  // ============================================================================
  
  inventory: {
    products: {
      create: async (data: {
        name: string;
        quantity: number;
        price: number;
      }): Promise<ApiResponse<Product>> => {
        const response = await api.post('/inventory/products', data);
        return response.data;
      },

      list: async (): Promise<ApiResponse<Product[]>> => {
        const response = await api.get('/inventory/products');
        return response.data;
      },

      getById: async (id: string): Promise<ApiResponse<Product>> => {
        const response = await api.get(`/inventory/products/${id}`);
        return response.data;
      },

      update: async (
        id: string,
        data: {
          name?: string;
          quantity?: number;
          price?: number;
        }
      ): Promise<ApiResponse<Product>> => {
        const response = await api.put(`/inventory/products/${id}`, data);
        return response.data;
      },

      delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/inventory/products/${id}`);
        return response.data;
      },
    },

    sales: {
      simulate: async (data: {
        productId: string;
        quantitySold: number;
        accountId: string;
      }): Promise<ApiResponse<{ sale: Sale; transaction: Transaction; product: Product }>> => {
        const response = await api.post('/inventory/sales', data);
        return response.data;
      },

      list: async (limit?: number): Promise<ApiResponse<Sale[]>> => {
        const response = await api.get('/inventory/sales', {
          params: limit ? { limit } : {},
        });
        return response.data;
      },
    },
  },

  // ============================================================================
  // BANK ACCOUNTS
  // ============================================================================
  
  accounts: {
    create: async (data: {
      accountName: string;
      balance?: number;
    }): Promise<ApiResponse<BankAccount>> => {
      const response = await api.post('/accounts', data);
      return response.data;
    },

    list: async (): Promise<ApiResponse<BankAccount[]>> => {
      const response = await api.get('/accounts');
      return response.data;
    },

    getById: async (id: string): Promise<ApiResponse<BankAccount>> => {
      const response = await api.get(`/accounts/${id}`);
      return response.data;
    },

    update: async (
      id: string,
      data: {
        accountName?: string;
        balance?: number;
      }
    ): Promise<ApiResponse<BankAccount>> => {
      const response = await api.put(`/accounts/${id}`, data);
      return response.data;
    },

    delete: async (id: string): Promise<ApiResponse> => {
      const response = await api.delete(`/accounts/${id}`);
      return response.data;
    },
  },

  // ============================================================================
  // TEAM MANAGEMENT
  // ============================================================================
  
  team: {
    invite: async (data: {
      email: string;
      roleName: string;
      firstName?: string;
      lastName?: string;
    }): Promise<ApiResponse<TeamMember>> => {
      const response = await api.post('/team/invite', data);
      return response.data;
    },

    list: async (): Promise<ApiResponse<TeamMember[]>> => {
      const response = await api.get('/team');
      return response.data;
    },

    updateRole: async (userId: string, roleName: string): Promise<ApiResponse<TeamMember>> => {
      const response = await api.put(`/team/${userId}/role`, { roleName });
      return response.data;
    },

    deactivate: async (userId: string): Promise<ApiResponse> => {
      const response = await api.post(`/team/${userId}/deactivate`);
      return response.data;
    },
  },

  // ============================================================================
  // AI FEATURES (OpenAI Integration)
  // ============================================================================
  
  ai: {
    getInsights: async (): Promise<ApiResponse<{
      burnAnalysis: string;
      topSpendingCategories: string[];
      costSavingSuggestions: string[];
      revenueOpportunities: string[];
      cashflowHealth: string;
      keyMetrics: {
        totalBalance: number;
        monthlyBurn: number;
        monthlyRevenue: number;
        runway: number | null;
      };
    }>> => {
      const response = await api.post('/ai/insights');
      return response.data;
    },

    runWhatIfScenario: async (scenario: string): Promise<ApiResponse<{
      scenario: string;
      impact: {
        runwayChange: string;
        burnRateChange: string;
        recommendation: string;
      };
      explanation: string;
      risks: string[];
      opportunities: string[];
    }>> => {
      const response = await api.post('/ai/scenarios', { scenario });
      return response.data;
    },

    generateInvestorUpdate: async (periodStart: string, periodEnd: string): Promise<ApiResponse<{
      id: string;
      executiveSummary: string;
      highlights: string[];
      challenges: string[];
      nextSteps: string[];
      financialSummary: string;
      financialData: {
        revenue: number;
        expenses: number;
        netCashflow: number;
      };
    }>> => {
      const response = await api.post('/ai/investor-update', { periodStart, periodEnd });
      return response.data;
    },
  },
};

export default api;
