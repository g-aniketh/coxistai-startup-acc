'use client';

import { useState, useEffect } from 'react';
import { api, Tenant } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { 
  BuildingOfficeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await api.tenants.list();
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
        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organizations</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage all organizations in the platform.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="col-span-full p-6 text-center">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : tenants.length > 0 ? (
              tenants.map((tenant) => (
                <div 
                  key={tenant.id} 
                  className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {tenant.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <UserGroupIcon className="h-4 w-4" />
                        <span>{tenant.users?.length || 0} users</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created {new Date(tenant.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-6 text-center">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No organizations</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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

