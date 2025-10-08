import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: React.ReactNode;
  className?: string;
}

export function MetricCard({ title, value, change, changeType, icon, className }: MetricCardProps) {
  return (
    <Card className={cn("group hover:shadow-lg transition-all duration-300 hover:-translate-y-1", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200">
            {icon}
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {change && (
            <div className="flex items-center gap-1">
              {changeType === 'positive' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={cn(
                "text-sm font-medium",
                changeType === 'positive' ? "text-green-600" : "text-red-600"
              )}>
                {change}
              </span>
              <span className="text-xs text-muted-foreground">
                vs. previous period
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
