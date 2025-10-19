'use client';

import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, Calendar, TrendingDown, Zap, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const kpiData = [
  { title: "Runway", value: "4.5 months", icon: Calendar, color: "text-blue-500" },
  { title: "Burn Rate", value: "$15,231", icon: TrendingDown, color: "text-red-500" },
  { title: "ARR", value: "$120,430", icon: Zap, color: "text-green-500" },
];

const cashFlowData = [
  { name: 'Jan', income: 4000, expenses: 2400 },
  { name: 'Feb', income: 3000, expenses: 1398 },
  { name: 'Mar', income: 2000, expenses: 9800 },
  { name: 'Apr', income: 2780, expenses: 3908 },
  { name: 'May', income: 1890, expenses: 4800 },
  { name: 'Jun', income: 2390, expenses: 3800 },
];


export default function StatisticsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <BarChart2 className="h-8 w-8 text-[#2C2C2C]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Statistics</h1>
              <p className="text-sm text-[#2C2C2C]/70 mt-1">
                Deep dive into your financial health and forecast the future.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Key Metrics */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              {kpiData.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <Card key={kpi.title} className="rounded-2xl shadow-lg border-0 bg-white p-6">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                      <CardTitle className="text-sm font-medium text-gray-500">{kpi.title}</CardTitle>
                      <Icon className={`h-5 w-5 ${kpi.color}`} />
                    </CardHeader>
                    <CardContent className="p-0 mt-2">
                      <p className="text-3xl font-bold">{kpi.value}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Cash Flow Analysis */}
            <Card className="lg:col-span-2 rounded-2xl shadow-lg border-0 bg-white p-6">
              <CardHeader className="p-0">
                <CardTitle>Cash Flow Analysis</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`}/>
                    <Tooltip />
                    <Bar dataKey="income" fill="#82ca9d" name="Income" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* "What If" Scenario Simulator */}
            <Card className="lg:col-span-1 rounded-2xl shadow-lg border-0 bg-white p-6">
              <CardHeader className="p-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5" />
                  <CardTitle>Scenario Simulator</CardTitle>
                </div>
                <p className="text-sm text-gray-500 mt-1">Simulate financial decisions.</p>
              </CardHeader>
              <CardContent className="p-0 mt-4 space-y-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hire">Hire new employee</SelectItem>
                    <SelectItem value="marketing">Increase marketing spend</SelectItem>
                    <SelectItem value="pricing">Change pricing</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Enter amount (e.g., 5000)" type="number" />
                <Button className="w-full">
                  Run Simulation <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">New Runway</p>
                  <p className="text-2xl font-bold text-blue-500">4.2 months</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
