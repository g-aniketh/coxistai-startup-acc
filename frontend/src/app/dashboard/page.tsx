"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/dashboard/StatCard";
import UserChart from "@/components/dashboard/UserChart";
import ProfitChart from "@/components/dashboard/ProfitChart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  apiClient,
  DashboardSummary,
  CashflowChartData,
  RecentActivity,
  CompanyProfile,
} from "@/lib/api";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Brain,
  Calendar,
  DollarSign,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
  Settings,
  X,
  Info,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cashflowData, setCashflowData] = useState<CashflowChartData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(
    null
  );
  const [showSetupBanner, setShowSetupBanner] = useState(false);

  // Mock bank accounts - balances sum to totalBalance
  const getMockBankAccounts = () => {
    if (!summary) return [];
    const totalBalance = summary.financial.totalBalance;
    
    // Distribute balance across 3 accounts: 50%, 30%, 20%
    return [
      {
        name: "HDFC Bank - Current Account",
        accountNumber: "XXX-XXXX-5678",
        balance: Math.round(totalBalance * 0.5),
      },
      {
        name: "ICICI Bank - Savings Account",
        accountNumber: "XXX-XXXX-9012",
        balance: Math.round(totalBalance * 0.3),
      },
      {
        name: "Axis Bank - Current Account",
        accountNumber: "XXX-XXXX-3456",
        balance: totalBalance - Math.round(totalBalance * 0.5) - Math.round(totalBalance * 0.3), // Remaining to ensure exact sum
      },
    ];
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, cashflowRes, activityRes, profileRes] =
        await Promise.all([
          apiClient.dashboard.summary(),
          apiClient.dashboard.cashflowChart(6),
          apiClient.dashboard.recentActivity(10),
          apiClient.company.getProfile(),
        ]);

      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      if (cashflowRes.success && cashflowRes.data)
        setCashflowData(cashflowRes.data);
      if (activityRes.success && activityRes.data)
        setRecentActivity(activityRes.data);

      if (profileRes.success && profileRes.data) {
        setCompanyProfile(profileRes.data);
        // Check if company profile is incomplete (missing email, phone, or addresses)
        const isIncomplete =
          !profileRes.data.email ||
          !profileRes.data.phone ||
          (profileRes.data.addresses && profileRes.data.addresses.length === 0);

        // Check if user dismissed the banner (stored in localStorage)
        const dismissed = localStorage.getItem(
          "company-setup-banner-dismissed"
        );
        if (isIncomplete && !dismissed) {
          setShowSetupBanner(true);
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleDismissBanner = () => {
    setShowSetupBanner(false);
    localStorage.setItem("company-setup-banner-dismissed", "true");
  };

  const handleGoToSettings = () => {
    router.push("/settings");
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">
                Loading AI CFO Dashboard...
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
        <div className="h-screen">
          {/* Main Content - Full Width */}
          <div className="overflow-y-auto custom-scrollbar h-full">
            <div className="p-4 md:p-8 space-y-4 md:space-y-6 w-full px-4 md:px-8 lg:px-16 pb-32">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">
                    AI CFO Dashboard
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Real-time Financial Health & Cashflow Insights
                  </p>
                </div>
              </div>

              {/* Company Setup Banner */}
              {showSetupBanner && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6 relative">
                  <button
                    onClick={handleDismissBanner}
                    className="absolute top-3 right-3 text-amber-600 hover:text-amber-800 transition-colors"
                    aria-label="Dismiss banner"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <div className="flex items-start gap-3 pr-8">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Info className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-900 mb-1">
                        Complete Your Company Setup (Recommended)
                      </h3>
                      <p className="text-sm text-amber-800 mb-3">
                        Add your company details, contact information, and
                        addresses to get the most out of your AI CFO dashboard.
                        This will help with invoicing, compliance, and financial
                        reporting.
                      </p>
                      <Button
                        onClick={handleGoToSettings}
                        className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Go to Settings
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI CFO Status Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Brain className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        AI CFO Status: Live Data
                      </h3>
                      <p className="text-sm text-blue-700">
                        Connected to your financial data • Real-time insights
                        and analysis
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Data
                  </div>
                </div>
              </div>

              {/* Top Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Cash Balance"
                  value={
                    summary
                      ? currencyFormatter.format(summary.financial.totalBalance)
                      : "₹0"
                  }
                  percentageChange={17}
                  icon={<DollarSign className="h-5 w-5" />}
                  cardClassName="bg-[#C9E0B0] text-[#3a5129]"
                  onClick={() =>
                    router.push("/financial-dashboard?tab=transactions")
                  }
                />
                <StatCard
                  title="Monthly Revenue"
                  value={
                    summary
                      ? currencyFormatter.format(
                          summary.financial.monthlyRevenue
                        )
                      : "₹0"
                  }
                  percentageChange={23}
                  icon={<TrendingUp className="h-5 w-5" />}
                  cardClassName="bg-[#F6D97A] text-[#7a6015]"
                  onClick={() =>
                    router.push("/financial-dashboard?tab=statistics")
                  }
                />
                <StatCard
                  title="Burn Rate"
                  value={
                    summary
                      ? currencyFormatter.format(summary.financial.monthlyBurn)
                      : "₹0"
                  }
                  percentageChange={
                    summary && summary.financial.monthlyRevenue > 0
                      ? Math.round(
                          (summary.financial.monthlyBurn /
                            summary.financial.monthlyRevenue) *
                            100
                        )
                      : undefined
                  }
                  icon={<TrendingDown className="h-5 w-5" />}
                  cardClassName="bg-[#FFB3BA] text-[#8B0000]"
                  onClick={() =>
                    router.push("/financial-dashboard?tab=statistics")
                  }
                />
                <StatCard
                  title="ARR Forecast"
                  value={
                    summary
                      ? currencyFormatter.format(
                          summary.financial.monthlyRevenue * 12
                        )
                      : "₹0"
                  }
                  percentageChange={12}
                  icon={<Target className="h-5 w-5" />}
                  cardClassName="bg-[#B7B3E6] text-[#2C2C2C]"
                  onClick={() =>
                    router.push("/financial-dashboard?tab=statistics")
                  }
                />
              </div>

              {/* Bank Accounts Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {getMockBankAccounts().map((account, index) => {
                  // Different color schemes for each bank
                  const bankColors = [
                    {
                      gradient: "from-blue-50 to-blue-100/50",
                      iconBg: "bg-blue-500/10",
                      iconColor: "text-blue-600",
                      border: "border-blue-200/50",
                      bankName: "HDFC Bank",
                    },
                    {
                      gradient: "from-purple-50 to-purple-100/50",
                      iconBg: "bg-purple-500/10",
                      iconColor: "text-purple-600",
                      border: "border-purple-200/50",
                      bankName: "ICICI Bank",
                    },
                    {
                      gradient: "from-emerald-50 to-emerald-100/50",
                      iconBg: "bg-emerald-500/10",
                      iconColor: "text-emerald-600",
                      border: "border-emerald-200/50",
                      bankName: "Axis Bank",
                    },
                  ];
                  const colors = bankColors[index] || bankColors[0]; // Fallback to first color if index out of bounds

                  return (
                    <Card
                      key={index}
                      className={`rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.gradient} shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden`}
                      onClick={() => router.push("/banking-payments")}
                    >
                      <div className="relative">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div
                                className={`p-3 ${colors.iconBg} rounded-xl group-hover:scale-110 transition-transform duration-300`}
                              >
                                <CreditCard
                                  className={`h-6 w-6 ${colors.iconColor}`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-[#2C2C2C] mb-1">
                                  {colors.bankName}
                                </h3>
                                <p className="text-xs font-mono text-[#2C2C2C]/70">
                                  {account.accountNumber}
                                </p>
                                <p className="text-xs text-[#2C2C2C]/60 mt-1">
                                  {account.name.includes("Current")
                                    ? "Current Account"
                                    : "Savings Account"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 pb-6">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-[#2C2C2C]/60 uppercase tracking-wide">
                              Available Balance
                            </p>
                            <div className="text-3xl font-bold text-[#2C2C2C] leading-tight">
                              {currencyFormatter.format(account.balance)}
                            </div>
                          </div>
                        </CardContent>
                        {/* Subtle bottom accent */}
                        <div
                          className={`absolute bottom-0 left-0 right-0 h-1 ${colors.iconBg} opacity-50`}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Cashflow Chart */}
              <UserChart data={cashflowData} />

              {/* Revenue Breakdown Chart */}
              <div className="mt-6">
                <ProfitChart summary={summary || undefined} />
              </div>

              {/* AI CFO What-If Scenarios */}
              <div className="mt-6">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Brain className="h-4 w-4 text-indigo-600" />
                      </div>
                      <CardTitle className="text-sm font-medium text-indigo-900">
                        AI CFO Scenarios
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-xs font-semibold text-indigo-900 mb-1">
                        Scenario: Hire 2 Engineers
                      </div>
                      <div className="text-xs text-indigo-700">
                        Runway: 8.2mo → 6.1mo
                      </div>
                      <div className="text-xs text-indigo-600">
                        Impact: -$8K/mo burn
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-xs font-semibold text-indigo-900 mb-1">
                        Scenario: Cut SaaS by 30%
                      </div>
                      <div className="text-xs text-indigo-700">
                        Runway: 8.2mo → 9.1mo
                      </div>
                      <div className="text-xs text-indigo-600">
                        Impact: +$1.8K/mo savings
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-xs font-semibold text-indigo-900 mb-1">
                        Scenario: 20% Revenue Growth
                      </div>
                      <div className="text-xs text-indigo-700">
                        Runway: 8.2mo → 10.4mo
                      </div>
                      <div className="text-xs text-indigo-600">
                        Impact: +$9K/mo revenue
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Proactive Alerts */}
              <div className="mt-6">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <CardTitle className="text-sm font-medium text-red-900">
                        AI Alerts
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="bg-white/60 rounded-lg p-3 border-l-4 border-red-400">
                      <div className="text-xs font-semibold text-red-900 mb-1">
                        ⚠️ High Burn Rate
                      </div>
                      <div className="text-xs text-red-700">
                        Current burn 15% above forecast
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        Recommendation: Review contractor costs
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 border-l-4 border-orange-400">
                      <div className="text-xs font-semibold text-orange-900 mb-1">
                        📊 Revenue Opportunity
                      </div>
                      <div className="text-xs text-orange-700">
                        Churn rate down 2% this month
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        Consider expansion pricing
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 border-l-4 border-yellow-400">
                      <div className="text-xs font-semibold text-yellow-900 mb-1">
                        💰 Cash Flow
                      </div>
                      <div className="text-xs text-yellow-700">
                        3 invoices overdue ($12K total)
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">
                        Auto-send reminders?
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bank Integration Status */}
              <div className="mt-6">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Wallet className="h-4 w-4 text-green-600" />
                      </div>
                      <CardTitle className="text-sm font-medium text-green-900">
                        Connected Accounts
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs font-medium text-green-900">
                          Chase Business
                        </span>
                      </div>
                      <span className="text-xs text-green-600">Live</span>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs font-medium text-green-900">
                          Stripe
                        </span>
                      </div>
                      <span className="text-xs text-green-600">Live</span>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-xs font-medium text-green-900">
                          QuickBooks
                        </span>
                      </div>
                      <span className="text-xs text-orange-600">Mock</span>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-xs font-medium text-green-900">
                          Payroll (Gusto)
                        </span>
                      </div>
                      <span className="text-xs text-orange-600">Mock</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
