'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, BankAccount } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
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
  Plus,
  Filter,
  Download,
  RefreshCw,
  BarChart2,
  Users,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import BlurIn from '@/components/ui/blur-in';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
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
import { Badge } from '@/components/ui/Badge';
import AddTransactionModal from '@/components/dashboard/AddTransactionModal';
import toast from 'react-hot-toast';

// Demo Transaction interface
interface DemoTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  category: string;
  date: string;
  accountId: string;
  notes?: string;
}

// Demo Account interface
interface DemoAccount {
  id: string;
  name: string;
  balance: number;
}

type SortConfig = {
  key: keyof DemoTransaction;
  direction: 'ascending' | 'descending';
};

const COLORS = ['#607c47', '#FFB3BA', '#B7B3E6', '#F6D97A', '#C9E0B0'];

// Statistics data
const kpiData = [
  { title: "Runway", value: "8.2 months", icon: Calendar, color: "text-blue-500", bgColor: "bg-blue-50", change: "+0.3 mo" },
  { title: "Burn Rate", value: "₹2.9L", icon: TrendingDown, color: "text-red-500", bgColor: "bg-red-50", change: "-8.6%" },
  { title: "ARR", value: "₹4.5Cr", icon: TrendingUp, color: "text-green-500", bgColor: "bg-green-50", change: "+15.2%" },
  { title: "Customers", value: "342", icon: Users, color: "text-purple-500", bgColor: "bg-purple-50", change: "+12.5%" },
];

const cashFlowData = [
  { name: 'Jan', income: 45000, expenses: 32000, net: 13000 },
  { name: 'Feb', income: 48000, expenses: 35000, net: 13000 },
  { name: 'Mar', income: 52000, expenses: 38000, net: 14000 },
  { name: 'Apr', income: 46000, expenses: 34000, net: 12000 },
  { name: 'May', income: 51000, expenses: 36000, net: 15000 },
  { name: 'Jun', income: 55000, expenses: 35000, net: 20000 },
];

const revenueData = [
  { name: 'Q1 2023', revenue: 120000, customers: 180 },
  { name: 'Q2 2023', revenue: 145000, customers: 220 },
  { name: 'Q3 2023', revenue: 168000, customers: 260 },
  { name: 'Q4 2023', revenue: 195000, customers: 300 },
  { name: 'Q1 2024', revenue: 225000, customers: 342 },
];

const expenseBreakdown = [
  { name: 'Payroll', value: 210000, color: '#607c47' },
  { name: 'Marketing', value: 45000, color: '#F6D97A' },
  { name: 'SaaS', value: 18000, color: '#B7B3E6' },
  { name: 'Operations', value: 32000, color: '#FFB3BA' },
  { name: 'Other', value: 15000, color: '#C9E0B0' },
];

