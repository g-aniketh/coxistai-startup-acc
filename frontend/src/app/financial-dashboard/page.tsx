"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient, BankAccount, DashboardSummary } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
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
  BarChart2,
  Users,
  Upload,
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
  LineChart,
  Line,
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
// no navigation needed for static Import button

// Demo Transaction interface
interface DemoTransaction {
  id: string;
  amount: number;
  type: "income" | "expense";
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
  direction: "ascending" | "descending";
};

const COLORS = ["#0d9488", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6"];

// Healthcare Statistics data
const kpiData = [
  {
    title: "Days in A/R",
    value: "42 days",
    icon: Calendar,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    change: "-3 days",
  },
  {
    title: "Operating Margin",
    value: "12.5%",
    icon: TrendingDown,
    color: "text-teal-500",
    bgColor: "bg-teal-50",
    change: "+1.2%",
  },
  {
    title: "Annual Revenue",
    value: "₹4.5Cr",
    icon: TrendingUp,
    color: "text-green-500",
    bgColor: "bg-green-50",
    change: "+15.2%",
  },
  {
    title: "Patient Volume",
    value: "2,847",
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    change: "+8.5%",
  },
];

const cashFlowData = [
  { name: "Jan", income: 4500000, expenses: 3200000, net: 1300000 },
  { name: "Feb", income: 4800000, expenses: 3500000, net: 1300000 },
  { name: "Mar", income: 5200000, expenses: 3800000, net: 1400000 },
  { name: "Apr", income: 4600000, expenses: 3400000, net: 1200000 },
  { name: "May", income: 5100000, expenses: 3600000, net: 1500000 },
  { name: "Jun", income: 5500000, expenses: 3500000, net: 2000000 },
];

const revenueData = [
  { name: "Q1 2024", revenue: 12000000, patients: 2180 },
  { name: "Q2 2024", revenue: 14500000, patients: 2420 },
  { name: "Q3 2024", revenue: 16800000, patients: 2660 },
  { name: "Q4 2024", revenue: 19500000, patients: 2800 },
  { name: "Q1 2025", revenue: 22500000, patients: 2847 },
];

const expenseBreakdown = [
  { name: "Staff Salaries", value: 2100000, color: "#0d9488" },
  { name: "Medical Supplies", value: 850000, color: "#10b981" },
  { name: "Pharmaceuticals", value: 620000, color: "#f59e0b" },
  { name: "Equipment & Maintenance", value: 420000, color: "#6366f1" },
  { name: "Utilities & Facilities", value: 280000, color: "#ec4899" },
  { name: "Administrative", value: 180000, color: "#8b5cf6" },
];

function FinancialDashboardContent() {
  const [activeTab, setActiveTab] = useState<"transactions" | "statistics">(
    "transactions"
  );
  const searchParams = useSearchParams();

  // Transactions state
  const [transactions, setTransactions] = useState<DemoTransaction[]>([]);
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);

  // Mock hospital bank accounts - balances sum to totalBalance
  const getMockBankAccounts = useCallback((summary: DashboardSummary | null): DemoAccount[] => {
    if (!summary) return [];
    const totalBalance = summary.financial.totalBalance;
    
    // Distribute balance across 3 hospital accounts: 50%, 30%, 20%
    const account1Balance = Math.round(totalBalance * 0.5);
    const account2Balance = Math.round(totalBalance * 0.3);
    const account3Balance = totalBalance - account1Balance - account2Balance;
    
    return [
      { id: "1", name: "Hospital Operating Account", balance: account1Balance },
      { id: "2", name: "Patient Trust Account", balance: account2Balance },
      { id: "3", name: "Capital Reserve Account", balance: account3Balance },
    ];
  }, []);
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
      // Healthcare transactions data
      const mockTransactions: DemoTransaction[] = [
        {
          id: "1",
          amount: 125000,
          type: "income" as const,
          description: "Insurance Claim Payment - Blue Cross",
          category: "Insurance Revenue",
          date: "2024-01-15T10:30:00Z",
          accountId: "1",
        },
        {
          id: "2",
          amount: 45000,
          type: "expense" as const,
          description: "Medical Supplies - Surgical Equipment",
          category: "Medical Supplies",
          date: "2024-01-14T09:00:00Z",
          accountId: "1",
        },
        {
          id: "3",
          amount: 28500,
          type: "expense" as const,
          description: "Pharmaceuticals - Monthly Stock",
          category: "Pharmaceuticals",
          date: "2024-01-13T14:20:00Z",
          accountId: "2",
        },
        {
          id: "4",
          amount: 85000,
          type: "income" as const,
          description: "Patient Payment - Cardiology Services",
          category: "Patient Revenue",
          date: "2024-01-12T16:45:00Z",
          accountId: "1",
        },
        {
          id: "5",
          amount: 15200,
          type: "expense" as const,
          description: "Lab Equipment Maintenance",
          category: "Equipment Maintenance",
          date: "2024-01-11T11:30:00Z",
          accountId: "2",
        },
        {
          id: "6",
          amount: 180000,
          type: "expense" as const,
          description: "Staff Salaries - January",
          category: "Staff Salaries",
          date: "2024-01-10T08:00:00Z",
          accountId: "1",
        },
        {
          id: "7",
          amount: 95000,
          type: "income" as const,
          description: "Insurance Payment - United Healthcare",
          category: "Insurance Revenue",
          date: "2024-01-09T13:15:00Z",
          accountId: "1",
        },
        {
          id: "8",
          amount: 12800,
          type: "expense" as const,
          description: "Utilities - Hospital Building",
          category: "Utilities",
          date: "2024-01-08T10:00:00Z",
          accountId: "2",
        },
        {
          id: "9",
          amount: 42000,
          type: "income" as const,
          description: "Patient Payment - Emergency Services",
          category: "Patient Revenue",
          date: "2024-01-07T15:30:00Z",
          accountId: "1",
        },
        {
          id: "10",
          amount: 68000,
          type: "expense" as const,
          description: "Medical Equipment - Diagnostic Machines",
          category: "Equipment Purchase",
          date: "2024-01-06T12:00:00Z",
          accountId: "2",
        },
      ];

      setTransactions(mockTransactions);
      // Accounts will be set after dashboard summary is loaded
    } catch (error) {
      console.error("Failed to load transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDashboardSummary = useCallback(async () => {
    try {
      const response = await apiClient.dashboard.summary();
      if (response.success && response.data) {
        setDashboardSummary(response.data);
        setAccounts(getMockBankAccounts(response.data));
      }
    } catch (error) {
      console.error("Failed to load dashboard summary:", error);
    }
  }, [getMockBankAccounts]);

  useEffect(() => {
    loadTransactions();
    loadDashboardSummary();
  }, [loadTransactions, loadDashboardSummary]);

  // Initialize tab from query param if provided
  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab === "statistics") setActiveTab("statistics");
    if (tab === "transactions") setActiveTab("transactions");
  }, [searchParams]);

  const handleAddTransactionSuccess = async (transactionData: any) => {
    try {
      // Add the new transaction to the state
      console.log("Adding transaction:", transactionData);
      setTransactions((prev) => {
        console.log("Previous transactions:", prev.length);
        const newTransactions = [transactionData, ...prev];
        console.log("New transactions count:", newTransactions.length);
        return newTransactions;
      });

      // Reset to first page to show the new transaction
      setCurrentPage(1);

      // Reset account filter to show all transactions
      setSelectedAccount("all");

      // Update the accounts if needed (for balance changes)
      // In a real app, this would be handled by the backend

      toast.success("Transaction added successfully");
    } catch (error) {
      console.error("Failed to add transaction:", error);
      toast.error("Failed to add transactions");
    }
  };

  const handleSort = (key: keyof DemoTransaction) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
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

    if (aValue == null || bValue == null) return 0;
    if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = sortedTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate transaction statistics
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIncome - totalExpenses;

  // Category breakdown for charts
  const categoryData = transactions.reduce(
    (acc, transaction) => {
      acc[transaction.category] =
        (acc[transaction.category] || 0) + transaction.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const categoryChartData = Object.entries(categoryData).map(
    ([category, amount], index) => ({
      name: category,
      value: amount,
      color: COLORS[index % COLORS.length],
    })
  );

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
                    <BarChart2 className="h-8 w-8 text-teal-600" />
                    Hospital Financial Dashboard
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70 mt-1">
                    Comprehensive view of revenue, expenses, and financial performance
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
                  <Button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white">
                    <Upload className="h-4 w-4" />
                    Import Transactions
                  </Button>
                  <Button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              {/* AI Status Banner */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <BarChart2 className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-teal-900">
                        Healthcare Financial Intelligence
                      </h3>
                      <p className="text-sm text-teal-700">
                        Revenue cycle analytics • Claim tracking • Financial forecasting
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-teal-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Sync
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200">
                <Button
                  onClick={() => setActiveTab("transactions")}
                  variant={activeTab === "transactions" ? "default" : "ghost"}
                  className={
                    activeTab === "transactions"
                      ? "bg-teal-600 hover:bg-teal-700 text-white"
                      : "text-[#2C2C2C] hover:bg-gray-100"
                  }
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Transactions
                </Button>
                <Button
                  onClick={() => setActiveTab("statistics")}
                  variant={activeTab === "statistics" ? "default" : "ghost"}
                  className={
                    activeTab === "statistics"
                      ? "bg-teal-600 hover:bg-teal-700 text-white"
                      : "text-[#2C2C2C] hover:bg-gray-100"
                  }
                >
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>

              {/* Transactions Tab */}
              {activeTab === "transactions" && (
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
                            <div className="text-sm text-green-700">
                              Total Income
                            </div>
                            <div className="text-lg font-bold text-green-900">
                              {formatCurrency(totalIncome)}
                            </div>
                            <div className="text-xs text-green-600">
                              This month
                            </div>
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
                            <div className="text-sm text-red-700">
                              Total Expenses
                            </div>
                            <div className="text-lg font-bold text-red-900">
                              {formatCurrency(totalExpenses)}
                            </div>
                            <div className="text-xs text-red-600">
                              This month
                            </div>
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
                            <div className="text-sm text-blue-700">
                              Net Cash Flow
                            </div>
                            <div
                              className={`text-lg font-bold ${netCashFlow >= 0 ? "text-green-900" : "text-red-900"}`}
                            >
                              {formatCurrency(netCashFlow)}
                            </div>
                            <div className="text-xs text-blue-600">
                              This month
                            </div>
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
                          <Select
                            value={selectedAccount}
                            onValueChange={setSelectedAccount}
                          >
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
                            className="bg-teal-600 hover:bg-teal-700 text-white"
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
                              <TableHead>Account</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedTransactions.map((transaction) => (
                              <TableRow
                                key={transaction.id}
                                className="hover:bg-gray-50"
                              >
                                <TableCell className="text-[#2C2C2C]">
                                  {formatDate(transaction.date)}
                                </TableCell>
                                <TableCell className="text-[#2C2C2C]">
                                  {transaction.description}
                                </TableCell>
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
                                <TableCell className="text-[#2C2C2C]">
                                  {accounts.find(
                                    (acc) => acc.id === transaction.accountId
                                  )?.name || "Unknown"}
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
                            Showing {startIndex + 1} to{" "}
                            {Math.min(
                              startIndex + itemsPerPage,
                              sortedTransactions.length
                            )}{" "}
                            of {sortedTransactions.length} transactions
                          </div>
                          <div className="flex items-center gap-2">
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
                            <span className="text-sm text-[#2C2C2C]">
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
              )}

              {/* Statistics Tab */}
              {activeTab === "statistics" && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiData.map((kpi, index) => {
                      const Icon = kpi.icon;
                      return (
                        <Card
                          key={index}
                          className="bg-white rounded-xl border-0 shadow-lg"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                                <Icon className={`h-5 w-5 ${kpi.color}`} />
                              </div>
                              <div>
                                <div className={`text-sm ${kpi.color}`}>
                                  {kpi.title}
                                </div>
                                <div className="text-lg font-bold text-[#2C2C2C]">
                                  {kpi.value}
                                </div>
                                <div className={`text-xs ${kpi.color}`}>
                                  {kpi.change}
                                </div>
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
                          <TrendingUp className="h-5 w-5 text-teal-600" />
                          Revenue & Expense Trend
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={cashFlowData}>
                              <XAxis
                                dataKey="name"
                                stroke="#6b7280"
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                              />
                              <YAxis
                                stroke="#6b7280"
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                                tickFormatter={(value) =>
                                  `₹${(value / 1000).toFixed(0)}k`
                                }
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#ffffff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "0.75rem",
                                }}
                                formatter={(value, name) => [
                                  `$${Number(value).toLocaleString()}`,
                                  name === "income"
                                    ? "Income"
                                    : name === "expenses"
                                      ? "Expenses"
                                      : "Net",
                                ]}
                              />
                              <Line
                                type="monotone"
                                dataKey="income"
                                stroke="#10b981"
                                strokeWidth={2}
                              />
                              <Line
                                type="monotone"
                                dataKey="expenses"
                                stroke="#ef4444"
                                strokeWidth={2}
                              />
                              <Line
                                type="monotone"
                                dataKey="net"
                                stroke="#3b82f6"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Revenue Growth */}
                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-teal-600" />
                          Patient Revenue Growth
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                              <XAxis
                                dataKey="name"
                                stroke="#6b7280"
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                              />
                              <YAxis
                                stroke="#6b7280"
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                                tickFormatter={(value) =>
                                  `₹${(value / 1000).toFixed(0)}k`
                                }
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#ffffff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "0.75rem",
                                }}
                                formatter={(value, name) => [
                                  `$${Number(value).toLocaleString()}`,
                                  name === "revenue" ? "Revenue" : "Customers",
                                ]}
                              />
                              <Bar
                                dataKey="revenue"
                                fill="#0d9488"
                                radius={[4, 4, 0, 0]}
                              />
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
                        <PieChart className="h-5 w-5 text-teal-600" />
                        Hospital Operating Expenses
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
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "0.75rem",
                              }}
                              formatter={(value) => [
                                `$${Number(value).toLocaleString()}`,
                                "Amount",
                              ]}
                            />
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

export default function FinancialDashboardPage() {
  return (
    <Suspense fallback={null}>
      <FinancialDashboardContent />
    </Suspense>
  );
}
