'use client';

import { useState, useEffect } from 'react';
import { api, DashboardSummary } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { 
  BellAlertIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: string;
  title: string;
  message: string;
  action?: string;
  timestamp: Date;
  resolved: boolean;
}

export default function AlertsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.cfo.dashboard(30);
      
      if (response.success && response.data) {
        setDashboardData(response.data);
        generateAlerts(response.data);
      } else {
        toast.error(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (data: DashboardSummary) => {
    const newAlerts: Alert[] = [];
    const runwayMonths = data.cashFlow.runway / 30;
    const monthlyBurn = data.cashFlow.burnRate * 30;
    const netCashFlow = data.cashFlow.netCashFlow;

    // Critical: Low runway
    if (runwayMonths < 3 && runwayMonths > 0) {
      newAlerts.push({
        id: 'runway-critical',
        type: 'critical',
        category: 'Runway',
        title: '🚨 Critical: Runway Below 3 Months',
        message: `Your current runway is ${runwayMonths.toFixed(1)} months. Immediate action required to extend runway or secure funding.`,
        action: `Reduce monthly burn by $${(monthlyBurn * 0.3).toLocaleString()} or secure funding within 60 days.`,
        timestamp: new Date(),
        resolved: false,
      });
    } else if (runwayMonths < 6 && runwayMonths >= 3) {
      newAlerts.push({
        id: 'runway-warning',
        type: 'warning',
        category: 'Runway',
        title: '⚠️ Warning: Runway Below 6 Months',
        message: `Your runway is ${runwayMonths.toFixed(1)} months. Consider initiating fundraising conversations or optimizing costs.`,
        action: `Start fundraising process or identify $${(monthlyBurn * 0.15).toLocaleString()}/month in cost savings.`,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Negative cash flow
    if (netCashFlow < 0) {
      newAlerts.push({
        id: 'cashflow-negative',
        type: netCashFlow < -50000 ? 'critical' : 'warning',
        category: 'Cash Flow',
        title: netCashFlow < -50000 ? '🚨 Critical: Large Negative Cash Flow' : '⚠️ Negative Cash Flow',
        message: `Net cash flow is $${netCashFlow.toLocaleString()} for the last 30 days. ${netCashFlow < -50000 ? 'This is unsustainable.' : 'Monitor closely.'}`,
        action: 'Review expense categories and identify optimization opportunities.',
        timestamp: new Date(),
        resolved: false,
      });
    }

    // High burn rate
    if (monthlyBurn > 50000) {
      newAlerts.push({
        id: 'burn-high',
        type: monthlyBurn > 100000 ? 'warning' : 'info',
        category: 'Burn Rate',
        title: monthlyBurn > 100000 ? '⚠️ High Burn Rate Detected' : 'ℹ️ Elevated Burn Rate',
        message: `Monthly burn rate is $${monthlyBurn.toLocaleString()}. Ensure this aligns with growth targets.`,
        action: 'Review largest expense categories for optimization opportunities.',
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Low balance
    if (data.balance.total < monthlyBurn * 2) {
      newAlerts.push({
        id: 'balance-low',
        type: 'critical',
        category: 'Balance',
        title: '🚨 Critical: Balance Below 2 Months of Expenses',
        message: `Current balance ($${data.balance.total.toLocaleString()}) is less than 2 months of operating expenses.`,
        action: 'Secure emergency funding or implement immediate cost reductions.',
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Top spending category alert
    const topCategory = data.categories.breakdown[0];
    if (topCategory && topCategory.expenses > monthlyBurn * 0.4) {
      newAlerts.push({
        id: 'category-high',
        type: 'info',
        category: 'Spending',
        title: `ℹ️ High Spending in ${topCategory.name}`,
        message: `${topCategory.name} accounts for ${((topCategory.expenses / data.cashFlow.expenses) * 100).toFixed(1)}% of total expenses.`,
        action: 'Review if this spending aligns with strategic priorities.',
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Positive alerts
    if (netCashFlow > 0 && runwayMonths > 12) {
      newAlerts.push({
        id: 'health-good',
        type: 'success',
        category: 'Financial Health',
        title: '✅ Strong Financial Position',
        message: `Positive cash flow and ${runwayMonths.toFixed(1)} months runway. Well positioned for growth.`,
        action: 'Consider strategic investments to accelerate growth.',
        timestamp: new Date(),
        resolved: false,
      });
    }

    setAlerts(newAlerts);
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-900/10';
      case 'success':
        return 'border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10';
      default:
        return 'border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10';
    }
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

  if (!dashboardData) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="text-center py-12">
            <BellAlertIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Data Available</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Connect your bank account to receive intelligent alerts.
            </p>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const warningAlerts = alerts.filter(a => a.type === 'warning');
  const infoAlerts = alerts.filter(a => a.type === 'info' || a.type === 'success');

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Alerts & Notifications</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Real-time financial alerts and proactive recommendations.
            </p>
          </div>

          {/* Alert Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <FireIcon className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Critical</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalAlerts.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warningAlerts.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <InformationCircleIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Info</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{infoAlerts.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-8 w-8 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Just now</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts List */}
          {alerts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-12 text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Clear!</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No active alerts at this time. Your financial health looks good.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`border rounded-lg p-6 ${getAlertColor(alert.type)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {alert.title}
                        </h3>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {alert.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {alert.message}
                      </p>
                      {alert.action && (
                        <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            💡 Recommended Action:
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {alert.action}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alert Settings */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alert Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Runway Alerts</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when runway drops below 6 months</p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">High Burn Rate Warnings</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Alert when burn rate exceeds $50k/month</p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Cash Flow Alerts</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Notify on negative cash flow trends</p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Daily Digest</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive daily summary of financial alerts</p>
                </div>
                <input 
                  type="checkbox" 
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

