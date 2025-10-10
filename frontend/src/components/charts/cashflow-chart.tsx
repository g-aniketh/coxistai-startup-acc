'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
    month: new Date(item.date + '-01').toLocaleDateString('en-US', { month: 'short' }),
    income: item.income,
    expenses: item.expenses,
    net: item.netCashflow
  }));

  // Calculate totals
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const netCashflow = totalIncome - totalExpenses;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">Cashflow Overview</h3>
        <p className="text-sm text-muted-foreground">
          Monthly income vs expenses over the last 6 months
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Income</p>
            <p className="text-lg font-bold text-green-500">${totalIncome.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-bold text-red-500">${totalExpenses.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${netCashflow >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10'} flex items-center justify-center`}>
            <TrendingUp className={`h-5 w-5 ${netCashflow >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net Cashflow</p>
            <p className={`text-lg font-bold ${netCashflow >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
              ${netCashflow.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--card-foreground))'
            }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar 
            dataKey="income" 
            name="Income" 
            fill="hsl(var(--chart-1))" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="expenses" 
            name="Expenses" 
            fill="hsl(var(--chart-2))" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

