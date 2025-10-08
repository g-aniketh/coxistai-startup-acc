'use client';

import { useState, useEffect } from 'react';
import { api, DashboardSummary } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { 
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CalendarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';

export default function RevenueMetricsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'30' | '90' | '365'>('90');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.cfo.dashboard(Number(selectedPeriod));
      
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        toast.error(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenueMetrics = () => {
    if (!dashboardData) return null;

    const totalIncome = dashboardData.cashFlow.income;
    const days = dashboardData.period.days;
    
    // Calculate MRR (Monthly Recurring Revenue) - based on average daily income
    const dailyIncome = totalIncome / days;
    const mrr = dailyIncome * 30;
    
    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12;
    
    // Calculate growth rate based on monthly trends
    const monthlyData = dashboardData.trends.monthly;
    let growthRate = 0;
    if (monthlyData.length >= 2) {
      const latestMonth = monthlyData[monthlyData.length - 1];
      const previousMonth = monthlyData[monthlyData.length - 2];
      if (previousMonth.income > 0) {
        growthRate = ((latestMonth.income - previousMonth.income) / previousMonth.income) * 100;
      }
    }

    // Estimate customer metrics (placeholder - in real app would come from Stripe/CRM)
    const estimatedCustomers = Math.max(1, Math.floor(mrr / 100)); // Assume $100 average per customer
    const avgRevenuePerCustomer = mrr / estimatedCustomers;
    const customerAcquisitionCost = dashboardData.cashFlow.expenses / estimatedCustomers * 0.3; // 30% of expenses on acquisition

    // Calculate lifetime value (simple estimation)
    const avgCustomerLifeMonths = 24; // Assume 2 year average
    const ltv = avgRevenuePerCustomer * avgCustomerLifeMonths;
    const ltvCacRatio = ltv / Math.max(customerAcquisitionCost, 1);

    // Quick ratio (new MRR / churned MRR) - placeholder
    const quickRatio = 2.5; // Industry standard target is 4+

    return {
      mrr,
      arr,
      growthRate,
      estimatedCustomers,
      avgRevenuePerCustomer,
      customerAcquisitionCost,
      ltv,
      ltvCacRatio,
      quickRatio,
      totalIncome,
    };
  };

  const metrics = calculateRevenueMetrics();

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
    maximumFractionDigits: 1,
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

  if (!dashboardData || !metrics) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="text-center py-12">
            <ArrowTrendingUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Revenue Data Available</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Connect your bank account and payment processors to track revenue metrics.
            </p>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Revenue Metrics</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Track ARR, MRR, and key SaaS metrics for your startup.
              </p>
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <CurrencyDollarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">MRR</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCompactCurrency(metrics.mrr)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Monthly Recurring Revenue</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">ARR</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCompactCurrency(metrics.arr)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Annual Recurring Revenue</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <ChartBarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Growth Rate</h3>
              </div>
              <p className={`text-3xl font-bold ${metrics.growthRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {metrics.growthRate >= 0 ? '+' : ''}{metrics.growthRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Month-over-month</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <UsersIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Customers</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {metrics.estimatedCustomers}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Estimated active</p>
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dashboardData.trends.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatCompactCurrency(value)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* SaaS Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">ARPA</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(metrics.avgRevenuePerCustomer)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Average Revenue Per Account</p>
            </div>

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">CAC</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(metrics.customerAcquisitionCost)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Customer Acquisition Cost</p>
            </div>

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">LTV</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(metrics.ltv)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Customer Lifetime Value</p>
            </div>

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">LTV:CAC Ratio</h3>
              <p className={`text-2xl font-bold ${metrics.ltvCacRatio >= 3 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                {metrics.ltvCacRatio.toFixed(1)}:1
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {metrics.ltvCacRatio >= 3 ? '✅ Healthy' : '⚠️ Needs improvement'}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Quick Ratio</h3>
              <p className={`text-2xl font-bold ${metrics.quickRatio >= 4 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                {metrics.quickRatio.toFixed(1)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {metrics.quickRatio >= 4 ? '✅ Excellent' : '⚠️ Target: 4+'}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">CAC Payback</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(metrics.customerAcquisitionCost / metrics.avgRevenuePerCustomer).toFixed(1)} mo
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Months to recover CAC</p>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">💡 Revenue Insights</h2>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {metrics.arr > 1000000 && (
                <li>🎉 Congratulations! You've crossed $1M ARR - a major milestone for SaaS startups.</li>
              )}
              {metrics.growthRate > 20 && (
                <li>📈 Strong growth rate of {metrics.growthRate.toFixed(1)}% MoM. This is exceptional for early-stage startups.</li>
              )}
              {metrics.ltvCacRatio >= 3 && (
                <li>✅ Your LTV:CAC ratio of {metrics.ltvCacRatio.toFixed(1)}:1 is healthy. Industry best practice is 3:1 or higher.</li>
              )}
              {metrics.ltvCacRatio < 3 && (
                <li>⚠️ LTV:CAC ratio is below 3:1. Focus on reducing acquisition costs or increasing customer lifetime value.</li>
              )}
              {metrics.quickRatio < 4 && (
                <li>💡 Quick ratio is {metrics.quickRatio.toFixed(1)}. Target 4+ by reducing churn and increasing expansion revenue.</li>
              )}
              {metrics.mrr < 10000 && (
                <li>🚀 Focus on reaching $10k MRR as your first major milestone. You're currently at {formatCompactCurrency(metrics.mrr)}.</li>
              )}
              {metrics.growthRate < 0 && (
                <li>⚠️ Revenue is declining. Review your product-market fit, pricing, and customer success strategies.</li>
              )}
            </ul>
          </div>

          {/* Integration Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">💳 Connect Payment Processors</h3>
            <p className="text-sm text-blue-800 dark:text-blue-400 mb-3">
              Get more accurate revenue metrics by connecting Stripe, PayPal, or other payment processors.
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors">
              Connect Stripe (Coming Soon)
            </button>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

