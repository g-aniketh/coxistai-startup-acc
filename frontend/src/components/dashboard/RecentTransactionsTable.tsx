'use client';

import { RecentActivity } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/Badge';
import { ArrowUpRight, ArrowDownRight, ShoppingCart, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentTransactionsTableProps {
  activities: RecentActivity[];
  onRefresh?: () => void;
}

export default function RecentTransactionsTable({ activities }: RecentTransactionsTableProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Receipt className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>No recent activity</p>
        <p className="text-sm mt-1">Start by adding a transaction or simulating a sale</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => {
            const isCredit = activity.transactionType === 'CREDIT';
            const isSale = activity.type === 'sale';
            
            return (
              <TableRow key={activity.id}>
                <TableCell>
                  {isSale ? (
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                  ) : isCredit ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{activity.description}</TableCell>
                <TableCell>
                  <Badge
                    variant={isCredit ? 'default' : 'secondary'}
                    className={cn(
                      isCredit ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    )}
                  >
                    {isCredit ? 'Credit' : 'Debit'}
                  </Badge>
                </TableCell>
                <TableCell className={cn(
                  'font-semibold',
                  isCredit ? 'text-green-500' : 'text-red-500'
                )}>
                  {isCredit ? '+' : '-'}${activity.amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(activity.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {activity.account || activity.product || '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

