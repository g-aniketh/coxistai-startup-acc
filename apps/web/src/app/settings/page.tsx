'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { 
  UserCircleIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  BellIcon,
  ShieldCheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [plaidItems, setPlaidItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlaidItems();
  }, []);

  const fetchPlaidItems = async () => {
    try {
      const response = await api.cfo.plaid.getItems();
      if (response.success && response.data) {
        setPlaidItems(response.data.plaidItems);
      }
    } catch (err) {
      console.error('Failed to fetch Plaid items:', err);
    }
  };

  const handleDisconnectBank = async (plaidItemId: string) => {
    if (!confirm('Are you sure you want to disconnect this bank account?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.cfo.plaid.deleteItem(plaidItemId);
      if (response.success) {
        toast.success('Bank account disconnected successfully');
        fetchPlaidItems();
      } else {
        toast.error(response.error || 'Failed to disconnect bank account');
      }
    } catch (err) {
      toast.error('An error occurred while disconnecting bank account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="space-y-6">
          <header>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your account settings and preferences.
            </p>
          </header>

          {/* Account Information */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserCircleIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Information</h2>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 capitalize">
                    {user?.role}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Organization</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user?.tenant.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Connected Accounts */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <BanknotesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Connected Bank Accounts</h2>
            </div>
            {plaidItems.length > 0 ? (
              <div className="space-y-3">
                {plaidItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.institutionName || 'Bank Account'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.accounts?.length || 0} accounts connected
                      </p>
                    </div>
                    <button
                      onClick={() => handleDisconnectBank(item.id)}
                      disabled={loading}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Disconnect
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No bank accounts connected yet. Go to the CFO Dashboard to connect your accounts.
              </p>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <BellIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Runway Alerts</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Get notified when your runway is running low
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Weekly Reports</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive weekly financial summaries
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Large Transactions</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Alert me about transactions over $1,000
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h2>
            </div>
            <div className="space-y-4">
              <div>
                <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors">
                  Change Password
                </button>
              </div>
              <div>
                <button className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors">
                  Enable Two-Factor Authentication
                </button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

