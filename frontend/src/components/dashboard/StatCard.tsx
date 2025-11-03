'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  percentageChange?: number;
  icon: React.ReactNode;
  cardClassName?: string;
}

const StatCard = ({ title, value, percentageChange, icon, cardClassName }: StatCardProps) => {
  return (
    <Card className={cn("rounded-2xl shadow-lg border-0 p-6 flex flex-col justify-between overflow-hidden min-w-0", cardClassName)}>
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
      <CardContent className="p-0 mt-4 min-w-0">
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
