'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  RefreshCw,
  Eye,
} from 'lucide-react';
import MagicBento from '@/components/MagicBento';
import { Badge } from '@/components/ui/Badge';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [counts, setCounts] = useState({ total: 0, critical: 0, warning: 0, info: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const [alertsRes, countsRes] = await Promise.all([
        api.alerts.list(false),
        api.alerts.getCounts(),
      ]);

      if (alertsRes.success && alertsRes.data) {
        setAlerts(alertsRes.data);
      }
      if (countsRes.success && countsRes.data) {
        setCounts(countsRes.data);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = async () => {
    try {
      setGenerating(true);
      await api.alerts.generate();
      await loadAlerts();
    } catch (error) {
      console.error('Failed to generate alerts:', error);
    } finally {
      setGenerating(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.alerts.markAsRead(id);
      await loadAlerts();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const dismissAlert = async (id: string) => {
    try {
      await api.alerts.dismiss(id);
      await loadAlerts();
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === filter);

  const bentoItems = [
    // Header
    {
      className: 'col-span-12',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Alerts & Recommendations</h1>
              <p className="text-muted-foreground mt-1">Proactive insights from your AI CFO</p>
            </div>
            <button
              onClick={generateAlerts}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Refresh Alerts'}
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All ({counts.total})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'critical'
                  ? 'bg-red-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Critical ({counts.critical})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'warning'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Warning ({counts.warning})
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'info'
                  ? 'bg-blue-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Info ({counts.info})
            </button>
          </div>
        </div>
      ),
    },

    // Alerts List
    ...filteredAlerts.map((alert) => ({
      className: 'col-span-12 lg:col-span-6',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className={`p-6 h-full flex flex-col border ${getSeverityColor(alert.severity)} rounded-lg`}>
          <div className="flex items-start gap-4 mb-4">
            <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-lg font-semibold text-foreground">{alert.title}</h3>
                <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'} className="capitalize">
                  {alert.severity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
            </div>
          </div>

          {/* Alert Details */}
          {(alert.currentValue || alert.thresholdValue) && (
            <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-muted/30">
              {alert.currentValue && (
                <div>
                  <div className="text-xs text-muted-foreground">Current Value</div>
                  <div className="text-sm font-bold text-foreground">
                    {typeof alert.currentValue === 'number'
                      ? alert.currentValue.toFixed(2)
                      : alert.currentValue}
                  </div>
                </div>
              )}
              {alert.thresholdValue && (
                <div>
                  <div className="text-xs text-muted-foreground">Threshold</div>
                  <div className="text-sm font-bold text-foreground">
                    {typeof alert.thresholdValue === 'number'
                      ? alert.thresholdValue.toFixed(2)
                      : alert.thresholdValue}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Recommendations */}
          {alert.recommendations && alert.recommendations.length > 0 && (
            <div className="flex-grow mb-4">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Recommended Actions
              </h4>
              <div className="space-y-2">
                {alert.recommendations.map((rec: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-start gap-2">
                      <div className="text-xs text-muted-foreground mt-0.5">•</div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">{rec.action || rec}</p>
                        {rec.impact && (
                          <p className="text-xs text-muted-foreground mt-1">Impact: {rec.impact}</p>
                        )}
                        {rec.effort && (
                          <Badge variant="outline" className="mt-2 capitalize text-xs">
                            {rec.effort} effort
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <button
              onClick={() => markAsRead(alert.id)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80"
            >
              <Eye className="h-3 w-3" />
              Mark as Read
            </button>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80"
            >
              <X className="h-3 w-3" />
              Dismiss
            </button>
            <div className="ml-auto text-xs text-muted-foreground">
              {new Date(alert.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      ),
    })),
  ];

  // Empty state
  if (!loading && filteredAlerts.length === 0) {
    bentoItems.push({
      className: 'col-span-12',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-12 text-center">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {filter === 'all' ? 'No Active Alerts' : `No ${filter} Alerts`}
          </h3>
          <p className="text-muted-foreground mb-6">
            {filter === 'all'
              ? "You're all caught up! Your financial health looks good."
              : `No ${filter} alerts at this time.`}
          </p>
          {filter === 'all' && (
            <button
              onClick={generateAlerts}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4 inline mr-2" />
              Check for New Alerts
            </button>
          )}
        </div>
      ),
    });
  }

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <MagicBento items={bentoItems} />
        )}
      </MainLayout>
    </AuthGuard>
  );
}
