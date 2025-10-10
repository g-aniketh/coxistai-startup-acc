'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Play,
  Plus,
  Calendar,
} from 'lucide-react';
import MagicBento from '@/components/MagicBento';
import SpotlightCard from '@/components/SpotlightCard';
import { Badge } from '@/components/ui/Badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function ForecastingPage() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showScenarioForm, setShowScenarioForm] = useState(false);
  const [scenarioInputs, setScenarioInputs] = useState({
    name: '',
    revenueChange: 0,
    expenseChange: 0,
    newHires: 0,
    averageSalary: 0,
    additionalFunding: 0,
    timeHorizon: 12,
  });

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const response = await apiClient.dashboard.getScenarios();
      if (response.success && response.data) {
        setScenarios(response.data);
      }
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateForecast = async () => {
    try {
      setGenerating(true);
      const response = await apiClient.dashboard.forecast(12);
      if (response.success) {
        await loadScenarios();
      }
    } catch (error) {
      console.error('Failed to generate forecast:', error);
    } finally {
      setGenerating(false);
    }
  };

  const runScenario = async () => {
    if (!scenarioInputs.name) return;

    try {
      setGenerating(true);
      const response = await apiClient.dashboard.runScenario(scenarioInputs.name, {
        revenueChange: scenarioInputs.revenueChange || undefined,
        expenseChange: scenarioInputs.expenseChange || undefined,
        newHires: scenarioInputs.newHires || undefined,
        averageSalary: scenarioInputs.averageSalary || undefined,
        additionalFunding: scenarioInputs.additionalFunding || undefined,
        timeHorizon: scenarioInputs.timeHorizon || 12,
      });

      if (response.success) {
        await loadScenarios();
        setShowScenarioForm(false);
        setScenarioInputs({
          name: '',
          revenueChange: 0,
          expenseChange: 0,
          newHires: 0,
          averageSalary: 0,
          additionalFunding: 0,
          timeHorizon: 12,
        });
      }
    } catch (error) {
      console.error('Failed to run scenario:', error);
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const bentoItems = [
    // Header
    {
      className: 'col-span-12',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI-Powered Forecasting</h1>
            <p className="text-muted-foreground mt-1">
              Run what-if scenarios and predict your financial future
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowScenarioForm(!showScenarioForm)}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80"
            >
              <Plus className="h-4 w-4" />
              New Scenario
            </button>
            <button
              onClick={generateForecast}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              <Sparkles className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'AI Forecast'}
            </button>
          </div>
        </div>
      ),
    },

    // Scenario Form
    ...(showScenarioForm
      ? [
          {
            className: 'col-span-12',
            background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
            content: (
              <div className="p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Create What-If Scenario</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Scenario Name *
                    </label>
                    <input
                      type="text"
                      value={scenarioInputs.name}
                      onChange={(e) => setScenarioInputs({ ...scenarioInputs, name: e.target.value })}
                      placeholder="e.g., Hire 3 Engineers"
                      className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Revenue Change (%)
                    </label>
                    <input
                      type="number"
                      value={scenarioInputs.revenueChange}
                      onChange={(e) => setScenarioInputs({ ...scenarioInputs, revenueChange: Number(e.target.value) })}
                      className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Expense Change (%)
                    </label>
                    <input
                      type="number"
                      value={scenarioInputs.expenseChange}
                      onChange={(e) => setScenarioInputs({ ...scenarioInputs, expenseChange: Number(e.target.value) })}
                      className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      New Hires
                    </label>
                    <input
                      type="number"
                      value={scenarioInputs.newHires}
                      onChange={(e) => setScenarioInputs({ ...scenarioInputs, newHires: Number(e.target.value) })}
                      className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Average Salary/Month ($)
                    </label>
                    <input
                      type="number"
                      value={scenarioInputs.averageSalary}
                      onChange={(e) => setScenarioInputs({ ...scenarioInputs, averageSalary: Number(e.target.value) })}
                      className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Additional Funding ($)
                    </label>
                    <input
                      type="number"
                      value={scenarioInputs.additionalFunding}
                      onChange={(e) => setScenarioInputs({ ...scenarioInputs, additionalFunding: Number(e.target.value) })}
                      className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Time Horizon (months)
                    </label>
                    <input
                      type="number"
                      value={scenarioInputs.timeHorizon}
                      onChange={(e) => setScenarioInputs({ ...scenarioInputs, timeHorizon: Number(e.target.value) })}
                      className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={runScenario}
                    disabled={!scenarioInputs.name || generating}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Play className="h-4 w-4 inline mr-2" />
                    Run Scenario
                  </button>
                  <button
                    onClick={() => setShowScenarioForm(false)}
                    className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ),
          },
        ]
      : []),

    // Scenarios List
    ...scenarios.map((scenario) => {
      const insights = scenario.insights || [];
      const recommendations = scenario.recommendations || [];
      const risks = scenario.risks || [];

      return {
        className: 'col-span-12 lg:col-span-6',
        background: <SpotlightCard spotlightColor="rgba(139, 92, 246, 0.2)" className="w-full h-full" />,
        content: (
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-medium text-foreground">{scenario.name}</h3>
                  <Badge variant={scenario.scenarioType === 'forecast' ? 'default' : 'outline'}>
                    {scenario.scenarioType}
                  </Badge>
                </div>
                {scenario.description && (
                  <p className="text-sm text-muted-foreground">{scenario.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Confidence</div>
                <div className="text-lg font-bold text-primary">
                  {(Number(scenario.confidence) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground">Projected Revenue</div>
                <div className="text-sm font-bold text-foreground">
                  {formatCurrency(Number(scenario.projectedRevenue))}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground">Projected Expenses</div>
                <div className="text-sm font-bold text-foreground">
                  {formatCurrency(Number(scenario.projectedExpenses))}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground">Projected Cashflow</div>
                <div className={`text-sm font-bold ${Number(scenario.projectedCashflow) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {formatCurrency(Number(scenario.projectedCashflow))}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground">Projected Runway</div>
                <div className="text-sm font-bold text-foreground">
                  {Number(scenario.projectedRunway).toFixed(1)} months
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="flex-grow space-y-3 overflow-y-auto">
              {insights.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Key Insights
                  </h4>
                  <ul className="space-y-1">
                    {insights.slice(0, 3).map((insight: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0">
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {recommendations.slice(0, 2).map((rec: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {risks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    Risks
                  </h4>
                  <ul className="space-y-1">
                    {risks.slice(0, 2).map((risk: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0">
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Created {new Date(scenario.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ),
      };
    }),
  ];

  // Add empty state if no scenarios
  if (!loading && scenarios.length === 0 && !showScenarioForm) {
    bentoItems.push({
      className: 'col-span-12',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-12 text-center">
          <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Scenarios Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first AI-powered forecast or what-if scenario to see projections
          </p>
          <button
            onClick={generateForecast}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4 inline mr-2" />
            Generate AI Forecast
          </button>
        </div>
      ),
    });
  }

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <MagicBento items={bentoItems} />
        )}
      </MainLayout>
    </AuthGuard>
  );
}
