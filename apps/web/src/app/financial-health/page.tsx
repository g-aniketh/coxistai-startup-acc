'use client';

import { useState, useEffect } from 'react';
import { api, HealthScore } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { 
  HeartIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function FinancialHealthPage() {
  const [healthData, setHealthData] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchHealthScore();
  }, [period]);

  const fetchHealthScore = async () => {
    try {
      setLoading(true);
      const response = await api.cfo.healthScore(period);
      
      if (response.success && response.data) {
        setHealthData(response.data);
      } else {
        toast.error(response.error || 'Failed to fetch health score');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (level: string) => {
    switch (level) {
      case 'Excellent':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'Good':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'Fair':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      default:
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

  if (!healthData) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="text-center py-12">
            <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Health Data Available</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Connect your bank account to see your financial health score.
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Health</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comprehensive overview of your startup's financial wellness.
              </p>
            </div>
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
          </div>

          {/* Overall Score */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border dark:border-gray-700 rounded-lg p-8 text-center">
            <HeartIcon className="mx-auto h-16 w-16 text-indigo-600 dark:text-indigo-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Overall Health Score</h2>
            <div className={`text-6xl font-bold mb-4 ${getScoreColor(healthData.score)}`}>
              {healthData.score}
              <span className="text-3xl">/100</span>
            </div>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${getHealthColor(healthData.healthLevel)}`}>
              {healthData.healthLevel}
            </span>
          </div>

          {/* Score Breakdown */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Score Breakdown</h2>
            <div className="space-y-4">
              {healthData.factors.map((factor) => (
                <div key={factor.name}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{factor.name}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {Math.round(factor.score)} / {factor.max}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        factor.score / factor.max >= 0.8
                          ? 'bg-green-500'
                          : factor.score / factor.max >= 0.6
                          ? 'bg-blue-500'
                          : factor.score / factor.max >= 0.4
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${(factor.score / factor.max) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <ChartBarIcon className="h-8 w-8 text-blue-500 mb-3" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Balance</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(healthData.metrics.totalBalance)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <ChartBarIcon className="h-8 w-8 text-green-500 mb-3" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Cash Flow</h3>
              <p className={`text-2xl font-bold mt-1 ${healthData.metrics.netCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(healthData.metrics.netCashFlow)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <ChartBarIcon className="h-8 w-8 text-amber-500 mb-3" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Daily Burn Rate</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(healthData.metrics.burnRate)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <ChartBarIcon className="h-8 w-8 text-indigo-500 mb-3" />
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Transactions</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {healthData.metrics.transactionCount}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <LightBulbIcon className="h-6 w-6 text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Recommendations</h2>
            </div>
            <ul className="space-y-3">
              {healthData.recommendations.map((recommendation, index) => (
                <li key={index} className="flex gap-3">
                  {healthData.score >= 60 ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

