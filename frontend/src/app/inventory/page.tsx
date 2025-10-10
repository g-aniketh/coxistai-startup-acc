'use client';

import { useEffect, useState } from 'react';
import { apiClient, Product, Sale } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/Badge';
import { Package, Plus, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import AddProductModal from '@/components/dashboard/AddProductModal';
import toast from 'react-hot-toast';

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
  const lowStockProducts = products.filter(p => p.quantity < 10);

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Package className="h-8 w-8 text-primary" />
                Inventory Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your products and track stock levels
              </p>
            </div>
            {canManageInventory && (
              <Button onClick={() => setIsAddProductOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Products</p>
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold">{products.length}</h3>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Value</p>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold">${totalValue.toLocaleString()}</h3>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <AlertCircle className={cn(
                  "h-5 w-5",
                  lowStockProducts.length > 0 ? "text-red-500" : "text-green-500"
                )} />
              </div>
              <h3 className={cn(
                "text-2xl font-bold",
                lowStockProducts.length > 0 ? "text-red-500" : "text-green-500"
              )}>
                {lowStockProducts.length}
              </h3>
            </Card>
          </div>

          {/* Products Table */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Products</h3>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first product to start tracking inventory
                </p>
                {canManageInventory && (
                  <Button onClick={() => setIsAddProductOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const isLowStock = product.quantity < 10;
                      const totalValue = product.quantity * product.price;
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>${product.price.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "font-semibold",
                              isLowStock ? "text-red-500" : "text-green-500"
                            )}>
                              {product.quantity} units
                            </span>
                          </TableCell>
                          <TableCell>${totalValue.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={isLowStock ? 'secondary' : 'default'}
                              className={cn(
                                isLowStock ? 
                                'bg-red-500/10 text-red-500 border-red-500/20' : 
                                'bg-green-500/10 text-green-500 border-green-500/20'
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
          </Card>

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

