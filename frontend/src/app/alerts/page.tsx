'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  RefreshCw,
  Eye,
  Sparkles,
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Bot,
  Zap,
  Bell,
  Settings,
  Filter,
  Download,
  Calendar,
  Target,
  Activity,
  Brain,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [counts, setCounts] = useState({ total: 0, critical: 0, warning: 0, info: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    burnRateThreshold: 15,
    cashFlowThreshold: 5000,
    revenueGrowthThreshold: 10,
    churnRateThreshold: 5,
    enableProactiveAlerts: true,
    enableWeeklyDigest: true,
    enableEmailNotifications: true
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const mockAlerts = [
        {
          id: '1',
          title: 'High Burn Rate Alert',
          message: 'Your monthly burn rate has increased by 15% above forecast. Current burn: $15,400/month vs projected $13,400/month.',
          severity: 'critical',
          currentValue: 15400,
          thresholdValue: 13400,
          createdAt: '2024-01-15T10:30:00Z',
          recommendations: [
            {
              action: 'Review contractor utilization and optimize costs',
              impact: 'Potential savings: $2,100/month',
              effort: 'medium'
            },
            {
              action: 'Audit SaaS subscriptions and remove unused tools',
              impact: 'Potential savings: $800/month',
              effort: 'low'
            }
          ],
          isRead: false,
          isDismissed: false
        },
        {
          id: '2',
          title: 'Revenue Growth Opportunity',
          message: 'Your churn rate has decreased by 2.3% this month. Consider implementing expansion pricing to capitalize on customer satisfaction.',
          severity: 'info',
          currentValue: 2.1,
          thresholdValue: 4.4,
          createdAt: '2024-01-14T14:20:00Z',
          recommendations: [
            {
              action: 'Implement usage-based pricing tiers',
              impact: 'Potential revenue increase: 15-25%',
              effort: 'high'
            },
            {
              action: 'Launch customer success program',
              impact: 'Reduce churn by additional 1-2%',
              effort: 'medium'
            }
          ],
          isRead: true,
          isDismissed: false
        },
        {
          id: '3',
          title: 'Cash Flow Warning',
          message: 'You have 3 overdue invoices totaling $12,500. This represents 8% of your monthly revenue.',
          severity: 'warning',
          currentValue: 12500,
          thresholdValue: 5000,
          createdAt: '2024-01-13T09:15:00Z',
          recommendations: [
            {
              action: 'Send automated payment reminders',
              impact: 'Expected collection: 70-80%',
              effort: 'low'
            },
            {
              action: 'Implement stricter payment terms',
              impact: 'Reduce future overdue amounts',
              effort: 'medium'
            }
          ],
          isRead: false,
          isDismissed: false
        },
        {
          id: '4',
          title: 'Runway Status Update',
          message: 'Based on current burn rate, you have 8.2 months of runway remaining. Consider fundraising timeline.',
          severity: 'info',
          currentValue: 8.2,
          thresholdValue: 6.0,
          createdAt: '2024-01-12T16:45:00Z',
          recommendations: [
            {
              action: 'Begin Series A fundraising process',
              impact: 'Extend runway to 18+ months',
              effort: 'high'
            },
            {
              action: 'Optimize burn rate for extended runway',
              impact: 'Extend runway by 2-3 months',
              effort: 'medium'
            }
          ],
          isRead: true,
          isDismissed: false
        }
      ];
      
      setAlerts(mockAlerts);
      
      // Calculate counts
      const newCounts = {
        total: mockAlerts.length,
        critical: mockAlerts.filter(a => a.severity === 'critical').length,
        warning: mockAlerts.filter(a => a.severity === 'warning').length,
        info: mockAlerts.filter(a => a.severity === 'info').length,
      };
      setCounts(newCounts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = async () => {
    try {
      setGenerating(true);
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI generation
      
      const newAlert = {
        id: Date.now().toString(),
        title: 'AI-Generated Alert',
        message: 'AI analysis detected a potential optimization opportunity in your expense categories.',
        severity: 'info',
        currentValue: Math.floor(Math.random() * 10000) + 5000,
        thresholdValue: Math.floor(Math.random() * 8000) + 3000,
        createdAt: new Date().toISOString(),
        recommendations: [
          {
            action: 'Review and optimize identified expense category',
            impact: 'Potential savings: 10-15%',
            effort: 'medium'
          }
        ],
        isRead: false,
        isDismissed: false,
        aiGenerated: true
      };
      
      setAlerts(prev => [newAlert, ...prev]);
      setCounts(prev => ({ ...prev, total: prev.total + 1, info: prev.info + 1 }));
      toast.success('New AI alert generated!');
    } catch (error) {
      console.error('Failed to generate alerts:', error);
      toast.error('Failed to generate alerts');
    } finally {
      setGenerating(false);
    }
  };

  const generateAIInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const insights = {
        patterns: [
          {
            type: 'Spending Pattern',
            description: 'SaaS expenses have increased 23% month-over-month',
            impact: 'High',
            trend: 'increasing',
            recommendation: 'Implement subscription management tool'
          },
          {
            type: 'Revenue Pattern',
            description: 'Customer acquisition cost decreased by 15%',
            impact: 'Positive',
            trend: 'improving',
            recommendation: 'Scale marketing spend while maintaining efficiency'
          },
          {
            type: 'Cash Flow Pattern',
            description: 'Payment collection time improved by 3 days',
            impact: 'Medium',
            trend: 'improving',
            recommendation: 'Continue automated payment reminders'
          }
        ],
        predictions: [
          {
            metric: 'Burn Rate',
            prediction: 'Will increase by 8% next month',
            confidence: 85,
            action: 'Monitor hiring plans and optimize costs'
          },
          {
            metric: 'Revenue',
            prediction: 'Will grow by 12% next quarter',
            confidence: 78,
            action: 'Prepare for increased customer support needs'
          },
          {
            metric: 'Runway',
            prediction: 'Will extend to 11.2 months',
            confidence: 92,
            action: 'Consider growth investments'
          }
        ],
        anomalies: [
          {
            type: 'Unusual Transaction',
            description: 'Large payment of $25,000 received 5 days early',
            severity: 'info',
            impact: 'Positive cash flow impact'
          },
          {
            type: 'Expense Spike',
            description: 'Marketing spend increased 40% this week',
            severity: 'warning',
            impact: 'Monitor ROI and budget allocation'
          }
        ]
      };
      
      setAiInsights(insights);
      toast.success('AI insights generated successfully!');
    } catch (error) {
      toast.error('Failed to generate AI insights');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alert.id === id ? { ...alert, isRead: true } : alert
      ));
      toast.success('Alert marked as read');
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
      toast.error('Failed to mark alert as read');
    }
  };

  const dismissAlert = async (id: string) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alert.id === id ? { ...alert, isDismissed: true } : alert
      ));
      setCounts(prev => ({ ...prev, total: prev.total - 1 }));
      toast.success('Alert dismissed');
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      toast.error('Failed to dismiss alert');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      case 'info':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return !alert.isDismissed;
    return alert.severity === filter && !alert.isDismissed;
  });

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading Alerts...</p>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="h-screen flex">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">AI Alerts</h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Proactive financial insights and recommendations
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search alerts..." 
                      className="pl-10 bg-white rounded-lg"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={generateAIInsights}
                    disabled={isGeneratingInsights}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isGeneratingInsights ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        AI Insights
                      </>
                    )}
                  </Button>
                  <Button
              onClick={generateAlerts}
              disabled={generating}
                    className="flex items-center gap-2 bg-[#607c47] hover:bg-[#4a6129] text-white"
            >
              <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                    {generating ? 'Generating...' : 'Generate Alerts'}
                  </Button>
                </div>
              </div>

              {/* AI Status Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">AI-Powered Alerts</h3>
                      <p className="text-sm text-blue-700">Real-time financial monitoring • Proactive recommendations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Monitoring
                  </div>
                </div>
              </div>

              {/* Alert Counts */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-900">{counts.critical}</div>
                        <div className="text-sm text-red-700">Critical</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-900">{counts.warning}</div>
                        <div className="text-sm text-yellow-700">Warning</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Info className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-900">{counts.info}</div>
                        <div className="text-sm text-blue-700">Info</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-900">{counts.total}</div>
                        <div className="text-sm text-green-700">Total</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
          </div>

              {/* Filter Buttons */}
          <div className="flex gap-2">
                <Button
              onClick={() => setFilter('all')}
                  variant={filter === 'all' ? 'default' : 'outline'}
                  className={filter === 'all' ? 'bg-[#607c47] hover:bg-[#4a6129] text-white' : 'border-gray-300 text-[#2C2C2C]'}
            >
              All ({counts.total})
                </Button>
                <Button
              onClick={() => setFilter('critical')}
                  variant={filter === 'critical' ? 'default' : 'outline'}
                  className={filter === 'critical' ? 'bg-red-500 hover:bg-red-600 text-white' : 'border-gray-300 text-[#2C2C2C]'}
            >
              Critical ({counts.critical})
                </Button>
                <Button
              onClick={() => setFilter('warning')}
                  variant={filter === 'warning' ? 'default' : 'outline'}
                  className={filter === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'border-gray-300 text-[#2C2C2C]'}
            >
              Warning ({counts.warning})
                </Button>
                <Button
              onClick={() => setFilter('info')}
                  variant={filter === 'info' ? 'default' : 'outline'}
                  className={filter === 'info' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'border-gray-300 text-[#2C2C2C]'}
            >
              Info ({counts.info})
                </Button>
              </div>

              {/* AI Insights Section */}
              {aiInsights && (
                <div className="space-y-6">
                  <Card className="bg-white rounded-xl border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        AI Pattern Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {aiInsights.patterns.map((pattern: any, index: number) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-[#2C2C2C]">{pattern.type}</h4>
                              <Badge className={
                                pattern.impact === 'High' ? 'bg-red-100 text-red-800' :
                                pattern.impact === 'Positive' ? 'bg-green-100 text-green-800' :
                                'bg-yellow-100 text-yellow-800'
                              }>
                                {pattern.impact}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{pattern.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Recommendation:</span>
                              <span className="text-xs text-[#607c47] font-medium">{pattern.recommendation}</span>
          </div>
        </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                          Predictive Analytics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {aiInsights.predictions.map((prediction: any, index: number) => (
                            <div key={index} className="border-l-4 border-blue-200 pl-4">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-[#2C2C2C]">{prediction.metric}</h4>
                                <Badge 
                                  className="bg-blue-100"
                                  style={{ color: '#1f2937' }}
                                >
                                  {prediction.confidence}% confidence
                                </Badge>
              </div>
                              <p className="text-sm text-gray-600 mb-2">{prediction.prediction}</p>
                              <p className="text-xs text-[#607c47] font-medium">{prediction.action}</p>
            </div>
                          ))}
          </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                          <Shield className="h-5 w-5 text-orange-600" />
                          Anomaly Detection
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {aiInsights.anomalies.map((anomaly: any, index: number) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-[#2C2C2C]">{anomaly.type}</h4>
                                <Badge 
                                  className={
                                    anomaly.severity === 'warning' ? 'bg-yellow-100' :
                                    'bg-blue-100'
                                  }
                                  style={{ color: '#1f2937' }}
                                >
                                  {anomaly.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{anomaly.description}</p>
                              <p className="text-xs text-gray-500">{anomaly.impact}</p>
                  </div>
                          ))}
                </div>
                      </CardContent>
                    </Card>
                  </div>
            </div>
          )}

              {/* Alerts List */}
              {filteredAlerts.length === 0 ? (
                <Card className="rounded-xl border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">No Alerts</h3>
                    <p className="text-gray-600 mb-6">
                      {filter === 'all' ? 'No alerts at this time' : `No ${filter} alerts`}
                    </p>
                    <Button
                      onClick={generateAlerts}
                      disabled={generating}
                      className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                      Generate AI Alerts
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => (
                    <Card key={alert.id} className={`rounded-xl border-0 shadow-lg hover:shadow-xl transition-shadow ${getSeverityColor(alert.severity)}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-lg font-medium text-[#2C2C2C]">{alert.title}</CardTitle>
                                <Badge 
                                  className={getSeverityBadgeColor(alert.severity)}
                                  style={{ color: '#1f2937' }}
                                >
                                  {alert.severity}
                                </Badge>
                                {!alert.isRead && (
                                  <Badge 
                                    variant="outline" 
                                    className="border-blue-300"
                                    style={{ color: '#1f2937' }}
                                  >
                                    New
                                  </Badge>
                        )}
                      </div>
                              <p className="text-sm text-gray-600 mb-3">{alert.message}</p>
                              
                              {/* Metrics */}
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-600">Current: {formatCurrency(alert.currentValue)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-600">Threshold: {formatCurrency(alert.thresholdValue)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!alert.isRead && (
                              <Button
                                onClick={() => markAsRead(alert.id)}
                                variant="outline"
                                size="sm"
                                className="border-gray-300 text-[#2C2C2C]"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              onClick={() => dismissAlert(alert.id)}
                              variant="outline"
                              size="sm"
                              className="border-gray-300 text-[#2C2C2C]"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                    </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        {/* Recommendations */}
                        {alert.recommendations && alert.recommendations.length > 0 && (
                          <div className="border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-semibold text-[#2C2C2C] mb-3">AI Recommendations</h4>
                            <div className="space-y-3">
                              {alert.recommendations.map((rec: any, index: number) => (
                                <div key={index} className="bg-white/60 rounded-lg p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <p className="text-sm font-medium text-[#2C2C2C]">{rec.action}</p>
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs"
                                      style={{ color: '#1f2937' }}
                                    >
                                      {rec.effort} effort
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-600">{rec.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

                        {/* Timestamp */}
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
                          <span className="text-xs text-gray-500">
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-300 text-[#2C2C2C]"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}