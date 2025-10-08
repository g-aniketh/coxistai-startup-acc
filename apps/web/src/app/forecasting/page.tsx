'use client';

import { useState, useEffect } from 'react';
import { api, DashboardSummary } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { 
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';

interface ForecastScenario {
  name: string;
  revenueChange: number; // percentage change
  expenseChange: number; // percentage change
  oneTimeRevenue?: number;
  oneTimeExpense?: number;
}

export default function ForecastingPage() {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<string>('baseline');
  const [customScenario, setCustomScenario] = useState<ForecastScenario>({
    name: 'Custom',
    revenueChange: 0,
    expenseChange: 0,
    oneTimeRevenue: 0,
    oneTimeExpense: 0,
  });

  const scenarios: Record<string, ForecastScenario> = {
    baseline: { name: 'Baseline', revenueChange: 0, expenseChange: 0 },
    growth: { name: 'High Growth', revenueChange: 50, expenseChange: 20 },
    conservative: { name: 'Conservative', revenueChange: -10, expenseChange: -20 },
    expansion: { name: 'Expansion', revenueChange: 30, expenseChange: 40, oneTimeExpense: 50000 },
    fundraise: { name: 'Post-Fundraise', revenueChange: 0, expenseChange: 0, oneTimeRevenue: 500000 },
    custom: customScenario,
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.cfo.dashboard(90); // Get 90 days of data
      
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

  const generateForecast = (scenario: ForecastScenario, months: number = 12) => {
    if (!dashboardData) return [];

    const currentBalance = dashboardData.balance.total;
    const avgMonthlyIncome = dashboardData.cashFlow.income * (30 / dashboardData.period.days);
    const avgMonthlyExpense = dashboardData.cashFlow.expenses * (30 / dashboardData.period.days);

    const forecast = [];
    let balance = currentBalance;

    for (let i = 0; i <= months; i++) {
      const monthIncome = avgMonthlyIncome * (1 + scenario.revenueChange / 100);
      const monthExpense = avgMonthlyExpense * (1 + scenario.expenseChange / 100);
      
      // Add one-time items in month 1
      const oneTimeRevenue = i === 1 ? (scenario.oneTimeRevenue || 0) : 0;
      const oneTimeExpense = i === 1 ? (scenario.oneTimeExpense || 0) : 0;
      
      const netCashFlow = monthIncome + oneTimeRevenue - monthExpense - oneTimeExpense;
      balance += netCashFlow;

      forecast.push({
        month: i === 0 ? 'Now' : `Month ${i}`,
        balance: Math.round(balance),
        income: Math.round(monthIncome + oneTimeRevenue),
        expenses: Math.round(monthExpense + oneTimeExpense),
        netCashFlow: Math.round(netCashFlow),
      });
    }

    return forecast;
  };

  const currentScenario = scenarios[selectedScenario];
  const forecastData = generateForecast(currentScenario);
  const finalBalance = forecastData[forecastData.length - 1]?.balance || 0;
  const monthsUntilRunout = forecastData.findIndex(d => d.balance <= 0);
  const runwayMonths = monthsUntilRunout === -1 ? '>12' : monthsUntilRunout;

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

  if (!dashboardData) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="text-center py-12">
            <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Data Available</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Connect your bank account to see AI-powered forecasts.
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Financial Forecasting</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Simulate "what-if" scenarios to plan your startup's financial future.
            </p>
          </div>

          {/* Scenario Selector */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Scenario</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(scenarios).map(([key, scenario]) => (
                <button
                  key={key}
                  onClick={() => setSelectedScenario(key)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedScenario === key
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <p className="font-medium text-gray-900 dark:text-white">{scenario.name}</p>
                  {key !== 'baseline' && key !== 'custom' && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <p>Revenue: {scenario.revenueChange > 0 ? '+' : ''}{scenario.revenueChange}%</p>
                      <p>Expenses: {scenario.expenseChange > 0 ? '+' : ''}{scenario.expenseChange}%</p>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Scenario Inputs */}
            {selectedScenario === 'custom' && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Customize Your Scenario</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Revenue Change (%)
                    </label>
                    <input
                      type="number"
                      value={customScenario.revenueChange}
                      onChange={(e) => setCustomScenario({ ...customScenario, revenueChange: Number(e.target.value) })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expense Change (%)
                    </label>
                    <input
                      type="number"
                      value={customScenario.expenseChange}
                      onChange={(e) => setCustomScenario({ ...customScenario, expenseChange: Number(e.target.value) })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      One-Time Revenue ($)
                    </label>
                    <input
                      type="number"
                      value={customScenario.oneTimeRevenue}
                      onChange={(e) => setCustomScenario({ ...customScenario, oneTimeRevenue: Number(e.target.value) })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      One-Time Expense ($)
                    </label>
                    <input
                      type="number"
                      value={customScenario.oneTimeExpense}
                      onChange={(e) => setCustomScenario({ ...customScenario, oneTimeExpense: Number(e.target.value) })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Forecast Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-500" />
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Projected Balance (12mo)</h3>
              </div>
              <p className={`text-3xl font-bold ${finalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCompactCurrency(finalBalance)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {finalBalance > dashboardData.balance.total ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <ArrowTrendingUpIcon className="h-3 w-3" />
                    Growing
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <ArrowTrendingDownIcon className="h-3 w-3" />
                    Declining
                  </span>
                )}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <CalendarIcon className="h-6 w-6 text-amber-500" />
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Runway</h3>
              </div>
              <p className={`text-3xl font-bold ${typeof runwayMonths === 'number' && runwayMonths < 6 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {runwayMonths} months
              </p>
              {typeof runwayMonths === 'number' && runwayMonths < 6 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ Low runway warning</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <ChartBarIcon className="h-6 w-6 text-green-500" />
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Monthly Growth</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {currentScenario.revenueChange > 0 ? '+' : ''}{currentScenario.revenueChange}%
              </p>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">12-Month Forecast</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatCompactCurrency(value)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Legend />
                <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={3} name="Balance" />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Insights</h2>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {finalBalance < 0 && (
                <li>🚨 Warning: This scenario leads to running out of cash. Consider cost reduction or fundraising.</li>
              )}
              {typeof runwayMonths === 'number' && runwayMonths < 6 && (
                <li>⚠️ Low runway detected. Start fundraising conversations now or cut burn rate by {Math.round(currentScenario.expenseChange - 30)}%.</li>
              )}
              {currentScenario.revenueChange > 30 && (
                <li>📈 Aggressive growth scenario. Ensure you have the team and infrastructure to support this growth.</li>
              )}
              {finalBalance > dashboardData.balance.total * 2 && (
                <li>✅ Strong financial position projected. Consider strategic investments or hiring to accelerate growth.</li>
              )}
              {currentScenario.oneTimeRevenue && currentScenario.oneTimeRevenue > 100000 && (
                <li>💰 Large funding injection will significantly extend runway. Plan deployment carefully.</li>
              )}
            </ul>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

