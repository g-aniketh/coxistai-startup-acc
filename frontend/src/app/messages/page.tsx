'use client';

import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, AlertTriangle, Info, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const alerts = [
  {
    title: "Runway Alert",
    message: "Runway is down to 4.5 months. Recommend cutting $15k/mo in SaaS spend.",
    type: "warning",
    date: "2 days ago",
  },
  {
    title: "High Burn Rate",
    message: "Your monthly burn rate has increased by 20% over the last 30 days.",
    type: "warning",
    date: "5 days ago",
  },
  {
    title: "Revenue Opportunity",
    message: "AI analysis suggests a pricing adjustment could increase ARR by 15%.",
    type: "info",
    date: "1 week ago",
  },
  {
    title: "Subscription Reminder",
    message: "Your subscription for 'Advanced AI Insights' will renew in 3 days.",
    type: "info",
    date: "1 week ago",
  }
];

export default function MessagesPage() {
  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <Bell className="h-8 w-8 text-[#2C2C2C]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">AI Alerts & Messages</h1>
              <p className="text-sm text-[#2C2C2C]/70 mt-1">
                Proactive insights from your AI CFO.
              </p>
            </div>
          </div>

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle>Inbox</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert, index) => {
                  const Icon = alert.type === 'warning' ? AlertTriangle : Info;
                  return (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                      <Icon className={cn("h-6 w-6", alert.type === 'warning' ? 'text-red-500' : 'text-blue-500')} />
                      <div>
                        <p className="font-bold">{alert.title}</p>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{alert.date}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
