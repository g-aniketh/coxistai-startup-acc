'use client';

import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, Plus, Landmark, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const subscriptionPlans = [
  {
    name: "Startup",
    price: "$50/mo",
    features: ["Automated Cashflow Dashboard", "Runway & Burn Tracking", "Basic 'What If' Scenarios"],
    current: true,
  },
  {
    name: "SMB CFO",
    price: "$200/mo",
    features: ["All Startup Features", "Advanced AI Insights", "Proactive Alerts", "Investor Update Drafts"],
    current: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: ["All SMB Features", "Payroll Automation", "Vendor Negotiations", "Tax Optimization"],
    current: false,
  }
];

const connectedAccounts = [
  { name: "Stripe", icon: CreditCard, connected: true },
  { name: "QuickBooks", icon: Landmark, connected: true },
  { name: "Bank of America", icon: Landmark, connected: false },
  { name: "Chase Bank", icon: Landmark, connected: true },
];

export default function PaymentPage() {
  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <CreditCard className="h-8 w-8 text-[#2C2C2C]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Billing & Integrations</h1>
              <p className="text-sm text-[#2C2C2C]/70 mt-1">
                Manage your subscription and connected financial accounts.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subscription Plans */}
            <div className="lg:col-span-2">
              <Card className="rounded-2xl shadow-lg border-0 bg-white p-6 h-full">
                <CardHeader className="p-0">
                  <CardTitle>Subscription Plans</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {subscriptionPlans.map(plan => (
                      <div key={plan.name} className={`p-4 rounded-lg border-2 ${plan.current ? 'border-purple-500' : 'border-gray-200'}`}>
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                        <p className="font-bold text-2xl my-2">{plan.price}</p>
                        <ul className="space-y-2 text-sm">
                          {plan.features.map(feature => (
                            <li key={feature} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button className="w-full mt-4" disabled={plan.current}>
                          {plan.current ? 'Current Plan' : 'Upgrade'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connected Accounts */}
            <div className="lg:col-span-1">
              <Card className="rounded-2xl shadow-lg border-0 bg-white p-6 h-full">
                <CardHeader className="p-0">
                  <CardTitle>Connected Accounts</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-4 space-y-4">
                  {connectedAccounts.map(account => {
                    const Icon = account.icon;
                    return (
                      <div key={account.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className="h-6 w-6 text-gray-500" />
                          <span className="font-semibold">{account.name}</span>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${account.connected ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                          {account.connected ? 'Connected' : 'Not Connected'}
                        </span>
                      </div>
                    )
                  })}
                   <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Connect New Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
