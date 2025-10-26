'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, 
  Zap, 
  TrendingDown, 
  TrendingUp, 
  Lightbulb, 
  AlertTriangle,
  CheckCircle,
  Search,
  Brain,
  Target,
  DollarSign,
  Calendar,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AICopilotPage() {
  const [activeTab, setActiveTab] = useState<'insights' | 'scenarios' | 'forecasting'>('insights');
  
  // Insights state
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  // Scenarios state
  const [scenario, setScenario] = useState('');
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  
  // Forecasting state
  const [forecastData, setForecastData] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastPeriod, setForecastPeriod] = useState<'3months' | '6months' | '12months'>('6months');

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
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      const mockInsights = {
        cashFlow: {
          current: 287500,
          projected: 312000,
          change: 8.5
        },
        runway: {
          current: 8.2,
          projected: 9.1,
          change: 0.9
        },
        burnRate: {
          current: 35000,
          projected: 32000,
          change: -8.6
        },
        revenue: {
          current: 45200,
          projected: 52000,
          change: 15.0
        },
        recommendations: [
          {
            title: "Optimize SaaS Subscriptions",
            description: "Review and consolidate unused software licenses",
            impact: "Save $2,100/month",
            effort: "Low",
            priority: "High"
          },
          {
            title: "Implement Usage-Based Pricing",
            description: "Introduce tiered pricing to increase ARPU",
            impact: "Increase revenue by 25%",
            effort: "Medium",
            priority: "High"
          },
          {
            title: "Hire Customer Success Manager",
            description: "Reduce churn and increase customer satisfaction",
            impact: "Reduce churn by 2%",
            effort: "High",
            priority: "Medium"
          }
        ],
        alerts: [
          {
            type: "warning",
            message: "Burn rate trending up 5% this month",
            action: "Review contractor costs"
          },
          {
            type: "info",
            message: "Customer acquisition cost decreasing",
            action: "Consider scaling marketing spend"
          }
        ]
      };
      
      setInsights(mockInsights);
        toast.success('AI insights generated successfully!');
    } catch (error) {
      console.error('Failed to generate insights:', error);
      toast.error('Failed to generate insights');
    } finally {
      setInsightsLoading(false);
    }
  };

  const runScenario = async () => {
    if (!scenario.trim()) return;

    setScenarioLoading(true);
    try {
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate API call
      
      const mockResult = {
        scenario: scenario,
        impact: {
          runway: {
            current: 8.2,
            new: 6.8,
            change: -1.4
          },
          burnRate: {
            current: 35000,
            new: 42000,
            change: 20.0
          },
          cashFlow: {
            current: 287500,
            new: 245000,
            change: -14.8
          }
        },
        analysis: "This scenario would significantly impact your runway. The increased burn rate from hiring would reduce your runway by 1.4 months. Consider the timing carefully and ensure you have sufficient funding runway.",
        recommendations: [
          "Consider hiring in phases to spread the cost impact",
          "Ensure you have at least 6 months of runway before hiring",
          "Negotiate equity-heavy compensation to reduce cash burn",
          "Consider contract-to-hire arrangements initially"
        ],
        riskLevel: "High"
      };
      
      setScenarioResult(mockResult);
      toast.success('Scenario analysis completed!');
    } catch (error) {
      console.error('Failed to run scenario:', error);
      toast.error('Failed to run scenario');
    } finally {
      setScenarioLoading(false);
    }
  };

  const generateForecast = async () => {
    setForecastLoading(true);
    try {
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate API call
      
      const periods = {
        '3months': 3,
        '6months': 6,
        '12months': 12
      };
      
      const months = periods[forecastPeriod];
      const forecastResult = {
        period: forecastPeriod,
        months: months,
        revenue: {
          current: 52000,
          projected: Array.from({ length: months }, (_, i) => ({
            month: `Month ${i + 1}`,
            amount: 52000 + (i * 3000) + Math.random() * 2000,
            growth: 5 + Math.random() * 10
          }))
        },
        expenses: {
          current: 2905000, // ₹29.1L
          projected: Array.from({ length: months }, (_, i) => ({
            month: `Month ${i + 1}`,
            amount: 2905000 + (i * 83000) + Math.random() * 83000, // ₹29.1L base + growth
            growth: 2 + Math.random() * 5
          }))
        },
        cashFlow: {
          current: 1410000, // ₹14.1L
          projected: Array.from({ length: months }, (_, i) => ({
            month: `Month ${i + 1}`,
            amount: 1410000 + (i * 166000) + Math.random() * 83000, // ₹14.1L base + growth
            cumulative: 23862500 + (i * 166000) + Math.random() * 83000 // ₹2.39Cr base
          }))
        },
        runway: {
          current: 8.2,
          projected: 8.2 + (months * 0.3) + Math.random() * 0.5
        },
        insights: [
          "Revenue growth is projected to accelerate in Q2 due to seasonal trends",
          "Expense growth is manageable and within budget constraints",
          "Cash runway extends to 12+ months under current projections",
          "Consider investing surplus cash in growth initiatives"
        ],
        risks: [
          "Market volatility could impact revenue projections",
          "Unexpected expenses could reduce runway",
          "Customer acquisition costs may increase",
          "Competition could pressure pricing"
        ],
        recommendations: [
          "Implement revenue optimization strategies",
          "Monitor expense growth closely",
          "Prepare contingency plans for market changes",
          "Consider fundraising timeline based on runway projections"
        ]
      };
      
      setForecastData(forecastResult);
      toast.success('Financial forecast generated!');
    } catch (error) {
      console.error('Failed to generate forecast:', error);
      toast.error('Failed to generate forecast');
    } finally {
      setForecastLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="bg-gray-50 flex">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
          {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">AI CFO Copilot</h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Intelligent financial insights and scenario planning
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search insights..." className="pl-10 bg-white rounded-lg" />
                  </div>
                </div>
              </div>

              {/* AI Status Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Brain className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">AI CFO Copilot</h3>
                      <p className="text-sm text-blue-700">Advanced financial analysis • Scenario modeling • Strategic insights</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Analysis
                  </div>
                </div>
          </div>

          {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200">
                <Button
              onClick={() => setActiveTab('insights')}
                  variant={activeTab === 'insights' ? 'default' : 'ghost'}
                  className={activeTab === 'insights' ? 'bg-[#607c47] hover:bg-[#4a6129] text-white' : 'text-[#2C2C2C] hover:bg-gray-100'}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
              Financial Insights
                </Button>
                <Button
              onClick={() => setActiveTab('scenarios')}
                  variant={activeTab === 'scenarios' ? 'default' : 'ghost'}
                  className={activeTab === 'scenarios' ? 'bg-[#607c47] hover:bg-[#4a6129] text-white' : 'text-[#2C2C2C] hover:bg-gray-100'}
                >
                  <Target className="h-4 w-4 mr-2" />
              What-If Scenarios
                </Button>
                <Button
                  onClick={() => setActiveTab('forecasting')}
                  variant={activeTab === 'forecasting' ? 'default' : 'ghost'}
                  className={activeTab === 'forecasting' ? 'bg-[#607c47] hover:bg-[#4a6129] text-white' : 'text-[#2C2C2C] hover:bg-gray-100'}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  AI Forecasting
                </Button>
          </div>

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
                  {/* Generate Insights Button */}
                  <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
                    <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                          <h3 className="text-lg font-semibold text-purple-900 mb-2">Generate AI Insights</h3>
                          <p className="text-sm text-purple-700">Get personalized financial recommendations based on your data</p>
                  </div>
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
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Insights
                      </>
                    )}
                  </Button>
                </div>
                    </CardContent>
              </Card>

                  {/* Insights Results */}
              {insights && (
                <div className="space-y-6">
                  {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm text-green-700">Cash Flow</div>
                                <div className="text-lg font-bold text-green-900">
                                  {formatCurrency(insights.cashFlow.projected)}
                                </div>
                                <div className="text-xs text-green-600">
                                  {insights.cashFlow.change > 0 ? '+' : ''}{insights.cashFlow.change}%
                                </div>
                              </div>
                            </div>
                          </CardContent>
                    </Card>

                        <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm text-blue-700">Runway</div>
                                <div className="text-lg font-bold text-blue-900">
                                  {insights.runway.projected} mo
                                </div>
                                <div className="text-xs text-blue-600">
                                  {insights.runway.change > 0 ? '+' : ''}{insights.runway.change} mo
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
                                <div className="text-sm text-red-700">Burn Rate</div>
                                <div className="text-lg font-bold text-red-900">
                                  {formatCurrency(insights.burnRate.projected)}
                                </div>
                                <div className="text-xs text-red-600">
                                  {insights.burnRate.change > 0 ? '+' : ''}{insights.burnRate.change}%
                                </div>
                              </div>
                    </div>
                          </CardContent>
                  </Card>

                        <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-yellow-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-yellow-600" />
                              </div>
                              <div>
                                <div className="text-sm text-yellow-700">Revenue</div>
                                <div className="text-lg font-bold text-yellow-900">
                                  {formatCurrency(insights.revenue.projected)}
                                </div>
                                <div className="text-xs text-yellow-600">
                                  {insights.revenue.change > 0 ? '+' : ''}{insights.revenue.change}%
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Recommendations */}
                      <Card className="rounded-xl border-0 shadow-lg bg-white">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-[#607c47]" />
                            AI Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            {insights.recommendations.map((rec: any, index: number) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-[#2C2C2C]">{rec.title}</h4>
                                  <div className="flex gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      rec.priority === 'High' ? 'bg-red-100 text-red-700' :
                                      rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {rec.priority}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      rec.effort === 'Low' ? 'bg-green-100 text-green-700' :
                                      rec.effort === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {rec.effort} effort
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                                <p className="text-sm font-medium text-[#607c47]">{rec.impact}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                    </Card>

                      {/* Alerts */}
                      <Card className="rounded-xl border-0 shadow-lg bg-white">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            AI Alerts
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {insights.alerts.map((alert: any, index: number) => (
                              <div key={index} className={`p-3 rounded-lg border-l-4 ${
                                alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                                alert.type === 'critical' ? 'bg-red-50 border-red-400' :
                                'bg-blue-50 border-blue-400'
                              }`}>
                                <div className="flex items-start gap-2">
                                  {alert.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" /> :
                                   alert.type === 'critical' ? <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" /> :
                                   <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />}
                                  <div>
                                    <p className="text-sm font-medium text-[#2C2C2C]">{alert.message}</p>
                                    <p className="text-xs text-gray-600 mt-1">{alert.action}</p>
                                  </div>
                                </div>
                      </div>
                            ))}
                          </div>
                        </CardContent>
                    </Card>
                </div>
              )}
            </div>
          )}

          {/* Scenarios Tab */}
          {activeTab === 'scenarios' && (
            <div className="space-y-6">
                  {/* Scenario Input */}
                  <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-medium text-indigo-900 flex items-center gap-2">
                        <Target className="h-5 w-5 text-indigo-600" />
                        What-If Scenario Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                          <Label htmlFor="scenario" className="text-sm font-medium text-[#2C2C2C]">
                            Describe your scenario
                          </Label>
                    <Input
                      id="scenario"
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                            placeholder="e.g., What happens if we hire 2 engineers at $150k/year each?"
                            className="mt-2 bg-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={runScenario}
                            disabled={!scenario.trim() || scenarioLoading}
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
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-[#2C2C2C] mb-4">Example Scenarios</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {exampleScenarios.map((example, index) => (
                        <button
                          key={index}
                          onClick={() => setScenario(example)}
                          className="h-auto p-3 text-left justify-start border border-gray-200 bg-white rounded-lg text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all text-sm"
                        >
                          <span>{example}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scenario Results */}
                  {scenarioResult && (
                    <Card className="rounded-xl border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                          <Target className="h-5 w-5 text-[#607c47]" />
                          Scenario Analysis Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-6">
                        {/* Scenario Description */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-[#2C2C2C] mb-2">Scenario</h4>
                          <p className="text-sm text-gray-600">{scenarioResult.scenario}</p>
                        </div>

                        {/* Impact Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-700">Runway</span>
                            </div>
                            <div className="text-lg font-bold text-blue-900">
                              {scenarioResult.impact.runway.new} mo
                            </div>
                            <div className="text-xs text-blue-600">
                              {scenarioResult.impact.runway.change > 0 ? '+' : ''}{scenarioResult.impact.runway.change} mo
                            </div>
                          </div>

                          <div className="bg-red-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium text-red-700">Burn Rate</span>
                            </div>
                            <div className="text-lg font-bold text-red-900">
                              {formatCurrency(scenarioResult.impact.burnRate.new)}
                            </div>
                            <div className="text-xs text-red-600">
                              {scenarioResult.impact.burnRate.change > 0 ? '+' : ''}{scenarioResult.impact.burnRate.change}%
                            </div>
                          </div>

                          <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">Cash Flow</span>
                            </div>
                            <div className="text-lg font-bold text-green-900">
                              {formatCurrency(scenarioResult.impact.cashFlow.new)}
                            </div>
                            <div className="text-xs text-green-600">
                              {scenarioResult.impact.cashFlow.change > 0 ? '+' : ''}{scenarioResult.impact.cashFlow.change}%
                            </div>
                          </div>
                        </div>

                        {/* Analysis */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-[#2C2C2C] mb-2">AI Analysis</h4>
                          <p className="text-sm text-gray-600">{scenarioResult.analysis}</p>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-[#2C2C2C] mb-3">Recommendations</h4>
                          <ul className="space-y-2">
                            {scenarioResult.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-[#607c47] mt-1">→</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Risk Level */}
                        <div className={`rounded-lg p-4 ${
                          scenarioResult.riskLevel === 'High' ? 'bg-red-50 border border-red-200' :
                          scenarioResult.riskLevel === 'Medium' ? 'bg-yellow-50 border border-yellow-200' :
                          'bg-green-50 border border-green-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${
                              scenarioResult.riskLevel === 'High' ? 'text-red-600' :
                              scenarioResult.riskLevel === 'Medium' ? 'text-yellow-600' :
                              'text-green-600'
                            }`} />
                            <span className="font-semibold text-[#2C2C2C]">Risk Level: {scenarioResult.riskLevel}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Forecasting Tab */}
              {activeTab === 'forecasting' && (
                <div className="space-y-6">
                  {/* Forecast Generation */}
                  <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-medium text-indigo-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        AI Financial Forecasting
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <Label htmlFor="forecast-period" className="text-sm font-medium text-[#2C2C2C]">
                              Forecast Period
                            </Label>
                            <Select value={forecastPeriod} onValueChange={(value: any) => setForecastPeriod(value)}>
                              <SelectTrigger className="w-[200px] mt-2 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3months">3 Months</SelectItem>
                                <SelectItem value="6months">6 Months</SelectItem>
                                <SelectItem value="12months">12 Months</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={generateForecast}
                            disabled={forecastLoading}
                            className="bg-[#607c47] hover:bg-[#4a6129] text-white mt-6"
                          >
                            {forecastLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Generating...
                      </>
                    ) : (
                      <>
                                <Brain className="h-4 w-4 mr-2" />
                                Generate Forecast
                      </>
                    )}
                  </Button>
                </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Forecast Results */}
                  {forecastData && (
                    <div className="space-y-6">
                      {/* Forecast Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-green-600" />
                              </div>
                        <div>
                                <div className="text-sm text-green-700">Projected Revenue</div>
                                <div className="text-lg font-bold text-green-900">
                                  {formatCurrency(forecastData.revenue.projected[forecastData.months - 1]?.amount || 0)}
                                </div>
                                <div className="text-xs text-green-600">
                                  +{forecastData.revenue.projected[forecastData.months - 1]?.growth?.toFixed(1)}% growth
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
                                <div className="text-sm text-red-700">Projected Expenses</div>
                                <div className="text-lg font-bold text-red-900">
                                  {formatCurrency(forecastData.expenses.projected[forecastData.months - 1]?.amount || 0)}
                                </div>
                                <div className="text-xs text-red-600">
                                  +{forecastData.expenses.projected[forecastData.months - 1]?.growth?.toFixed(1)}% growth
                                </div>
                        </div>
                      </div>
                          </CardContent>
                        </Card>

                        <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-blue-600" />
                              </div>
                        <div>
                                <div className="text-sm text-blue-700">Projected Runway</div>
                                <div className="text-lg font-bold text-blue-900">
                                  {forecastData.runway.projected.toFixed(1)} mo
                                </div>
                                <div className="text-xs text-blue-600">
                                  +{(forecastData.runway.projected - forecastData.runway.current).toFixed(1)} mo change
                        </div>
                      </div>
                    </div>
                          </CardContent>
                  </Card>

                        <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <div className="text-sm text-purple-700">Cash Flow Growth</div>
                                <div className="text-lg font-bold text-purple-900">
                                  {formatCurrency(forecastData.cashFlow.projected[forecastData.months - 1]?.amount || 0)}
                                </div>
                                <div className="text-xs text-purple-600">Monthly projection</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Forecast Insights */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-white rounded-xl border-0 shadow-lg">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                              <Lightbulb className="h-5 w-5 text-[#607c47]" />
                              AI Insights
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              {forecastData.insights.map((insight: string, index: number) => (
                                <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                  <span className="text-[#607c47] mt-1">→</span>
                                  <span>{insight}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                    </Card>

                        <Card className="bg-white rounded-xl border-0 shadow-lg">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-orange-500" />
                              Risk Factors
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              {forecastData.risks.map((risk: string, index: number) => (
                                <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                  <span className="text-orange-500 mt-1">⚠</span>
                                  <span>{risk}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Forecast Recommendations */}
                      <Card className="bg-white rounded-xl border-0 shadow-lg">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                            <Target className="h-5 w-5 text-[#607c47]" />
                            Strategic Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {forecastData.recommendations.map((rec: string, index: number) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                  <div className="p-1 bg-[#607c47] rounded-full">
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  </div>
                                  <span className="text-sm text-gray-700">{rec}</span>
                                </div>
                              </div>
                            ))}
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