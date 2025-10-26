'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  title: string;
  value: string;
  percentageChange?: number;
  chartData?: any[];
  chartColor?: string;
  icon: React.ReactNode;
  cardClassName?: string;
}

const StatCard = ({ title, value, percentageChange, chartData, chartColor, icon, cardClassName }: StatCardProps) => {
  return (
    <Card className={cn("rounded-2xl shadow-lg border-0 p-6 flex flex-col justify-between overflow-hidden", cardClassName)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-black/5 rounded-lg">
            {icon}
          </div>
          <CardTitle className="text-sm font-medium opacity-70">{title}</CardTitle>
        </div>
        {percentageChange !== undefined && (
          <div className={cn(
            "flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-black/5",
          )}>
            <ArrowUp className={cn("h-4 w-4", percentageChange > 0 ? "" : "transform rotate-180")} />
            +{percentageChange}%
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 mt-2 overflow-hidden">
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold break-all" style={{ overflowWrap: 'anywhere' }}>
          {value}
        </div>
        {chartData && chartColor && (
          <div className="h-32 mt-6 -mb-2 -mx-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.25}/>
                    <stop offset="50%" stopColor={chartColor} stopOpacity={0.15}/>
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area
                  type="natural"
                  dataKey="value"
                  stroke={chartColor}
                  strokeWidth={2.5}
                  fill={`url(#gradient${title})`}
                  fillOpacity={0.5}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="linear"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
