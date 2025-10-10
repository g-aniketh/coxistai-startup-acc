'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { apiClient, DashboardSummary, Transaction, RecentActivity, BankAccount, Product } from '@/lib/api';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
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
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AddTransactionModal from '@/components/dashboard/AddTransactionModal';
import SimulateSaleModal from '@/components/dashboard/SimulateSaleModal';
import AddProductModal from '@/components/dashboard/AddProductModal';
import CreateAccountModal from '@/components/dashboard/CreateAccountModal';
import RecentTransactionsTable from '@/components/dashboard/RecentTransactionsTable';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
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
      const [summaryRes, activityRes, accountsRes, productsRes] = await Promise.all([
        apiClient.dashboard.summary(),
        apiClient.dashboard.recentActivity(10),
        apiClient.accounts.list(),
        apiClient.inventory.products.list(),
      ]);

      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
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

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.firstName || user?.email}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              {user?.startup.name} • {user?.roles.join(', ')}
            </p>
          </div>
          <div className="flex gap-2">
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
            <Button
              onClick={() => setIsSimulateSaleOpen(true)}
              disabled={!hasAccounts || !hasProducts}
              size="sm"
              variant="secondary"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Simulate Sale
            </Button>
          </div>
        </div>

        {/* Onboarding Alert */}
        {(!hasAccounts || !hasProducts) && (
          <Card className="bg-blue-500/10 border-blue-500/20 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-500">Get Started</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {!hasAccounts && !hasProducts && 'Create a bank account and add products to start simulating your financial data.'}
                  {!hasAccounts && hasProducts && 'Create a bank account to start adding transactions.'}
                  {hasAccounts && !hasProducts && 'Add products to simulate sales and revenue.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Balance */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold">
              ${summary?.financial.totalBalance.toLocaleString() || '0'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Across {summary?.accounts || 0} account{summary?.accounts !== 1 ? 's' : ''}
            </p>
          </Card>

          {/* Monthly Burn Rate */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Monthly Burn</p>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold">
              ${summary?.financial.monthlyBurn.toLocaleString() || '0'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Last 3 months average
            </p>
          </Card>

          {/* Runway */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Runway</p>
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold">
              {summary?.financial.runwayMonths 
                ? `${summary.financial.runwayMonths} months`
                : '∞'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Based on current burn rate
            </p>
          </Card>

          {/* Monthly Revenue */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold">
              ${summary?.financial.monthlyRevenue.toLocaleString() || '0'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Last 3 months average
            </p>
          </Card>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Income/Expenses */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Cashflow (Last 3 Months)</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Income</span>
                </div>
                <span className="font-semibold text-green-500">
                  ${summary?.financial.income.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Expenses</span>
                </div>
                <span className="font-semibold text-red-500">
                  ${summary?.financial.expenses.toLocaleString() || '0'}
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Net Cashflow</span>
                  <span className={cn(
                    "font-bold",
                    (summary?.financial.netCashflow || 0) >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    ${summary?.financial.netCashflow.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Inventory */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Inventory</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Products</span>
                <span className="font-semibold">
                  {summary?.inventory.totalProducts || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Value</span>
                <span className="font-semibold">
                  ${summary?.inventory.totalInventoryValue.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Low Stock Items</span>
                <span className={cn(
                  "font-semibold",
                  (summary?.inventory.lowStockProducts || 0) > 0 ? "text-red-500" : "text-green-500"
                )}>
                  {summary?.inventory.lowStockProducts || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* Sales (Last 30 Days) */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Sales (Last 30 Days)</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Sales</span>
                <span className="font-semibold">
                  ${summary?.sales.totalSales30Days.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Units Sold</span>
                <span className="font-semibold">
                  {summary?.sales.unitsSold30Days || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Transactions</span>
                <span className="font-semibold">
                  {summary?.sales.salesCount || 0}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Activity</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <RecentTransactionsTable 
            activities={recentActivity}
            onRefresh={handleDataUpdate}
          />
        </Card>

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
    </AuthGuard>
  );
}
