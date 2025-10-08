import { twMerge } from 'tailwind-merge';

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
    <div className={twMerge("bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-5 shadow-sm", className)}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
          {icon}
        </div>
      </div>
      {change && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span className={changeType === 'positive' ? 'text-green-500' : 'text-red-500'}>
            {change}
          </span>
          {' '}vs. previous period
        </p>
      )}
    </div>
  );
}
