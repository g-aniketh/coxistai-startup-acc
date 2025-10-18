'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RecentActivity } from '@/lib/api';

interface LastOrdersProps {
  activities?: RecentActivity[];
}

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function LastOrders({ activities = [] }: LastOrdersProps) {
  return (
    <Card className="rounded-2xl shadow-lg border-0 bg-white p-4">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-semibold text-gray-800">Last Orders</CardTitle>
        <div className="flex items-center gap-4">
           <Button variant="outline" size="sm" className="text-gray-600 bg-gray-100 border-gray-200 text-xs px-3 py-1 h-auto">
            Data Updates Every 3 Hours
          </Button>
          <Link href="#" className="text-sm text-blue-600 hover:underline font-semibold">
            View All Orders
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-500">Description</TableHead>
              <TableHead className="text-gray-500">Amount</TableHead>
              <TableHead className="text-gray-500">Status</TableHead>
              <TableHead className="text-right text-gray-500">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.length > 0 ? (
              activities.slice(0, 5).map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                        activity.transactionType === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <span className={`text-xs font-bold ${
                          activity.transactionType === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {activity.transactionType === 'CREDIT' ? '+' : '-'}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">{activity.description}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-gray-800">
                    {currencyFormatter.format(activity.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className={cn(
                        "h-2.5 w-2.5 rounded-full mr-2",
                        activity.transactionType === 'CREDIT' ? 'bg-green-500' : 'bg-red-500'
                      )}></span>
                      <span className="text-gray-600">
                        {activity.transactionType === 'CREDIT' ? 'Income' : 'Expense'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-gray-500">
                    {new Date(activity.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
