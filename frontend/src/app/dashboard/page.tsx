'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/dashboard/StatCard';
import UserChart from '@/components/dashboard/UserChart';
import ProfitChart from '@/components/dashboard/ProfitChart';
import RecentSales from '@/components/dashboard/RecentSales';
import LastOrders from '@/components/dashboard/LastOrders';
import { DollarSign, Percent, Search, Wallet, TrendingUp, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { apiClient, DashboardSummary, CashflowChartData, RecentActivity } from '@/lib/api';
import toast from 'react-hot-toast';

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cashflowData, setCashflowData] = useState<CashflowChartData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, cashflowRes, activityRes] = await Promise.all([
        apiClient.dashboard.summary(),
        apiClient.dashboard.cashflowChart(6),
        apiClient.dashboard.recentActivity(10),
      ]);

      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      if (cashflowRes.success && cashflowRes.data) setCashflowData(cashflowRes.data);
      if (activityRes.success && activityRes.data) setRecentActivity(activityRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Prepare chart data for StatCards
  const balanceChartData = cashflowData.map(item => ({ value: item.income }));
  const revenueChartData = cashflowData.map(item => ({ value: item.income }));
  
  // Calculate growth percentages
  const balanceGrowth = summary ? ((summary.financial.netCashflow / summary.financial.totalBalance) * 100) : 0;
  const revenueGrowth = summary ? ((summary.financial.monthlyRevenue / (summary.financial.monthlyRevenue - summary.financial.netCashflow)) * 100) : 0;

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading AI CFO Dashboard...</p>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }
  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="h-screen flex">
          {/* Section 2: Main Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">AI CFO Dashboard</h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Real-time Financial Health & Cashflow Insights
                  </p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search transactions, insights..." className="pl-10 bg-white rounded-lg" />
                </div>
              </div>

              {/* Top Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Balance"
                  value={summary ? currencyFormatter.format(summary.financial.totalBalance) : '$0'}
                  percentageChange={17}
                  chartData={balanceChartData}
                  chartColor="#607c47"
                  icon={<DollarSign className="h-5 w-5" />}
                  cardClassName="bg-[#C9E0B0] text-[#3a5129]"
                />
                <StatCard 
                  title="Sales"
                  value={summary ? currencyFormatter.format(summary.financial.monthlyRevenue) : '$0'}
                  percentageChange={23}
                  chartData={revenueChartData}
                  chartColor="#ccab59"
                  icon={<Percent className="h-5 w-5" />}
                  cardClassName="bg-[#F6D97A] text-[#7a6015]"
                />
                <StatCard 
                  title="Runway"
                  value={summary?.financial.runwayMonths ? `${summary.financial.runwayMonths.toFixed(1)} mo` : 'N/A'}
                  icon={<Calendar className="h-5 w-5" />}
                  cardClassName="bg-[#B7B3E6] text-[#2C2C2C]"
                />
              </div>

              {/* Cashflow Chart */}
              <UserChart data={cashflowData} />

              {/* Recent Transactions */}
              <LastOrders activities={recentActivity} />
            </div>
          </div>

          {/* Section 3: Monthly Profits + Recent Activity */}
          <div className="w-[28rem] border-l border-gray-200 overflow-y-auto custom-scrollbar">
            <div className="p-4 space-y-6">
              {/* Revenue Breakdown Chart */}
              <ProfitChart summary={summary} />

              {/* Recent Activity */}
              <RecentSales activities={recentActivity} />
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
