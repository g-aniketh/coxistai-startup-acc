'use client';
import { useState, useEffect, useCallback } from 'react';
import { api, DashboardSummary } from '@/lib/api';
import PlaidLink from '@/components/ui/PlaidLink';
import { CashFlowChart } from '@/components/ui/CashFlowChart';
import { MetricCard } from '@/components/ui/MetricCard';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Banknote,
  Clock,
  Scale,
  Wallet,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
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
          <Card className="text-center py-12 animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Banknote className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Financial Data Available</h3>
              <p className="text-sm text-muted-foreground mb-6">Connect your bank account to get started and see your financial overview.</p>
              <PlaidLink onSuccess={handlePlaidSuccess} onError={handlePlaidError} />
            </CardContent>
          </Card>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CFO Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Financial overview for the last {period} days.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="rounded-lg border border-border bg-card text-card-foreground shadow-sm focus:border-primary focus:ring-primary px-3 py-2 text-sm"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <MetricCard 
          title="Total Balance"
          value={formatCurrency(balance.total)}
          icon={<Scale className="w-5 h-5" />}
          change={"+12.5%"}
          changeType="positive"
        />
        <MetricCard 
          title="Net Cash Flow"
          value={formatCurrency(cashFlow.netCashFlow)}
          icon={cashFlow.netCashFlow >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          change={cashFlow.netCashFlow >= 0 ? "+8.2%" : "-3.1%"}
          changeType={cashFlow.netCashFlow >= 0 ? "positive" : "negative"}
        />
        <MetricCard 
          title="Daily Burn Rate"
          value={formatCurrency(cashFlow.burnRate)}
          icon={<Clock className="w-5 h-5" />}
          change="-5.7%"
          changeType="positive"
        />
        <MetricCard 
          title="Financial Runway"
          value={cashFlow.runway > 0 ? `${Math.round(cashFlow.runway)} days` : 'N/A'}
          icon={<Banknote className="w-5 h-5" />}
        />
      </div>

      {/* Cash Flow Chart */}
      <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Cash Flow Analysis
          </CardTitle>
          <CardDescription>
            Income vs. Expenses over the last {period} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                <p className="text-sm font-medium text-green-600">Total Income</p>
              </div>
              <p className="text-2xl font-bold text-green-500">{formatCompactCurrency(cashFlow.income)}</p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="h-4 w-4 text-red-500" />
                <p className="text-sm font-medium text-red-600">Total Expenses</p>
              </div>
              <p className="text-2xl font-bold text-red-500">{formatCompactCurrency(cashFlow.expenses)}</p>
            </div>
            <div className="p-4 bg-accent/50 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Net Cash Flow</p>
              </div>
              <p className={`text-2xl font-bold ${cashFlow.netCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCompactCurrency(cashFlow.netCashFlow)}
              </p>
            </div>
          </div>
          <CashFlowChart data={cashFlow.dailyBreakdown} period={period} />
        </CardContent>
      </Card>

      {/* Accounts & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
        {/* Accounts Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Connected Accounts
            </CardTitle>
            <CardDescription>
              Your linked financial accounts and balances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts.breakdown.map((account, index) => (
                <div key={account.id} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border border-border animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Banknote className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{account.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {account.institution} - {account.type} ({account.mask})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(account.balance)}</p>
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Spending by Category
            </CardTitle>
            <CardDescription>
              Breakdown of your expenses by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.breakdown.slice(0, 5).map((category, index) => (
                <div key={category.name} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">{category.name}</span>
                    <span className="text-sm text-muted-foreground">{formatCurrency(category.expenses)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${(category.expenses / cashFlow.expenses) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
