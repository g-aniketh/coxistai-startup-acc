'use client';
import { useState, useEffect, useCallback } from 'react';
import { api, DashboardSummary } from '@/lib/api';
import PlaidLink from '@/components/ui/PlaidLink';
import { CashFlowChart } from '@/components/ui/CashFlowChart';
import { MetricCard } from '@/components/ui/MetricCard';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ClockIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function CFODashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.cfo.dashboard(period);
      
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else if (response.error?.includes('No Plaid items found')) {
        setDashboardData(null);
      } else {
        setError(response.error || 'Failed to fetch dashboard data');
        toast.error(response.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  const handlePlaidSuccess = async (public_token: string) => {
    try {
      toast.loading('Exchanging public token...', { id: 'plaid-exchange' });
      const exchangeResponse = await api.cfo.plaid.exchangePublicToken(public_token);
      
      if (exchangeResponse.success && exchangeResponse.data) {
        toast.success('Bank account connected successfully!', { id: 'plaid-exchange' });
        
        // Sync transactions for the newly connected item
        const plaidItemId = exchangeResponse.data.plaidItem.id;
        toast.loading('Syncing transactions...', { id: 'plaid-sync' });
        await api.cfo.plaid.syncTransactions(plaidItemId);
        toast.success('Transactions synced!', { id: 'plaid-sync' });
        
        fetchDashboardData();
      } else {
        throw new Error(exchangeResponse.error || 'Failed to exchange public token');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during token exchange.';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'plaid-exchange' });
    }
  };

  const handlePlaidError = (error: string) => {
    setError(error);
    toast.error(error);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  const formatCompactCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);


  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  if (error && !dashboardData) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-md p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">An Error Occurred</h3>
            <p className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</p>
            <div className="mt-6">
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/30"
              >
                Try Again
              </button>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  if (!dashboardData) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Financial Data Available</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Connect your bank account to get started and see your financial overview.</p>
            <div className="mt-6">
              <PlaidLink onSuccess={handlePlaidSuccess} onError={handlePlaidError} />
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  const { balance, cashFlow, accounts, categories } = dashboardData;

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CFO Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Financial overview for the last {period} days.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <PlaidLink onSuccess={handlePlaidSuccess} onError={handlePlaidError} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Balance"
          value={formatCurrency(balance.total)}
          icon={<ScaleIcon className="w-6 h-6 text-indigo-500" />}
        />
        <MetricCard 
          title="Net Cash Flow"
          value={formatCurrency(cashFlow.netCashFlow)}
          icon={cashFlow.netCashFlow >= 0 
            ? <ArrowTrendingUpIcon className="w-6 h-6 text-green-500" /> 
            : <ArrowTrendingDownIcon className="w-6 h-6 text-red-500" />}
        />
        <MetricCard 
          title="Daily Burn Rate"
          value={formatCurrency(cashFlow.burnRate)}
          icon={<ClockIcon className="w-6 h-6 text-amber-500" />}
        />
        <MetricCard 
          title="Financial Runway"
          value={cashFlow.runway > 0 ? `${Math.round(cashFlow.runway)} days` : 'N/A'}
          icon={<BanknotesIcon className="w-6 h-6 text-blue-500" />}
        />
      </div>

      {/* Cash Flow Chart */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cash Flow</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Income vs. Expenses over the last {period} days.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-center">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-300">Total Income</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCompactCurrency(cashFlow.income)}</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCompactCurrency(cashFlow.expenses)}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${cashFlow.netCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCompactCurrency(cashFlow.netCashFlow)}
                </p>
            </div>
        </div>
        <CashFlowChart data={cashFlow.dailyBreakdown} period={period} />
      </div>

      {/* Accounts & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts Overview */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Connected Accounts</h2>
          <div className="mt-4 space-y-4">
            {accounts.breakdown.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{account.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {account.institution} - {account.type} ({account.mask})
                  </p>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(account.balance)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Spending by Category</h2>
          <div className="mt-4 space-y-3">
            {categories.breakdown.slice(0, 5).map((category) => (
              <div key={category.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-800 dark:text-gray-200">{category.name}</span>
                  <span className="text-gray-600 dark:text-gray-300">{formatCurrency(category.expenses)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ width: `${(category.expenses / cashFlow.expenses) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
