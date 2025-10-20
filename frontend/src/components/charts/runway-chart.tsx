'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, AlertCircle, TrendingDown } from 'lucide-react';
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
    const monthsToProject = runwayMonths ? Math.ceil(runwayMonths) + 3 : 12;

    for (let i = 0; i <= monthsToProject; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
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
  const isCritical = runwayMonths !== null && runwayMonths < 6;

  return (
    <Card className="rounded-xl border-0 shadow-lg h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#607c47]" />
              Runway Forecast
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Projected balance based on current burn rate
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Runway Summary */}
        <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-12 w-12 rounded-lg flex items-center justify-center",
              isHealthy ? "bg-green-100" : isCritical ? "bg-red-100" : "bg-yellow-100"
            )}>
              <TrendingDown className={cn(
                "h-6 w-6",
                isHealthy ? "text-green-600" : isCritical ? "text-red-600" : "text-yellow-600"
              )} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Runway</p>
              <p className={cn(
                "text-2xl font-bold",
                isHealthy ? "text-green-700" : isCritical ? "text-red-700" : "text-yellow-700"
              )}>
                {runwayMonths ? `${runwayMonths.toFixed(1)} months` : 'Healthy'}
              </p>
            </div>
          </div>

          {!isHealthy && runwayMonths && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full",
              isCritical ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
            )}>
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">
                {isCritical ? 'Critical' : 'Warning'}
              </span>
            </div>
          )}
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={forecastData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#d1d5db"
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#d1d5db"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
              labelFormatter={(label) => `Month: ${label}`}
            />
            {runwayReached && (
              <ReferenceLine 
                x={runwayReached.month} 
                stroke="#ef4444" 
                strokeDasharray="4 4"
                label={{ 
                  value: 'Runway End', 
                  position: 'insideTopRight',
                  fill: '#ef4444',
                  fontSize: 12,
                  dy: -10,
                  dx: -10
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#607c47"
              strokeWidth={2}
              dot={{ r: 4, fill: '#607c47' }}
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

