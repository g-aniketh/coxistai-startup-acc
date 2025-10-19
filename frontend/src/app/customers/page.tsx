'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, MoreHorizontal, UserPlus, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';

const customers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', plan: 'Startup', spend: 50, avatar: 'https://i.pravatar.cc/150?u=john' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', plan: 'SMB CFO', spend: 200, avatar: 'https://i.pravatar.cc/150?u=jane' },
  { id: 3, name: 'Peter Jones', email: 'peter@example.com', plan: 'Startup', spend: 50, avatar: 'https://i.pravatar.cc/150?u=peter' },
];

export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]);

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-[#2C2C2C]" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Customers</h1>
                <p className="text-sm text-[#2C2C2C]/70 mt-1">
                  View and manage your customer data.
                </p>
              </div>
            </div>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground">+2 this month</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+2</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churned Customers</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">0</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Customer</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Jane Smith</div>
                <p className="text-xs text-muted-foreground">SMB CFO Plan</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle>Customer List</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Monthly Spend</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map(customer => (
                      <TableRow key={customer.id} onClick={() => setSelectedCustomer(customer)} className="cursor-pointer">
                        <TableCell className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={customer.avatar} />
                            <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{customer.plan}</TableCell>
                        <TableCell>${customer.spend}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex items-center justify-center text-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={selectedCustomer.avatar} />
                  <AvatarFallback>{selectedCustomer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl mt-4">{selectedCustomer.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-lg font-bold">{selectedCustomer.plan}</p>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Spend</p>
                  <p className="text-lg font-bold">${selectedCustomer.spend * 12}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
