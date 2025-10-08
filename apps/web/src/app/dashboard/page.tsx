'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { api, User, Tenant } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  Users,
  Building2,
  Activity,
  Clock,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import SplitText from '@/components/SplitText';
import CountUp from '@/components/CountUp';
import GradientText from '@/components/GradientText';
import SpotlightCard from '@/components/SpotlightCard';
import MagicBento from '@/components/MagicBento';
import AnimatedList from '@/components/AnimatedList';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Badge } from '@/components/ui/Badge';

const chartData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 },
  { name: 'Jun', revenue: 5500 },
  { name: 'Jul', revenue: 7000 },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [usersResponse, tenantsResponse] = await Promise.all([
          api.users.list(),
          api.tenants.list(),
        ]);
        if (usersResponse.success) setUsers(usersResponse.data || []);
        if (tenantsResponse.success) setTenants(tenantsResponse.data || []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoadingData(false);
      }
    };
    loadDashboardData();
  }, []);

  const bentoItems = [
    {
      className: 'col-span-12 lg:col-span-8',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full flex flex-col justify-between">
          <div>
            <SplitText
              text="Dashboard"
              tag="h1"
              className="text-3xl font-bold text-foreground"
            />
            <p className="mt-2 text-muted-foreground">
              Welcome back,{' '}
              <GradientText className="inline-flex font-semibold">
                {user?.email}
              </GradientText>
              !
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Here's a snapshot of your startup's performance.
          </div>
        </div>
      ),
    },
    {
      className: 'col-span-6 lg:col-span-4',
      background: (
        <SpotlightCard
          spotlightColor="rgba(139, 92, 246, 0.3)"
          className="w-full h-full"
        />
      ),
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Total Users</h3>
          </div>
          <div className="mt-4 text-4xl font-bold text-foreground">
            {loadingData ? '...' : <CountUp to={users.length} duration={1.5} />}
          </div>
        </div>
      ),
    },
    {
      className: 'col-span-6 lg:col-span-4',
      background: (
        <SpotlightCard
          spotlightColor="rgba(5, 150, 105, 0.3)"
          className="w-full h-full"
        />
      ),
      content: (
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Total Tenants
            </h3>
          </div>
          <div className="mt-4 text-4xl font-bold text-foreground">
            {loadingData ? '...' : <CountUp to={tenants.length} duration={1.5} />}
          </div>
        </div>
      ),
    },
    {
      className: 'col-span-12 lg:col-span-8',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground">
                Revenue Over Time
              </h3>
              <p className="text-sm text-muted-foreground">Last 7 months</p>
            </div>
          </div>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(var(--card))',
                    borderColor: 'oklch(var(--border))',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      className: 'col-span-12 lg:col-span-6',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full">
           <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground">
                Recent Users
              </h3>
              <p className="text-sm text-muted-foreground">Latest signups</p>
            </div>
          </div>
          <div className="space-y-2">
            {loadingData ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : (
              <AnimatedList items={
                users.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.tenant.name}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{u.role}</Badge>
                  </div>
                ))
              } />
            )}
          </div>
        </div>
      ),
    },
     {
      className: 'col-span-12 lg:col-span-6',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6 h-full">
           <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground">
                Your Account
              </h3>
              <p className="text-sm text-muted-foreground">Current session details</p>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Email</span>
              <span className="font-medium text-sm">{user?.email}</span>
            </div>
             <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Role</span>
              <Badge variant="default" className="capitalize">{user?.role}</Badge>
            </div>
             <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Tenant</span>
              <span className="font-medium text-sm">{user?.tenant.name}</span>
            </div>
             <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Member Since</span>
              <span className="font-medium text-sm">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
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
