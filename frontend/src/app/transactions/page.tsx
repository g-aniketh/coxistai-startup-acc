"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient, BankAccount } from "@/lib/api";
import MainLayout from "@/components/layout/MainLayout";
import AuthGuard from "@/components/auth/AuthGuard";
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
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import BlurIn from "@/components/ui/blur-in";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import AddTransactionModal from "@/components/dashboard/AddTransactionModal";
import toast from "react-hot-toast";

// Demo Transaction interface
interface DemoTransaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  category: string;
  date: string;
  accountId: string;
}

// Demo Account interface
interface DemoAccount {
  id: string;
  name: string;
  balance: number;
}

type SortConfig = {
  key: keyof DemoTransaction;
  direction: "ascending" | "descending";
};

const COLORS = ["#607c47", "#FFB3BA", "#B7B3E6", "#F6D97A", "#C9E0B0"];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<DemoTransaction[]>([]);
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "date",
    direction: "descending",
  });
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
          id: "1",
          amount: 5000,
          type: "income" as const,
          description: "Customer Payment - SaaS Subscription",
          category: "Sales Revenue",
          date: "2024-01-15T10:30:00Z",
          accountId: "acc1",
        },
        {
          id: "2",
          amount: 2500,
          type: "income" as const,
          description: "Investment from Angel Investor",
          category: "Investment",
          date: "2024-01-14T14:20:00Z",
          accountId: "acc1",
        },
        {
          id: "3",
          amount: 1200,
          type: "expense" as const,
          description: "Office Rent Payment",
          category: "Office Rent",
          date: "2024-01-13T09:15:00Z",
          accountId: "acc2",
        },
        {
          id: "4",
          amount: 800,
          type: "expense" as const,
          description: "Software Licenses",
          category: "Software/SaaS",
          date: "2024-01-12T16:45:00Z",
          accountId: "acc2",
        },
        {
          id: "5",
          amount: 3000,
          type: "expense" as const,
          description: "Team Salaries",
          category: "Salaries",
          date: "2024-01-11T11:30:00Z",
          accountId: "acc1",
        },
      ];

      setTransactions(mockTransactions);
    } catch (error) {
      console.error("Failed to load transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      // For demo purposes, use mock data that matches the expected interface
      const mockAccounts = [
        {
          id: "acc1",
          name: "Chase Business Account",
          balance: 125000,
        },
        {
          id: "acc2",
          name: "Wells Fargo Business",
          balance: 45000,
        },
        {
          id: "acc3",
          name: "Stripe Account",
          balance: 8500,
        },
      ];

      setAccounts(mockAccounts);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    loadAccounts();
  }, [loadTransactions, loadAccounts]);

  const handleSort = (key: keyof DemoTransaction) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const response = await apiClient.transactions.delete(id);
      if (response.success) {
        await loadTransactions();
        toast.success("Transaction deleted successfully");
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  const handleTransactionAdded = async (transactionData: {
    amount: number;
    type: "income" | "expense";
    description: string;
    category: string;
    date: string;
    accountId: string;
  }) => {
    try {
      // Add the new transaction to the state
      const newTransaction: DemoTransaction = {
        id: Date.now().toString(),
        ...transactionData,
      };
      setTransactions((prev) => [newTransaction, ...prev]);

      // Update the accounts if needed (for balance changes)
      // In a real app, this would be handled by the backend

      toast.success("Transaction added successfully");
    } catch (error) {
      console.error("Failed to add transaction:", error);
      toast.error("Failed to add transaction");
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      transaction.category
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase());
    const matchesAccount =
      selectedAccount === "all" || transaction.accountId === selectedAccount;
    return matchesSearch && matchesAccount;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
    return 0;
  });

  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate summary data
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashflow = totalIncome - totalExpenses;

  // Category breakdown for expenses
  const expenseCategories = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      },
      {} as Record<string, number>
    );

  const categoryData = Object.entries(expenseCategories).map(
    ([category, amount], index) => ({
      name: category,
      value: amount,
      color: COLORS[index % COLORS.length],
    })
  );

  // Monthly trend data
  const monthlyData = transactions.reduce(
    (acc, t) => {
      const month = new Date(t.date).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0 };
      }
      if (t.type === "income") {
        acc[month].income += t.amount;
      } else {
        acc[month].expenses += t.amount;
      }
      return acc;
    },
    {} as Record<string, { income: number; expenses: number }>
  );

  const monthlyTrendData = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    income: data.income,
    expenses: data.expenses,
    net: data.income - data.expenses,
  }));

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">
                Loading transactions...
              </p>
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
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">
                    Transactions
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Track and manage your financial transactions
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
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Add Transaction
                  </Button>
                </div>
              </div>

              {/* AI Status Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Receipt className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        Transaction Management
                      </h3>
                      <p className="text-sm text-blue-700">
                        Real-time tracking • Automated categorization • Smart
                        insights
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Sync
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm text-green-700">
                          Total Income
                        </div>
                        <div className="text-lg font-bold text-green-900">
                          {formatCurrency(totalIncome)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <div className="text-sm text-red-700">
                          Total Expenses
                        </div>
                        <div className="text-lg font-bold text-red-900">
                          {formatCurrency(totalExpenses)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-blue-700">
                          Net Cashflow
                        </div>
                        <div
                          className={`text-lg font-bold ${netCashflow >= 0 ? "text-green-900" : "text-red-900"}`}
                        >
                          {formatCurrency(netCashflow)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trend */}
                <Card className="bg-white rounded-xl border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#607c47]" />
                      Monthly Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyTrendData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="month"
                            stroke="#6b7280"
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                          />
                          <YAxis
                            stroke="#6b7280"
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            tickFormatter={(value) => `$${value / 1000}k`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#ffffff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "0.75rem",
                            }}
                            formatter={(value, name) => [
                              formatCurrency(value as number),
                              name === "income"
                                ? "Income"
                                : name === "expenses"
                                  ? "Expenses"
                                  : "Net",
                            ]}
                          />
                          <Bar
                            dataKey="income"
                            fill="#607c47"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="expenses"
                            fill="#FFB3BA"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Expense Categories */}
                <Card className="bg-white rounded-xl border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                      <FileSearch className="h-5 w-5 text-[#607c47]" />
                      Expense Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#ffffff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "0.75rem",
                            }}
                            formatter={(value) => [
                              formatCurrency(value as number),
                              "Amount",
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Controls */}
              <Card className="bg-white rounded-xl border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-4 items-center">
                      <Select
                        value={selectedAccount}
                        onValueChange={setSelectedAccount}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by account" />
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
                        variant="outline"
                        className="border-gray-300 text-[#2C2C2C]"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        More Filters
                      </Button>
                    </div>

                    <div className="flex gap-2 items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-[#2C2C2C]"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-[#2C2C2C]"
                        onClick={loadTransactions}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transactions Table */}
              <Card className="bg-white rounded-xl border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-[#2C2C2C]">
                    Recent Transactions ({sortedTransactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort("date")}
                          >
                            <div className="flex items-center gap-2">
                              Date
                              {sortConfig.key === "date" &&
                                (sortConfig.direction === "ascending" ? (
                                  <ArrowUp className="h-4 w-4" />
                                ) : (
                                  <ArrowDown className="h-4 w-4" />
                                ))}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort("description")}
                          >
                            <div className="flex items-center gap-2">
                              Description
                              {sortConfig.key === "description" &&
                                (sortConfig.direction === "ascending" ? (
                                  <ArrowUp className="h-4 w-4" />
                                ) : (
                                  <ArrowDown className="h-4 w-4" />
                                ))}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort("category")}
                          >
                            <div className="flex items-center gap-2">
                              Category
                              {sortConfig.key === "category" &&
                                (sortConfig.direction === "ascending" ? (
                                  <ArrowUp className="h-4 w-4" />
                                ) : (
                                  <ArrowDown className="h-4 w-4" />
                                ))}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort("amount")}
                          >
                            <div className="flex items-center gap-2">
                              Amount
                              {sortConfig.key === "amount" &&
                                (sortConfig.direction === "ascending" ? (
                                  <ArrowUp className="h-4 w-4" />
                                ) : (
                                  <ArrowDown className="h-4 w-4" />
                                ))}
                            </div>
                          </TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTransactions.map((transaction) => (
                          <TableRow
                            key={transaction.id}
                            className="hover:bg-gray-50"
                          >
                            <TableCell className="font-medium">
                              {formatDate(transaction.date)}
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-gray-300 text-gray-700"
                              >
                                {transaction.category}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className={`font-semibold ${
                                transaction.type === "income"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === "income" ? "+" : "-"}
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  transaction.type === "income"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }
                              >
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDeleteTransaction(transaction.id)
                                }
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
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
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(
                          currentPage * itemsPerPage,
                          sortedTransactions.length
                        )}{" "}
                        of {sortedTransactions.length} transactions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="border-gray-300 text-[#2C2C2C]"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="px-3 py-1 text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
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
          </div>
        </div>

        {/* Add Transaction Modal */}
        <AddTransactionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleTransactionAdded}
          accounts={accounts}
        />
      </MainLayout>
    </AuthGuard>
  );
}
