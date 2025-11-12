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

export interface CompanyAddress {
  id: string;
  label?: string | null;
  line1: string;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  isPrimary: boolean;
  isBilling: boolean;
  isShipping: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfile {
  id: string;
  displayName: string;
  legalName?: string | null;
  mailingName?: string | null;
  baseCurrency: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  website?: string | null;
  createdAt: string;
  updatedAt: string;
  addresses: CompanyAddress[];
}

export interface CompanyFiscalConfig {
  id: string;
  financialYearStart: string;
  booksStart: string;
  allowBackdatedEntries: boolean;
  backdatedFrom?: string | null;
  enableEditLog: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFiscalInput {
  financialYearStart: string;
  booksStart: string;
  allowBackdatedEntries?: boolean;
  backdatedFrom?: string | null;
  enableEditLog?: boolean;
}

export interface CompanySecurityConfig {
  id: string;
  tallyVaultEnabled: boolean;
  userAccessControlEnabled: boolean;
  multiFactorRequired: boolean;
  tallyVaultPasswordHint?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySecurityInput {
  tallyVaultEnabled?: boolean;
  newTallyVaultPassword?: string;
  currentTallyVaultPassword?: string;
  tallyVaultPasswordHint?: string | null;
  userAccessControlEnabled?: boolean;
  multiFactorRequired?: boolean;
}

export interface CompanyCurrencyConfig {
  id: string;
  baseCurrencyCode: string;
  baseCurrencySymbol: string;
  baseCurrencyFormalName?: string | null;
  decimalPlaces: number;
  decimalSeparator: string;
  thousandSeparator: string;
  symbolOnRight: boolean;
  spaceBetweenAmountAndSymbol: boolean;
  showAmountInMillions: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyCurrencyInput {
  baseCurrencyCode?: string;
  baseCurrencySymbol?: string;
  baseCurrencyFormalName?: string | null;
  decimalPlaces?: number;
  decimalSeparator?: string;
  thousandSeparator?: string;
  symbolOnRight?: boolean;
  spaceBetweenAmountAndSymbol?: boolean;
  showAmountInMillions?: boolean;
}

export interface CompanyFeatureToggle {
  id: string;
  enableAccounting: boolean;
  enableInventory: boolean;
  enableTaxation: boolean;
  enablePayroll: boolean;
  enableAIInsights: boolean;
  enableScenarioPlanning: boolean;
  enableAutomations: boolean;
  enableVendorManagement: boolean;
  enableBillingAndInvoicing: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFeatureToggleInput {
  enableAccounting?: boolean;
  enableInventory?: boolean;
  enableTaxation?: boolean;
  enablePayroll?: boolean;
  enableAIInsights?: boolean;
  enableScenarioPlanning?: boolean;
  enableAutomations?: boolean;
  enableVendorManagement?: boolean;
  enableBillingAndInvoicing?: boolean;
}

export type VoucherCategory =
  | 'PAYMENT'
  | 'RECEIPT'
  | 'CONTRA'
  | 'JOURNAL'
  | 'SALES'
  | 'PURCHASE'
  | 'DEBIT_NOTE'
  | 'CREDIT_NOTE'
  | 'MEMO'
  | 'REVERSING_JOURNAL'
  | 'OPTIONAL'
  | 'DELIVERY_NOTE'
  | 'RECEIPT_NOTE'
  | 'REJECTION_IN'
  | 'REJECTION_OUT'
  | 'STOCK_JOURNAL'
  | 'PHYSICAL_STOCK'
  | 'JOB_WORK_IN'
  | 'JOB_WORK_OUT'
  | 'MATERIAL_IN'
  | 'MATERIAL_OUT';

export type VoucherNumberingMethod =
  | 'NONE'
  | 'MANUAL'
  | 'AUTOMATIC'
  | 'AUTOMATIC_WITH_OVERRIDE'
  | 'MULTI_USER_AUTO';

export type VoucherNumberingBehavior = 'RENUMBER' | 'RETAIN';

export interface VoucherNumberingSeries {
  id: string;
  startupId: string;
  voucherTypeId: string;
  name: string;
  prefix?: string | null;
  suffix?: string | null;
  startNumber: number;
  nextNumber: number;
  numberingMethod: VoucherNumberingMethod;
  numberingBehavior: VoucherNumberingBehavior;
  allowManualOverride: boolean;
  allowDuplicateNumbers: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherType {
  id: string;
  startupId: string;
  name: string;
  abbreviation?: string | null;
  category: VoucherCategory;
  isDefault: boolean;
  numberingMethod: VoucherNumberingMethod;
  numberingBehavior: VoucherNumberingBehavior;
  nextNumber: number;
  prefix?: string | null;
  suffix?: string | null;
  allowManualOverride: boolean;
  allowDuplicateNumbers: boolean;
  createdAt: string;
  updatedAt: string;
  numberingSeries: VoucherNumberingSeries[];
}

export interface VoucherTypeInput {
  name: string;
  abbreviation?: string;
  category: VoucherCategory;
  numberingMethod?: VoucherNumberingMethod;
  numberingBehavior?: VoucherNumberingBehavior;
  prefix?: string;
  suffix?: string;
  allowManualOverride?: boolean;
  allowDuplicateNumbers?: boolean;
}

export interface VoucherTypeUpdateInput {
  abbreviation?: string | null;
  numberingMethod?: VoucherNumberingMethod;
  numberingBehavior?: VoucherNumberingBehavior;
  prefix?: string | null;
  suffix?: string | null;
  allowManualOverride?: boolean;
  allowDuplicateNumbers?: boolean;
  nextNumber?: number;
}

export interface VoucherNumberingSeriesInput {
  name: string;
  prefix?: string;
  suffix?: string;
  numberingMethod?: VoucherNumberingMethod;
  numberingBehavior?: VoucherNumberingBehavior;
  startNumber?: number;
  allowManualOverride?: boolean;
  allowDuplicateNumbers?: boolean;
  isDefault?: boolean;
}

export type VoucherEntryType = 'DEBIT' | 'CREDIT';
export type VoucherBillReferenceType = 'AGAINST' | 'NEW' | 'ADVANCE' | 'ON_ACCOUNT';

export interface VoucherBillReference {
  id: string;
  voucherEntryId: string;
  reference: string;
  referenceType: VoucherBillReferenceType;
  amount: number;
  dueDate?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherEntry {
  id: string;
  voucherId: string;
  ledgerName: string;
  ledgerCode?: string | null;
  entryType: VoucherEntryType;
  amount: number;
  narration?: string | null;
  costCenterName?: string | null;
  costCategory?: string | null;
  createdAt: string;
  updatedAt: string;
  billReferences: VoucherBillReference[];
}

export interface Voucher {
  id: string;
  startupId: string;
  voucherTypeId: string;
  numberingSeriesId?: string | null;
  voucherNumber: string;
  date: string;
  reference?: string | null;
  narration?: string | null;
  createdById?: string | null;
  transactionId?: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  voucherType: VoucherType;
  numberingSeries?: VoucherNumberingSeries | null;
  entries: VoucherEntry[];
}

export interface CreateVoucherRequest {
  voucherTypeId: string;
  numberingSeriesId?: string | null;
  date?: string;
  reference?: string;
  narration?: string;
  createdById?: string;
  entries: Array<{
    ledgerName: string;
    ledgerCode?: string;
    entryType: VoucherEntryType;
    amount: number;
    narration?: string;
    costCenterName?: string;
    costCategory?: string;
    billReferences?: Array<{
      reference: string;
      amount: number;
      referenceType?: VoucherBillReferenceType;
      dueDate?: string;
      remarks?: string;
    }>;
  }>;
}

export interface Startup {
  id: string;
  name: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  trialEndsAt?: string;
  companyProfile?: CompanyProfile | null;
  fiscalConfig?: CompanyFiscalConfig | null;
  securityConfig?: CompanySecurityConfig | null;
  currencyConfig?: CompanyCurrencyConfig | null;
  featureToggle?: CompanyFeatureToggle | null;
  voucherTypes?: VoucherType[];
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

export interface CompanyAddressInput {
  id?: string;
  label?: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isPrimary?: boolean;
  isBilling?: boolean;
  isShipping?: boolean;
}

export interface CompanyProfileInput {
  displayName: string;
  legalName?: string;
  mailingName?: string;
  baseCurrency?: string;
  country?: string;
  state?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  addresses?: CompanyAddressInput[];
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
  minStockLevel?: number;
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
  accounts: {
    count: number;
    breakdown: Array<{
      id: string;
      name: string;
      balance: number;
      institution?: string;
      mask?: string;
    }>;
  };
  balance: {
    total: number;
  };
  cashFlow: {
    netCashFlow: number;
    burnRate: number;
    runway: number;
    dailyBreakdown: Array<{
      date: string;
      value: number;
    }>;
  };
  categories: {
    breakdown: Array<{
      name: string;
      amount: number;
      percentage: number;
    }>;
  };
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
  timeout: 120000, // 2 minutes for long-running imports
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

