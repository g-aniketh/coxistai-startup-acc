'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
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
} from 'lucide-react';
import MagicBento from '@/components/MagicBento';
import SpotlightCard from '@/components/SpotlightCard';
import { Badge } from '@/components/ui/Badge';

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
    } catch (error) {
      console.error('Failed to generate update:', error);
    } finally {
      setGenerating(false);
    }
  };

  const publishUpdate = async (id: string) => {
    try {
      await apiClient.dashboard.publishInvestorUpdate(id);
      await loadUpdates();
    } catch (error) {
      console.error('Failed to publish update:', error);
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

  const bentoItems = [
    // Header
    {
      className: 'col-span-12',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Investor Updates</h1>
              <p className="text-muted-foreground mt-1">
                AI-generated updates for your investors
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Update
            </button>
          </div>
          
          {/* Demo Mode Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">AI Investor Updates Demo</h3>
                  <p className="text-sm text-blue-700">Experience AI-powered investor report generation • Live AI integration coming soon</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                Mock Data
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Generate Form
    ...(showForm
      ? [
          {
            className: 'col-span-12',
            background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
            content: (
              <div className="p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Generate Investor Update
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Period Start *
                    </label>
                    <input
                      type="date"
                      value={formData.periodStart}
                      onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                      className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Period End *
                    </label>
                    <input
                      type="date"
                      value={formData.periodEnd}
                      onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                      className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={generateUpdate}
                    disabled={!formData.periodStart || !formData.periodEnd || generating}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {generating ? 'Generating...' : 'Generate Update'}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ),
          },
        ]
      : []),

    // Updates List
    ...updates.map((update) => ({
      className: 'col-span-12 lg:col-span-6',
      background: <SpotlightCard spotlightColor="rgba(139, 92, 246, 0.2)" className="w-full h-full" />,
      content: (
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">{update.title}</h3>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(update.periodStart).toLocaleDateString()} - {new Date(update.periodEnd).toLocaleDateString()}
                </span>
                <Badge variant={update.isDraft ? 'outline' : 'default'}>
                  {update.isDraft ? 'Draft' : 'Published'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedUpdate(selectedUpdate?.id === update.id ? null : update)}
                className="p-2 rounded-md bg-muted hover:bg-muted/80"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          {update.metrics && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Revenue</span>
                </div>
                <div className="text-lg font-bold text-foreground">
                  {formatCurrency(update.metrics.revenue || 0)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">MRR</span>
                </div>
                <div className="text-lg font-bold text-foreground">
                  {formatCurrency(update.metrics.mrr || 0)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-muted-foreground">Customers</span>
                </div>
                <div className="text-lg font-bold text-foreground">
                  {update.metrics.customers || 0}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Growth</span>
                </div>
                <div className="text-lg font-bold text-foreground">
                  {(update.metrics.revenueGrowth || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Executive Summary */}
          {selectedUpdate?.id === update.id && (
            <div className="flex-grow space-y-4 overflow-y-auto border-t border-border pt-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Executive Summary</h4>
                <p className="text-sm text-muted-foreground">{update.executiveSummary}</p>
              </div>

              {update.highlights && update.highlights.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Key Highlights</h4>
                  <ul className="space-y-2">
                    {update.highlights.map((highlight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-emerald-500 mt-1">✓</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {update.challenges && update.challenges.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Challenges</h4>
                  <ul className="space-y-2">
                    {update.challenges.map((challenge: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-yellow-500 mt-1">⚠</span>
                        <span>{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {update.nextSteps && update.nextSteps.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Next Steps</h4>
                  <ul className="space-y-2">
                    {update.nextSteps.map((step: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-1">→</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-border mt-auto">
            {update.isDraft && (
              <button
                onClick={() => publishUpdate(update.id)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                <Send className="h-3 w-3" />
                Publish
              </button>
            )}
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80">
              <Download className="h-3 w-3" />
              Export PDF
            </button>
            <div className="ml-auto text-xs text-muted-foreground">
              {new Date(update.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      ),
    })),
  ];

  // Empty state
  if (!loading && updates.length === 0 && !showForm) {
    bentoItems.push({
      className: 'col-span-12',
      background: <div className="absolute top-0 left-0 w-full h-full bg-card" />,
      content: (
        <div className="p-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Investor Updates</h3>
          <p className="text-muted-foreground mb-6">
            Generate AI-powered updates to keep your investors informed
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Create First Update
          </button>
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
