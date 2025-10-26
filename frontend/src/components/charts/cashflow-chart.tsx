'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BentoCard } from '@/components/ui/BentoCard';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface CashflowChartProps {
  data: {
    date: string;
    income: number;
    expenses: number;
    netCashflow: number;
  }[];
}

export default function CashflowChart({ data }: CashflowChartProps) {
  // Format data for the chart
  const chartData = data.map(item => ({
    month: new Date(item.date + '-01').toLocaleDateString('en-IN', { month: 'short' }),
    income: item.income,
    expenses: item.expenses,
    net: item.netCashflow
  }));

  // Calculate totals
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const netCashflow = totalIncome - totalExpenses;

  return (
    <BentoCard gradient glow>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Cashflow Overview</h3>
          <p className="text-sm text-gray-400 mt-1">
            Monthly income vs expenses over the last 6 months
          </p>
        </div>
        <BarChart3 className="h-6 w-6 text-purple-400" />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Income</p>
            <p className="text-lg font-bold text-green-400">${totalIncome.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
            <TrendingDown className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Expenses</p>
            <p className="text-lg font-bold text-red-400">${totalExpenses.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl ${netCashflow >= 0 ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' : 'bg-gradient-to-br from-orange-500/20 to-red-500/20'} flex items-center justify-center`}>
            <TrendingUp className={`h-5 w-5 ${netCashflow >= 0 ? 'text-blue-400' : 'text-orange-400'}`} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Net Cashflow</p>
            <p className={`text-lg font-bold ${netCashflow >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              ${netCashflow.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            stroke="#4b5563"
          />
          <YAxis 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            stroke="#4b5563"
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              backdropFilter: 'blur(10px)'
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
          />
          <Area 
            type="monotone" 
            dataKey="income" 
            stroke="#10b981" 
            strokeWidth={2}
            fill="url(#incomeGradient)"
            name="Income"
          />
          <Area 
            type="monotone" 
            dataKey="expenses" 
            stroke="#ef4444" 
            strokeWidth={2}
            fill="url(#expensesGradient)"
            name="Expenses"
          />
        </AreaChart>
      </ResponsiveContainer>
    </BentoCard>
  );
}

