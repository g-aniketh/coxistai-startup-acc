"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import MainLayout from "@/components/layout/MainLayout";
import AIChatbot from "@/components/AIChatbot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import {
  Bot,
  Sparkles,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
} from "lucide-react";

export default function AIChatbotPage() {
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
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C] flex items-center gap-2">
                    <Bot className="h-8 w-8 text-[#607c47]" />
                    AI CFO Chatbot
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70 mt-1">
                    Ask me anything about your financial data and get instant
                    insights
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="flex items-center gap-2 border-gray-300 text-[#2C2C2C]"
                >
                  <Sparkles className="h-4 w-4" />
                  Demo Mode
                </Badge>
              </div>

              {/* AI Status Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        AI CFO Chatbot
                      </h3>
                      <p className="text-sm text-blue-700">
                        Intelligent financial analysis • Real-time data
                        integration
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Data
                  </div>
                </div>
              </div>

              {/* AI Chatbot */}
              <div className="mt-6">
                <AIChatbot />
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
