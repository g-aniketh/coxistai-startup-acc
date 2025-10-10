'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  TrendingUp,
  DollarSign,
  Users,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import CountUp from '@/components/CountUp';
import MagicBento from '@/components/MagicBento';
import SpotlightCard from '@/components/SpotlightCard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function RevenueMetricsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsRes, historyRes] = await Promise.all([
        apiClient.dashboard.latest(),
        apiClient.dashboard.history(12),
      ]);

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
      if (historyRes.success && historyRes.data) {
        setHistory(historyRes.data);
      }
    } catch (error) {
      console.error('Failed to load revenue metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    try {
      setSyncing(true);
      await api.stripe.sync();
      await apiClient.dashboard.calculate();
      await loadData();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
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

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  if (!metrics) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Revenue Metrics</h1>
            <p className="text-muted-foreground">No metrics available. Connect Stripe and sync your data.</p>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  const chartData = history.map((m: any) => ({
    month: new Date(m.periodStart).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    mrr: Number(m.mrr),
    arr: Number(m.arr),
    revenue: Number(m.totalRevenue),
    customers: m.activeCustomers,
    growthRate: Number(m.growthRate),
  }));

  const bentoItems = [
    // Header
    {
      className: 'col-span-12',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Revenue Metrics</h1>
            <p className="text-muted-foreground mt-1">Track your recurring revenue and growth</p>
          </div>
          <button
            onClick={syncData}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      ),
    },

    // MRR
    {
      className: 'col-span-6 lg:col-span-3',
      background: <SpotlightCard spotlightColor="rgba(34, 197, 94, 0.3)" className="w-full h-full" />,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <DollarSign className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">MRR</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">
            <CountUp to={Number(metrics.mrr)} duration={1.5} prefix="$" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Monthly Recurring Revenue</p>
        </div>
      ),
    },

    // ARR
    {
      className: 'col-span-6 lg:col-span-3',
      background: <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.3)" className="w-full h-full" />,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">ARR</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">
            <CountUp to={Number(metrics.arr)} duration={1.5} prefix="$" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Annual Recurring Revenue</p>
        </div>
      ),
    },

    // Total Revenue
    {
      className: 'col-span-6 lg:col-span-3',
      background: <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.3)" className="w-full h-full" />,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <DollarSign className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">
            <CountUp to={Number(metrics.totalRevenue)} duration={1.5} prefix="$" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">This period</p>
        </div>
      ),
    },

    // Growth Rate
    {
      className: 'col-span-6 lg:col-span-3',
      background: <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.3)" className="w-full h-full" />,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Percent className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Growth Rate</h3>
          </div>
          <div className="text-3xl font-bold text-foreground flex items-center gap-2">
            <CountUp to={Number(metrics.growthRate)} duration={1.5} suffix="%" decimals={1} />
            {Number(metrics.growthRate) > 0 ? (
              <ArrowUpRight className="h-6 w-6 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-6 w-6 text-red-500" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Month-over-month</p>
        </div>
      ),
    },

    // MRR & ARR Trend
    {
      className: 'col-span-12 lg:col-span-8',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-foreground">MRR & ARR Trend</h3>
            <p className="text-sm text-muted-foreground">Last 12 months</p>
          </div>
          <div className="flex-grow min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                <Legend />
                <Line type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} name="MRR" />
                <Line type="monotone" dataKey="arr" stroke="#3b82f6" strokeWidth={2} name="ARR" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },

    // Customer Metrics
    {
      className: 'col-span-12 lg:col-span-4',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-foreground">Customer Metrics</h3>
            <p className="text-sm text-muted-foreground">Current period</p>
          </div>
          <div className="space-y-4 flex-grow">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Active Customers</span>
              </div>
              <span className="text-2xl font-bold">{metrics.activeCustomers}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium">New Customers</span>
              </div>
              <span className="text-2xl font-bold text-emerald-500">{metrics.newCustomers}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <ArrowDownRight className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">Churned</span>
              </div>
              <span className="text-2xl font-bold text-red-500">{metrics.churnedCustomers}</span>
            </div>
            <div className="p-4 rounded-lg bg-primary/10">
              <div className="text-sm text-muted-foreground mb-1">Churn Rate</div>
              <div className="text-2xl font-bold text-foreground">
                {metrics.activeCustomers > 0
                  ? ((metrics.churnedCustomers / (metrics.activeCustomers + metrics.churnedCustomers)) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Revenue Growth Chart
    {
      className: 'col-span-12 lg:col-span-8',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-foreground">Revenue Growth</h3>
            <p className="text-sm text-muted-foreground">Monthly breakdown</p>
          </div>
          <div className="flex-grow min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },

    // Customer Lifetime Value
    {
      className: 'col-span-12 lg:col-span-4',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">Unit Economics</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Customer Lifetime Value</div>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(Number(metrics.lifetimeValue))}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Customer Acquisition Cost</div>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(Number(metrics.customerAcquisitionCost))}
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground mb-1">LTV / CAC Ratio</div>
                <div className="text-3xl font-bold text-primary">
                  {Number(metrics.customerAcquisitionCost) > 0
                    ? (Number(metrics.lifetimeValue) / Number(metrics.customerAcquisitionCost)).toFixed(2)
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {Number(metrics.lifetimeValue) / Number(metrics.customerAcquisitionCost) >= 3
                    ? '✓ Healthy ratio (3:1 or better)'
                    : '⚠ Needs improvement'}
                </p>
              </div>
            </div>
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
