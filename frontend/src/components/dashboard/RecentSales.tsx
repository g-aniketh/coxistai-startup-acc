'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { RecentActivity } from '@/lib/api';

interface RecentSalesProps {
  activities?: RecentActivity[];
}

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function RecentSales({ activities = [] }: RecentSalesProps) {
  return (
    <Card className="rounded-2xl shadow-lg border-0 bg-white">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-semibold text-gray-800">Recent Activity</CardTitle>
        <Link href="#" className="text-sm text-blue-600 hover:underline font-semibold">
          View All
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.slice(0, 6).map((activity, index) => (
              <div key={activity.id} className="flex items-center bg-gray-50 p-3 rounded-lg">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  activity.transactionType === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <span className={`text-sm font-bold ${
                    activity.transactionType === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {activity.transactionType === 'CREDIT' ? '+' : '-'}
                  </span>
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-sm text-gray-800">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <p className={`font-bold text-sm ${
                  activity.transactionType === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {activity.transactionType === 'CREDIT' ? '+' : '-'}{currencyFormatter.format(activity.amount)}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity</p>
              <p className="text-sm">Transactions will appear here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}