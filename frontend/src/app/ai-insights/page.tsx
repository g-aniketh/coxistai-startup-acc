"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

interface AIInsight {
  healthScore?: number;
  healthAssessment?: string;
  positives?: string[];
  concerns?: string[];
  recommendations?: string[];
  burnAnalysis?: string;
  topSpendingCategories?: string[];
  costSavingSuggestions?: string[];
  revenueOpportunities?: string[];
  cashflowHealth?: string;
  keyMetrics?: {
    totalBalance: number;
    monthlyBurn: number;
    monthlyRevenue: number;
    runway: number | null;
  };
}

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const response = await apiClient.ai.getInsights();
      if (response.success && response.data) {
        setInsights(response.data);
        toast.success("AI insights generated successfully!");
      } else {
        toast.error(response.message || "Failed to generate insights");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to generate insights";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-primary" />
                AI Financial Insights
              </h1>
              <p className="text-muted-foreground mt-1">
                Get AI-powered analysis of your financial health and
                recommendations
              </p>
            </div>
            <Button onClick={generateInsights} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>

          {!insights && !loading && (
            <Card className="p-12 text-center">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
              <p className="text-muted-foreground mb-4">
                Click "Generate Insights" to get AI-powered financial analysis
              </p>
            </Card>
          )}

          {insights && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Balance
                  </p>
                  <h3 className="text-2xl font-bold">
                    $
                    {insights.keyMetrics?.totalBalance.toLocaleString() ??
                      "N/A"}
                  </h3>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    Monthly Burn
                  </p>
                  <h3 className="text-2xl font-bold text-red-500">
                    $
                    {insights.keyMetrics?.monthlyBurn.toLocaleString() ?? "N/A"}
                  </h3>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    Monthly Revenue
                  </p>
                  <h3 className="text-2xl font-bold text-green-500">
                    $
                    {insights.keyMetrics?.monthlyRevenue.toLocaleString() ??
                      "N/A"}
                  </h3>
                </Card>
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Runway</p>
                  <h3 className="text-2xl font-bold">
                    {insights.keyMetrics?.runway
                      ? `${insights.keyMetrics.runway.toFixed(1)}mo`
                      : "∞"}
                  </h3>
                </Card>
              </div>

              {/* Cashflow Health */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">
                    Cashflow Health Assessment
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {insights.cashflowHealth}
                </p>
              </Card>

              {/* Burn Analysis */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-lg">Burn Rate Analysis</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {insights.burnAnalysis}
                </p>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Spending Categories */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold">Top Spending Categories</h3>
                  </div>
                  <ul className="space-y-2">
                    {insights.topSpendingCategories?.map(
                      (category: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">•</span>
                          <span className="text-sm text-muted-foreground">
                            {category}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </Card>

                {/* Cost Saving Suggestions */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">Cost Saving Suggestions</h3>
                  </div>
                  <ul className="space-y-2">
                    {insights.costSavingSuggestions?.map(
                      (suggestion: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">💡</span>
                          <span className="text-sm text-muted-foreground">
                            {suggestion}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </Card>
              </div>

              {/* Revenue Opportunities */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold text-lg">
                    Revenue Growth Opportunities
                  </h3>
                </div>
                <ul className="space-y-3">
                  {insights.revenueOpportunities?.map(
                    (opportunity: string, index: number) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                      >
                        <span className="text-green-500 mt-0.5">📈</span>
                        <span className="text-sm text-foreground">
                          {opportunity}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </Card>

              {/* Disclaimer */}
              <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                <p className="text-xs text-blue-500">
                  💡 These insights are AI-generated based on your financial
                  data. Always consult with a financial advisor for major
                  decisions.
                </p>
              </Card>
            </div>
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
