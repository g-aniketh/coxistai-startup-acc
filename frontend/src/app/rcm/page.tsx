"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  ClipboardList,
  FileCheck,
  ArrowRight,
  RefreshCw,
  BarChart2,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { apiClient, DashboardSummary } from "@/lib/api";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Mock RCM data
const claimsPipeline = [
  { name: "Submitted", value: 145, color: "#0d9488" },
  { name: "In Review", value: 67, color: "#f59e0b" },
  { name: "Approved", value: 312, color: "#10b981" },
  { name: "Denied", value: 28, color: "#ef4444" },
  { name: "Paid", value: 892, color: "#6366f1" },
];

const denialReasons = [
  { reason: "Coding Errors", count: 12, amount: 285000 },
  { reason: "Missing Documentation", count: 8, amount: 192000 },
  { reason: "Eligibility Issues", count: 5, amount: 125000 },
  { reason: "Authorization Required", count: 2, amount: 48000 },
  { reason: "Duplicate Claims", count: 1, amount: 18000 },
];

const monthlyCollections = [
  { month: "Aug", submitted: 4500000, collected: 4100000, denied: 180000 },
  { month: "Sep", submitted: 4800000, collected: 4350000, denied: 165000 },
  { month: "Oct", submitted: 5200000, collected: 4750000, denied: 195000 },
  { month: "Nov", submitted: 4900000, collected: 4520000, denied: 145000 },
  { month: "Dec", submitted: 5100000, collected: 4680000, denied: 172000 },
  { month: "Jan", submitted: 5500000, collected: 5050000, denied: 158000 },
];

const agingBuckets = [
  { bucket: "0-30 days", amount: 2850000, count: 245 },
  { bucket: "31-60 days", amount: 1420000, count: 98 },
  { bucket: "61-90 days", amount: 680000, count: 45 },
  { bucket: "90+ days", amount: 320000, count: 24 },
];

export default function RCMDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await apiClient.dashboard.summary();
        if (response.success && response.data) {
          setSummary(response.data);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalClaims = claimsPipeline.reduce((sum, item) => sum + item.value, 0);
  const cleanClaimRate = (
    ((claimsPipeline[2].value + claimsPipeline[4].value) / totalClaims) *
    100
  ).toFixed(1);
  const denialRate = ((claimsPipeline[3].value / totalClaims) * 100).toFixed(1);
  const totalAR = agingBuckets.reduce((sum, bucket) => sum + bucket.amount, 0);
  const daysInAR = 42;

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">
                Loading RCM Dashboard...
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
        <div className="bg-gray-50 min-h-screen">
          <div className="overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-6 pb-32">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C] flex items-center gap-3">
                    <Activity className="h-8 w-8 text-teal-600" />
                    Revenue Cycle Management
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Monitor claims, collections, and revenue performance in
                    real-time
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-gray-300">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Submit New Claim
                  </Button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Activity className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-teal-900">
                        RCM Intelligence Active
                      </h3>
                      <p className="text-sm text-teal-700">
                        Real-time claim tracking • Denial analytics • Collection
                        optimization
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-teal-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Updates
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-teal-700">
                          Total Claims Value
                        </p>
                        <p className="text-2xl font-bold text-teal-900 mt-1">
                          {currencyFormatter.format(
                            monthlyCollections[5].submitted
                          )}
                        </p>
                        <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> +8.2% from last
                          month
                        </p>
                      </div>
                      <div className="p-3 bg-teal-100 rounded-xl">
                        <ClipboardList className="h-6 w-6 text-teal-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700">
                          Collections (MTD)
                        </p>
                        <p className="text-2xl font-bold text-green-900 mt-1">
                          {currencyFormatter.format(
                            monthlyCollections[5].collected
                          )}
                        </p>
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> 91.8% collection
                          rate
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-xl">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700">Days in A/R</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">
                          {daysInAR}
                        </p>
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" /> -3 days vs last
                          month
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-violet-700">
                          Clean Claim Rate
                        </p>
                        <p className="text-2xl font-bold text-violet-900 mt-1">
                          {cleanClaimRate}%
                        </p>
                        <p className="text-xs text-violet-600 mt-1 flex items-center gap-1">
                          <FileCheck className="h-3 w-3" /> Industry avg: 78%
                        </p>
                      </div>
                      <div className="p-3 bg-violet-100 rounded-xl">
                        <FileCheck className="h-6 w-6 text-violet-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Claims Pipeline */}
                <Card className="rounded-xl border-0 shadow-lg bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-teal-600" />
                      Claims Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={claimsPipeline}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {claimsPipeline.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value, name) => [
                                `${value} claims`,
                                name,
                              ]}
                              contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "0.5rem",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-3">
                        {claimsPipeline.map((item) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-sm text-gray-700">
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {item.value}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({((item.value / totalClaims) * 100).toFixed(0)}
                                %)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* A/R Aging */}
                <Card className="rounded-xl border-0 shadow-lg bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-teal-600" />
                      Accounts Receivable Aging
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agingBuckets}>
                          <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) =>
                              `₹${(value / 100000).toFixed(0)}L`
                            }
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              currencyFormatter.format(value),
                              "Amount",
                            ]}
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "0.5rem",
                            }}
                          />
                          <Bar
                            dataKey="amount"
                            fill="#0d9488"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Outstanding</span>
                      <span className="font-bold text-teal-600">
                        {currencyFormatter.format(totalAR)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Collections Trend */}
              <Card className="rounded-xl border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-teal-600" />
                    Monthly Collections Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyCollections}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) =>
                            `₹${(value / 100000).toFixed(0)}L`
                          }
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            currencyFormatter.format(value),
                            name === "submitted"
                              ? "Claims Submitted"
                              : name === "collected"
                                ? "Collected"
                                : "Denied",
                          ]}
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "0.5rem",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="submitted"
                          stroke="#0d9488"
                          strokeWidth={2}
                          dot={{ fill: "#0d9488" }}
                          name="Claims Submitted"
                        />
                        <Line
                          type="monotone"
                          dataKey="collected"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: "#10b981" }}
                          name="Collected"
                        />
                        <Line
                          type="monotone"
                          dataKey="denied"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ fill: "#ef4444" }}
                          name="Denied"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Denial Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rounded-xl border-0 shadow-lg bg-white">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        Denial Analysis
                      </CardTitle>
                      <Badge className="bg-red-100 text-red-700">
                        {denialRate}% Denial Rate
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {denialReasons.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-red-600">
                                {item.count}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {item.reason}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {currencyFormatter.format(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Action Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-red-900">
                              28 Claims Denied
                            </h4>
                            <p className="text-sm text-red-700 mt-1">
                              Review and resubmit with corrected information
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 border-red-300 text-red-700"
                            >
                              Review Denials{" "}
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-amber-900">
                              67 Claims In Review
                            </h4>
                            <p className="text-sm text-amber-700 mt-1">
                              Follow up with payers for faster processing
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 border-amber-300 text-amber-700"
                            >
                              View Pending{" "}
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <DollarSign className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-blue-900">
                              ₹32L in 90+ Day A/R
                            </h4>
                            <p className="text-sm text-blue-700 mt-1">
                              Escalate aged receivables for collection
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 border-blue-300 text-blue-700"
                            >
                              View Aged A/R{" "}
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
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
