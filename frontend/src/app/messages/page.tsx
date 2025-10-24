'use client';

import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  AlertTriangle, 
  Info, 
  Bell, 
  Search,
  Filter,
  MarkAsRead,
  Archive,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { useState } from 'react';

const alerts = [
  {
    id: '1',
    title: "Runway Alert",
    message: "Runway is down to 4.5 months. Recommend cutting $15k/mo in SaaS spend.",
    type: "warning",
    priority: "high",
    date: "2024-01-15T10:30:00Z",
    isRead: false,
    category: "Financial Health",
    action: "Review SaaS subscriptions",
    impact: "Potential savings: $15,000/month"
  },
  {
    id: '2',
    title: "High Burn Rate",
    message: "Your monthly burn rate has increased by 20% over the last 30 days.",
    type: "warning",
    priority: "high",
    date: "2024-01-12T14:20:00Z",
    isRead: true,
    category: "Cash Flow",
    action: "Audit expenses",
    impact: "Current burn: $42,000/month"
  },
  {
    id: '3',
    title: "Revenue Opportunity",
    message: "AI analysis suggests a pricing adjustment could increase ARR by 15%.",
    type: "info",
    priority: "medium",
    date: "2024-01-10T09:15:00Z",
    isRead: true,
    category: "Growth",
    action: "Review pricing strategy",
    impact: "Potential ARR increase: $81,000"
  },
  {
    id: '4',
    title: "Subscription Reminder",
    message: "Your subscription for 'Advanced AI Insights' will renew in 3 days.",
    type: "info",
    priority: "low",
    date: "2024-01-08T16:45:00Z",
    isRead: false,
    category: "Billing",
    action: "Review subscription",
    impact: "Renewal cost: $200/month"
  },
  {
    id: '5',
    title: "Customer Churn Alert",
    message: "Customer churn rate increased to 3.2% this month. Above target of 2%.",
    type: "warning",
    priority: "medium",
    date: "2024-01-05T11:30:00Z",
    isRead: true,
    category: "Customer Success",
    action: "Investigate churn causes",
    impact: "Lost revenue: $8,500/month"
  },
  {
    id: '6',
    title: "Tax Optimization",
    message: "Consider accelerating Q1 expenses to optimize tax position.",
    type: "info",
    priority: "medium",
    date: "2024-01-03T13:20:00Z",
    isRead: false,
    category: "Tax Planning",
    action: "Review Q1 expenses",
    impact: "Potential tax savings: $12,000"
  }
];

export default function MessagesPage() {
  const [messages, setMessages] = useState(alerts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'warning' | 'info'>('all');
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !message.isRead) ||
                         (filter === 'warning' && message.type === 'warning') ||
                         (filter === 'info' && message.type === 'info');
    
    return matchesSearch && matchesFilter;
  });

  const unreadCount = messages.filter(m => !m.isRead).length;
  const warningCount = messages.filter(m => m.type === 'warning').length;
  const infoCount = messages.filter(m => m.type === 'info').length;

  const handleMarkAsRead = (id: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, isRead: true } : msg
    ));
    toast.success('Message marked as read');
  };

  const handleMarkAllAsRead = () => {
    setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
    toast.success('All messages marked as read');
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
    toast.success('Message deleted');
  };

  const handleArchiveMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
    toast.success('Message archived');
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

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
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">AI Alerts & Messages</h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Proactive insights from your AI CFO
              </p>
            </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search messages..." 
                      className="pl-10 bg-white rounded-lg"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-2 bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark All Read
                  </Button>
                </div>
              </div>

              {/* AI Status Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">AI-Powered Alerts</h3>
                      <p className="text-sm text-blue-700">Real-time monitoring • Proactive insights • Smart recommendations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Monitoring
                  </div>
                </div>
          </div>

              {/* Message Counts */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <div className="text-sm text-red-700">Unread</div>
                        <div className="text-lg font-bold text-red-900">{unreadCount}</div>
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
                        <div className="text-sm text-yellow-700">Warnings</div>
                        <div className="text-lg font-bold text-yellow-900">{warningCount}</div>
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
                        <div className="text-sm text-blue-700">Info</div>
                        <div className="text-lg font-bold text-blue-900">{infoCount}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm text-green-700">Total</div>
                        <div className="text-lg font-bold text-green-900">{messages.length}</div>
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
                  All ({messages.length})
                </Button>
                <Button
                  onClick={() => setFilter('unread')}
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  className={filter === 'unread' ? 'bg-red-500 hover:bg-red-600 text-white' : 'border-gray-300 text-[#2C2C2C]'}
                >
                  Unread ({unreadCount})
                </Button>
                <Button
                  onClick={() => setFilter('warning')}
                  variant={filter === 'warning' ? 'default' : 'outline'}
                  className={filter === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'border-gray-300 text-[#2C2C2C]'}
                >
                  Warnings ({warningCount})
                </Button>
                <Button
                  onClick={() => setFilter('info')}
                  variant={filter === 'info' ? 'default' : 'outline'}
                  className={filter === 'info' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'border-gray-300 text-[#2C2C2C]'}
                >
                  Info ({infoCount})
                </Button>
              </div>

              {/* Messages List */}
              {filteredMessages.length === 0 ? (
                <Card className="bg-white rounded-xl border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">No Messages</h3>
                    <p className="text-gray-600 mb-6">
                      {filter === 'all' ? 'No messages at this time' : `No ${filter} messages`}
                    </p>
                    <Button
                      onClick={() => setFilter('all')}
                      className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                    >
                      View All Messages
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map((message) => (
                    <Card key={message.id} className={`bg-white rounded-xl border-0 shadow-lg hover:shadow-xl transition-shadow`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getMessageIcon(message.type)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-[#2C2C2C]">{message.title}</h3>
                                {!message.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                                <Badge className={getPriorityColor(message.priority)}>
                                  {message.priority}
                                </Badge>
                                <Badge variant="outline" className="border-gray-300 text-gray-700">
                                  {message.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{message.message}</p>
                              
                              {/* Action and Impact */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-white/60 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="h-4 w-4 text-[#607c47]" />
                                    <span className="font-medium text-[#2C2C2C]">Recommended Action</span>
                                  </div>
                                  <p className="text-gray-600">{message.action}</p>
                                </div>
                                <div className="bg-white/60 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                    <span className="font-medium text-[#2C2C2C]">Impact</span>
                                  </div>
                                  <p className="text-gray-600">{message.impact}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <div className="text-xs text-gray-500 text-right">
                              {formatDate(message.date)}
                            </div>
                            <div className="flex gap-1">
                              {!message.isRead && (
                                <Button
                                  onClick={() => handleMarkAsRead(message.id)}
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-300 text-[#2C2C2C]"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                onClick={() => handleArchiveMessage(message.id)}
                                variant="outline"
                                size="sm"
                                className="border-gray-300 text-[#2C2C2C]"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteMessage(message.id)}
                                variant="outline"
                                size="sm"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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