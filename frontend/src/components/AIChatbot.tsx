'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/Badge';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  data?: any; // For structured data responses
}

interface AIChatbotProps {
  className?: string;
}

export default function AIChatbot({ className }: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI CFO assistant. How can I help you with your startup's finances today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Mock AI response based on the question
      const response = await generateAIResponse(inputValue.trim());
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        data: response.data
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (question: string): Promise<{ content: string; data?: any }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerQuestion = question.toLowerCase();

    // Revenue queries
    if (lowerQuestion.includes('revenue') || lowerQuestion.includes('income') || lowerQuestion.includes('sales')) {
      if (lowerQuestion.includes('total') || lowerQuestion.includes('overall')) {
        return {
          content: "Based on your transaction history, your total revenue for the last 90 days is approximately **$127,450**. This includes all income from customer payments, subscriptions, and other revenue streams.",
          data: {
            type: 'revenue',
            value: 127450,
            period: '90 days',
            breakdown: [
              { source: 'Customer Payments', amount: 85000 },
              { source: 'Subscriptions', amount: 32450 },
              { source: 'API Usage', amount: 10000 }
            ]
          }
        };
      }
      if (lowerQuestion.includes('monthly') || lowerQuestion.includes('per month')) {
        return {
          content: "Your monthly recurring revenue (MRR) is approximately **$45,200**. This represents the predictable monthly income from your subscription-based customers.",
          data: {
            type: 'mrr',
            value: 45200,
            growth: '+12%',
            trend: 'increasing'
          }
        };
      }
    }

    // Expense queries
    if (lowerQuestion.includes('expense') || lowerQuestion.includes('cost') || lowerQuestion.includes('spend')) {
      if (lowerQuestion.includes('monthly') || lowerQuestion.includes('burn')) {
        return {
          content: "Your current monthly burn rate is **$35,000**. This includes payroll ($21,000), operating expenses ($8,500), and other costs ($5,500).",
          data: {
            type: 'burn_rate',
            value: 35000,
            breakdown: [
              { category: 'Payroll', amount: 21000 },
              { category: 'Operating', amount: 8500 },
              { category: 'Other', amount: 5500 }
            ]
          }
        };
      }
    }

    // Cash flow queries
    if (lowerQuestion.includes('cash') || lowerQuestion.includes('balance') || lowerQuestion.includes('money')) {
      return {
        content: "Your current cash balance across all accounts is **$287,500**. This includes your main checking account ($125,000), business savings ($150,000), and Stripe payouts ($12,500).",
        data: {
          type: 'cash_balance',
          value: 287500,
          accounts: [
            { name: 'Main Checking', balance: 125000 },
            { name: 'Business Savings', balance: 150000 },
            { name: 'Stripe Payouts', balance: 12500 }
          ]
        }
      };
    }

    // Runway queries
    if (lowerQuestion.includes('runway') || lowerQuestion.includes('months') || lowerQuestion.includes('survive')) {
      return {
        content: "Based on your current burn rate of $35,000/month and cash balance of $287,500, you have approximately **8.2 months of runway** remaining. This is above the recommended 6-month threshold.",
        data: {
          type: 'runway',
          months: 8.2,
          status: 'healthy',
          recommendation: 'Consider fundraising in Q2 2025'
        }
      };
    }

    // Customer queries
    if (lowerQuestion.includes('customer') || lowerQuestion.includes('client')) {
      return {
        content: "You currently have **215 active customers** with a monthly churn rate of 2.3%. Your customer acquisition cost (CAC) is $425 and customer lifetime value (LTV) is $4,750.",
        data: {
          type: 'customers',
          active: 215,
          churn_rate: 2.3,
          cac: 425,
          ltv: 4750
        }
      };
    }

    // Growth queries
    if (lowerQuestion.includes('growth') || lowerQuestion.includes('increase') || lowerQuestion.includes('trend')) {
      return {
        content: "Your revenue has grown **25% quarter-over-quarter** with a consistent upward trend. Customer acquisition is accelerating, and your unit economics are improving.",
        data: {
          type: 'growth',
          qoq_growth: 25,
          trend: 'positive',
          metrics: ['Revenue up 25%', 'Customer count up 18%', 'Churn down 35%']
        }
      };
    }

    // Default response
    return {
      content: "I can help you with questions about your financial metrics, including revenue, expenses, cash flow, runway, customer metrics, and growth trends. Try asking me something like:\n\n• \"What's my total revenue?\"\n• \"How much am I spending monthly?\"\n• \"What's my runway?\"\n• \"How many customers do I have?\"\n• \"What's my growth rate?\"",
      data: {
        type: 'help',
        suggestions: [
          'What is my total revenue?',
          'What is my monthly burn rate?',
          'How much cash do I have?',
          'What is my runway?',
          'How many customers do I have?'
        ]
      }
    };
  };

  const getMessageIcon = (type: 'user' | 'ai') => {
    if (type === 'user') {
      return <User className="h-4 w-4" />;
    }
    return <Bot className="h-4 w-4" />;
  };

  const getDataIcon = (dataType: string) => {
    switch (dataType) {
      case 'revenue':
      case 'mrr':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'burn_rate':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'cash_balance':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'runway':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'customers':
        return <CheckCircle className="h-4 w-4 text-indigo-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-primary" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderDataVisualization = (data: any) => {
    if (!data) return null;

    switch (data.type) {
      case 'revenue':
        return (
          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              {getDataIcon(data.type)}
              <span className="font-semibold text-green-800">Revenue Breakdown</span>
            </div>
            <div className="text-2xl font-bold text-green-900 mb-2">
              {formatCurrency(data.value)}
            </div>
            <div className="text-sm text-green-700 mb-2">Period: {data.period}</div>
            {data.breakdown && (
              <div className="space-y-1">
                {data.breakdown.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm text-gray-700">
                    <span>{item.source}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'burn_rate':
        return (
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              {getDataIcon(data.type)}
              <span className="font-semibold text-red-800">Monthly Burn Rate</span>
            </div>
            <div className="text-2xl font-bold text-red-900 mb-2">
              {formatCurrency(data.value)}
            </div>
            {data.breakdown && (
              <div className="space-y-1">
                {data.breakdown.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm text-gray-700">
                    <span>{item.category}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'cash_balance':
        return (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              {getDataIcon(data.type)}
              <span className="font-semibold text-blue-800">Cash Balance</span>
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-2">
              {formatCurrency(data.value)}
            </div>
            {data.accounts && (
              <div className="space-y-1">
                {data.accounts.map((account: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm text-gray-700">
                    <span>{account.name}</span>
                    <span className="font-medium">{formatCurrency(account.balance)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'runway':
        return (
          <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              {getDataIcon(data.type)}
              <span className="font-semibold text-purple-800">Runway Analysis</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 mb-2">
              {data.months} months
            </div>
            <div className="flex items-center gap-2">
              <Badge className={data.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {data.status}
              </Badge>
              <span className="text-sm text-purple-700">{data.recommendation}</span>
            </div>
          </div>
        );

      case 'customers':
        return (
          <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              {getDataIcon(data.type)}
              <span className="font-semibold text-indigo-800">Customer Metrics</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-lg font-bold text-indigo-900">{data.active}</div>
                <div className="text-indigo-700">Active Customers</div>
              </div>
              <div>
                <div className="text-lg font-bold text-indigo-900">{data.churn_rate}%</div>
                <div className="text-indigo-700">Churn Rate</div>
              </div>
              <div>
                <div className="text-lg font-bold text-indigo-900">{formatCurrency(data.cac)}</div>
                <div className="text-indigo-700">CAC</div>
              </div>
              <div>
                <div className="text-lg font-bold text-indigo-900">{formatCurrency(data.ltv)}</div>
                <div className="text-indigo-700">LTV</div>
              </div>
            </div>
          </div>
        );

      case 'help':
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              {getDataIcon(data.type)}
              <span className="font-semibold text-gray-800">Try These Questions</span>
            </div>
            <div className="space-y-1">
              {data.suggestions.map((suggestion: string, index: number) => (
                <div 
                  key={index} 
                  className="text-sm text-gray-700 cursor-pointer hover:text-gray-900 hover:bg-gray-100 p-1 rounded"
                  onClick={() => setInputValue(suggestion)}
                >
                  • {suggestion}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={cn("w-full shadow-lg border-0 rounded-xl bg-white", className)}>
      <CardContent className="p-0">
        <ScrollArea ref={scrollAreaRef} className="h-[60vh] p-4 bg-white">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3",
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.type === 'ai' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3",
                    message.type === 'user'
                      ? 'bg-[#607c47] text-white'
                      : 'bg-gray-100 text-gray-800'
                  )}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.data && renderDataVisualization(message.data)}
                  <div className="text-xs opacity-70 mt-1 text-right">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {message.type === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-[#607c47] rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-gray-600" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50/50 rounded-b-xl">
          <div className="relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask your AI CFO anything..."
              className="pr-12 bg-white rounded-lg h-12"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={isLoading || !inputValue.trim()}
              className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8 rounded-md bg-[#607c47] hover:bg-[#4a6129]"
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