    // Additional dashboard methods
    dashboard: async (period: string): Promise<ApiResponse<any>> => {
      const response = await api.get('/dashboard', { params: { period } });
      return response.data;
    },

    getScenarios: async (): Promise<ApiResponse<any[]>> => {
      const response = await api.get('/ai-cfo/scenarios');
      return response.data;
    },

    forecast: async (months: number): Promise<ApiResponse<any>> => {
      const response = await api.post('/ai-cfo/forecast', { months });
      return response.data;
    },

    runScenario: async (name: string, inputs: any): Promise<ApiResponse<any>> => {
      const response = await api.post('/ai-cfo/scenario', { name, inputs });
      return response.data;
    },

    latest: async (): Promise<ApiResponse<any>> => {
      const response = await api.get('/analytics/latest');
      return response.data;
    },

    history: async (months: number): Promise<ApiResponse<any>> => {
      const response = await api.get('/analytics/history', { params: { months } });
      return response.data;
    },

    calculate: async (): Promise<ApiResponse<any>> => {
      const response = await api.post('/analytics/calculate');
      return response.data;
    },

    plaid: {
      exchangePublicToken: async (publicToken: string): Promise<ApiResponse<any>> => {
        const response = await api.post('/plaid/exchange-token', { public_token: publicToken });
        return response.data;
      },

      syncTransactions: async (itemId: string): Promise<ApiResponse<any>> => {
        const response = await api.post('/plaid/sync', { item_id: itemId });
        return response.data;
      },
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

    plaid: {
      createLinkToken: async (): Promise<ApiResponse<{ link_token: string }>> => {
        const response = await api.post('/plaid/link-token');
        return response.data;
      },

      exchangePublicToken: async (publicToken: string): Promise<ApiResponse<any>> => {
        const response = await api.post('/plaid/exchange-token', { public_token: publicToken });
        return response.data;
      },

      syncTransactions: async (itemId: string): Promise<ApiResponse<any>> => {
        const response = await api.post('/plaid/sync', { item_id: itemId });
        return response.data;
      },
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
  // COMPANY PROFILE
  // ============================================================================

  company: {
    getProfile: async (): Promise<ApiResponse<CompanyProfile | null>> => {
      const response = await api.get('/company/profile');
      return response.data;
    },

    updateProfile: async (
      data: CompanyProfileInput
    ): Promise<ApiResponse<CompanyProfile>> => {
      const response = await api.put('/company/profile', data);
      return response.data;
    },

    getFiscal: async (): Promise<ApiResponse<CompanyFiscalConfig | null>> => {
      const response = await api.get('/company/fiscal');
      return response.data;
    },

    updateFiscal: async (
      data: CompanyFiscalInput
    ): Promise<ApiResponse<CompanyFiscalConfig>> => {
      const response = await api.put('/company/fiscal', data);
      return response.data;
    },

    getSecurity: async (): Promise<ApiResponse<CompanySecurityConfig | null>> => {
      const response = await api.get('/company/security');
      return response.data;
    },

    updateSecurity: async (
      data: CompanySecurityInput
    ): Promise<ApiResponse<CompanySecurityConfig>> => {
      const response = await api.put('/company/security', data);
      return response.data;
    },

    getCurrency: async (): Promise<ApiResponse<CompanyCurrencyConfig | null>> => {
      const response = await api.get('/company/currency');
      return response.data;
    },

    updateCurrency: async (
      data: CompanyCurrencyInput
    ): Promise<ApiResponse<CompanyCurrencyConfig>> => {
      const response = await api.put('/company/currency', data);
      return response.data;
    },

    getFeatureToggles: async (): Promise<ApiResponse<CompanyFeatureToggle | null>> => {
      const response = await api.get('/company/feature-toggles');
      return response.data;
    },

    updateFeatureToggles: async (
      data: CompanyFeatureToggleInput
    ): Promise<ApiResponse<CompanyFeatureToggle>> => {
      const response = await api.put('/company/feature-toggles', data);
      return response.data;
    },
  },

  vouchers: {
    listTypes: async (): Promise<ApiResponse<VoucherType[]>> => {
      const response = await api.get('/vouchers/types');
      return response.data;
    },

    createType: async (data: VoucherTypeInput): Promise<ApiResponse<VoucherType>> => {
      const response = await api.post('/vouchers/types', data);
      return response.data;
    },

    updateType: async (
      voucherTypeId: string,
      data: VoucherTypeUpdateInput
    ): Promise<ApiResponse<VoucherType>> => {
      const response = await api.put(`/vouchers/types/${voucherTypeId}`, data);
      return response.data;
    },

    createSeries: async (
      voucherTypeId: string,
      data: VoucherNumberingSeriesInput
    ): Promise<ApiResponse<VoucherNumberingSeries>> => {
      const response = await api.post(`/vouchers/types/${voucherTypeId}/series`, data);
      return response.data;
    },

    generateNextNumber: async (
      voucherTypeId: string,
      numberingSeriesId?: string
    ): Promise<ApiResponse<{ voucherNumber: string }>> => {
      const response = await api.post(`/vouchers/types/${voucherTypeId}/next-number`, {
        numberingSeriesId,
      });
      return response.data;
    },
    list: async (params?: {
      voucherTypeId?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
    }): Promise<ApiResponse<Voucher[]>> => {
      const response = await api.get('/vouchers', { params });
      return response.data;
    },
    create: async (data: CreateVoucherRequest): Promise<ApiResponse<Voucher>> => {
      const response = await api.post('/vouchers', data);
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

    chat: async (message: string): Promise<ApiResponse<{ response: string }>> => {
      const response = await api.post('/ai-cfo/chat', { message });
      return response.data;
    },
  },

  // ============================================================================
  // STRIPE
  // ============================================================================
  
  stripe: {
    sync: async (): Promise<ApiResponse<any>> => {
      const response = await api.post('/stripe/sync');
      return response.data;
    },

    connect: async (apiKey: string): Promise<ApiResponse<any>> => {
      const response = await api.post('/stripe/connect', { apiKey });
      return response.data;
    },

    getAccount: async (): Promise<ApiResponse<any>> => {
      const response = await api.get('/stripe/account');
      return response.data;
    },

    disconnect: async (): Promise<ApiResponse<any>> => {
      const response = await api.delete('/stripe/disconnect');
      return response.data;
    },
  },

  // ============================================================================
  // IMPORT
  // ============================================================================
  
  import: {
    tally: async (importData: any): Promise<ApiResponse<any>> => {
      const response = await api.post('/import/tally', importData);
      return response.data;
    },
  },
};

export default api;
