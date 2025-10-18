'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  title: string;
  value: string;
  percentageChange: number;
  chartData: any[];
  chartColor: string;
  icon: React.ReactNode;
  cardClassName?: string;
}

const StatCard = ({ title, value, percentageChange, chartData, chartColor, icon, cardClassName }: StatCardProps) => {
  return (
    <Card className={cn("rounded-2xl shadow-lg border-0 p-4 text-[#2C2C2C]", cardClassName)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="p-2 bg-black/5 rounded-lg">
          {icon}
        </div>
        <div className={cn(
          "flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-black/5",
        )}>
          <ArrowUp className={cn("h-4 w-4", percentageChange > 0 ? "" : "transform rotate-180")} />
          {percentageChange}%
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-sm opacity-70 mt-1">{title}</p>
        <div className="h-20 mt-4 -mb-4 -mx-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`color${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color${title})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
