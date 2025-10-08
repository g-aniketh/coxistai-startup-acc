'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  Heart,
  Thermometer,
  Calendar,
  DollarSign,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import SplitText from '@/components/SplitText';
import MagicBento from '@/components/MagicBento';
import CountUp from '@/components/CountUp';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';

// Mock Data
const healthData = {
  score: 82,
  runway: 14, // in months
  burnRate: 50000, // per month
  arr: 1200000,
  fundraisingNeed: 750000,
  recommendations: [
    'Your current runway is healthy at 14 months.',
    'Customer acquisition cost has increased by 12% last quarter. Investigate marketing channel efficiency.',
    'Consider exploring enterprise pricing tiers to increase ARR.',
  ],
  runwayHistory: [
    { month: 'Jan', runway: 18 },
    { month: 'Feb', runway: 17 },
    { month: 'Mar', runway: 16 },
    { month: 'Apr', runway: 15 },
    { month: 'May', runway: 14 },
    { month: 'Jun', runway: 14 },
  ],
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
  }).format(amount);

export default function FinancialHealthPage() {
  // You can replace this with your actual data fetching logic
  const [loading, setLoading] = useState(false);

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
            text="Financial Health"
            tag="h1"
            className="text-3xl font-bold"
          />
          <p className="mt-1 text-muted-foreground">
            An AI-powered overview of your startup's financial wellness.
          </p>
        </div>
      ),
    },
    {
      className: 'col-span-12 lg:col-span-4',
      background: (
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-card" />
      ),
      content: (
        <div className="p-6 text-center h-full flex flex-col justify-between">
          <div>
            <Heart className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Overall Health Score</h2>
          </div>
          <div className="text-7xl font-bold text-primary">
            <CountUp to={healthData.score} duration={2} />
            <span className="text-4xl">/100</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Excellent financial standing
          </p>
        </div>
      ),
    },
    {
      className: 'col-span-12 lg:col-span-8',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-medium">Runway & Burn Rate</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="glass p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Financial Runway</p>
              <p className="text-3xl font-bold">
                <CountUp to={healthData.runway} duration={2} /> months
              </p>
            </div>
            <div className="glass p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Avg. Monthly Burn</p>
              <p className="text-3xl font-bold">
                $<CountUp
                  to={healthData.burnRate}
                  duration={2}
                  separator=","
                />
              </p>
            </div>
          </div>
          <div className="flex-grow h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthData.runwayHistory}>
                <defs>
                  <linearGradient id="colorRunway" x1="0" y1="0" x2="0" y2="1">
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(var(--card))',
                    borderColor: 'oklch(var(--border))',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="runway"
                  stroke="var(--primary)"
                  fill="url(#colorRunway)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      className: 'col-span-6 lg:col-span-4',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
            <h3 className="text-lg font-medium">ARR</h3>
          </div>
          <p className="text-5xl font-bold text-emerald-500">
            $<CountUp to={healthData.arr} duration={2} separator="," />
          </p>
        </div>
      ),
    },
    {
      className: 'col-span-6 lg:col-span-4',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="h-6 w-6 text-yellow-500" />
            <h3 className="text-lg font-medium">Fundraising Need</h3>
          </div>
          <p className="text-5xl font-bold text-yellow-500">
            $<CountUp
              to={healthData.fundraisingNeed}
              duration={2}
              separator=","
            />
          </p>
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
            <h3 className="text-lg font-medium">AI Recommendations</h3>
          </div>
          <ul className="space-y-3">
            {healthData.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-muted-foreground">{rec}</li>
            ))}
          </ul>
        </div>
      ),
    }
  ];

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <MagicBento />
      </MainLayout>
    </AuthGuard>
  );
}

