"use client";

import { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { apiClient, DashboardSummary } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  CreditCard,
  Plus,
  Landmark,
  ExternalLink,
  Search,
  Settings,
  Shield,
  Zap,
  DollarSign,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";

const subscriptionPlans = [
  {
    name: "Startup",
    price: "$50/mo",
    originalPrice: "$75/mo",
    features: [
      "Automated Cashflow Dashboard",
      "Runway & Burn Tracking",
      "Basic 'What If' Scenarios",
      "Email Support",
      "Up to 2 bank accounts",
    ],
    current: true,
    popular: false,
    color: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-900",
  },
  {
    name: "SMB CFO",
    price: "$200/mo",
    originalPrice: "$250/mo",
    features: [
      "All Startup Features",
      "Advanced AI Insights",
      "Proactive Alerts",
      "Investor Update Drafts",
      "Priority Support",
      "Up to 5 bank accounts",
      "Custom integrations",
    ],
    current: false,
    popular: true,
    color: "bg-[#C9E0B0]",
    borderColor: "border-[#607c47]",
    textColor: "text-[#3a5129]",
  },
  {
    name: "Enterprise",
    price: "Custom",
    originalPrice: null,
    features: [
      "All SMB Features",
      "Payroll Automation",
      "Vendor Negotiations",
      "Tax Optimization",
      "Dedicated Account Manager",
      "Unlimited bank accounts",
      "White-label options",
      "API access",
    ],
    current: false,
    popular: false,
    color: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-900",
  },
];


const recentTransactions = [
  {
    id: "txn_001",
    description: "Stripe payment processing",
    amount: -125.5,
    date: "2024-01-15",
    status: "completed",
    type: "fee",
  },
  {
    id: "txn_002",
    description: "Monthly subscription",
    amount: -50.0,
    date: "2024-01-14",
    status: "completed",
    type: "subscription",
  },
  {
    id: "txn_003",
    description: "Customer payment",
    amount: 2500.0,
    date: "2024-01-13",
    status: "completed",
    type: "income",
  },
];

export default function PaymentPage() {
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<Array<{
    name: string;
    icon: typeof Landmark;
    connected: boolean;
    status: string;
    lastSync: string;
    balance: string;
  }>>([]);

  // Mock bank accounts - balances sum to totalBalance
  const getMockBankAccounts = useCallback((summary: DashboardSummary | null) => {
    if (!summary) return [];
    const totalBalance = summary.financial.totalBalance;
    
    // Distribute balance across 3 accounts: 50%, 30%, 20%
    const account1Balance = Math.round(totalBalance * 0.5);
    const account2Balance = Math.round(totalBalance * 0.3);
    const account3Balance = totalBalance - account1Balance - account2Balance; // Remaining to ensure exact sum
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
      }).format(amount);
    };
    
    return [
      {
        name: "HDFC Bank",
        icon: Landmark,
        connected: true,
        status: "Live",
        lastSync: "2 minutes ago",
        balance: formatCurrency(account1Balance),
      },
      {
        name: "ICICI Bank",
        icon: Landmark,
        connected: true,
        status: "Live",
        lastSync: "5 minutes ago",
        balance: formatCurrency(account2Balance),
      },
      {
        name: "Axis Bank",
        icon: Landmark,
        connected: true,
        status: "Live",
        lastSync: "1 minute ago",
        balance: formatCurrency(account3Balance),
      },
    ];
  }, []);

  const loadDashboardSummary = useCallback(async () => {
    try {
      const response = await apiClient.dashboard.summary();
      if (response.success && response.data) {
        setDashboardSummary(response.data);
        setConnectedAccounts(getMockBankAccounts(response.data));
      }
    } catch (error) {
      console.error("Failed to load dashboard summary:", error);
    }
  }, [getMockBankAccounts]);

  useEffect(() => {
    loadDashboardSummary();
  }, [loadDashboardSummary]);

  const handleUpgrade = (planName: string) => {
    toast.success(`Upgrading to ${planName} plan...`);
  };

  const handleConnectAccount = (accountName: string) => {
    toast.success(`Connecting to ${accountName}...`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

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
                    Billing & Integrations
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Manage your subscription and connected financial accounts
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search accounts..."
                      className="pl-10 bg-white rounded-lg"
                    />
                  </div>
                  <Button className="flex items-center gap-2 bg-[#607c47] hover:bg-[#4a6129] text-white">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </div>

              {/* AI Status Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        Secure Billing & Integrations
                      </h3>
                      <p className="text-sm text-blue-700">
                        Bank-level security • Real-time sync • Automated
                        reconciliation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    All Systems Active
                  </div>
                </div>
              </div>

              {/* Current Plan Status */}
              <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-900">
                          Current Plan: Startup
                        </h3>
                        <p className="text-sm text-green-700">
                          Next billing: February 14, 2024
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-green-100 text-green-700">
                            Active
                          </Badge>
                          <span className="text-sm text-green-600">
                            $50/month
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-900">
                        $50
                      </div>
                      <div className="text-sm text-green-600">per month</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Plans */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[#2C2C2C]">
                  Available Plans
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {subscriptionPlans.map((plan, index) => (
                    <Card
                      key={index}
                      className={`rounded-xl border-0 shadow-lg hover:shadow-xl transition-shadow flex flex-col bg-white ${
                        plan.popular ? "ring-2 ring-[#607c47]" : ""
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-medium text-[#2C2C2C]">
                            {plan.name}
                          </CardTitle>
                          {plan.popular && (
                            <Badge className="bg-[#607c47] text-white">
                              Most Popular
                            </Badge>
                          )}
                          {plan.current && (
                            <Badge
                              variant="outline"
                              className="border-green-300 bg-green-50 text-green-700"
                            >
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-[#2C2C2C]">
                            {plan.price}
                          </span>
                          {plan.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {plan.originalPrice}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 flex-1 flex flex-col">
                        <ul className="space-y-2 mb-6 flex-1">
                          {plan.features.map((feature, featureIndex) => (
                            <li
                              key={featureIndex}
                              className="flex items-center gap-2 text-sm text-gray-600"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button
                          onClick={() => handleUpgrade(plan.name)}
                          disabled={plan.current}
                          className={`w-full ${
                            plan.current
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-[#607c47] hover:bg-[#4a6129] text-white"
                          }`}
                        >
                          {plan.current
                            ? "Current Plan"
                            : plan.name === "Enterprise"
                              ? "Contact Sales"
                              : "Upgrade"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Connected Accounts */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[#2C2C2C]">
                  Connected Accounts
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {connectedAccounts.map((account, index) => (
                    <Card
                      key={index}
                      className="bg-white rounded-xl border-0 shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                account.connected
                                  ? "bg-green-100"
                                  : "bg-gray-100"
                              }`}
                            >
                              <account.icon
                                className={`h-5 w-5 ${
                                  account.connected
                                    ? "text-green-600"
                                    : "text-gray-500"
                                }`}
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold text-[#2C2C2C]">
                                {account.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Last sync: {account.lastSync}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              className={
                                account.connected
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }
                            >
                              {account.status}
                            </Badge>
                            {account.balance !== "N/A" && (
                              <div className="text-sm font-medium text-[#2C2C2C] mt-1">
                                {account.balance}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {account.connected ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-300 text-[#2C2C2C]"
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Settings
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-300 text-[#2C2C2C]"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => handleConnectAccount(account.name)}
                              size="sm"
                              className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Connect
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <Card className="bg-white rounded-xl border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#607c47]" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              transaction.type === "income"
                                ? "bg-green-100"
                                : transaction.type === "subscription"
                                  ? "bg-blue-100"
                                  : "bg-red-100"
                            }`}
                          >
                            {transaction.type === "income" ? (
                              <DollarSign className="h-4 w-4 text-green-600" />
                            ) : transaction.type === "subscription" ? (
                              <Calendar className="h-4 w-4 text-blue-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-[#2C2C2C]">
                              {transaction.description}
                            </div>
                            <div className="text-sm text-gray-600">
                              {transaction.date}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold ${
                              transaction.amount > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.amount > 0 ? "+" : ""}
                            {formatCurrency(transaction.amount)}
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs border-green-300 text-green-700"
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
