'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  Bell,
  AlertTriangle,
  ShieldCheck,
  Info,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import SplitText from '@/components/SplitText';
import { cn } from '@/lib/utils';
import AnimatedList from '@/components/AnimatedList';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
}

// Mock Data
const mockAlerts: Alert[] = [
  {
    id: 'runway-warning',
    type: 'warning',
    title: 'Runway Below 6 Months',
    message:
      'Your current runway is projected to be 4.5 months. It is advisable to start planning your next fundraising round or identify cost-saving measures.',
    action: 'Reduce monthly burn by at least 15% to extend runway.',
  },
  {
    id: 'burn-high',
    type: 'info',
    title: 'SaaS Spend Increased',
    message:
      'Your spending on SaaS tools has increased by 25% this month. The largest increase came from a new subscription to Figma.',
    action: 'Review SaaS subscriptions and cancel any unused services.',
  },
  {
    id: 'health-good',
    type: 'success',
    title: 'Strong Financial Position',
    message:
      'Congratulations! You have over 12 months of runway and positive cash flow.',
    action: 'Consider strategic investments to accelerate growth.',
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [loading, setLoading] = useState(false);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'success':
        return <ShieldCheck className="h-6 w-6 text-emerald-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'border-red-500/50';
      case 'warning':
        return 'border-yellow-500/50';
      case 'success':
        return 'border-emerald-500/50';
      default:
        return 'border-blue-500/50';
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="space-y-6">
          <SplitText
            text="Alerts & Notifications"
            tag="h1"
            className="text-3xl font-bold"
          />
          <p className="text-muted-foreground">
            Real-time financial alerts and proactive recommendations from your AI
            CFO.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-lg">
              <h3 className="font-semibold mb-2 text-red-500">Critical</h3>
              <p className="text-4xl font-bold">
                {alerts.filter((a) => a.type === 'critical').length}
              </p>
            </div>
            <div className="glass p-6 rounded-lg">
              <h3 className="font-semibold mb-2 text-yellow-500">Warnings</h3>
              <p className="text-4xl font-bold">
                {alerts.filter((a) => a.type === 'warning').length}
              </p>
            </div>
            <div className="glass p-6 rounded-lg">
              <h3 className="font-semibold mb-2 text-blue-500">Info</h3>
              <p className="text-4xl font-bold">
                {alerts.filter((a) => a.type === 'info').length}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatedList items={
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'glass border-l-4 p-6 rounded-lg',
                    getAlertColor(alert.type)
                  )}
                >
                  <div className="flex items-start gap-4">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                      {alert.action && (
                        <div className="mt-4 glass p-3 rounded-md flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                          <div>
                            <h4 className="text-sm font-semibold">
                              Recommended Action
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {alert.action}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            } />
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

