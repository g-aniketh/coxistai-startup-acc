'use client';

import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BarChart2, 
  Calendar, 
  TrendingDown, 
  TrendingUp,
  DollarSign,
  Users,
  Search,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const kpiData = [
  { title: "Runway", value: "8.2 months", icon: Calendar, color: "text-blue-500", bgColor: "bg-blue-50", change: "+0.3 mo" },
  { title: "Burn Rate", value: "$35,000", icon: TrendingDown, color: "text-red-500", bgColor: "bg-red-50", change: "-8.6%" },
  { title: "ARR", value: "$542,400", icon: TrendingUp, color: "text-green-500", bgColor: "bg-green-50", change: "+15.2%" },
  { title: "Customers", value: "342", icon: Users, color: "text-purple-500", bgColor: "bg-purple-50", change: "+12.5%" },
];

const cashFlowData = [
  { name: 'Jan', income: 45000, expenses: 32000, net: 13000 },
  { name: 'Feb', income: 48000, expenses: 35000, net: 13000 },
  { name: 'Mar', income: 52000, expenses: 38000, net: 14000 },
  { name: 'Apr', income: 46000, expenses: 34000, net: 12000 },
  { name: 'May', income: 51000, expenses: 36000, net: 15000 },
  { name: 'Jun', income: 55000, expenses: 35000, net: 20000 },
];

const revenueData = [
  { name: 'Q1 2023', revenue: 120000, customers: 180 },
  { name: 'Q2 2023', revenue: 145000, customers: 220 },
  { name: 'Q3 2023', revenue: 168000, customers: 260 },
  { name: 'Q4 2023', revenue: 195000, customers: 300 },
  { name: 'Q1 2024', revenue: 225000, customers: 342 },
];

const expenseBreakdown = [
  { name: 'Payroll', value: 210000, color: '#607c47' },
  { name: 'Marketing', value: 45000, color: '#F6D97A' },
  { name: 'SaaS', value: 18000, color: '#B7B3E6' },
  { name: 'Operations', value: 32000, color: '#FFB3BA' },
  { name: 'Other', value: 15000, color: '#C9E0B0' },
];

export default function StatisticsPage() {
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
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Statistics</h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Deep dive into your financial health and forecast the future
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search metrics..." className="pl-10 bg-white rounded-lg" />
                  </div>
                  <Button className="flex items-center gap-2 bg-[#607c47] hover:bg-[#4a6129] text-white">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              {/* AI Status Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">Advanced Analytics</h3>
                      <p className="text-sm text-blue-700">Real-time financial insights • Predictive modeling • Trend analysis</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Data
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiData.map((kpi, index) => (
                  <Card key={index} className="bg-white rounded-xl border-0 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                          <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-600">{kpi.title}</div>
                          <div className="text-lg font-bold text-[#2C2C2C]">{kpi.value}</div>
                          <div className={`text-xs ${kpi.color}`}>{kpi.change}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cash Flow Chart */}
                <Card className="bg-white rounded-xl border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-[#607c47]" />
                      Monthly Cash Flow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cashFlowData}>
                          <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                          <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `$${(value/1000)}k`} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.75rem',
                            }}
                            formatter={(value, name) => [
                              new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value as number),
                              name === 'income' ? 'Income' : name === 'expenses' ? 'Expenses' : 'Net'
                            ]}
                          />
                          <Bar dataKey="income" fill="#607c47" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expenses" fill="#FFB3BA" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Growth Chart */}
                <Card className="bg-white rounded-xl border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Revenue Growth Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData}>
                          <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                          <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `$${(value/1000)}k`} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.75rem',
                            }}
                            formatter={(value, name) => [
                              name === 'revenue' ? 
                                new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value as number) :
                                value,
                              name === 'revenue' ? 'Revenue' : 'Customers'
                            ]}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#607c47" 
                            strokeWidth={3}
                            dot={{ fill: '#607c47', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#607c47' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Expense Breakdown */}
              <Card className="bg-white rounded-xl border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      Expense Breakdown
                    </CardTitle>
                    <div className="flex gap-2">
                      <Select defaultValue="quarterly">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" className="border-gray-300 text-[#2C2C2C]">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {expenseBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.75rem',
                            }}
                            formatter={(value) => [
                              new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value as number),
                              'Amount'
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Expense List */}
                    <div className="space-y-4">
                      {expenseBreakdown.map((expense, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: expense.color }}
                            />
                            <span className="font-medium text-[#2C2C2C]">{expense.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-[#2C2C2C]">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(expense.value)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {((expense.value / expenseBreakdown.reduce((sum, e) => sum + e.value, 0)) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-900">Growth Rate</h3>
                        <p className="text-sm text-green-700">Quarter over quarter</p>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-green-900 mb-2">+23.5%</div>
                    <div className="text-sm text-green-600">Above industry average</div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">Customer Health</h3>
                        <p className="text-sm text-blue-700">Churn & retention</p>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-900 mb-2">2.1%</div>
                    <div className="text-sm text-blue-600">Monthly churn rate</div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-900">Unit Economics</h3>
                        <p className="text-sm text-purple-700">CAC vs LTV</p>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-purple-900 mb-2">4.2x</div>
                    <div className="text-sm text-purple-600">LTV/CAC ratio</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}