export default function FinancialDashboardPage() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'statistics'>('transactions');
  
  // Transactions state
  const [transactions, setTransactions] = useState<DemoTransaction[]>([]);
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const itemsPerPage = 10;

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      // For demo purposes, use mock data that matches the expected interface
      const mockTransactions: DemoTransaction[] = [
        {
          id: '1',
          amount: 5000,
          type: 'income' as const,
          description: 'Customer Payment - SaaS Subscription',
          category: 'Sales Revenue',
          date: '2024-01-15T10:30:00Z',
          accountId: '1'
        },
        {
          id: '2',
          amount: 1200,
          type: 'expense' as const,
          description: 'Office Rent - Downtown Location',
          category: 'Office Expenses',
          date: '2024-01-14T09:00:00Z',
          accountId: '1'
        },
        {
          id: '3',
          amount: 850,
          type: 'expense' as const,
          description: 'Software Licenses - Development Tools',
          category: 'Software & Tools',
          date: '2024-01-13T14:20:00Z',
          accountId: '2'
        },
        {
          id: '4',
          amount: 3200,
          type: 'income' as const,
          description: 'Client Payment - Consulting Services',
          category: 'Professional Services',
          date: '2024-01-12T16:45:00Z',
          accountId: '1'
        },
        {
          id: '5',
          amount: 450,
          type: 'expense' as const,
          description: 'Marketing Campaign - Google Ads',
          category: 'Marketing',
          date: '2024-01-11T11:30:00Z',
          accountId: '2'
        },
        {
          id: '6',
          amount: 1800,
          type: 'expense' as const,
          description: 'Employee Salary - January',
          category: 'Payroll',
          date: '2024-01-10T08:00:00Z',
          accountId: '1'
        },
        {
          id: '7',
          amount: 2800,
          type: 'income' as const,
          description: 'Product Sales - Monthly Subscription',
          category: 'Sales Revenue',
          date: '2024-01-09T13:15:00Z',
          accountId: '1'
        },
        {
          id: '8',
          amount: 320,
          type: 'expense' as const,
          description: 'Internet & Utilities - Office',
          category: 'Utilities',
          date: '2024-01-08T10:00:00Z',
          accountId: '2'
        },
        {
          id: '9',
          amount: 1500,
          type: 'income' as const,
          description: 'Freelance Project Payment',
          category: 'Professional Services',
          date: '2024-01-07T15:30:00Z',
          accountId: '1'
        },
        {
          id: '10',
          amount: 680,
          type: 'expense' as const,
          description: 'Equipment Purchase - Laptop',
          category: 'Equipment',
          date: '2024-01-06T12:00:00Z',
          accountId: '2'
        }
      ];

      const mockAccounts = [
        { id: '1', name: 'Business Checking', balance: 287500 },
        { id: '2', name: 'Business Savings', balance: 125000 },
        { id: '3', name: 'Credit Card', balance: -8500 }
      ];

      setTransactions(mockTransactions);
      setAccounts(mockAccounts);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      // Mock accounts data
      const mockAccounts = [
        { id: '1', name: 'Business Checking', balance: 287500 },
        { id: '2', name: 'Business Savings', balance: 125000 },
        { id: '3', name: 'Credit Card', balance: -8500 }
      ];
      setAccounts(mockAccounts);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      toast.error('Failed to load accounts');
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    loadAccounts();
  }, [loadTransactions, loadAccounts]);

  const handleAddTransactionSuccess = async (transactionData: any) => {
    try {
      // Add the new transaction to the state
      console.log('Adding transaction:', transactionData);
      setTransactions(prev => {
        console.log('Previous transactions:', prev.length);
        const newTransactions = [transactionData, ...prev];
        console.log('New transactions count:', newTransactions.length);
        return newTransactions;
      });
      
      // Reset to first page to show the new transaction
      setCurrentPage(1);
      
      // Reset account filter to show all transactions
      setSelectedAccount('all');
      
      // Update the accounts if needed (for balance changes)
      // In a real app, this would be handled by the backend
      
      toast.success('Transaction added successfully');
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast.error('Failed to add transactions');
    }
  };

  const handleSort = (key: keyof DemoTransaction) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesAccount = selectedAccount === 'all' || transaction.accountId === selectedAccount;
    return matchesSearch && matchesAccount;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue == null || bValue == null) return 0;
    if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + itemsPerPage);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate transaction statistics
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIncome - totalExpenses;

  // Category breakdown for charts
  const categoryData = transactions.reduce((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryData).map(([category, amount], index) => ({
    name: category,
    value: amount,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="bg-gray-50 flex">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C] flex items-center gap-2">
                    <BarChart2 className="h-8 w-8 text-[#607c47]" />
                    Financial Dashboard
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70 mt-1">
                    Comprehensive view of your transactions, analytics, and financial health
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search transactions..." 
                      className="pl-10 bg-white rounded-lg"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button className="flex items-center gap-2 bg-[#607c47] hover:bg-[#4a6129] text-white">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              {/* AI Status Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">Financial Intelligence</h3>
                      <p className="text-sm text-blue-700">Real-time analytics • Transaction insights • Financial forecasting</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Sync
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200">
                <Button
                  onClick={() => setActiveTab('transactions')}
                  variant={activeTab === 'transactions' ? 'default' : 'ghost'}
                  className={activeTab === 'transactions' ? 'bg-[#607c47] hover:bg-[#4a6129] text-white' : 'text-[#2C2C2C] hover:bg-gray-100'}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Transactions
                </Button>
                <Button
                  onClick={() => setActiveTab('statistics')}
                  variant={activeTab === 'statistics' ? 'default' : 'ghost'}
                  className={activeTab === 'statistics' ? 'bg-[#607c47] hover:bg-[#4a6129] text-white' : 'text-[#2C2C2C] hover:bg-gray-100'}
                >
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <ArrowUp className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm text-green-700">Total Income</div>
                            <div className="text-lg font-bold text-green-900">{formatCurrency(totalIncome)}</div>
                            <div className="text-xs text-green-600">This month</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <ArrowDown className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <div className="text-sm text-red-700">Total Expenses</div>
                            <div className="text-lg font-bold text-red-900">{formatCurrency(totalExpenses)}</div>
                            <div className="text-xs text-red-600">This month</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm text-blue-700">Net Cash Flow</div>
                            <div className={`text-lg font-bold ${netCashFlow >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                              {formatCurrency(netCashFlow)}
                            </div>
                            <div className="text-xs text-blue-600">This month</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Filters and Actions */}
                  <Card className="bg-white rounded-xl border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium text-[#2C2C2C]">
                          Transactions ({filteredTransactions.length})
                        </CardTitle>
                        <div className="flex gap-2">
                          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="All Accounts" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Accounts</SelectItem>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Transaction
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleSort('date')}
                              >
                                <div className="flex items-center gap-2">
                                  Date
                                  {sortConfig.key === 'date' && (
                                    sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleSort('description')}
                              >
                                <div className="flex items-center gap-2">
                                  Description
                                  {sortConfig.key === 'description' && (
                                    sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleSort('category')}
                              >
                                <div className="flex items-center gap-2">
                                  Category
                                  {sortConfig.key === 'category' && (
                                    sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleSort('amount')}
                              >
                                <div className="flex items-center gap-2">
                                  Amount
                                  {sortConfig.key === 'amount' && (
                                    sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead>Account</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedTransactions.map((transaction) => (
                              <TableRow key={transaction.id} className="hover:bg-gray-50">
                                <TableCell className="text-[#2C2C2C]">
                                  {formatDate(transaction.date)}
                                </TableCell>
                                <TableCell className="text-[#2C2C2C]">
                                  {transaction.description}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                                    {transaction.category}
                                  </Badge>
                                </TableCell>
                                <TableCell className={`font-semibold ${
                                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </TableCell>
                                <TableCell className="text-[#2C2C2C]">
                                  {accounts.find(acc => acc.id === transaction.accountId)?.name || 'Unknown'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-gray-600">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedTransactions.length)} of {sortedTransactions.length} transactions
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="border-gray-300 text-[#2C2C2C]"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-[#2C2C2C]">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="border-gray-300 text-[#2C2C2C]"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Statistics Tab */}
              {activeTab === 'statistics' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiData.map((kpi, index) => {
                      const Icon = kpi.icon;
                      return (
                        <Card key={index} className="bg-white rounded-xl border-0 shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                                <Icon className={`h-5 w-5 ${kpi.color}`} />
                              </div>
                              <div>
                                <div className={`text-sm ${kpi.color}`}>{kpi.title}</div>
                                <div className="text-lg font-bold text-[#2C2C2C]">{kpi.value}</div>
                                <div className={`text-xs ${kpi.color}`}>{kpi.change}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cash Flow Chart */}
                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-[#607c47]" />
                          Cash Flow Trend
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={cashFlowData}>
                              <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                              <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.75rem',
                                }}
                                formatter={(value, name) => [
                                  `$${Number(value).toLocaleString()}`,
                                  name === 'income' ? 'Income' : name === 'expenses' ? 'Expenses' : 'Net'
                                ]}
                              />
                              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                              <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Revenue Growth */}
                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-[#607c47]" />
                          Revenue Growth
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                              <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                              <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.75rem',
                                }}
                                formatter={(value, name) => [
                                  `$${Number(value).toLocaleString()}`,
                                  name === 'revenue' ? 'Revenue' : 'Customers'
                                ]}
                              />
                              <Bar dataKey="revenue" fill="#607c47" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Expense Breakdown */}
                  <Card className="bg-white rounded-xl border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-[#607c47]" />
                        Expense Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expenseBreakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={120}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {expenseBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.75rem',
                              }}
                              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Transaction Modal */}
        <AddTransactionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddTransactionSuccess}
          accounts={accounts}
        />
      </MainLayout>
    </AuthGuard>
  );
}
