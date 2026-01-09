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
  Activity,
  ClipboardList,
  Clock,
  HeartPulse,
  Building2,
  FileCheck,
  Users,
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

  // Mock hospital bank accounts - balances sum to totalBalance
  const getMockBankAccounts = () => {
    if (!summary) return [];
    const totalBalance = summary.financial.totalBalance;

    // Distribute balance across hospital accounts: 50%, 30%, 20%
    return [
      {
        name: "Hospital Operating Account",
        accountNumber: "XXX-XXXX-5678",
        balance: Math.round(totalBalance * 0.5),
        type: "Operating",
      },
      {
        name: "Patient Trust Account",
        accountNumber: "XXX-XXXX-9012",
        balance: Math.round(totalBalance * 0.3),
        type: "Trust",
      },
      {
        name: "Capital Reserve Account",
        accountNumber: "XXX-XXXX-3456",
        balance:
          totalBalance -
          Math.round(totalBalance * 0.5) -
          Math.round(totalBalance * 0.3),
        type: "Reserve",
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
        const isIncomplete =
          !profileRes.data.email ||
          !profileRes.data.phone ||
          (profileRes.data.addresses && profileRes.data.addresses.length === 0);

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
                Loading Hospital Finance Dashboard...
              </p>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  // Calculate healthcare-specific metrics
  const outstandingClaims = summary
    ? Math.round(summary.financial.totalBalance * 0.15)
    : 0;
  const daysInAR = 42; // Mock value - typical healthcare metric
  const collectionRate = 94.5; // Mock percentage

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
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C] flex items-center gap-3">
                    <HeartPulse className="h-8 w-8 text-teal-600" />
                    Hospital Finance Dashboard
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Real-time Financial Health & Revenue Cycle Insights
                  </p>
                </div>
              </div>

              {/* Organization Setup Banner */}
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
                        Complete Your Organization Setup (Recommended)
                      </h3>
                      <p className="text-sm text-amber-800 mb-3">
                        Add your hospital details, NPI, Tax ID, and contact
                        information to optimize billing, compliance, and
                        financial reporting.
                      </p>
                      <Button
                        onClick={handleGoToSettings}
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Go to Settings
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Intelligence Status Banner */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Activity className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-teal-900">
                        Financial Intelligence: Active
                      </h3>
                      <p className="text-sm text-teal-700">
                        Connected to billing systems • Real-time revenue
                        analytics
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-teal-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Data
                  </div>
                </div>
              </div>

              {/* Top Financial KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Cash Position"
                  value={
                    summary
                      ? currencyFormatter.format(summary.financial.totalBalance)
                      : "₹0"
                  }
                  percentageChange={17}
                  icon={<DollarSign className="h-5 w-5" />}
                  cardClassName="bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-800"
                  onClick={() =>
                    router.push("/financial-dashboard?tab=transactions")
                  }
                />
                <StatCard
                  title="Patient Collections"
                  value={
                    summary
                      ? currencyFormatter.format(
                          summary.financial.monthlyRevenue
                        )
                      : "₹0"
                  }
                  percentageChange={23}
                  icon={<TrendingUp className="h-5 w-5" />}
                  cardClassName="bg-gradient-to-br from-green-100 to-emerald-100 text-green-800"
                  onClick={() =>
                    router.push("/financial-dashboard?tab=statistics")
                  }
                />
                <StatCard
                  title="Operating Expenses"
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
                  cardClassName="bg-gradient-to-br from-rose-100 to-pink-100 text-rose-800"
                  onClick={() =>
                    router.push("/financial-dashboard?tab=statistics")
                  }
                />
                <StatCard
                  title="Annual Revenue"
                  value={
                    summary
                      ? currencyFormatter.format(
                          summary.financial.monthlyRevenue * 12
                        )
                      : "₹0"
                  }
                  percentageChange={12}
                  icon={<Target className="h-5 w-5" />}
                  cardClassName="bg-gradient-to-br from-violet-100 to-purple-100 text-violet-800"
                  onClick={() =>
                    router.push("/financial-dashboard?tab=statistics")
                  }
                />
              </div>

              {/* Healthcare-Specific KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-100 rounded-xl">
                        <ClipboardList className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-orange-700">
                          Outstanding Claims
                        </p>
                        <p className="text-2xl font-bold text-orange-900">
                          {currencyFormatter.format(outstandingClaims)}
                        </p>
                        <p className="text-xs text-orange-600">
                          Pending insurance
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-700">Days in A/R</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {daysInAR}
                        </p>
                        <p className="text-xs text-blue-600">
                          Industry avg: 49 days
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-100 rounded-xl">
                        <FileCheck className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-emerald-700">
                          Collection Rate
                        </p>
                        <p className="text-2xl font-bold text-emerald-900">
                          {collectionRate}%
                        </p>
                        <p className="text-xs text-emerald-600">Target: 95%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Hospital Bank Accounts Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {getMockBankAccounts().map((account, index) => {
                  const bankColors = [
                    {
                      gradient: "from-teal-50 to-cyan-100/50",
                      iconBg: "bg-teal-500/10",
                      iconColor: "text-teal-600",
                      border: "border-teal-200/50",
                    },
                    {
                      gradient: "from-blue-50 to-indigo-100/50",
                      iconBg: "bg-blue-500/10",
                      iconColor: "text-blue-600",
                      border: "border-blue-200/50",
                    },
                    {
                      gradient: "from-emerald-50 to-green-100/50",
                      iconBg: "bg-emerald-500/10",
                      iconColor: "text-emerald-600",
                      border: "border-emerald-200/50",
                    },
                  ];
                  const colors = bankColors[index] || bankColors[0];

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
                                <Building2
                                  className={`h-6 w-6 ${colors.iconColor}`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-[#2C2C2C] mb-1">
                                  {account.name}
                                </h3>
                                <p className="text-xs font-mono text-[#2C2C2C]/70">
                                  {account.accountNumber}
                                </p>
                                <p className="text-xs text-[#2C2C2C]/60 mt-1">
                                  {account.type} Account
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
                        <div
                          className={`absolute bottom-0 left-0 right-0 h-1 ${colors.iconBg} opacity-50`}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Revenue & Cashflow Chart */}
              <UserChart data={cashflowData} />

              {/* Revenue Breakdown Chart */}
              <div className="mt-6">
                <ProfitChart summary={summary || undefined} />
              </div>

              {/* AI Financial Scenarios */}
              <div className="mt-6">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <Brain className="h-4 w-4 text-teal-600" />
                      </div>
                      <CardTitle className="text-sm font-medium text-teal-900">
                        AI Financial Scenarios
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-xs font-semibold text-teal-900 mb-1">
                        Scenario: Add 10 Beds to ICU
                      </div>
                      <div className="text-xs text-teal-700">
                        Revenue Impact: +₹45L/month
                      </div>
                      <div className="text-xs text-teal-600">
                        ROI: 18 months payback
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-xs font-semibold text-teal-900 mb-1">
                        Scenario: Reduce A/R Days by 10
                      </div>
                      <div className="text-xs text-teal-700">
                        Cash Flow: +₹12L immediate
                      </div>
                      <div className="text-xs text-teal-600">
                        Impact: Improved liquidity
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-xs font-semibold text-teal-900 mb-1">
                        Scenario: 15% Claim Denial Reduction
                      </div>
                      <div className="text-xs text-teal-700">
                        Annual Savings: +₹85L
                      </div>
                      <div className="text-xs text-teal-600">
                        Impact: Improved collection rate
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Alerts */}
              <div className="mt-6">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <CardTitle className="text-sm font-medium text-red-900">
                        Financial Alerts
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="bg-white/60 rounded-lg p-3 border-l-4 border-red-400">
                      <div className="text-xs font-semibold text-red-900 mb-1">
                        ⚠️ High Claim Denials
                      </div>
                      <div className="text-xs text-red-700">
                        Denial rate up 8% this month
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        Review: Cardiology coding accuracy
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 border-l-4 border-orange-400">
                      <div className="text-xs font-semibold text-orange-900 mb-1">
                        📊 Collection Opportunity
                      </div>
                      <div className="text-xs text-orange-700">
                        ₹28L in claims over 60 days
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        Consider: Accelerated follow-up
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 border-l-4 border-yellow-400">
                      <div className="text-xs font-semibold text-yellow-900 mb-1">
                        💰 Cash Flow Alert
                      </div>
                      <div className="text-xs text-yellow-700">
                        15 patient invoices overdue
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">
                        Send automated payment reminders?
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Connected Systems Status */}
              <div className="mt-6">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Wallet className="h-4 w-4 text-green-600" />
                      </div>
                      <CardTitle className="text-sm font-medium text-green-900">
                        Connected Systems
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs font-medium text-green-900">
                          Hospital Banking
                        </span>
                      </div>
                      <span className="text-xs text-green-600">Connected</span>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs font-medium text-green-900">
                          Payment Gateway
                        </span>
                      </div>
                      <span className="text-xs text-green-600">Active</span>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-xs font-medium text-green-900">
                          Insurance Portal
                        </span>
                      </div>
                      <span className="text-xs text-orange-600">Demo</span>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-xs font-medium text-green-900">
                          EHR Integration
                        </span>
                      </div>
                      <span className="text-xs text-orange-600">Demo</span>
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
