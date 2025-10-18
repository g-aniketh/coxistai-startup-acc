'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { usePermissions } from '@/hooks/usePermissions';
import { apiClient, DashboardSummary, RecentActivity, BankAccount, Product, CashflowChartData } from '@/lib/api';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Calendar, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Building2,
  Sparkles,
  Wallet,
  Receipt,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MetricCard } from '@/components/ui/MetricCard';
import AddTransactionModal from '@/components/dashboard/AddTransactionModal';
import SimulateSaleModal from '@/components/dashboard/SimulateSaleModal';
import AddProductModal from '@/components/dashboard/AddProductModal';
import CreateAccountModal from '@/components/dashboard/CreateAccountModal';
import RecentTransactionsTable from '@/components/dashboard/RecentTransactionsTable';
import toast from 'react-hot-toast';
import { format, subMonths } from 'date-fns';

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const numberFormatter = new Intl.NumberFormat('en-US');

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { can } = usePermissions();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cashflowData, setCashflowData] = useState<CashflowChartData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isSimulateSaleOpen, setIsSimulateSaleOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, cashflowRes, activityRes, accountsRes, productsRes] = await Promise.all([
        apiClient.dashboard.summary(),
        apiClient.dashboard.cashflowChart(6),
        apiClient.dashboard.recentActivity(10),
        apiClient.accounts.list(),
        apiClient.inventory.products.list(),
      ]);

      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      if (cashflowRes.success && cashflowRes.data) setCashflowData(cashflowRes.data);
      if (activityRes.success && activityRes.data) setRecentActivity(activityRes.data);
      if (accountsRes.success && accountsRes.data) setAccounts(accountsRes.data);
      if (productsRes.success && productsRes.data) setProducts(productsRes.data);
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

  const handleDataUpdate = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  const hasAccounts = accounts.length > 0;
  const hasProducts = products.length > 0;

  // Prepare chart data
  const chartData = cashflowData.map(item => ({
    month: format(new Date(item.date), 'MMM yy'),
    Income: item.income,
    Expenses: item.expenses,
  }));

  const netCashflowChange = summary ? summary.financial.netCashflow : 0;
  const monthlyRevenueChange = summary ? summary.financial.monthlyRevenue : 0;
  
  const endDate = new Date();
  const startDate = subMonths(endDate, 1);

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Showing data for {format(startDate, 'LLL dd, yyyy')} - {format(endDate, 'LLL dd, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </Button>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Balance"
              value={currencyFormatter.format(summary?.financial.totalBalance || 0)}
              change={summary?.financial.netCashflow! >= 0 ? '↑' : '↓' + currencyFormatter.format(Math.abs(summary?.financial.netCashflow || 0))}
              changeType={summary?.financial.netCashflow! >= 0 ? "positive" : "negative"}
              icon={<Wallet className="h-4 w-4" />}
            />
            <MetricCard
              title="Monthly Revenue"
              value={currencyFormatter.format(summary?.financial.monthlyRevenue || 0)}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <MetricCard
              title="Monthly Burn"
              value={currencyFormatter.format(summary?.financial.monthlyBurn || 0)}
              icon={<TrendingDown className="h-4 w-4" />}
            />
            <MetricCard
              title="Runway"
              value={summary?.financial.runwayMonths ? `${summary.financial.runwayMonths.toFixed(1)} months` : 'N/A'}
              icon={<Calendar className="h-4 w-4" />}
            />
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 md:gap-6">
            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle>Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => currencyFormatter.format(value)} />
                    <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="Income" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                    <Area type="monotone" dataKey="Expenses" stackId="1" stroke="#ffc658" fill="#ffc658" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentTransactionsTable activities={recentActivity} />
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {can('read', 'CFO') && (
              <Button
                onClick={() => router.push('/ai-copilot')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Copilot
              </Button>
            )}
            {can('manage', 'Account') &&
              <Button onClick={() => setIsCreateAccountOpen(true)} variant="outline" size="sm">
                <Building2 className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            }
             {can('manage', 'Inventory') &&
              <Button onClick={() => setIsAddProductOpen(true)} variant="outline" size="sm">
                <Package className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            }
             {can('manage', 'Transaction') &&
              <Button onClick={() => setIsAddTransactionOpen(true)} disabled={!hasAccounts} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            }
          </div>

          {/* Modals */}
          <CreateAccountModal
            isOpen={isCreateAccountOpen}
            onClose={() => setIsCreateAccountOpen(false)}
            onSuccess={handleDataUpdate}
          />

          <AddProductModal
            isOpen={isAddProductOpen}
            onClose={() => setIsAddProductOpen(false)}
            onSuccess={handleDataUpdate}
          />

          <AddTransactionModal
            isOpen={isAddTransactionOpen}
            onClose={() => setIsAddTransactionOpen(false)}
            onSuccess={handleDataUpdate}
            accounts={accounts}
          />

          <SimulateSaleModal
            isOpen={isSimulateSaleOpen}
            onClose={() => setIsSimulateSaleOpen(false)}
            onSuccess={handleDataUpdate}
            accounts={accounts}
            products={products}
          />
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
