'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Plus,
  Send,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  Download,
  Sparkles,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

export default function InvestorUpdatesPage() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [formData, setFormData] = useState({
    periodStart: '',
    periodEnd: '',
  });

  useEffect(() => {
    loadUpdates();
  }, []);

  const loadUpdates = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const mockUpdates = [
        {
          id: '1',
          title: 'Q4 2024 Investor Update',
          periodStart: '2024-10-01',
          periodEnd: '2024-12-31',
          isDraft: false,
          createdAt: '2024-12-15T10:30:00Z',
          metrics: {
            revenue: 135600,
            mrr: 45200,
            customers: 342,
            revenueGrowth: 23.5
          },
          executiveSummary: "Q4 2024 was a strong quarter for our company, with significant growth in revenue and customer acquisition. We exceeded our targets across all key metrics and are well-positioned for continued expansion in 2025.",
          highlights: [
            "Achieved $135,600 in quarterly revenue, exceeding target by 18%",
            "Added 89 new customers, bringing total to 342 active users",
            "Launched enterprise tier with 3 major clients signed",
            "Reduced customer churn rate to 2.1% (down from 4.3%)",
            "Hired 4 key team members across engineering and sales"
          ],
          challenges: [
            "Increased competition in the SaaS space requiring higher customer acquisition costs",
            "Need to scale customer support team to maintain service quality",
            "Infrastructure costs growing faster than anticipated"
          ],
          nextSteps: [
            "Launch Series A fundraising round targeting $2.1M",
            "Expand into European market with localized product",
            "Implement AI-powered features to differentiate from competitors",
            "Build strategic partnerships with key industry players"
          ]
        },
        {
          id: '2',
          title: 'Q3 2024 Investor Update',
          periodStart: '2024-07-01',
          periodEnd: '2024-09-30',
          isDraft: false,
          createdAt: '2024-09-30T15:45:00Z',
          metrics: {
            revenue: 109800,
            mrr: 36600,
            customers: 253,
            revenueGrowth: 18.2
          },
          executiveSummary: "Q3 2024 demonstrated solid execution on our growth strategy with strong revenue performance and successful product launches. We maintained healthy unit economics while scaling our customer base.",
          highlights: [
            "Generated $109,800 in quarterly revenue, up 18.2% from Q2",
            "Achieved product-market fit with 4.8/5 customer satisfaction score",
            "Successfully launched mobile app with 10,000+ downloads",
            "Reduced monthly burn rate by 12% through operational efficiency",
            "Secured $500K bridge funding from existing investors"
          ],
          challenges: [
            "Longer sales cycles for enterprise customers than projected",
            "Technical debt accumulation requiring dedicated engineering time",
            "Market saturation in core vertical requiring expansion"
          ],
          nextSteps: [
            "Focus on enterprise sales strategy and longer-term contracts",
            "Invest in technical infrastructure and code quality",
            "Explore adjacent markets and vertical expansion opportunities"
          ]
        },
        {
          id: '3',
          title: 'Q1 2025 Investor Update (Draft)',
          periodStart: '2025-01-01',
          periodEnd: '2025-03-31',
          isDraft: true,
          createdAt: '2025-01-15T09:20:00Z',
          metrics: {
            revenue: 0,
            mrr: 0,
            customers: 0,
            revenueGrowth: 0
          },
          executiveSummary: "Q1 2025 is off to a strong start with ambitious goals for revenue growth and market expansion. We're focusing on scaling our enterprise sales and launching new AI-powered features.",
          highlights: [
            "Planning to launch AI-powered analytics dashboard",
            "Targeting 50% revenue growth through enterprise expansion",
            "Preparing for Series A fundraising round",
            "Building strategic partnerships with key industry players"
          ],
          challenges: [
            "Need to balance growth investments with runway management",
            "Competitive landscape intensifying in AI space",
            "Talent acquisition becoming more challenging and expensive"
          ],
          nextSteps: [
            "Complete Series A fundraising by end of Q1",
            "Launch AI features to drive premium pricing",
            "Expand sales team to support enterprise growth",
            "Establish European operations and compliance"
          ]
        }
      ];
      
      setUpdates(mockUpdates);
    } catch (error) {
      console.error('Failed to load investor updates:', error);
      toast.error('Failed to load investor updates');
    } finally {
      setLoading(false);
    }
  };

  const generateUpdate = async () => {
    if (!formData.periodStart || !formData.periodEnd) return;

    try {
      setGenerating(true);
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate AI generation
      
      const newUpdate = {
        id: Date.now().toString(),
        title: `Q${Math.floor(Math.random() * 4) + 1} ${new Date().getFullYear()} Investor Update`,
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        isDraft: true,
        createdAt: new Date().toISOString(),
        metrics: {
          revenue: Math.floor(Math.random() * 200000) + 50000,
          mrr: Math.floor(Math.random() * 60000) + 20000,
          customers: Math.floor(Math.random() * 500) + 100,
          revenueGrowth: Math.floor(Math.random() * 50) + 10
        },
        executiveSummary: `This period demonstrated strong execution across all key metrics. Revenue growth exceeded expectations, customer acquisition accelerated, and we maintained healthy unit economics while scaling operations. The team's focus on product excellence and customer success continues to drive sustainable growth.`,
        highlights: [
          "Achieved significant revenue growth with improved unit economics",
          "Successfully launched new product features driving customer engagement",
          "Expanded customer base with focus on enterprise clients",
          "Maintained strong customer satisfaction and low churn rates",
          "Strengthened team with key hires across engineering and sales"
        ],
        challenges: [
          "Market competition intensifying requiring increased marketing investment",
          "Scaling customer support to maintain service quality standards",
          "Balancing growth investments with runway management"
        ],
        nextSteps: [
          "Continue expanding enterprise sales and partnerships",
          "Invest in product development and AI-powered features",
          "Scale team strategically to support growth objectives",
          "Prepare for next funding round to accelerate expansion"
        ]
      };
      
      setUpdates(prev => [newUpdate, ...prev]);
        setShowForm(false);
        setFormData({ periodStart: '', periodEnd: '' });
      toast.success('Investor update generated successfully!');
    } catch (error) {
      console.error('Failed to generate update:', error);
      toast.error('Failed to generate update');
    } finally {
      setGenerating(false);
    }
  };

  const publishUpdate = async (id: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUpdates(prev => prev.map(update => 
        update.id === id ? { ...update, isDraft: false } : update
      ));
      toast.success('Update published successfully!');
    } catch (error) {
      console.error('Failed to publish update:', error);
      toast.error('Failed to publish update');
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

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading Investor Updates...</p>
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
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Investor Updates</h1>
                  <p className="text-sm text-[#2C2C2C]/70">
              AI-generated updates for your investors
            </p>
          </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search updates..." className="pl-10 bg-white rounded-lg" />
                  </div>
                  <Button
            onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-[#607c47] hover:bg-[#4a6129] text-white"
          >
            <Plus className="h-4 w-4" />
            New Update
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
                      <h3 className="font-semibold text-blue-900">AI Investor Updates</h3>
                      <p className="text-sm text-blue-700">AI-powered report generation • Live data integration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Data
                  </div>
                </div>
        </div>

              {/* Generate Form */}
              {showForm && (
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                      </div>
                      <CardTitle className="text-sm font-medium text-purple-900">Generate Investor Update</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                        <label className="block text-sm font-medium text-[#2C2C2C] mb-2">
                      Period Start *
                    </label>
                        <Input
                      type="date"
                      value={formData.periodStart}
                      onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                          className="bg-white"
                    />
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-[#2C2C2C] mb-2">
                      Period End *
                    </label>
                        <Input
                      type="date"
                      value={formData.periodEnd}
                      onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                          className="bg-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                      <Button
                    onClick={generateUpdate}
                    disabled={!formData.periodStart || !formData.periodEnd || generating}
                        className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {generating ? 'Generating...' : 'Generate Update'}
                      </Button>
                      <Button
                    onClick={() => setShowForm(false)}
                        variant="outline"
                        className="border-gray-300 text-[#2C2C2C]"
                  >
                    Cancel
                      </Button>
                </div>
                  </CardContent>
                </Card>
              )}

              {/* Updates Grid */}
              {updates.length === 0 && !showForm ? (
                <Card className="rounded-xl border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">No Investor Updates</h3>
                    <p className="text-gray-600 mb-6">
                      Generate AI-powered updates to keep your investors informed
                    </p>
                    <Button
                      onClick={() => setShowForm(true)}
                      className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                    >
                      <Plus className="h-4 w-4 inline mr-2" />
                      Create First Update
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {updates.map((update) => (
                    <Card key={update.id} className="bg-white rounded-xl border-0 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-5 w-5 text-[#607c47]" />
                              <CardTitle className="text-lg font-medium text-[#2C2C2C]">{update.title}</CardTitle>
              </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(update.periodStart).toLocaleDateString()} - {new Date(update.periodEnd).toLocaleDateString()}
                </span>
                              <Badge variant={update.isDraft ? 'outline' : 'default'} className={update.isDraft ? 'border-orange-300 text-orange-700' : 'bg-green-100 text-green-700'}>
                  {update.isDraft ? 'Draft' : 'Published'}
                </Badge>
              </div>
            </div>
                          <Button
                onClick={() => setSelectedUpdate(selectedUpdate?.id === update.id ? null : update)}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 text-[#2C2C2C]"
              >
                <Eye className="h-4 w-4" />
                          </Button>
            </div>
                      </CardHeader>

                      <CardContent className="pt-0">
          {/* Key Metrics */}
          {update.metrics && (
            <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-[#C9E0B0]">
                <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="h-4 w-4 text-[#3a5129]" />
                                <span className="text-xs text-[#3a5129]">Revenue</span>
                </div>
                              <div className="text-lg font-bold text-[#2C2C2C]">
                  {formatCurrency(update.metrics.revenue || 0)}
                </div>
              </div>
                            <div className="p-3 rounded-lg bg-[#F6D97A]">
                <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-[#7a6015]" />
                                <span className="text-xs text-[#7a6015]">MRR</span>
                </div>
                              <div className="text-lg font-bold text-[#2C2C2C]">
                  {formatCurrency(update.metrics.mrr || 0)}
                </div>
              </div>
                            <div className="p-3 rounded-lg bg-[#B7B3E6]">
                <div className="flex items-center gap-2 mb-1">
                                <Users className="h-4 w-4 text-[#2C2C2C]" />
                                <span className="text-xs text-[#2C2C2C]">Customers</span>
                </div>
                              <div className="text-lg font-bold text-[#2C2C2C]">
                  {update.metrics.customers || 0}
                </div>
              </div>
                            <div className="p-3 rounded-lg bg-[#FFB3BA]">
                <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-[#8B0000]" />
                                <span className="text-xs text-[#8B0000]">Growth</span>
                </div>
                              <div className="text-lg font-bold text-[#2C2C2C]">
                  {(update.metrics.revenueGrowth || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Executive Summary */}
          {selectedUpdate?.id === update.id && (
                          <div className="space-y-4 border-t border-gray-200 pt-4">
              <div>
                              <h4 className="text-sm font-semibold text-[#2C2C2C] mb-2">Executive Summary</h4>
                              <p className="text-sm text-gray-600">{update.executiveSummary}</p>
              </div>

              {update.highlights && update.highlights.length > 0 && (
                <div>
                                <h4 className="text-sm font-semibold text-[#2C2C2C] mb-2">Key Highlights</h4>
                  <ul className="space-y-2">
                    {update.highlights.map((highlight: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                      <span className="text-green-500 mt-1">✓</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {update.challenges && update.challenges.length > 0 && (
                <div>
                                <h4 className="text-sm font-semibold text-[#2C2C2C] mb-2">Challenges</h4>
                  <ul className="space-y-2">
                    {update.challenges.map((challenge: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-yellow-500 mt-1">⚠</span>
                        <span>{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {update.nextSteps && update.nextSteps.length > 0 && (
                <div>
                                <h4 className="text-sm font-semibold text-[#2C2C2C] mb-2">Next Steps</h4>
                  <ul className="space-y-2">
                    {update.nextSteps.map((step: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                      <span className="text-[#607c47] mt-1">→</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
            {update.isDraft && (
                            <Button
                onClick={() => publishUpdate(update.id)}
                              size="sm"
                              className="bg-[#607c47] hover:bg-[#4a6129] text-white"
              >
                              <Send className="h-3 w-3 mr-1" />
                Publish
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 text-[#2C2C2C]"
                          >
                            <Download className="h-3 w-3 mr-1" />
              Export PDF
                          </Button>
                          <div className="ml-auto text-xs text-gray-500">
              {new Date(update.createdAt).toLocaleString()}
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