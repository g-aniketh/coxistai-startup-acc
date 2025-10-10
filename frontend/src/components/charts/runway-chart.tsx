'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/Card';
import { Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RunwayChartProps {
  currentBalance: number;
  monthlyBurn: number;
  runwayMonths: number | null;
}

export default function RunwayChart({ currentBalance, monthlyBurn, runwayMonths }: RunwayChartProps) {
  // Generate forecast data
  const generateForecast = () => {
    const months = [];
    let balance = currentBalance;
    const monthsToProject = runwayMonths ? Math.ceil(runwayMonths) + 2 : 12;

    for (let i = 0; i <= monthsToProject; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        balance: Math.max(0, balance),
        projected: i > 0,
        monthNumber: i
      });

      balance -= monthlyBurn;
    }

    return months;
  };

  const forecastData = generateForecast();
  const runwayReached = forecastData.find(d => d.balance === 0);
  const isHealthy = runwayMonths === null || runwayMonths > 12;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">Runway Forecast</h3>
        <p className="text-sm text-muted-foreground">
          Projected balance based on current burn rate
        </p>
      </div>

      {/* Runway Summary */}
      <div className="flex items-center justify-between mb-6 p-4 rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-12 w-12 rounded-lg flex items-center justify-center",
            isHealthy ? "bg-green-500/10" : "bg-red-500/10"
          )}>
            <Calendar className={cn(
              "h-6 w-6",
              isHealthy ? "text-green-500" : "text-red-500"
            )} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Runway</p>
            <p className={cn(
              "text-2xl font-bold",
              isHealthy ? "text-green-500" : "text-red-500"
            )}>
              {runwayMonths ? `${runwayMonths.toFixed(1)} months` : 'Infinite'}
            </p>
          </div>
        </div>

        {!isHealthy && runwayMonths && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-500 font-medium">
              {runwayMonths < 6 ? 'Critical' : 'Warning'}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--card-foreground))'
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
            labelFormatter={(label) => `Month: ${label}`}
          />
          {runwayReached && (
            <ReferenceLine 
              x={runwayReached.monthNumber} 
              stroke="hsl(var(--destructive))" 
              strokeDasharray="3 3"
              label={{ 
                value: 'Runway End', 
                position: 'top',
                fill: 'hsl(var(--destructive))'
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="balance"
            stroke="hsl(var(--chart-1))"
            fill="url(#balanceGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Forecast Info */}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-chart-1" />
          <span>Current balance</span>
        </div>
        <span>•</span>
        <span>Projected at ${monthlyBurn.toLocaleString()}/month burn rate</span>
      </div>
    </Card>
  );
}

