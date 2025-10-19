'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  Zap, 
  TrendingDown, 
  TrendingUp, 
  Lightbulb, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AICopilotPage() {
  const [activeTab, setActiveTab] = useState<'insights' | 'scenarios'>('insights');
  
  // Insights state
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  // Scenarios state
  const [scenario, setScenario] = useState('');
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);

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
        keyMetrics: {
          totalBalance: 127450,
          monthlyBurn: 15400,
          monthlyRevenue: 45200,
          runway: 8.2
        },
        cashflowHealth: "Your cashflow is healthy with a positive net cashflow of $29,800/month. The AI CFO recommends maintaining current growth trajectory while monitoring burn rate closely. Your runway of 8.2 months provides adequate buffer for strategic investments.",
        burnAnalysis: "Current burn rate of $15,400/month is 12% above forecast. Primary drivers: increased contractor costs (+$2,100), new SaaS tools (+$800), and office rent (+$1,200). Consider optimizing contractor utilization and reviewing SaaS subscriptions.",
        costSavingSuggestions: [
          "Cancel unused Slack Pro licenses: Save $240/month",
          "Switch to annual billing for Figma: Save $180/month", 
          "Optimize AWS usage: Potential $400/month savings",
          "Negotiate better rates with contractors: Save $1,200/month"
        ],
        revenueOpportunities: [
          "Implement usage-based pricing: +15% revenue potential",
          "Expand to enterprise tier: +$5,000/month ARR",
          "Launch partner program: +$2,000/month",
          "Optimize conversion funnel: +8% revenue growth"
        ]
      };
      
      setInsights(mockInsights);
      toast.success('AI insights generated successfully!');
    } catch (error: any) {
      toast.error('Failed to generate insights');
    } finally {
      setInsightsLoading(false);
    }
  };

  const runScenario = async () => {
    if (!scenario.trim()) {
      toast.error('Please enter a scenario to analyze');
      return;
    }

    setScenarioLoading(true);
    try {
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate AI analysis
      
      const mockScenarioResult = {
        scenario: scenario,
        explanation: "Based on your current financial data and growth patterns, here's how this scenario would impact your business:",
        impact: {
          burnRateChange: scenario.includes('hire') ? "Monthly burn increases by $8,000 (from $15,400 to $23,400)" : 
                        scenario.includes('reduce') ? "Monthly burn decreases by $1,500 (from $15,400 to $13,900)" :
                        scenario.includes('revenue') ? "Monthly revenue increases by $9,040 (from $45,200 to $54,240)" :
                        scenario.includes('funding') ? "Cash balance increases by $500,000, extending runway significantly" :
                        "Burn rate decreases by $4,620 (from $15,400 to $10,780)",
          runwayChange: scenario.includes('hire') ? "Runway reduces from 8.2 months to 6.1 months" :
                       scenario.includes('reduce') ? "Runway extends from 8.2 months to 9.1 months" :
                       scenario.includes('revenue') ? "Runway extends from 8.2 months to 10.4 months" :
                       scenario.includes('funding') ? "Runway extends from 8.2 months to 18.7 months" :
                       "Runway extends from 8.2 months to 11.8 months",
          recommendation: scenario.includes('hire') ? "Consider hiring if revenue growth can support increased burn. Monitor runway closely." :
                         scenario.includes('reduce') ? "Excellent cost optimization opportunity. Implement immediately." :
                         scenario.includes('revenue') ? "Focus on achieving this growth through marketing and product improvements." :
                         scenario.includes('funding') ? "Perfect timing for fundraising. Use extended runway for growth initiatives." :
                         "Good cost-cutting strategy. Monitor impact on growth metrics."
        },
        risks: scenario.includes('hire') ? [
          "Increased burn rate reduces financial runway",
          "Higher fixed costs reduce flexibility",
          "May need additional funding sooner"
        ] : scenario.includes('reduce') ? [
          "Potential impact on team productivity",
          "May slow down development velocity"
        ] : scenario.includes('revenue') ? [
          "Aggressive growth targets may be unrealistic",
          "Increased customer acquisition costs",
          "Potential quality issues with rapid scaling"
        ] : scenario.includes('funding') ? [
          "Dilution of equity",
          "Pressure to meet investor expectations",
          "Increased reporting requirements"
        ] : [
          "Reduced marketing reach",
          "Potential impact on brand awareness",
          "May slow customer acquisition"
        ],
        opportunities: scenario.includes('hire') ? [
          "Faster product development",
          "Better customer support",
          "Increased revenue potential"
        ] : scenario.includes('reduce') ? [
          "Improved profit margins",
          "Extended runway for strategic investments",
          "Better cash flow management"
        ] : scenario.includes('revenue') ? [
          "Higher valuation potential",
          "Better unit economics",
          "Increased market share"
        ] : scenario.includes('funding') ? [
          "Accelerated growth",
          "Competitive advantage",
          "Ability to hire top talent"
        ] : [
          "Improved efficiency",
          "Better ROI on marketing spend",
          "Focus on high-converting channels"
        ]
      };
      
      setScenarioResult(mockScenarioResult);
      toast.success('Scenario analyzed successfully!');
    } catch (error: any) {
      toast.error('Failed to analyze scenario');
    } finally {
      setScenarioLoading(false);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              AI CFO Copilot
            </h1>
            <p className="text-muted-foreground mt-1">
              Get AI-powered financial insights and run scenario analysis
            </p>
          </div>

          {/* Demo Mode Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">AI CFO Demo Mode</h3>
                  <p className="text-sm text-blue-700">Experience AI-powered financial analysis with mock data • Live AI integration coming soon</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                Mock Analysis
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('insights')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'insights'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Financial Insights
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'scenarios'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              What-If Scenarios
            </button>
          </div>

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Generate AI Insights</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Analyze your financial data and get actionable recommendations
                    </p>
                  </div>
                  <Button onClick={generateInsights} disabled={insightsLoading}>
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
              </Card>

              {insights && (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-6">
                      <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                      <h3 className="text-2xl font-bold">
                        ${insights.keyMetrics.totalBalance.toLocaleString()}
                      </h3>
                    </Card>
                    <Card className="p-6">
                      <p className="text-sm text-muted-foreground mb-1">Monthly Burn</p>
                      <h3 className="text-2xl font-bold text-red-500">
                        ${insights.keyMetrics.monthlyBurn.toLocaleString()}
                      </h3>
                    </Card>
                    <Card className="p-6">
                      <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
                      <h3 className="text-2xl font-bold text-green-500">
                        ${insights.keyMetrics.monthlyRevenue.toLocaleString()}
                      </h3>
                    </Card>
                    <Card className="p-6">
                      <p className="text-sm text-muted-foreground mb-1">Runway</p>
                      <h3 className="text-2xl font-bold">
                        {insights.keyMetrics.runway ? `${insights.keyMetrics.runway.toFixed(1)}mo` : '∞'}
                      </h3>
                    </Card>
                  </div>

                  {/* Cashflow Health */}
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Cashflow Health</h3>
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
                    {/* Cost Saving Suggestions */}
                    <Card className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="h-5 w-5 text-green-500" />
                        <h3 className="font-semibold">Cost Saving Suggestions</h3>
                      </div>
                      <ul className="space-y-2">
                        {insights.costSavingSuggestions?.map((suggestion: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">💡</span>
                            <span className="text-sm text-muted-foreground">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>

                    {/* Revenue Opportunities */}
                    <Card className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold">Revenue Opportunities</h3>
                      </div>
                      <ul className="space-y-2">
                        {insights.revenueOpportunities?.map((opportunity: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">📈</span>
                            <span className="text-sm text-muted-foreground">{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scenarios Tab */}
          {activeTab === 'scenarios' && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scenario">Describe your scenario</Label>
                    <Input
                      id="scenario"
                      placeholder="What happens if we hire 2 engineers at $150k/year each?"
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Describe a change you're considering and let AI analyze the financial impact
                    </p>
                  </div>

                  {/* Example Scenarios */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Try these examples:</p>
                    <div className="flex flex-wrap gap-2">
                      {exampleScenarios.map((example, index) => (
                        <button
                          key={index}
                          onClick={() => setScenario(example)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={runScenario} disabled={scenarioLoading} className="w-full">
                    {scenarioLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Run Scenario Analysis
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {scenarioResult && (
                <div className="space-y-6">
                  {/* Scenario Summary */}
                  <Card className="p-6 bg-primary/5 border-primary/20">
                    <h3 className="font-semibold text-lg mb-2">{scenarioResult.scenario}</h3>
                    <p className="text-sm text-muted-foreground">
                      {scenarioResult.explanation}
                    </p>
                  </Card>

                  {/* Impact Analysis */}
                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Financial Impact</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                        <TrendingDown className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Burn Rate Change</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {scenarioResult.impact.burnRateChange}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                        <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Runway Impact</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {scenarioResult.impact.runwayChange}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-primary">AI Recommendation</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {scenarioResult.impact.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Risks */}
                    <Card className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <h3 className="font-semibold">Potential Risks</h3>
                      </div>
                      <ul className="space-y-2">
                        {scenarioResult.risks?.map((risk: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-1">⚠️</span>
                            <span className="text-sm text-muted-foreground">{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>

                    {/* Opportunities */}
                    <Card className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-green-500" />
                        <h3 className="font-semibold">Potential Opportunities</h3>
                      </div>
                      <ul className="space-y-2">
                        {scenarioResult.opportunities?.map((opportunity: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✨</span>
                            <span className="text-sm text-muted-foreground">{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

