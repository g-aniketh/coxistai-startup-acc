'use client';

import { useEffect, useState } from 'react';
import { apiClient, Product } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { BentoCard, BentoGrid } from '@/components/ui/BentoCard';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/Badge';
import { Package, Plus, TrendingUp, AlertCircle, Boxes, DollarSign, ShoppingBag, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AddProductModal from '@/components/dashboard/AddProductModal';
import BlurIn from '@/components/ui/blur-in';
import toast from 'react-hot-toast';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function InventoryPage() {
  const { can } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const canManageInventory = can('manage', 'inventory');

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.inventory.products.list();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleProductAdded = () => {
    loadProducts();
  };

  const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockProducts = products.filter(p => p.quantity < 10);
  const outOfStockProducts = products.filter(p => p.quantity === 0);

  // Prepare chart data
  const stockChartData = products.slice(0, 5).map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    quantity: p.quantity
  }));

  const valueChartData = products.slice(0, 5).map(p => ({
    name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
    value: p.quantity * p.price
  }));

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <BlurIn>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
                  <Package className="h-10 w-10 text-blue-400" />
                  Inventory Management
                </h1>
              </BlurIn>
              <p className="text-gray-400 mt-2 text-lg">
                Manage your products and track stock levels
              </p>
            </div>
            {canManageInventory && (
              <Button 
                onClick={() => setIsAddProductOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>

          {/* Bento Grid Layout */}
          <BentoGrid>
            {/* Total Products */}
            <BentoCard className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1 group" glow>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Boxes className="h-6 w-6 text-blue-400" />
                  </div>
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
                <p className="text-sm text-gray-400 mb-2">Total Products</p>
                <h3 className="text-3xl font-bold text-white mb-1">{products.length}</h3>
                <p className="text-xs text-gray-500">Active SKUs</p>
              </div>
            </BentoCard>

            {/* Total Value */}
            <BentoCard className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1 group" glow>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-400" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <p className="text-sm text-gray-400 mb-2">Total Value</p>
                <h3 className="text-3xl font-bold text-white mb-1">${totalValue.toLocaleString()}</h3>
                <p className="text-xs text-gray-500">Inventory worth</p>
              </div>
            </BentoCard>

            {/* Total Quantity */}
            <BentoCard className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1 group" glow>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-purple-400" />
                  </div>
                  <Package className="h-5 w-5 text-purple-400" />
                </div>
                <p className="text-sm text-gray-400 mb-2">Total Units</p>
                <h3 className="text-3xl font-bold text-white mb-1">{totalQuantity.toLocaleString()}</h3>
                <p className="text-xs text-gray-500">In stock</p>
              </div>
            </BentoCard>

            {/* Low Stock Alert */}
            <BentoCard className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1 group" glow>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center",
                    lowStockProducts.length > 0 
                      ? "bg-gradient-to-br from-red-500/20 to-orange-500/20"
                      : "bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                  )}>
                    <AlertCircle className={cn(
                      "h-6 w-6",
                      lowStockProducts.length > 0 ? "text-red-400" : "text-green-400"
                    )} />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-2">Low Stock Items</p>
                <h3 className={cn(
                  "text-3xl font-bold mb-1",
                  lowStockProducts.length > 0 ? "text-red-400" : "text-green-400"
                )}>
                  {lowStockProducts.length}
                </h3>
                <p className="text-xs text-gray-500">Need attention</p>
              </div>
            </BentoCard>

            {/* Stock Levels Chart */}
            {stockChartData.length > 0 && (
              <BentoCard className="col-span-12 lg:col-span-6 row-span-2" gradient>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Stock Levels</h3>
                    <p className="text-sm text-gray-400 mt-1">Top 5 products by quantity</p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      stroke="#4b5563"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      stroke="#4b5563"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        backdropFilter: 'blur(10px)'
                      }}
                      formatter={(value: number) => [`${value} units`, 'Stock']}
                    />
                    <Bar 
                      dataKey="quantity" 
                      fill="#8b5cf6" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </BentoCard>
            )}

            {/* Value Distribution */}
            {valueChartData.length > 0 && (
              <BentoCard className="col-span-12 lg:col-span-6 row-span-2" gradient>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Value Distribution</h3>
                    <p className="text-sm text-gray-400 mt-1">Top 5 products by value</p>
                  </div>
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={valueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      stroke="#4b5563"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      stroke="#4b5563"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        backdropFilter: 'blur(10px)'
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#10b981" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </BentoCard>
            )}

            {/* Products Table */}
            <BentoCard className="col-span-12 row-span-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Product List</h3>
                  <p className="text-sm text-gray-400 mt-1">All inventory items</p>
                </div>
              </div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="mt-4 text-gray-400">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-600 opacity-20" />
                  <h3 className="text-lg font-semibold mb-2 text-white">No products yet</h3>
                  <p className="text-gray-400 mb-4">
                    Add your first product to start tracking inventory
                  </p>
                  {canManageInventory && (
                    <Button 
                      onClick={() => setIsAddProductOpen(true)}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="text-gray-400">Product Name</TableHead>
                        <TableHead className="text-gray-400">Price</TableHead>
                        <TableHead className="text-gray-400">Stock</TableHead>
                        <TableHead className="text-gray-400">Total Value</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => {
                        const isLowStock = product.quantity < 10;
                        const totalProductValue = product.quantity * product.price;
                        
                        return (
                          <TableRow key={product.id} className="border-white/10 hover:bg-white/5">
                            <TableCell className="font-medium text-white">{product.name}</TableCell>
                            <TableCell className="text-gray-300">${product.price.toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={cn(
                                "font-semibold",
                                isLowStock ? "text-red-400" : "text-green-400"
                              )}>
                                {product.quantity} units
                              </span>
                            </TableCell>
                            <TableCell className="text-gray-300">${totalProductValue.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge
                                variant={isLowStock ? 'secondary' : 'default'}
                                className={cn(
                                  isLowStock ? 
                                  'bg-red-500/10 text-red-400 border-red-500/20' : 
                                  'bg-green-500/10 text-green-400 border-green-500/20'
                                )}
                              >
                                {isLowStock ? 'Low Stock' : 'In Stock'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </BentoCard>
          </BentoGrid>

          {/* Add Product Modal */}
          <AddProductModal
            isOpen={isAddProductOpen}
            onClose={() => setIsAddProductOpen(false)}
            onSuccess={handleProductAdded}
          />
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
