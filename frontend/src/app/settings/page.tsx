'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User,
  Shield,
  Trash2,
  Settings,
  Link,
  Plus,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PlaidLink from '@/components/ui/PlaidLink';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [plaidItems, setPlaidItems] = useState<any[]>([]);

  useEffect(() => {
    fetchPlaidItems();
  }, []);

  const fetchPlaidItems = async () => {
    // Mocking Plaid items for now
    setPlaidItems([
      { id: '1', institutionName: 'Bank of America', accounts: { length: 2 } },
      { id: '2', institutionName: 'Chase', accounts: { length: 1 } },
    ]);
  };
  
  const handlePlaidSuccess = () => {
    toast.success("Account connected! Refreshing...");
    setTimeout(fetchPlaidItems, 1000);
  }

  const handleDisconnectBank = async (plaidItemId: string) => {
    toast.success('Bank account disconnected.');
    setPlaidItems(plaidItems.filter(item => item.id !== plaidItemId));
  };
  
  const sections = [
    {
      icon: <User className="h-5 w-5" />,
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
              <dd className="mt-1 font-semibold">{user?.startup?.name}</dd>
            </div>
             <div>
              <dt className="text-muted-foreground">Member Since</dt>
              <dd className="mt-1 font-semibold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</dd>
            </div>
        </dl>
      ),
    },
    {
      icon: <Link className="h-5 w-5" />,
      title: "Connections",
      content: (
        <div className="space-y-4">
           {plaidItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{item.institutionName || 'Bank Account'}</p>
                  <p className="text-xs text-muted-foreground">{item.accounts?.length || 0} accounts</p>
                </div>
                 <Button onClick={() => handleDisconnectBank(item.id)} variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-600">
                  <Trash2 className="h-3 w-3 mr-1" /> Disconnect
                </Button>
              </div>
            ))}
            <PlaidLink onSuccess={handlePlaidSuccess} onError={(e: any) => toast.error(e.display_message || 'An error occurred.')} />
        </div>
      )
    },
     {
      icon: <Shield className="h-5 w-5" />,
      title: "Security",
       content: (
        <div className="space-y-4">
           <Button variant="outline" className="w-full justify-start">Change Password</Button>
           <Button variant="outline" className="w-full justify-start">Enable Two-Factor Authentication</Button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <Settings className="h-8 w-8 text-[#2C2C2C]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Settings</h1>
              <p className="text-sm text-[#2C2C2C]/70 mt-1">
                Manage your account and application settings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {sections.map(section => (
              <Card key={section.title} className="rounded-2xl shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {section.icon} {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {section.content}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

