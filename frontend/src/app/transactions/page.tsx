'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, Transaction, BankAccount } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { BentoCard, BentoGrid } from '@/components/ui/BentoCard';
import {
  Search,
  ArrowUp,
  ArrowDown,
  X,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import BlurIn from '@/components/ui/blur-in';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

type SortConfig = {
  key: keyof Transaction;
  direction: 'ascending' | 'descending';
};

const COLORS = ['#10b981', '#ef4444', '#8b5cf6', '#3b82f6', '#f59e0b'];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    accountId: '',
    limit: 15,
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'date',
    direction: 'descending',
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        limit: filters.limit,
        offset: (currentPage - 1) * filters.limit,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.accountId && { accountId: filters.accountId }),
      };
      
      const response = await apiClient.transactions.list(params);
      if (response.success && response.data) {
        setTransactions(response.data);
        const pagination = response.pagination || { total: response.data.length };
        setTotalCount(pagination.total || 0);
        setTotalPages(Math.ceil((pagination.total || 0) / filters.limit));
      } else {
        setError(response.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    filters.limit,
    filters.startDate,
    filters.endDate,
    filters.accountId,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const accRes = await apiClient.accounts.list();
        if (accRes.success && accRes.data) {
          setAccounts(accRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch filter data:', err);
      }
    };
    fetchDropdownData();
  }, []);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const requestSort = (key: keyof Transaction) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === 'ascending'
          ? 'descending'
          : 'ascending',
    }));
    setCurrentPage(1);
  };
  
  const clearFilters = () => {
    setFilters({ search: '', startDate: '', endDate: '', accountId: '', limit: 15 });
    setSortConfig({ key: 'date', direction: 'descending' });
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  // Calculate stats
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netCashflow = totalIncome - totalExpenses;
  const avgTransaction = transactions.length > 0 ? transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length : 0;

  // Type distribution
  const typeDistribution = transactions.reduce((acc, t) => {
    const type = t.type || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(typeDistribution).map(([name, value]) => ({ name, value }));

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <BlurIn>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                  <Receipt className="h-10 w-10 text-green-400" />
                  Transactions
                </h1>
              </BlurIn>
              <p className="text-gray-400 mt-2 text-lg">
                View and manage all your financial transactions
              </p>
            </div>
          </div>

          {/* Stats Bento Grid */}
          <BentoGrid>
            {/* Total Income */}
            <BentoCard className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1 group" glow>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-2">Total Income</p>
                <h3 className="text-3xl font-bold text-white mb-1">${totalIncome.toLocaleString()}</h3>
                <p className="text-xs text-gray-500">All time</p>
              </div>
            </BentoCard>

            {/* Total Expenses */}
            <BentoCard className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1 group" glow>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-2">Total Expenses</p>
                <h3 className="text-3xl font-bold text-white mb-1">${totalExpenses.toLocaleString()}</h3>
                <p className="text-xs text-gray-500">All time</p>
              </div>
            </BentoCard>

            {/* Net Cashflow */}
            <BentoCard className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1 group" glow>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center",
                    netCashflow >= 0 
                      ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
                      : "bg-gradient-to-br from-orange-500/20 to-red-500/20"
                  )}>
                    <DollarSign className={cn(
                      "h-6 w-6",
                      netCashflow >= 0 ? "text-blue-400" : "text-orange-400"
                    )} />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-2">Net Cashflow</p>
                <h3 className={cn(
                  "text-3xl font-bold mb-1",
                  netCashflow >= 0 ? "text-blue-400" : "text-orange-400"
                )}>
                  ${netCashflow.toLocaleString()}
                </h3>
                <p className="text-xs text-gray-500">All time</p>
              </div>
            </BentoCard>

            {/* Average Transaction */}
            <BentoCard className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1 group" glow>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-2">Avg Transaction</p>
                <h3 className="text-3xl font-bold text-white mb-1">${avgTransaction.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                <p className="text-xs text-gray-500">{transactions.length} total</p>
              </div>
            </BentoCard>

            {/* Type Distribution Chart */}
            {pieData.length > 0 && (
              <BentoCard className="col-span-12 lg:col-span-4 row-span-2" gradient>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Transaction Types</h3>
                    <p className="text-sm text-gray-400 mt-1">Distribution by category</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </BentoCard>
            )}

            {/* Filters */}
            <BentoCard className="col-span-12 lg:col-span-8 row-span-2" gradient>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Filters & Search</h3>
                <p className="text-sm text-gray-400">Refine your transaction list</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by description..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-white/10 rounded-xl bg-black/40 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <select 
                  value={filters.accountId} 
                  onChange={e => handleFilterChange('accountId', e.target.value)} 
                  className="w-full border border-white/10 rounded-xl bg-black/40 text-white py-3 px-4 focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">All Accounts</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.accountName}</option>)}
                </select>
                <input 
                  type="date" 
                  value={filters.startDate} 
                  onChange={e => handleFilterChange('startDate', e.target.value)} 
                  className="w-full border border-white/10 rounded-xl bg-black/40 text-white py-3 px-4 focus:outline-none focus:border-purple-500/50"
                  placeholder="Start date"
                />
                <input 
                  type="date" 
                  value={filters.endDate} 
                  onChange={e => handleFilterChange('endDate', e.target.value)} 
                  className="w-full border border-white/10 rounded-xl bg-black/40 text-white py-3 px-4 focus:outline-none focus:border-purple-500/50"
                  placeholder="End date"
                />
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-400">{totalCount.toLocaleString()} results</p>
                <button 
                  onClick={clearFilters} 
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <X className="h-4 w-4" /> Clear Filters
                </button>
              </div>
            </BentoCard>

            {/* Transactions Table */}
            <BentoCard className="col-span-12 row-span-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Transaction History</h3>
                  <p className="text-sm text-gray-400 mt-1">All your financial activity</p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-black/40">
                    <tr>
                      {[
                        { key: 'date', label: 'Date' },
                        { key: 'description', label: 'Description' },
                        { key: 'account', label: 'Account' },
                        { key: 'type', label: 'Type' },
                        { key: 'amount', label: 'Amount' }
                      ].map(({ key, label }) => (
                        <th 
                          key={key} 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                        >
                          <button 
                            onClick={() => requestSort(key as keyof Transaction)} 
                            className="flex items-center gap-1 hover:text-white transition-colors"
                          >
                            {label}
                            {sortConfig.key === key && (
                              sortConfig.direction === 'ascending' ? 
                              <ArrowUp className="h-3 w-3" /> : 
                              <ArrowDown className="h-3 w-3" />
                            )}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-red-400">{error}</td>
                      </tr>
                    ) : transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white max-w-xs truncate">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {transaction.account?.accountName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              {transaction.type}
                            </span>
                          </td>
                          <td className={cn(
                            "px-6 py-4 whitespace-nowrap text-sm font-bold",
                            transaction.amount < 0 ? 'text-red-400' : 'text-green-400'
                          )}>
                            {formatCurrency(transaction.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-16">
                          <FileSearch className="mx-auto h-12 w-12 text-gray-600 opacity-50" />
                          <h3 className="mt-2 text-sm font-medium text-white">No Transactions Found</h3>
                          <p className="mt-1 text-sm text-gray-400">Try adjusting your filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="p-4 flex items-center justify-between border-t border-white/10 mt-4">
                  <p className="text-sm text-gray-400">
                    Page <span className="font-medium text-white">{currentPage}</span> of <span className="font-medium text-white">{totalPages}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => p - 1)} 
                      disabled={currentPage === 1} 
                      className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-400" />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => p + 1)} 
                      disabled={currentPage === totalPages} 
                      className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
            </BentoCard>
          </BentoGrid>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
