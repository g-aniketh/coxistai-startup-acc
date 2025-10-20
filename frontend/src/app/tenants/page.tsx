'use client';

import { useState, useEffect } from 'react';
import { apiClient, TeamMember } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { 
  BuildingOffice2,
  User,
  Plus,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await apiClient.team.list();
        if (response.success && response.data) {
          setTenants(response.data);
        } else {
          setError(response.error || 'Failed to fetch tenants');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="space-y-6 p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Organizations</h1>
              <p className="text-sm text-[#2C2C2C]/70 mt-1">
                Manage all organizations in the platform.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search organizations..." className="pl-10 bg-white rounded-lg" />
              </div>
              <Button className="flex items-center gap-2 bg-[#607c47] hover:bg-[#4a6129] text-white">
                <Plus className="h-4 w-4" />
                New Organization
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#607c47]"></div>
              </div>
            ) : error ? (
              <div className="col-span-full p-6 text-center">
                <p className="text-red-600">{error}</p>
              </div>
            ) : tenants.length > 0 ? (
              tenants.map((tenant) => (
                <Card 
                  key={tenant.id} 
                  className="rounded-xl border-0 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <BuildingOffice2 className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[#2C2C2C] truncate">
                          {tenant.firstName} {tenant.lastName}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <User className="h-4 w-4" />
                          <span>{tenant.roles.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Joined {new Date(tenant.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full p-6 text-center">
                <BuildingOffice2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No organizations found in the system.
                </p>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

