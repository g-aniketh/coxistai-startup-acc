'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { api, User, Tenant } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, Building2, TrendingUp, Activity, Clock, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!isAuthenticated) return;
      
      try {
        const [usersResponse, tenantsResponse] = await Promise.all([
          api.users.list(),
          api.tenants.list(),
        ]);
        
        if (usersResponse.success) {
          setUsers(usersResponse.data || []);
        }
        
        if (tenantsResponse.success) {
          setTenants(tenantsResponse.data || []);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoadingData(false);
      }
    };
    
    loadDashboardData();
  }, [isAuthenticated]);

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back, {user?.email}! Here's what's happening with your account.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loadingData ? '...' : users.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active users across all tenants
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform duration-200">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Tenants</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loadingData ? '...' : tenants.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Organizations in the platform
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform duration-200">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Your Role</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground capitalize">
                {user?.role}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current access level
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-200">
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">Member Since</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {user?.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Years of membership
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users and User Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Users
              </CardTitle>
              <CardDescription>
                Latest users who joined the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading users...</p>
                </div>
              ) : users.length > 0 ? (
                <div className="space-y-4">
                  {users.slice(0, 5).map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {user.tenant.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No users found</p>
              )}
            </CardContent>
          </Card>

          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Your Account Information
              </CardTitle>
              <CardDescription>
                Your personal account details and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <span className="text-sm font-medium text-muted-foreground">Email</span>
                  <span className="text-sm text-foreground">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <span className="text-sm font-medium text-muted-foreground">Role</span>
                  <Badge variant="default" className="capitalize">
                    {user?.role}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <span className="text-sm font-medium text-muted-foreground">Tenant</span>
                  <span className="text-sm text-foreground">{user?.tenant.name}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <span className="text-sm font-medium text-muted-foreground">Member Since</span>
                  <span className="text-sm text-foreground">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </MainLayout>
    </AuthGuard>
  );
}
