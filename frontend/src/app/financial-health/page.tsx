"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import MainLayout from "@/components/layout/MainLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import {
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Sparkles,
} from "lucide-react";
import CountUp from "@/components/CountUp";
import MagicBento from "@/components/MagicBento";
import SpotlightCard from "@/components/SpotlightCard";
import { Badge } from "@/components/ui/Badge";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function FinancialHealthPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsRes, historyRes, insightsRes] = await Promise.all([
        apiClient.dashboard.summary(),
        apiClient.dashboard.cashflowChart(12),
        apiClient.dashboard.summary(),
      ]);

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
      if (historyRes.success && historyRes.data) {
        setHistory(historyRes.data);
      }
      if (insightsRes.success && insightsRes.data) {
        setInsights(insightsRes.data);
      }
    } catch (error) {
      console.error("Failed to load financial health:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  if (!metrics) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Financial Health</h1>
            <p className="text-muted-foreground">No data available.</p>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  const runway = Number(metrics.runway);
  const burnRate = Number(metrics.burnRate);
  const cashBalance = Number(metrics.cashBalance);

  const chartData = history.map((m: any) => ({
    month: new Date(m.periodStart).toLocaleDateString("en-IN", {
      month: "short",
    }),
    runway: Number(m.runway),
    burnRate: Number(m.burnRate),
    cashBalance: Number(m.cashBalance),
  }));

  const healthScore = insights?.healthScore || 75;

  const bentoItems = [
    // Header
    {
      className: "col-span-12",
      background: (
        <div className="absolute top-0 left-0 w-full h-full bg-card" />
      ),
      content: (
        <div className="p-6">
          <h1 className="text-3xl font-bold text-foreground">
            Financial Health
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your startup's financial well-being
          </p>
        </div>
      ),
    },

    // Health Score
    {
      className: "col-span-12 lg:col-span-4",
      background: (
        <SpotlightCard
          spotlightColor="rgba(139, 92, 246, 0.3)"
          className="w-full h-full"
        />
      ),
      content: (
        <div className="p-6 h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                Health Score
              </h3>
            </div>
            <div
              className={`text-6xl font-bold ${getHealthColor(healthScore)}`}
            >
              <CountUp to={healthScore} duration={2} />
              <span className="text-2xl">/100</span>
            </div>
            <div className="mt-4">
              <Badge
                variant={healthScore >= 60 ? "default" : "destructive"}
                className="text-sm"
              >
                {getHealthLabel(healthScore)}
              </Badge>
            </div>
          </div>
          {insights?.healthAssessment && (
            <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
              {insights.healthAssessment}
            </p>
          )}
        </div>
      ),
    },

    // Runway
    {
      className: "col-span-6 lg:col-span-4",
      background: (
        <SpotlightCard
          spotlightColor={
            runway < 6 ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"
          }
          className="w-full h-full"
        />
      ),
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`h-10 w-10 rounded-lg ${runway < 6 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"} flex items-center justify-center`}
            >
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Runway
            </h3>
          </div>
          <div className="text-4xl font-bold text-foreground">
            <CountUp to={runway} duration={1.5} decimals={1} />
            <span className="text-xl ml-2">months</span>
          </div>
          {runway < 6 && (
            <div className="flex items-center gap-2 mt-3 text-sm text-red-500">
              <AlertTriangle className="h-4 w-4" />
              Critical - Action needed
            </div>
          )}
        </div>
      ),
    },

    // Burn Rate
    {
      className: "col-span-6 lg:col-span-4",
      background: (
        <SpotlightCard
          spotlightColor="rgba(239, 68, 68, 0.3)"
          className="w-full h-full"
        />
      ),
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <TrendingDown className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Monthly Burn
            </h3>
          </div>
          <div className="text-4xl font-bold text-foreground">
            <CountUp to={burnRate} duration={1.5} prefix="$" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Average monthly expenses
          </p>
        </div>
      ),
    },

    // Runway Trend
    {
      className: "col-span-12 lg:col-span-8",
      background: (
        <div className="absolute top-0 left-0 w-full h-full bg-card" />
      ),
      content: (
        <div className="p-6 h-full flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-foreground">
              Runway Trend
            </h3>
            <p className="text-sm text-muted-foreground">
              Months of runway over time
            </p>
          </div>
          <div className="flex-grow min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRunway" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `${value.toFixed(1)} months`}
                />
                <Area
                  type="monotone"
                  dataKey="runway"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorRunway)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },

    // AI Insights
    {
      className: "col-span-12 lg:col-span-4",
      background: (
        <div className="absolute top-0 left-0 w-full h-full bg-card" />
      ),
      content: (
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-foreground">AI Insights</h3>
          </div>
          <div className="space-y-3 flex-grow overflow-y-auto">
            {insights?.positives && insights.positives.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-emerald-500 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Positive Indicators
                </h4>
                <ul className="space-y-2">
                  {insights.positives.map((item: string, i: number) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground pl-6 relative before:content-['•'] before:absolute before:left-2"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {insights?.concerns && insights.concerns.length > 0 && (
              <div className="pt-3 border-t border-border">
                <h4 className="text-sm font-semibold text-yellow-500 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Areas of Concern
                </h4>
                <ul className="space-y-2">
                  {insights.concerns.map((item: string, i: number) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground pl-6 relative before:content-['•'] before:absolute before:left-2"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ),
    },

    // Burn Rate Trend
    {
      className: "col-span-12 lg:col-span-8",
      background: (
        <div className="absolute top-0 left-0 w-full h-full bg-card" />
      ),
      content: (
        <div className="p-6 h-full flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-foreground">
              Burn Rate & Cash Balance
            </h3>
            <p className="text-sm text-muted-foreground">Monthly tracking</p>
          </div>
          <div className="flex-grow min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="burnRate"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Burn Rate"
                />
                <Line
                  type="monotone"
                  dataKey="cashBalance"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Cash Balance"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },

    // AI Recommendations
    {
      className: "col-span-12 lg:col-span-4",
      background: (
        <div className="absolute top-0 left-0 w-full h-full bg-card" />
      ),
      content: (
        <div className="p-6 h-full flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-foreground">
              AI Recommendations
            </h3>
            <p className="text-sm text-muted-foreground">Actionable advice</p>
          </div>
          <div className="space-y-3 flex-grow overflow-y-auto">
            {insights?.recommendations &&
            insights.recommendations.length > 0 ? (
              insights.recommendations.map((rec: string, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <p className="text-sm text-foreground">{rec}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No recommendations at this time
              </p>
            )}
          </div>
        </div>
      ),
    },

    // Financial Ratios
    {
      className: "col-span-12",
      background: (
        <div className="absolute top-0 left-0 w-full h-full bg-card" />
      ),
      content: (
        <div className="p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">
            Key Financial Ratios
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">
                Cash to Burn Ratio
              </div>
              <div className="text-2xl font-bold text-foreground">
                {burnRate > 0 ? (cashBalance / burnRate).toFixed(1) : "∞"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Months of runway
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">
                Revenue to Expense
              </div>
              <div className="text-2xl font-bold text-foreground">
                {Number(metrics.totalExpenses) > 0
                  ? (
                      (Number(metrics.totalRevenue) /
                        Number(metrics.totalExpenses)) *
                      100
                    ).toFixed(0)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Coverage ratio
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">
                Net Cashflow
              </div>
              <div
                className={`text-2xl font-bold ${Number(metrics.netCashflow) >= 0 ? "text-emerald-500" : "text-red-500"}`}
              >
                {formatCurrency(Number(metrics.netCashflow))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This period</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">
                Growth Rate
              </div>
              <div
                className={`text-2xl font-bold ${Number(metrics.growthRate) >= 0 ? "text-emerald-500" : "text-red-500"}`}
              >
                {Number(metrics.growthRate).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Month-over-month
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <MagicBento items={bentoItems} />
      </MainLayout>
    </AuthGuard>
  );
}
