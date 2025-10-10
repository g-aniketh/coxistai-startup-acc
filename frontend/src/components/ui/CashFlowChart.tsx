'use client';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface CashFlowChartProps {
  data: {
    income: number;
    expenses: number;
    date: string;
  }[];
  period: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-lg glass">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground font-medium">
              Income
            </span>
            <span className="font-bold text-green-500">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payload[0].value)}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground font-medium">
              Expenses
            </span>
            <span className="font-bold text-red-500">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payload[1].value)}
            </span>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-3 font-medium">{label}</p>
      </div>
    );
  }
  return null;
};

export function CashFlowChart({ data, period }: CashFlowChartProps) {
  // Generate date range for the last 'period' days
  const endDate = new Date();
  const startDate = subDays(endDate, period -1);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  // Create a map for quick lookup
  const dataMap = new Map(data.map(item => [format(new Date(item.date), 'yyyy-MM-dd'), item]));

  // Create a complete dataset with all dates, filling missing ones with 0
  const chartData = dateRange.map(date => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const entry = dataMap.get(formattedDate);
    return {
      date: format(date, 'MMM d'),
      income: entry ? entry.income : 0,
      expenses: entry ? Math.abs(entry.expenses) : 0, // ensure expenses are positive for chart
    };
  });


  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value as number)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorIncome)"
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="#ef4444"
          fillOpacity={1}
          fill="url(#colorExpenses)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
