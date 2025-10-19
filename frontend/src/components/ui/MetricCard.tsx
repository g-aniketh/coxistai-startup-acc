import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from './card';
import { TrendingUp, TrendingDown, CheckCircle, Circle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: React.ReactNode;
  className?: string;
  subtitle?: string;
  showCheckbox?: boolean;
  checked?: boolean;
  chart?: React.ReactNode;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  className, 
  subtitle,
  showCheckbox = false,
  checked = false,
  chart
}: MetricCardProps): React.JSX.Element {
  return (
    <Card className={cn("group hover:shadow-lg transition-all duration-300 hover:-translate-y-1", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200">
            {icon}
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
        {showCheckbox && (
          <div className="flex items-center">
            {checked ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        )}
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
                since last month
              </span>
            </div>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {chart && (
            <div className="mt-3">
              {chart}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Specialized card for financial metrics
interface FinancialMetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: React.ReactNode;
  className?: string;
  subtitle?: string;
  currency?: boolean;
}

export function FinancialMetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  className, 
  subtitle,
  currency = true
}: FinancialMetricCardProps): React.JSX.Element {
  const formattedValue = currency && typeof value === 'number' 
    ? `$${value.toLocaleString()}` 
    : value;

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
          <div className="text-2xl font-bold text-foreground">{formattedValue}</div>
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
                since last month
              </span>
            </div>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Card for user analytics with donut chart
interface UserAnalyticsCardProps {
  title: string;
  total: number;
  subtitle?: string;
  segments: Array<{
    label: string;
    value: number;
    color: string;
    percentage: number;
  }>;
  className?: string;
}

export function UserAnalyticsCard({ 
  title, 
  total, 
  subtitle, 
  segments, 
  className 
}: UserAnalyticsCardProps): React.JSX.Element {
  return (
    <Card className={cn("group hover:shadow-lg transition-all duration-300 hover:-translate-y-1", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-2xl font-bold text-foreground">{total.toLocaleString()}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          
          {/* Simple donut chart representation */}
          <div className="flex items-center justify-center">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {segments.map((segment, index) => {
                  const circumference = 2 * Math.PI * 15.9155;
                  const strokeDasharray = `${(segment.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = segments.slice(0, index).reduce((acc, s) => acc - (s.percentage / 100) * circumference, 0);
                  
                  return (
                    <path
                      key={segment.label}
                      className={segment.color}
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
          
          {/* Legend */}
          <div className="space-y-1">
            {segments.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${segment.color}`}></div>
                  <span className="text-muted-foreground">{segment.percentage}% {segment.label}</span>
                </div>
                <span className="font-medium">{segment.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
