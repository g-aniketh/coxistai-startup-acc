'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  User,
  Banknote,
  Bell,
  Shield,
  Trash2,
  Settings,
  Link,
  Plus,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import SplitText from '@/components/SplitText';
import { cn } from '@/lib/utils';
import PlaidLink from '@/components/ui/PlaidLink';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [plaidItems, setPlaidItems] = useState<any[]>([]);

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
  
  const handlePlaidSuccess = () => {
    toast.success("Account connected! Refreshing...");
    setTimeout(fetchPlaidItems, 1000);
  }

  const handleDisconnectBank = async (plaidItemId: string) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p>Are you sure you want to disconnect this account?</p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await api.cfo.plaid.deleteItem(plaidItemId);
                toast.success('Account disconnected.');
                fetchPlaidItems();
              }}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded"
            >
              Disconnect
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-200 text-sm rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };
  
  const sections = [
    {
      icon: <User className="h-5 w-5 text-primary" />,
      title: 'Account Information',
      content: (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="mt-1 font-semibold">{user?.email}</dd>
            </div>
             <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="mt-1 font-semibold capitalize">{user?.roles.join(', ')}</dd>
            </div>
             <div>
              <dt className="text-muted-foreground">Organization</dt>
              <dd className="mt-1 font-semibold">{user?.startup.name}</dd>
            </div>
             <div>
              <dt className="text-muted-foreground">Member Since</dt>
              <dd className="mt-1 font-semibold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</dd>
            </div>
        </dl>
      ),
    },
    {
      icon: <Link className="h-5 w-5 text-primary" />,
      title: "Connections",
      content: (
        <div className="space-y-4">
           {plaidItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold">{item.institutionName || 'Bank Account'}</p>
                  <p className="text-xs text-muted-foreground">{item.accounts?.length || 0} accounts</p>
                </div>
                 <button onClick={() => handleDisconnectBank(item.id)} className="text-xs p-2 hover:bg-destructive/10 text-destructive rounded-md flex items-center gap-1">
                  <Trash2 className="h-3 w-3" /> Disconnect
                </button>
              </div>
            ))}
            <PlaidLink onSuccess={handlePlaidSuccess} onError={(e: any) => toast.error(e.display_message || 'An error occurred.')} />
        </div>
      )
    },
     {
      icon: <Shield className="h-5 w-5 text-primary" />,
      title: "Security",
       content: (
        <div className="space-y-4">
           <button className="w-full p-3 bg-muted rounded-lg text-left">Change Password</button>
           <button className="w-full p-3 bg-muted rounded-lg text-left">Enable Two-Factor Authentication</button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="space-y-6">
          <SplitText text="Settings" tag="h1" className="text-3xl font-bold" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map(section => (
              <div key={section.title} className="glass p-6 rounded-lg">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  {section.icon} {section.title}
                </h2>
                {section.content}
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

