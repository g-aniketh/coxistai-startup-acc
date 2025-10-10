'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  TrendingUp,
  DollarSign,
  TrendingDown,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Activity,
} from 'lucide-react';
import SplitText from '@/components/SplitText';
import CountUp from '@/components/CountUp';
import GradientText from '@/components/GradientText';
import SpotlightCard from '@/components/SpotlightCard';
import MagicBento from '@/components/MagicBento';
import { Badge } from '@/components/ui/Badge';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  metrics: any;
  history: any[];
  alerts: any[];
  recentTransactions: any[];
  trends: {
    revenue: number;
    expenses: number;
  };
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.analytics.dashboard();
      
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        // If no metrics exist, calculate them first
        await api.analytics.calculate();
        const retryResponse = await api.analytics.dashboard();
        if (retryResponse.success && retryResponse.data) {
          setDashboardData(retryResponse.data);
        }
      }
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  if (error || !dashboardData?.metrics) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Financial Data</h2>
              <p className="text-muted-foreground mb-4">
                {error || 'Connect your bank accounts and Stripe to see your dashboard'}
              </p>
              <button
                onClick={() => window.location.href = '/settings'}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Go to Settings
              </button>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  const { metrics, history, alerts, recentTransactions, trends } = dashboardData;

  const chartData = history.map((m: any) => ({
    month: new Date(m.periodStart).toLocaleDateString('en-US', { month: 'short' }),
    revenue: Number(m.totalRevenue),
    expenses: Number(m.totalExpenses),
    cashflow: Number(m.netCashflow),
  }));

  const bentoItems = [
    // Header
    {
      className: 'col-span-12 lg:col-span-8',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full flex flex-col justify-between">
          <div>
            <SplitText
              text="AI CFO Dashboard"
              tag="h1"
              className="text-3xl font-bold text-foreground"
            />
            <p className="mt-2 text-muted-foreground">
              Welcome back,{' '}
              <GradientText className="inline-flex font-semibold">
                {user?.email}
              </GradientText>
              !
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      ),
    },

    // Quick Actions
    {
      className: 'col-span-12 lg:col-span-4',
      background: <SpotlightCard spotlightColor="rgba(139, 92, 246, 0.3)" className="w-full h-full" />,
      content: (
        <div className="p-6 h-full flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium text-foreground mb-2">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">Runway: {Number(metrics.runway).toFixed(1)} months</p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => window.location.href = '/forecasting'}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              Run AI Forecast
            </button>
            <button
              onClick={() => window.location.href = '/alerts'}
              className="w-full px-4 py-2 bg-muted text-foreground rounded-md text-sm hover:bg-muted/80"
            >
              View Alerts ({alerts.length})
            </button>
          </div>
        </div>
      ),
    },

    // Cash Balance
    {
      className: 'col-span-6 lg:col-span-3',
      background: <SpotlightCard spotlightColor="rgba(34, 197, 94, 0.3)" className="w-full h-full" />,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <DollarSign className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Cash Balance</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">
            <CountUp to={Number(metrics.cashBalance)} duration={1.5} prefix="$" />
          </div>
        </div>
      ),
    },

    // Monthly Burn Rate
    {
      className: 'col-span-6 lg:col-span-3',
      background: <SpotlightCard spotlightColor="rgba(239, 68, 68, 0.3)" className="w-full h-full" />,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <TrendingDown className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Burn Rate</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">
            <CountUp to={Number(metrics.burnRate)} duration={1.5} prefix="$" suffix="/mo" />
          </div>
        </div>
      ),
    },

    // MRR
    {
      className: 'col-span-6 lg:col-span-3',
      background: <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.3)" className="w-full h-full" />,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">MRR</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">
            <CountUp to={Number(metrics.mrr)} duration={1.5} prefix="$" />
          </div>
          {trends.revenue !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trends.revenue > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trends.revenue > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(trends.revenue).toFixed(1)}% from last month
            </div>
          )}
        </div>
      ),
    },

    // ARR
    {
      className: 'col-span-6 lg:col-span-3',
      background: <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.3)" className="w-full h-full" />,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">ARR</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">
            <CountUp to={Number(metrics.arr)} duration={1.5} prefix="$" />
          </div>
        </div>
      ),
    },

    // Revenue & Expenses Chart
    {
      className: 'col-span-12 lg:col-span-8',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-foreground">Revenue & Expenses</h3>
            <p className="text-sm text-muted-foreground">Last {history.length} months</p>
          </div>
          <div className="flex-grow min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#colorExpenses)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },

    // Recent Alerts
    {
      className: 'col-span-12 lg:col-span-4',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-foreground">Recent Alerts</h3>
            <p className="text-sm text-muted-foreground">{alerts.length} active alerts</p>
          </div>
          <div className="flex-grow space-y-2 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No alerts</p>
            ) : (
              alerts.slice(0, 5).map((alert: any) => (
                <div key={alert.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-start gap-2">
                    <AlertCircle className={`h-4 w-4 mt-0.5 ${
                      alert.severity === 'critical' ? 'text-red-500' :
                      alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ),
    },

    // Recent Transactions
    {
      className: 'col-span-12',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-foreground">Recent Transactions</h3>
              <p className="text-sm text-muted-foreground">Latest financial activity</p>
            </div>
            <button
              onClick={() => window.location.href = '/transactions'}
              className="text-sm text-primary hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No transactions</p>
            ) : (
              recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString()} • {tx.account.name}
                    </p>
                  </div>
                  <div className={`text-sm font-semibold ${Number(tx.amount) > 0 ? 'text-emerald-500' : 'text-foreground'}`}>
                    {formatCurrency(Number(tx.amount))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <MagicBento items={bentoItems} />
      </MainLayout>
    </AuthGuard>
  );
}
