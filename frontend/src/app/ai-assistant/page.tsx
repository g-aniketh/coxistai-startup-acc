"use client";

import { useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/Badge";
import AIChatbot from "@/components/AIChatbot";
import {
  Sparkles,
  Bot,
  Zap,
  TrendingDown,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Brain,
  Target,
  DollarSign,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState<
    "chatbot" | "insights" | "scenarios" | "forecasting"
  >("chatbot");
  const [hasInteracted, setHasInteracted] = useState(false);

  interface AIRecommendation {
    title: string;
    description: string;
    priority: "High" | "Medium" | "Low";
    impact: string;
    effort: "Low" | "Medium" | "High";
  }

  interface AIAlert {
    type: "warning" | "error" | "info";
    title: string;
    message: string;
    action: string;
    severity?: "low" | "medium" | "high";
  }

  interface AIInsights {
    cashFlow: {
      current: number;
      projected: number;
      change: number;
    };
    runway: {
      current: number;
      projected: number;
      change: number;
    };
    burnRate: {
      current: number;
      projected: number;
      change: number;
    };
    revenue: {
      current: number;
      projected: number;
      change: number;
    };
    recommendations: AIRecommendation[];
    alerts: AIAlert[];
  }

  interface ScenarioResult {
    scenario: string;
    impact: {
      cashFlow: number;
      runway: number;
      burnRate: number;
      revenue: number;
    };
    projectedRevenue?: number;
    projectedExpenses?: number;
    projectedRunway?: number;
    analysis?: string;
    insights?: string[];
    risks: string[];
    recommendations: string[];
  }

  // Insights state
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Scenarios state
  const [scenario, setScenario] = useState("");
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);

  // Forecasting state
  const [forecastData, setForecastData] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastPeriod, setForecastPeriod] = useState<
    "3months" | "6months" | "12months"
  >("6months");

  const exampleScenarios = [
    "What happens if we hire 2 engineers at $150k/year each?",
    "What if we reduce SaaS spending by $5,000/month?",
    "What if our revenue grows by 20% next quarter?",
    "What if we raise $500k in funding?",
    "What happens if we cut marketing budget by 30%?",
  ];

  const generateInsights = async () => {
    setInsightsLoading(true);
    try {
      // Mock data for demonstration
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call

      const mockInsights = {
        cashFlow: {
          current: 287500,
          projected: 312000,
          change: 8.5,
        },
        runway: {
          current: 8.2,
          projected: 9.1,
          change: 0.9,
        },
        burnRate: {
          current: 35000,
          projected: 32000,
          change: -8.6,
        },
        revenue: {
          current: 45200,
          projected: 52000,
          change: 15.0,
        },
        recommendations: [
          {
            title: "Optimize SaaS Subscriptions",
            description: "Review and consolidate unused software licenses",
            impact: "Save $2,100/month",
            effort: "Low" as const,
            priority: "High" as const,
          },
          {
            title: "Implement Usage-Based Pricing",
            description: "Introduce tiered pricing to increase ARPU",
            impact: "Increase revenue by 25%",
            effort: "Medium" as const,
            priority: "High" as const,
          },
          {
            title: "Hire Customer Success Manager",
            description: "Reduce churn and increase customer satisfaction",
            impact: "Reduce churn by 15%",
            effort: "Medium" as const,
            priority: "Medium" as const,
          },
        ],
        alerts: [
          {
            type: "warning" as const,
            title: "Cash Runway Alert",
            message:
              "Current runway is 8.2 months. Consider fundraising timeline.",
            action: "Plan fundraising",
          },
          {
            type: "info" as const,
            title: "Revenue Opportunity",
            message: "Usage-based pricing could increase revenue by 25%",
            action: "Implement pricing tiers",
          },
        ],
      };

      setInsights(mockInsights);
      toast.success("AI insights generated successfully!");
    } catch (error) {
      console.error("Failed to generate insights:", error);
      toast.error("Failed to generate insights");
    } finally {
      setInsightsLoading(false);
    }
  };

  const runScenario = async () => {
    if (!scenario.trim()) {
      toast.error("Please enter a scenario");
      return;
    }

    setScenarioLoading(true);
    try {
      // Mock scenario analysis
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const mockResult = {
        scenario: scenario,
        impact: {
          cashFlow: Math.random() * 8300000 - 4150000, // ₹41.5L range
          runway: Math.random() * 6 - 3,
          burnRate: Math.random() * 830000 - 415000, // ₹4.15L range
          revenue: Math.random() * 1660000 - 830000, // ₹8.3L range
        },
        recommendations: [
          "Monitor cash flow closely for the next 3 months",
          "Consider adjusting hiring timeline based on results",
          "Review and optimize operational expenses",
        ],
        risks: [
          "Potential cash flow volatility",
          "Market conditions may affect projections",
          "Execution risks in implementation",
        ],
      };

      setScenarioResult(mockResult);
      toast.success("Scenario analysis completed!");
    } catch (error) {
      console.error("Failed to run scenario:", error);
      toast.error("Failed to run scenario");
    } finally {
      setScenarioLoading(false);
    }
  };

  const generateForecast = async () => {
    setForecastLoading(true);
    try {
      // Mock data for demonstration
      await new Promise((resolve) => setTimeout(resolve, 2500)); // Simulate API call

      const periods = {
        "3months": 3,
        "6months": 6,
        "12months": 12,
      };

      const months = periods[forecastPeriod];
      const forecastResult = {
        period: forecastPeriod,
        months: months,
        revenue: {
          current: 4316000, // ₹43.2L
          projected: Array.from({ length: months }, (_, i) => ({
            month: `Month ${i + 1}`,
            amount: 4316000 + i * 249000 + Math.random() * 166000, // ₹43.2L base + growth
            growth: 5 + Math.random() * 10,
          })),
        },
        expenses: {
          current: 2905000, // ₹29.1L
          projected: Array.from({ length: months }, (_, i) => ({
            month: `Month ${i + 1}`,
            amount: 2905000 + i * 83000 + Math.random() * 83000, // ₹29.1L base + growth
            growth: 2 + Math.random() * 5,
          })),
        },
        cashFlow: {
          current: 1410000, // ₹14.1L
          projected: Array.from({ length: months }, (_, i) => ({
            month: `Month ${i + 1}`,
            amount: 1410000 + i * 166000 + Math.random() * 83000, // ₹14.1L base + growth
            cumulative: 23862500 + i * 166000 + Math.random() * 83000, // ₹2.39Cr base
          })),
        },
        runway: {
          current: 8.2,
          projected: 8.2 + months * 0.3 + Math.random() * 0.5,
        },
        insights: [
          "Revenue growth is projected to accelerate in Q2 due to seasonal trends",
          "Expense growth is manageable and within budget constraints",
          "Cash runway extends to 12+ months under current projections",
          "Consider investing surplus cash in growth initiatives",
        ],
        risks: [
          "Market volatility could impact revenue projections",
          "Unexpected expenses could reduce runway",
          "Customer acquisition costs may increase",
          "Competition could pressure pricing",
        ],
        recommendations: [
          "Implement revenue optimization strategies",
          "Monitor expense growth closely",
          "Prepare contingency plans for market changes",
          "Consider fundraising timeline based on runway projections",
        ],
      };

      setForecastData(forecastResult);
      toast.success("Financial forecast generated!");
    } catch (error) {
      console.error("Failed to generate forecast:", error);
      toast.error("Failed to generate forecast");
    } finally {
      setForecastLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const showIntro = activeTab !== "chatbot" || !hasInteracted;

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="bg-gray-50 flex">
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
            <div
              className={cn(
                "p-4 md:p-8",
                showIntro ? "space-y-4 md:space-y-6" : "space-y-3 md:space-y-4"
              )}
            >
              {showIntro && (
                <>
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C] flex items-center gap-2">
                        <Sparkles className="h-8 w-8 text-[#607c47]" />
                        AI Assistant
                      </h1>
                      <p className="text-sm text-[#2C2C2C]/70 mt-1">
                        Your intelligent CFO companion for insights,
                        forecasting, and financial guidance
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-gray-300 text-[#2C2C2C]"
                    >
                      AI Powered
                    </Badge>
                  </div>

                  {/* AI Status Banner */}
                  <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-2 md:mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Brain className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900">
                            AI CFO Assistant
                          </h3>
                          <p className="text-sm text-blue-700">
                            Chat • Insights • Forecasting • Scenario Planning
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        Active
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tabs */}
              <div
                className={cn(
                  "flex gap-2 border-b border-gray-200",
                  !showIntro &&
                    activeTab === "chatbot" &&
                    "border-transparent pt-0 pb-0"
                )}
              >
                <Button
                  onClick={() => setActiveTab("chatbot")}
                  variant={activeTab === "chatbot" ? "default" : "ghost"}
                  className={
                    activeTab === "chatbot"
                      ? "bg-[#607c47] hover:bg-[#4a6129] text-white"
                      : "text-[#2C2C2C] hover:bg-gray-100"
                  }
                >
                  <Bot className="h-4 w-4 mr-2" />
                  AI Chat
                </Button>
                <Button
                  onClick={() => setActiveTab("insights")}
                  variant={activeTab === "insights" ? "default" : "ghost"}
                  className={
                    activeTab === "insights"
                      ? "bg-[#607c47] hover:bg-[#4a6129] text-white"
                      : "text-[#2C2C2C] hover:bg-gray-100"
                  }
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  AI Insights
                </Button>
                <Button
                  onClick={() => setActiveTab("scenarios")}
                  variant={activeTab === "scenarios" ? "default" : "ghost"}
                  className={
                    activeTab === "scenarios"
                      ? "bg-[#607c47] hover:bg-[#4a6129] text-white"
                      : "text-[#2C2C2C] hover:bg-gray-100"
                  }
                >
                  <Target className="h-4 w-4 mr-2" />
                  What-If Scenarios
                </Button>
                <Button
                  onClick={() => setActiveTab("forecasting")}
                  variant={activeTab === "forecasting" ? "default" : "ghost"}
                  className={
                    activeTab === "forecasting"
                      ? "bg-[#607c47] hover:bg-[#4a6129] text-white"
                      : "text-[#2C2C2C] hover:bg-gray-100"
                  }
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  AI Forecasting
                </Button>
              </div>

              {/* Chatbot Tab */}
              {activeTab === "chatbot" && (
                <div className="space-y-6">
                  <AIChatbot
                    className="w-full"
                    onUserMessage={() => setHasInteracted(true)}
                  />
                </div>
              )}

              {/* Insights Tab */}
              {activeTab === "insights" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[#2C2C2C]">
                      AI Financial Insights
                    </h2>
                    <Button
                      onClick={generateInsights}
                      disabled={insightsLoading}
                      className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                    >
                      {insightsLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Generate Insights
                        </>
                      )}
                    </Button>
                  </div>

                  {insights && (
                    <div className="space-y-6">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-white rounded-xl border-0 shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm text-green-700">
                                  Cash Flow
                                </div>
                                <div className="text-lg font-bold text-green-900">
                                  {formatCurrency(insights.cashFlow.current)}
                                </div>
                                <div className="text-xs text-green-600">
                                  {insights.cashFlow.change > 0 ? "+" : ""}
                                  {insights.cashFlow.change}%
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white rounded-xl border-0 shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm text-blue-700">
                                  Runway
                                </div>
                                <div className="text-lg font-bold text-blue-900">
                                  {insights.runway.current} months
                                </div>
                                <div className="text-xs text-blue-600">
                                  {insights.runway.change > 0 ? "+" : ""}
                                  {insights.runway.change} months
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white rounded-xl border-0 shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-100 rounded-lg">
                                <TrendingDown className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <div className="text-sm text-orange-700">
                                  Burn Rate
                                </div>
                                <div className="text-lg font-bold text-orange-900">
                                  {formatCurrency(insights.burnRate.current)}
                                </div>
                                <div className="text-xs text-orange-600">
                                  {insights.burnRate.change > 0 ? "+" : ""}
                                  {insights.burnRate.change}%
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white rounded-xl border-0 shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <div className="text-sm text-purple-700">
                                  Revenue
                                </div>
                                <div className="text-lg font-bold text-purple-900">
                                  {formatCurrency(insights.revenue.current)}
                                </div>
                                <div className="text-xs text-purple-600">
                                  {insights.revenue.change > 0 ? "+" : ""}
                                  {insights.revenue.change}%
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Recommendations */}
                      <Card className="bg-white rounded-xl border-0 shadow-lg">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-[#607c47]" />
                            AI Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            {insights.recommendations.map(
                              (rec: AIRecommendation, index: number) => (
                                <div
                                  key={index}
                                  className="border border-gray-200 rounded-lg p-4"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-semibold text-[#2C2C2C]">
                                      {rec.title}
                                    </h4>
                                    <Badge
                                      className={
                                        rec.priority === "High"
                                          ? "bg-red-100 text-red-800"
                                          : rec.priority === "Medium"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                      }
                                    >
                                      {rec.priority} Priority
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {rec.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs">
                                    <span className="text-green-600 font-medium">
                                      Impact: {rec.impact}
                                    </span>
                                    <span className="text-gray-500">
                                      Effort: {rec.effort}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Alerts */}
                      <Card className="bg-white rounded-xl border-0 shadow-lg">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-[#607c47]" />
                            AI Alerts
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {insights.alerts.map(
                              (alert: AIAlert, index: number) => (
                                <div
                                  key={index}
                                  className={`p-3 rounded-lg border-l-4 ${
                                    alert.type === "warning"
                                      ? "bg-yellow-50 border-yellow-400"
                                      : alert.type === "error"
                                        ? "bg-red-50 border-red-400"
                                        : "bg-blue-50 border-blue-400"
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    {alert.type === "warning" ? (
                                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                    ) : alert.type === "error" ? (
                                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-[#2C2C2C]">
                                        {alert.title}
                                      </h4>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {alert.message}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-2">
                                        Action: {alert.action}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {/* Scenarios Tab */}
              {activeTab === "scenarios" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[#2C2C2C]">
                      What-If Scenario Analysis
                    </h2>
                  </div>

                  <Card className="bg-white rounded-xl border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                        <Target className="h-5 w-5 text-[#607c47]" />
                        Scenario Input
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div>
                          <Label
                            htmlFor="scenario"
                            className="text-sm font-medium text-[#2C2C2C]"
                          >
                            Describe your scenario
                          </Label>
                          <Input
                            id="scenario"
                            placeholder="e.g., What happens if we hire 2 engineers at $150k/year each?"
                            value={scenario}
                            onChange={(e) => setScenario(e.target.value)}
                            className="mt-2"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={runScenario}
                            disabled={scenarioLoading || !scenario.trim()}
                            className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                          >
                            {scenarioLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-2" />
                                Run Scenario
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Example Scenarios */}
                  <Card className="bg-white rounded-xl border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-[#607c47]" />
                        Example Scenarios
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {exampleScenarios.map((example, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            onClick={() => setScenario(example)}
                            className="text-left h-auto p-3 border-gray-300 text-[#2C2C2C] hover:bg-gray-50"
                          >
                            <div className="text-sm">{example}</div>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scenario Results */}
                  {scenarioResult && (
                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-[#607c47]" />
                          Scenario Analysis Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">
                              Scenario
                            </h4>
                            <p className="text-sm text-blue-700">
                              {scenarioResult.scenario}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-600">
                                Cash Flow Impact
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  scenarioResult.impact.cashFlow >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {scenarioResult.impact.cashFlow >= 0 ? "+" : ""}
                                {formatCurrency(scenarioResult.impact.cashFlow)}
                              </div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-600">
                                Runway Change
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  scenarioResult.impact.runway >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {scenarioResult.impact.runway >= 0 ? "+" : ""}
                                {scenarioResult.impact.runway.toFixed(1)} months
                              </div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-600">
                                Burn Rate Change
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  scenarioResult.impact.burnRate >= 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {scenarioResult.impact.burnRate >= 0 ? "+" : ""}
                                {formatCurrency(scenarioResult.impact.burnRate)}
                              </div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-600">
                                Revenue Impact
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  scenarioResult.impact.revenue >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {scenarioResult.impact.revenue >= 0 ? "+" : ""}
                                {formatCurrency(scenarioResult.impact.revenue)}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-[#2C2C2C] mb-2">
                                Recommendations
                              </h4>
                              <ul className="space-y-1">
                                {scenarioResult.recommendations.map(
                                  (rec: string, index: number) => (
                                    <li
                                      key={index}
                                      className="text-sm text-gray-600 flex items-start gap-2"
                                    >
                                      <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                                      {rec}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#2C2C2C] mb-2">
                                Risks
                              </h4>
                              <ul className="space-y-1">
                                {scenarioResult.risks.map(
                                  (risk: string, index: number) => (
                                    <li
                                      key={index}
                                      className="text-sm text-gray-600 flex items-start gap-2"
                                    >
                                      <AlertTriangle className="h-3 w-3 text-yellow-500 mt-1 shrink-0" />
                                      {risk}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Forecasting Tab */}
              {activeTab === "forecasting" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[#2C2C2C]">
                      AI Financial Forecasting
                    </h2>
                    <div className="flex gap-2">
                      <Select
                        value={forecastPeriod}
                        onValueChange={(
                          value: "3months" | "6months" | "12months"
                        ) => setForecastPeriod(value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3months">3 Months</SelectItem>
                          <SelectItem value="6months">6 Months</SelectItem>
                          <SelectItem value="12months">12 Months</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={generateForecast}
                        disabled={forecastLoading}
                        className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                      >
                        {forecastLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Forecasting...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Generate Forecast
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {forecastData && (
                    <div className="space-y-6">
                      {/* Forecast Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-white rounded-xl border-0 shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm text-green-700">
                                  Projected Revenue
                                </div>
                                <div className="text-lg font-bold text-green-900">
                                  {formatCurrency(
                                    forecastData.revenue.projected[
                                      forecastData.revenue.projected.length - 1
                                    ]?.amount || 0
                                  )}
                                </div>
                                <div className="text-xs text-green-600">
                                  Month {forecastData.months}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white rounded-xl border-0 shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-100 rounded-lg">
                                <TrendingDown className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <div className="text-sm text-orange-700">
                                  Projected Expenses
                                </div>
                                <div className="text-lg font-bold text-orange-900">
                                  {formatCurrency(
                                    forecastData.expenses.projected[
                                      forecastData.expenses.projected.length - 1
                                    ]?.amount || 0
                                  )}
                                </div>
                                <div className="text-xs text-orange-600">
                                  Month {forecastData.months}
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
                                  Projected Cash Flow
                                </div>
                                <div className="text-lg font-bold text-blue-900">
                                  {formatCurrency(
                                    forecastData.cashFlow.projected[
                                      forecastData.cashFlow.projected.length - 1
                                    ]?.amount || 0
                                  )}
                                </div>
                                <div className="text-xs text-blue-600">
                                  Month {forecastData.months}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white rounded-xl border-0 shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <div className="text-sm text-purple-700">
                                  Projected Runway
                                </div>
                                <div className="text-lg font-bold text-purple-900">
                                  {forecastData.runway.projected.toFixed(1)}{" "}
                                  months
                                </div>
                                <div className="text-xs text-purple-600">
                                  Extended
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* AI Insights */}
                      <Card className="bg-white rounded-xl border-0 shadow-lg">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                            <Brain className="h-5 w-5 text-[#607c47]" />
                            AI Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {forecastData.insights.map(
                              (insight: string, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg"
                                >
                                  <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                                  <p className="text-sm text-blue-800">
                                    {insight}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Risk Factors */}
                      <Card className="bg-white rounded-xl border-0 shadow-lg">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-[#607c47]" />
                            Risk Factors
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {forecastData.risks.map(
                              (risk: string, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg"
                                >
                                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                                  <p className="text-sm text-yellow-800">
                                    {risk}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Strategic Recommendations */}
                      <Card className="bg-white rounded-xl border-0 shadow-lg">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                            <Target className="h-5 w-5 text-[#607c47]" />
                            Strategic Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {forecastData.recommendations.map(
                              (rec: string, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 p-3 bg-green-50 rounded-lg"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                  <p className="text-sm text-green-800">
                                    {rec}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
