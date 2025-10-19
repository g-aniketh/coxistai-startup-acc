'use client';

import { useEffect, useState } from 'react';
import { apiClient, Product, BankAccount } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Plus, TrendingUp, AlertCircle, Boxes, DollarSign, ShoppingBag, BarChart3, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AddProductModal from '@/components/dashboard/AddProductModal';
import RecordSaleModal from '@/components/products/RecordSaleModal';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const { can } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const canManageInventory = can('manage', 'inventory');

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, accountsRes] = await Promise.all([
        apiClient.inventory.products.list(),
        apiClient.accounts.list(),
      ]);

      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data);
      }
      if (accountsRes.success && accountsRes.data) {
        setAccounts(accountsRes.data);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDataUpdate = () => {
    loadData();
  };

  const openRecordSaleModal = (product: Product) => {
    setSelectedProduct(product);
    setIsRecordSaleOpen(true);
  };
  
  const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockProducts = products.filter(p => p.quantity < 10);

  const stockChartData = products.slice(0, 5).map(p => ({
    name: p.name.substring(0, 15),
    quantity: p.quantity
  }));

  const valueChartData = products.slice(0, 5).map(p => ({
    name: p.name.substring(0, 15),
    value: p.quantity * p.price
  }));
  
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-[#2C2C2C]" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Products</h1>
                <p className="text-sm text-[#2C2C2C]/70 mt-1">
                  Manage your products and track stock levels.
                </p>
              </div>
            </div>
            {canManageInventory && (
              <Button onClick={() => setIsAddProductOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Boxes className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">Active SKUs</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-muted-foreground">Inventory worth</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                <ShoppingBag className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">In stock</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{lowStockProducts.length}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl shadow-lg border-0 bg-white p-6">
              <CardHeader className="p-0">
                <CardTitle>Stock Levels</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockChartData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg border-0 bg-white p-6">
              <CardHeader className="p-0">
                <CardTitle>Value Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valueChartData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Value']} />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle>Product List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell className={cn(product.quantity < 10 ? "text-red-500" : "")}>{product.quantity} units</TableCell>
                      <TableCell>{formatCurrency(product.quantity * product.price)}</TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full", product.quantity < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
                          {product.quantity < 10 ? 'Low Stock' : 'In Stock'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openRecordSaleModal(product)}>
                          Record Sale
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <AddProductModal
            isOpen={isAddProductOpen}
            onClose={() => setIsAddProductOpen(false)}
            onSuccess={handleDataUpdate}
          />
          <RecordSaleModal
            isOpen={isRecordSaleOpen}
            onClose={() => setIsRecordSaleOpen(false)}
            onSuccess={handleDataUpdate}
            accounts={accounts}
            product={selectedProduct}
          />
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
