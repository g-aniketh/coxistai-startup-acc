'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import AIChatbot from '@/components/AIChatbot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { 
  Bot, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Lightbulb
} from 'lucide-react';

export default function AIChatbotPage() {
  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Bot className="h-8 w-8 text-primary" />
                AI CFO Chatbot
              </h1>
              <p className="text-muted-foreground mt-1">
                Ask me anything about your financial data and get instant insights
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Demo Mode
            </Badge>
          </div>

          {/* Demo Mode Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bot className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">AI CFO Chatbot Demo</h3>
                  <p className="text-sm text-blue-700">Experience intelligent financial analysis • Live AI integration coming soon</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                Mock Responses
              </div>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-sm">Revenue Questions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• "What's my total revenue?"</div>
                  <div>• "What's my monthly revenue?"</div>
                  <div>• "How is my revenue trending?"</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <CardTitle className="text-sm">Expense Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• "What's my burn rate?"</div>
                  <div>• "How much am I spending?"</div>
                  <div>• "What are my biggest expenses?"</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-sm">Cash Flow</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• "How much cash do I have?"</div>
                  <div>• "What's my runway?"</div>
                  <div>• "When will I run out of money?"</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-indigo-500" />
                  <CardTitle className="text-sm">Customer Metrics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• "How many customers do I have?"</div>
                  <div>• "What's my churn rate?"</div>
                  <div>• "What's my CAC and LTV?"</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-sm">Growth Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• "What's my growth rate?"</div>
                  <div>• "How am I performing vs last month?"</div>
                  <div>• "What are my growth trends?"</div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <CardTitle className="text-sm">Strategic Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• "Should I hire more people?"</div>
                  <div>• "When should I raise funding?"</div>
                  <div>• "What should I optimize?"</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Chatbot */}
          <AIChatbot className="max-w-4xl" />
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
