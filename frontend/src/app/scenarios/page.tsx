'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ScenariosPage() {
  const [scenario, setScenario] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Example scenarios
  const exampleScenarios = [
    "What happens if we hire 2 engineers at $150k/year each?",
    "What if we reduce SaaS spending by $5,000/month?",
    "What if our revenue grows by 20% next quarter?",
    "What if we raise $500k in funding?",
    "What happens if we cut marketing budget by 30%?",
  ];

  const runScenario = async () => {
    if (!scenario.trim()) {
      toast.error('Please enter a scenario to analyze');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.ai.runWhatIfScenario(scenario);
      if (response.success) {
        setResult(response.data);
        toast.success('Scenario analyzed successfully!');
      } else {
        toast.error(response.message || 'Failed to analyze scenario');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to analyze scenario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            What-If Scenario Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Use AI to predict the financial impact of business decisions
          </p>
        </div>

        {/* Input Section */}
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

            <Button onClick={runScenario} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run Scenario Analysis
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Scenario Summary */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h3 className="font-semibold text-lg mb-2">{result.scenario}</h3>
              <p className="text-sm text-muted-foreground">
                {result.explanation}
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
                      {result.impact.burnRateChange}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Runway Impact</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.impact.runwayChange}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-primary">AI Recommendation</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.impact.recommendation}
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
                  {result.risks?.map((risk: string, index: number) => (
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
                  {result.opportunities?.map((opportunity: string, index: number) => (
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
    </AuthGuard>
  );
}

