'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { MoreHorizontal } from 'lucide-react';
import { DashboardSummary } from '@/lib/api';

interface ProfitChartProps {
  summary?: DashboardSummary;
}

const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd'];

const renderLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex flex-col space-y-2">
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: entry.color }} />
          <div className='flex justify-between w-full'>
            <span className="text-gray-600 mr-2">{entry.name}</span>
            <span className="font-semibold text-gray-800">{entry.value}%</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function ProfitChart({ summary }: ProfitChartProps) {
  // Use mock data that matches the image exactly
  const data = [
    { name: 'Giveaway', value: 60 },
    { name: 'Affiliate', value: 24 },
    { name: 'Offline Sales', value: 16 },
  ];

  const totalValue = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <Card className="rounded-2xl shadow-lg border-0 bg-white p-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold text-gray-800">Monthly Profits</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Total Profit Growth of 26%
          </CardDescription>
        </div>
        <MoreHorizontal className="h-5 w-5 text-gray-400" />
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
        <div className="w-full md:w-1/2 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-lg font-bold text-gray-800"
              >
                <tspan x="50%" dy="-0.5em" className="text-sm text-gray-500">Total</tspan>
                <tspan x="50%" dy="1.2em" className="text-xl font-bold text-gray-800">$76,356</tspan>
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-1/2">
          {renderLegend({ payload: data.map((d, i) => ({...d, color: COLORS[i]})) })}
        </div>
      </CardContent>
    </Card>
  );
}
