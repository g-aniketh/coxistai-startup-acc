'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BentoCard } from '@/components/ui/BentoCard';
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
    <BentoCard gradient glow>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Runway Forecast</h3>
          <p className="text-sm text-gray-400 mt-1">
            Projected balance based on current burn rate
          </p>
        </div>
        <Calendar className="h-6 w-6 text-purple-400" />
      </div>

      {/* Runway Summary */}
      <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-black/40 border border-white/10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center",
            isHealthy ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20" : "bg-gradient-to-br from-red-500/20 to-orange-500/20"
          )}>
            <TrendingDown className={cn(
              "h-6 w-6",
              isHealthy ? "text-green-400" : "text-red-400"
            )} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Current Runway</p>
            <p className={cn(
              "text-2xl font-bold",
              isHealthy ? "text-green-400" : "text-red-400"
            )}>
              {runwayMonths ? `${runwayMonths.toFixed(1)}mo` : '∞'}
            </p>
          </div>
        </div>

        {!isHealthy && runwayMonths && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400 font-medium">
              {runwayMonths < 6 ? 'Critical' : 'Warning'}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={forecastData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="runwayGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
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
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              backdropFilter: 'blur(10px)'
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
            labelFormatter={(label) => `Month: ${label}`}
          />
          {runwayReached && (
            <ReferenceLine 
              x={runwayReached.monthNumber} 
              stroke="#ef4444" 
              strokeDasharray="3 3"
              label={{ 
                value: 'Runway End', 
                position: 'top',
                fill: '#ef4444',
                fontSize: 12
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Forecast Info */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          <span>Current balance</span>
        </div>
        <span>•</span>
        <span>Projected at ${monthlyBurn.toLocaleString()}/month burn</span>
      </div>
    </BentoCard>
  );
}

