'use client';

import { useEffect, useState } from 'react';
import { apiClient, Product, BankAccount } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, 
  Plus, 
  TrendingUp, 
  AlertCircle, 
  Boxes, 
  DollarSign, 
  ShoppingBag, 
  BarChart3, 
  MoreHorizontal,
  Search,
  Filter,
  Download,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AddProductModal from '@/components/dashboard/AddProductModal';
import RecordSaleModal from '@/components/products/RecordSaleModal';
import EditProductModal from '@/components/products/EditProductModal';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const { can } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleAddProduct = async (productData: any) => {
    try {
      const response = await apiClient.inventory.products.create(productData);
      if (response.success) {
        await loadData();
        toast.success('Product added successfully');
      }
    } catch (error) {
      toast.error('Failed to add product');
    }
  };

  const handleRecordSale = async (saleData: any) => {
    try {
      const response = await apiClient.inventory.sales.create(saleData);
      if (response.success) {
        await loadData();
        toast.success('Sale recorded successfully');
      }
    } catch (error) {
      toast.error('Failed to record sale');
    }
  };

  const handleUpdateProduct = async (productData: any) => {
    if (!selectedProduct) return;

    try {
      const response = await apiClient.inventory.products.update(selectedProduct.id, productData);
      if (response.success) {
        await loadData();
        toast.success('Product updated successfully');
        setIsEditProductOpen(false);
        setSelectedProduct(null);
      }
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await apiClient.inventory.products.delete(productId);
      if (response.success) {
        await loadData();
        toast.success('Product deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate summary metrics
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const lowStockProducts = products.filter(product => product.quantity < 10).length;
  const totalSales = products.reduce((sum, product) => sum + (product.salesCount || 0), 0);

  // Category breakdown
  const categoryData = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + product.quantity;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryData).map(([category, quantity], index) => ({
    name: category,
    value: quantity,
    color: ['#607c47', '#FFB3BA', '#B7B3E6', '#F6D97A', '#C9E0B0'][index % 5]
  }));

  // Top selling products
  const topSellingProducts = [...products]
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 5);

  const salesChartData = topSellingProducts.map(product => ({
    name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
    sales: product.salesCount || 0,
    revenue: (product.salesCount || 0) * product.price
  }));

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading products...</p>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="h-screen flex">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Products</h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Manage your inventory and track product performance
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search products..." 
                      className="pl-10 bg-white rounded-lg"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {canManageInventory && (
                    <>
                      <Button 
                        onClick={() => setIsRecordSaleOpen(true)}
                        className="flex items-center gap-2 bg-[#F6D97A] hover:bg-[#E6C96A] text-[#7a6015]"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Record Sale
                      </Button>
                      <Button 
                        onClick={() => setIsAddProductOpen(true)}
                        className="flex items-center gap-2 bg-[#607c47] hover:bg-[#4a6129] text-white"
                      >
                        <Plus className="h-4 w-4" />
                        Add Product
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* AI Status Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">Inventory Management</h3>
                      <p className="text-sm text-blue-700">Real-time tracking • Automated alerts • Sales analytics</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Sync
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Boxes className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-blue-700">Total Products</div>
                        <div className="text-lg font-bold text-blue-900">{totalProducts}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm text-green-700">Total Value</div>
                        <div className="text-lg font-bold text-green-900">{formatCurrency(totalValue)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <div className="text-sm text-red-700">Low Stock</div>
                        <div className="text-lg font-bold text-red-900">{lowStockProducts}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm text-purple-700">Total Sales</div>
                        <div className="text-lg font-bold text-purple-900">{totalSales}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Selling Products */}
                <Card className="bg-white rounded-xl border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#607c47]" />
                      Top Selling Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesChartData}>
                          <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                          <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `$${(value/1000)}k`} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.75rem',
                            }}
                            formatter={(value, name) => [
                              name === 'sales' ? value : formatCurrency(value as number),
                              name === 'sales' ? 'Sales Count' : 'Revenue'
                            ]}
                          />
                          <Bar dataKey="sales" fill="#607c47" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Distribution */}
                <Card className="bg-white rounded-xl border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                      <Package className="h-5 w-5 text-[#607c47]" />
                      Category Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {categoryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.75rem',
                            }}
                            formatter={(value) => [value, 'Quantity']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Products Table */}
              <Card className="bg-white rounded-xl border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C]">
                      Products ({filteredProducts.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="border-gray-300 text-[#2C2C2C]">
                        <Filter className="h-4 w-4 mr-1" />
                        Filter
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-300 text-[#2C2C2C]">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-gray-300 text-[#2C2C2C]"
                        onClick={loadData}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Sales</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-[#2C2C2C]">{product.name}</div>
                                  <div className="text-sm text-gray-600">{product.description}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-gray-300 text-gray-700">
                                {product.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-[#2C2C2C]">
                              {formatCurrency(product.price)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[#2C2C2C]">{product.quantity}</span>
                                {product.quantity < 10 && (
                                  <Badge className="bg-red-100 text-red-700">Low Stock</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-[#2C2C2C]">
                              {product.salesCount || 0}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                product.quantity > 20 
                                  ? 'bg-green-100 text-green-700' 
                                  : product.quantity > 10 
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }>
                                {product.quantity > 20 ? 'In Stock' : product.quantity > 10 ? 'Low Stock' : 'Out of Stock'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-300 text-[#2C2C2C]"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {canManageInventory && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProduct(product);
                                        setIsEditProductOpen(true);
                                      }}
                                      className="border-gray-300 text-[#2C2C2C]"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteProduct(product.id)}
                                      className="border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modals */}
        <AddProductModal
          isOpen={isAddProductOpen}
          onClose={() => setIsAddProductOpen(false)}
          onSubmit={handleAddProduct}
        />

        <RecordSaleModal
          isOpen={isRecordSaleOpen}
          onClose={() => setIsRecordSaleOpen(false)}
          onSubmit={handleRecordSale}
          products={products}
          accounts={accounts}
        />

        <EditProductModal
          isOpen={isEditProductOpen}
          onClose={() => {
            setIsEditProductOpen(false);
            setSelectedProduct(null);
          }}
          onSubmit={handleUpdateProduct}
          product={selectedProduct}
        />
      </MainLayout>
    </AuthGuard>
  );
}