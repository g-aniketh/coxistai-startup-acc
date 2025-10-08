'use client';

import { useState, useEffect } from 'react';
import { api, DashboardSummary } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  TrendingUp,
  DollarSign,
  Percent,
  Users,
  Goal,
  Activity,
  Lightbulb,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { toast } from 'react-hot-toast';
import SplitText from '@/components/SplitText';
import MagicBento from '@/components/MagicBento';
import CountUp from '@/components/CountUp';
import SpotlightCard from '@/components/SpotlightCard';
import { cn } from '@/lib/utils';

// Using mock data for demonstration
const mockRevenueData = {
  arr: 2500000,
  mrr: 208333,
  growthRate: 15, // percentage
  ltvCacRatio: 4.2,
  arpa: 150,
  paybackPeriod: 8, // months
  revenueTrend: [
    { month: 'Jan', revenue: 120000, growth: 5 },
    { month: 'Feb', revenue: 135000, growth: 12.5 },
    { month: 'Mar', revenue: 150000, growth: 11.1 },
    { month: 'Apr', revenue: 175000, growth: 16.7 },
    { month: 'May', revenue: 190000, growth: 8.6 },
    { month: 'Jun', revenue: 208333, growth: 9.6 },
  ],
  insights: [
    'ARR growth is accelerating, keep focusing on enterprise sales.',
    'LTV:CAC ratio is excellent. You have room to increase marketing spend.',
    'Payback period is healthy. Consider annual plans to shorten it further.',
  ],
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(amount);

export default function RevenueMetricsPage() {
  const [loading, setLoading] = useState(false);

  // This is where you'd fetch your actual data
  const metrics = mockRevenueData;

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  const bentoItems = [
    {
      className: 'col-span-12',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6">
          <SplitText
            text="Revenue Metrics"
            tag="h1"
            className="text-3xl font-bold"
          />
          <p className="mt-1 text-muted-foreground">
            Track ARR, MRR, and key SaaS metrics for your startup.
          </p>
        </div>
      ),
    },
    {
      className: 'col-span-12 lg:col-span-4',
      background: <SpotlightCard spotlightColor="rgba(5, 150, 105, 0.3)" />,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
            <h3 className="text-lg font-medium">Annual Recurring Revenue</h3>
          </div>
          <p className="text-5xl font-bold text-emerald-500">
            $<CountUp to={metrics.arr} duration={2} separator="," />
          </p>
        </div>
      ),
    },
    {
      className: 'col-span-6 lg:col-span-4',
      background: <SpotlightCard />,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-medium">Monthly Recurring Revenue</h3>
          </div>
          <p className="text-5xl font-bold text-primary">
            $<CountUp to={metrics.mrr} duration={2} separator="," />
          </p>
        </div>
      ),
    },
    {
      className: 'col-span-6 lg:col-span-4',
      background: <SpotlightCard />,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Percent className="h-6 w-6 text-yellow-500" />
            <h3 className="text-lg font-medium">Growth Rate (MoM)</h3>
          </div>
          <p className="text-5xl font-bold text-yellow-500">
            <CountUp to={metrics.growthRate} duration={2} />%
          </p>
        </div>
      ),
    },
    {
      className: 'col-span-12 lg:col-span-8',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full flex flex-col">
          <h3 className="text-lg font-medium mb-4">Revenue & Growth</h3>
          <div className="flex-grow h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.revenueTrend}>
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis
                  yAxisId="left"
                  stroke="var(--primary)"
                  tickFormatter={formatCurrency}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--yellow-500)"
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(var(--card))',
                    borderColor: 'oklch(var(--border))',
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  fill="var(--primary)"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="growth"
                  stroke="var(--yellow-500)"
                  strokeWidth={2}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      className: 'col-span-12 lg:col-span-4',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-medium">AI Insights</h3>
          </div>
          <ul className="space-y-3">
            {metrics.insights.map((insight, i) => (
              <li key={i} className="text-sm text-muted-foreground">{insight}</li>
            ))}
          </ul>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <MagicBento />
      </MainLayout>
    </AuthGuard>
  );
}

