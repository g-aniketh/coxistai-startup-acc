'use client';

import { useState, useEffect } from 'react';
import { api, DashboardSummary } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Briefcase,
  Bot,
  SlidersHorizontal,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { toast } from 'react-hot-toast';
import SplitText from '@/components/SplitText';
import CountUp from '@/components/CountUp';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface ForecastScenario {
  name: string;
  revenueChange: number;
  expenseChange: number;
  oneTimeRevenue?: number;
  oneTimeExpense?: number;
}

// Mock data as the backend might not be ready
const mockDashboardData = {
  balance: { total: 1000000 },
  cashFlow: { income: 150000, expenses: 100000 },
  period: { days: 30 },
};

export default function ForecastingPage() {
  const [dashboardData] = useState<any>(mockDashboardData);
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState<ForecastScenario>({
    name: 'Custom',
    revenueChange: 0,
    expenseChange: 0,
    oneTimeRevenue: 0,
    oneTimeExpense: 0,
  });

  const generateForecast = (
    currentScenario: ForecastScenario,
    months: number = 12
  ) => {
    if (!dashboardData) return [];

    const currentBalance = dashboardData.balance.total;
    const avgMonthlyIncome =
      dashboardData.cashFlow.income * (30 / dashboardData.period.days);
    const avgMonthlyExpense =
      dashboardData.cashFlow.expenses * (30 / dashboardData.period.days);

    let forecast = [];
    let balance = currentBalance;
    let cumulativeIncome = 0;
    let cumulativeExpenses = 0;

    for (let i = 0; i <= months; i++) {
      let monthIncome =
        avgMonthlyIncome * (1 + currentScenario.revenueChange / 100);
      let monthExpense =
        avgMonthlyExpense * (1 + currentScenario.expenseChange / 100);
      if (i === 1) {
        monthIncome += currentScenario.oneTimeRevenue || 0;
        monthExpense += currentScenario.oneTimeExpense || 0;
      }

      balance += monthIncome - monthExpense;
      cumulativeIncome += monthIncome;
      cumulativeExpenses += monthExpense;

      forecast.push({
        month: i === 0 ? 'Now' : `M${i}`,
        balance: Math.round(balance),
      });
    }
    return forecast;
  };

  const forecastData = generateForecast(scenario);
  const finalBalance = forecastData[forecastData.length - 1]?.balance || 0;
  const runwayMonths = forecastData.findIndex((d) => d.balance <= 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
    }).format(amount);

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="space-y-6">
          <SplitText
            text="AI Financial Forecasting"
            tag="h1"
            className="text-3xl font-bold"
          />
          <p className="text-muted-foreground">
            Simulate "what-if" scenarios to plan your startup's financial
            future.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="glass p-6 rounded-lg">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  Scenario Controls
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Revenue Change: {scenario.revenueChange}%
                    </label>
                    <input
                      type="range"
                      min="-50"
                      max="100"
                      value={scenario.revenueChange}
                      onChange={(e) =>
                        setScenario({
                          ...scenario,
                          revenueChange: +e.target.value,
                        })
                      }
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Expense Change: {scenario.expenseChange}%
                    </label>
                    <input
                      type="range"
                      min="-50"
                      max="100"
                      value={scenario.expenseChange}
                      onChange={(e) =>
                        setScenario({
                          ...scenario,
                          expenseChange: +e.target.value,
                        })
                      }
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <div className="glass p-6 rounded-lg">
                <h3 className="font-semibold mb-4">One-Time Events</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Revenue</label>
                    <input
                      type="number"
                      placeholder="$0"
                      value={scenario.oneTimeRevenue}
                      onChange={(e) =>
                        setScenario({
                          ...scenario,
                          oneTimeRevenue: +e.target.value,
                        })
                      }
                      className="w-full bg-transparent border-b border-border p-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Expense</label>
                    <input
                      type="number"
                      placeholder="$0"
                      value={scenario.oneTimeExpense}
                      onChange={(e) =>
                        setScenario({
                          ...scenario,
                          oneTimeExpense: +e.target.value,
                        })
                      }
                      className="w-full bg-transparent border-b border-border p-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="glass p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    Projected Runway
                  </h3>
                  <p
                    className={cn(
                      'text-4xl font-bold',
                      runwayMonths !== -1 &&
                        runwayMonths < 6 &&
                        'text-red-500'
                    )}
                  >
                    {runwayMonths === -1 ? '>12' : runwayMonths} months
                  </p>
                </div>
                <div className="glass p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4" />
                    Balance in 12 mo.
                  </h3>
                  <p
                    className={cn(
                      'text-4xl font-bold',
                      finalBalance > dashboardData.balance.total &&
                        'text-emerald-500',
                      finalBalance < 0 && 'text-red-500'
                    )}
                  >
                    {formatCurrency(finalBalance)}
                  </p>
                </div>
              </div>
              <div className="glass p-6 rounded-lg h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--primary)"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--primary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(var(--card))',
                        borderColor: 'oklch(var(--border))',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="var(--primary)"
                      fill="url(#colorBalance)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

