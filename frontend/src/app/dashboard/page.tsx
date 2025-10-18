'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { usePermissions } from '@/hooks/usePermissions';
import { apiClient, DashboardSummary, RecentActivity, BankAccount, Product, CashflowChartData } from '@/lib/api';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { BentoCard, BentoGrid } from '@/components/ui/BentoCard';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  AlertCircle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  ShoppingCart,
  Building2,
  Sparkles,
  Activity,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BlurIn from '@/components/ui/blur-in';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AddTransactionModal from '@/components/dashboard/AddTransactionModal';
import SimulateSaleModal from '@/components/dashboard/SimulateSaleModal';
import AddProductModal from '@/components/dashboard/AddProductModal';
import CreateAccountModal from '@/components/dashboard/CreateAccountModal';
import RecentTransactionsTable from '@/components/dashboard/RecentTransactionsTable';
import toast from 'react-hot-toast';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const hasAccounts = accounts.length > 0;
  const hasProducts = products.length > 0;

  // Prepare chart data
  const chartData = cashflowData.map(item => ({
    month: new Date(item.date + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    income: item.income,
    expenses: item.expenses,
    net: item.netCashflow
  }));

  // Runway data
  const runwayData = Array.from({ length: Math.min((summary?.financial.runwayMonths || 12), 12) }, (_, i) => ({
    month: `M${i + 1}`,
    balance: Math.max(0, (summary?.financial.totalBalance || 0) - ((summary?.financial.monthlyBurn || 0) * i))
  }));

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <BlurIn>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Welcome back, {user?.firstName || user?.email}! 👋
                </h1>
              </BlurIn>
              <p className="text-muted-foreground mt-2 text-lg">
                {user?.startup?.name || 'Your Startup'} • {user?.roles?.join(', ') || 'User'}
              </p>
            </div>
            <div className="flex gap-2">
              {can('read', 'analytics') && (
                <Button
                  onClick={() => router.push('/ai-copilot')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  size="sm"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Copilot
                </Button>
              )}
              <Button
                onClick={() => setIsCreateAccountOpen(true)}
                variant="outline"
                size="sm"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Add Account
              </Button>
              <Button
                onClick={() => setIsAddProductOpen(true)}
                variant="outline"
                size="sm"
              >
                <Package className="h-4 w-4 mr-2" />
                Add Product
              </Button>
              <Button
                onClick={() => setIsAddTransactionOpen(true)}
                disabled={!hasAccounts}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </div>

          {/* Onboarding Alert */}
          {(!hasAccounts || !hasProducts) && (
            <BentoCard gradient className="border-blue-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-400">Get Started</h3>
                  <p className="text-sm text-gray-300 mt-1">
                    {!hasAccounts && !hasProducts && 'Create a bank account and add products to start simulating your financial data.'}
                    {!hasAccounts && hasProducts && 'Create a bank account to start adding transactions.'}
                    {hasAccounts && !hasProducts && 'Add products to simulate sales and revenue.'}
                  </p>
                </div>
              </div>
            </BentoCard>
          )}

          {/* Bento Grid Layout */}
          <BentoGrid>
            {/* Total Balance - Large */}
            <BentoCard className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1 group" glow>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-400" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <p className="text-sm text-gray-400 mb-2">Total Balance</p>
                <h3 className="text-3xl font-bold text-white mb-1">
                  ${summary?.financial.totalBalance.toLocaleString() || '0'}
                </h3>
                <p className="text-xs text-gray-500">
                  Across {summary?.accounts || 0} account{summary?.accounts !== 1 ? 's' : ''}
                </p>
              </div>
            </BentoCard>

            {/* Monthly Burn Rate */}
            <BentoCard className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1 group" glow>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-400" />
                  </div>
                  <Activity className="h-5 w-5 text-red-400" />
                </div>
                <p className="text-sm text-gray-400 mb-2">Monthly Burn</p>
                <h3 className="text-3xl font-bold text-white mb-1">
                  ${summary?.financial.monthlyBurn.toLocaleString() || '0'}
                </h3>
                <p className="text-xs text-gray-500">Last 3 months average</p>
              </div>
            </BentoCard>

            {/* Runway */}
            <BentoCard className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1 group" glow>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-400" />
                  </div>
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <p className="text-sm text-gray-400 mb-2">Runway</p>
                <h3 className="text-3xl font-bold text-white mb-1">
                  {summary?.financial.runwayMonths 
                    ? `${summary.financial.runwayMonths}mo`
                    : '∞'}
                </h3>
                <p className="text-xs text-gray-500">Based on current burn</p>
              </div>
            </BentoCard>

            {/* Monthly Revenue */}
            <BentoCard className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1 group" glow>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-purple-400" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
                <p className="text-sm text-gray-400 mb-2">Monthly Revenue</p>
                <h3 className="text-3xl font-bold text-white mb-1">
                  ${summary?.financial.monthlyRevenue.toLocaleString() || '0'}
                </h3>
                <p className="text-xs text-gray-500">Last 3 months average</p>
              </div>
            </BentoCard>

            {/* Cashflow Chart - Large */}
            <BentoCard className="col-span-12 lg:col-span-8 row-span-2" gradient>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Cashflow Overview</h3>
                  <p className="text-sm text-gray-400 mt-1">6-month income vs expenses trend</p>
                </div>
                <BarChart3 className="h-6 w-6 text-purple-400" />
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      stroke="#4b5563"
                    />
                    <YAxis 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      stroke="#4b5563"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        backdropFilter: 'blur(10px)'
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fill="url(#incomeGradient)"
                      name="Income"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      fill="url(#expensesGradient)"
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No data available yet</p>
                  </div>
                </div>
              )}
            </BentoCard>

            {/* Runway Forecast */}
            <BentoCard className="col-span-12 lg:col-span-4 row-span-2" gradient>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">Runway Forecast</h3>
                <p className="text-sm text-gray-400 mt-1">Cash depletion timeline</p>
              </div>
              {runwayData.length > 0 && summary && summary.financial.monthlyBurn > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={runwayData}>
                    <defs>
                      <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      stroke="#4b5563"
                    />
                    <YAxis 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      stroke="#4b5563"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        backdropFilter: 'blur(10px)'
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-gray-500">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Insufficient data</p>
                  </div>
                </div>
              )}
            </BentoCard>

            {/* Inventory Summary */}
            <BentoCard className="col-span-12 md:col-span-6 lg:col-span-4 row-span-1" gradient>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Inventory</h3>
                  <p className="text-xs text-gray-400">Product management</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-white">{summary?.inventory.totalProducts || 0}</p>
                  <p className="text-xs text-gray-400">Total Products</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">${summary?.inventory.totalInventoryValue.toLocaleString() || '0'}</p>
                  <p className="text-xs text-gray-400">Total Value</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Low Stock Items</span>
                  <span className={cn(
                    "font-bold text-xl",
                    (summary?.inventory.lowStockProducts || 0) > 0 ? "text-red-400" : "text-green-400"
                  )}>
                    {summary?.inventory.lowStockProducts || 0}
                  </span>
                </div>
              </div>
            </BentoCard>

            {/* Sales Summary */}
            <BentoCard className="col-span-12 md:col-span-6 lg:col-span-4 row-span-1" gradient>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Sales (30 Days)</h3>
                  <p className="text-xs text-gray-400">Recent performance</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-white">${summary?.sales.totalSales30Days.toLocaleString() || '0'}</p>
                  <p className="text-xs text-gray-400">Total Sales</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{summary?.sales.unitsSold30Days || 0}</p>
                  <p className="text-xs text-gray-400">Units Sold</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Transactions</span>
                  <span className="font-bold text-xl text-purple-400">
                    {summary?.sales.salesCount || 0}
                  </span>
                </div>
              </div>
            </BentoCard>

            {/* Cashflow Summary */}
            <BentoCard className="col-span-12 md:col-span-12 lg:col-span-4 row-span-1" gradient>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Cashflow Summary</h3>
                  <p className="text-xs text-gray-400">Income vs Expenses</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-300">Income</span>
                  </div>
                  <span className="font-bold text-green-400">
                    ${summary?.financial.income.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-gray-300">Expenses</span>
                  </div>
                  <span className="font-bold text-red-400">
                    ${summary?.financial.expenses.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-sm font-medium text-gray-300">Net Cashflow</span>
                  <span className={cn(
                    "font-bold text-xl",
                    (summary?.financial.netCashflow || 0) >= 0 ? "text-blue-400" : "text-orange-400"
                  )}>
                    ${summary?.financial.netCashflow.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </BentoCard>

            {/* Recent Activity */}
            <BentoCard className="col-span-12 row-span-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Recent Activity</h3>
                  <p className="text-sm text-gray-400 mt-1">Latest transactions and events</p>
                </div>
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                  View All →
                </Button>
              </div>
              <RecentTransactionsTable 
                activities={recentActivity}
                onRefresh={handleDataUpdate}
              />
            </BentoCard>
          </BentoGrid>

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
