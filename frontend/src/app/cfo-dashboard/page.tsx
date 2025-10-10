'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiClient, DashboardSummary } from '@/lib/api';
import PlaidLink from '@/components/ui/PlaidLink';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Banknote,
  Clock,
  Scale,
  Wallet,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import SplitText from '@/components/SplitText';
import GradientText from '@/components/GradientText';
import MagicBento from '@/components/MagicBento';
import SpotlightCard from '@/components/SpotlightCard';
import AnimatedList from '@/components/AnimatedList';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import CountUp from '@/components/CountUp';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface PlaidError {
  display_message: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

export default function CFODashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.dashboard.dashboard(period);
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else if (response.error?.includes('No Plaid items found')) {
        setDashboardData(null);
      } else {
        setError(response.error || 'Failed to fetch dashboard data');
        toast.error(response.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handlePlaidSuccess = async (public_token: string) => {
    try {
      toast.loading('Exchanging public token...', { id: 'plaid-exchange' });
      const exchangeResponse =
        await apiClient.dashboard.plaid.exchangePublicToken(public_token);

      if (exchangeResponse.success && exchangeResponse.data) {
        toast.success('Bank account connected successfully!', {
          id: 'plaid-exchange',
        });

        const plaidItemId = exchangeResponse.data.plaidItem.id;
        toast.loading('Syncing transactions...', { id: 'plaid-sync' });
        await apiClient.dashboard.plaid.syncTransactions(plaidItemId);
        toast.success('Transactions synced!', { id: 'plaid-sync' });

        fetchDashboardData();
      } else {
        throw new Error(
          exchangeResponse.error || 'Failed to exchange public token'
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unknown error occurred during token exchange.';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'plaid-exchange' });
    }
  };

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
  
  if (!dashboardData) {
    return (
       <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="w-full h-[calc(100vh-10rem)] flex items-center justify-center">
            <SpotlightCard className="max-w-md p-8 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Banknote className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-medium text-foreground mb-2">Connect Your Financials</h3>
                <p className="text-sm text-muted-foreground mb-6">Link your bank account via Plaid to unlock your CFO dashboard and gain real-time financial insights.</p>
                <PlaidLink onSuccess={handlePlaidSuccess} onError={(e: any) => toast.error(e.display_message)} />
            </SpotlightCard>
          </div>
        </MainLayout>
      </AuthGuard>
    )
  }

  const { balance, cashFlow, accounts, categories } = dashboardData;

  const bentoItems = [
     {
      className: 'col-span-12 lg:col-span-8',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full flex flex-col justify-between">
          <div>
            <SplitText
              text="CFO Dashboard"
              tag="h1"
              className="text-3xl font-bold text-foreground"
            />
            <p className="mt-2 text-muted-foreground">
              Financial overview for the last{' '}
              <GradientText className="inline-flex font-semibold">
                {period} days
              </GradientText>
              .
            </p>
          </div>
           <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="rounded-lg border border-border bg-muted text-foreground px-3 py-2 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
            <PlaidLink onSuccess={handlePlaidSuccess} onError={(e: any) => toast.error(e.display_message)} />
          </div>
        </div>
      ),
    },
    {
      className: 'col-span-6 lg:col-span-4',
      background: <SpotlightCard spotlightColor="rgba(139, 92, 246, 0.3)" className="w-full h-full" />,
      content: (
         <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Total Balance</h3>
          </div>
          <div className="mt-4 text-4xl font-bold text-foreground">
            $<CountUp to={balance.total} duration={1.5} />
          </div>
        </div>
      )
    },
    {
      className: 'col-span-6 lg:col-span-4',
      background: <SpotlightCard spotlightColor={cashFlow.netCashFlow >= 0 ? 'rgba(5, 150, 105, 0.3)' : 'rgba(220, 38, 38, 0.3)'} className="w-full h-full" />,
      content: (
         <div className="p-6">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${cashFlow.netCashFlow >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} flex items-center justify-center`}>
              {cashFlow.netCashFlow >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
            <h3 className="text-lg font-medium text-foreground">Net Cash Flow</h3>
          </div>
          <div className="mt-4 text-4xl font-bold text-foreground">
            $<CountUp to={cashFlow.netCashFlow} duration={1.5} />
          </div>
        </div>
      )
    },
     {
      className: 'col-span-6 lg:col-span-4',
      background: <SpotlightCard className="w-full h-full" />,
      content: (
         <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Daily Burn</h3>
          </div>
          <div className="mt-4 text-4xl font-bold text-foreground">
            $<CountUp to={cashFlow.burnRate} duration={1.5} />
          </div>
        </div>
      )
    },
     {
      className: 'col-span-6 lg:col-span-4',
      background: <SpotlightCard className="w-full h-full" />,
      content: (
         <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Runway</h3>
          </div>
          <div className="mt-4 text-4xl font-bold text-foreground">
            {cashFlow.runway > 0 ? <><CountUp to={Math.round(cashFlow.runway)} duration={1.5} /> days</> : 'N/A'}
          </div>
        </div>
      )
    },
    {
      className: 'col-span-12 lg:col-span-7',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full flex flex-col">
          <h3 className="text-lg font-medium text-foreground mb-4">Cash Flow</h3>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlow.dailyBreakdown}>
                 <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'oklch(var(--card))', borderColor: 'oklch(var(--border))' }} />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      className: 'col-span-12 lg:col-span-5',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full flex flex-col">
          <h3 className="text-lg font-medium text-foreground mb-4">Spending by Category</h3>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories.breakdown} dataKey="expenses" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                   {categories.breakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      className: 'col-span-12',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Connected Accounts</h3>
           <AnimatedList items={accounts.breakdown.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Banknote className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{account.name}</p>
                        <p className="text-sm text-muted-foreground">{account.institution} ({account.mask})</p>
                      </div>
                  </div>
                  <p className="font-semibold text-lg">{formatCurrency(account.balance)}</p>
                </div>
              ))} />
        </div>
      )
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
