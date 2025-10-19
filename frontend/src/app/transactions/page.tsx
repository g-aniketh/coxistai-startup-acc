'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, Transaction, BankAccount } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
        ...(filters.accountId && filters.accountId !== 'all' && { accountId: filters.accountId }),
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
        <div className="p-4 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Transactions</h1>
              <p className="text-sm text-[#2C2C2C]/70 mt-1">
                View and manage all your financial transactions.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Cashflow</CardTitle>
                <DollarSign className={cn("h-4 w-4", netCashflow >= 0 ? "text-blue-500" : "text-orange-500")} />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", netCashflow >= 0 ? "text-blue-500" : "text-orange-500")}>
                  {formatCurrency(netCashflow)}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
                <Receipt className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(avgTransaction)}</div>
                <p className="text-xs text-muted-foreground">{totalCount} total</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Table */}
          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-1/3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by description..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Input 
                    type="date" 
                    value={filters.startDate} 
                    onChange={e => handleFilterChange('startDate', e.target.value)}
                  />
                  <Input 
                    type="date" 
                    value={filters.endDate} 
                    onChange={e => handleFilterChange('endDate', e.target.value)}
                  />
                  <Select onValueChange={value => handleFilterChange('accountId', value)} value={filters.accountId || 'all'}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Accounts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.accountName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[
                        { key: 'date', label: 'Date' },
                        { key: 'description', label: 'Description' },
                        { key: 'account', label: 'Account' },
                        { key: 'type', label: 'Type' },
                        { key: 'amount', label: 'Amount' }
                      ].map(({ key, label }) => (
                        <TableHead key={key}>
                          <Button 
                            variant="ghost"
                            onClick={() => requestSort(key as keyof Transaction)} 
                            className="px-0"
                          >
                            {label}
                            {sortConfig.key === key && (
                              sortConfig.direction === 'ascending' ? 
                              <ArrowUp className="h-3 w-3 ml-1" /> : 
                              <ArrowDown className="h-3 w-3 ml-1" />
                            )}
                          </Button>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-red-500">{error}</TableCell>
                      </TableRow>
                    ) : transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(transaction.date)}
                          </TableCell>
                          <TableCell className="font-medium max-w-xs truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {transaction.account?.accountName || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              {transaction.type}
                            </span>
                          </TableCell>
                          <TableCell className={cn(
                            "whitespace-nowrap font-bold",
                            transaction.amount < 0 ? 'text-red-500' : 'text-green-500'
                          )}>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-16">
                          <FileSearch className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium">No Transactions Found</h3>
                          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="p-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p - 1)} 
                      disabled={currentPage === 1} 
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous</span>
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p + 1)} 
                      disabled={currentPage === totalPages} 
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
