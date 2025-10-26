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
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Clock,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Minus,
  RotateCcw,
  History,
  Calendar,
  Users,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import AddProductModal from '@/components/dashboard/AddProductModal';
import RecordSaleModal from '@/components/products/RecordSaleModal';
import EditProductModal from '@/components/products/EditProductModal';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  date: string;
  user: string;
}

interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'slow_moving';
  message: string;
  severity: 'low' | 'medium' | 'high';
  date: string;
}

export default function ProductsPage() {
  const { can } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'alerts' | 'analytics'>('overview');

  const canManageInventory = can('manage', 'inventory');

  // Mock data initialization
  useEffect(() => {
    // Initialize with enhanced mock data
    setProducts([
      {
        id: '1',
        name: 'Premium Laptop',
        description: 'High-performance business laptop',
        category: 'Electronics',
        price: 1200,
        quantity: 15,
        salesCount: 45,
        sku: 'LAP-001',
        cost: 800,
        reorderLevel: 10,
        maxStock: 50,
        supplier: 'TechCorp Inc',
        lastRestocked: '2024-01-15',
        startupId: 'startup-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-20'
      },
      {
        id: '2',
        name: 'Office Chair',
        description: 'Ergonomic office chair',
        category: 'Furniture',
        price: 350,
        quantity: 8,
        salesCount: 22,
        sku: 'CHAIR-002',
        cost: 200,
        reorderLevel: 5,
        maxStock: 30,
        supplier: 'FurniPro Ltd',
        lastRestocked: '2024-01-10',
        startupId: 'startup-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-18'
      },
      {
        id: '3',
        name: 'Wireless Mouse',
        description: 'Bluetooth wireless mouse',
        category: 'Accessories',
        price: 45,
        quantity: 2,
        salesCount: 38,
        sku: 'MOUSE-003',
        cost: 25,
        reorderLevel: 10,
        maxStock: 100,
        supplier: 'AccessoryWorld',
        lastRestocked: '2024-01-05',
        startupId: 'startup-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-19'
      }
    ]);

    setStockMovements([
      {
        id: '1',
        productId: '1',
        type: 'in',
        quantity: 20,
        reason: 'Purchase Order #PO-001',
        date: '2024-01-15',
        user: 'John Doe'
      },
      {
        id: '2',
        productId: '1',
        type: 'out',
        quantity: 5,
        reason: 'Sale #SALE-001',
        date: '2024-01-16',
        user: 'Jane Smith'
      },
      {
        id: '3',
        productId: '3',
        type: 'adjustment',
        quantity: -1,
        reason: 'Damaged item return',
        date: '2024-01-17',
        user: 'Mike Johnson'
      }
    ]);

    setInventoryAlerts([
      {
        id: '1',
        productId: '3',
        productName: 'Wireless Mouse',
        type: 'low_stock',
        message: 'Stock level below reorder point (2/10)',
        severity: 'high',
        date: '2024-01-19'
      },
      {
        id: '2',
        productId: '2',
        productName: 'Office Chair',
        type: 'slow_moving',
        message: 'No sales in the last 7 days',
        severity: 'medium',
        date: '2024-01-18'
      }
    ]);

    // Initialize accounts for payment processing
    setAccounts([
      {
        id: '1',
        accountName: 'Business Checking',
        balance: 287500,
        startupId: 'startup-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-20'
      },
      {
        id: '2',
        accountName: 'Business Savings',
        balance: 125000,
        startupId: 'startup-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-20'
      },
      {
        id: '3',
        accountName: 'Credit Card',
        balance: -8500,
        startupId: 'startup-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-20'
      }
    ]);

    setLoading(false);
  }, []);

  const handleAddProduct = async (productData: any) => {
    try {
      // Mock API call
      const newProduct: Product = {
        id: Date.now().toString(),
        ...productData,
        salesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setProducts(prev => [...prev, newProduct]);
      
      // Add stock movement
      const movement: StockMovement = {
        id: Date.now().toString(),
        productId: newProduct.id,
        type: 'in',
        quantity: productData.quantity,
        reason: 'Initial stock',
        date: new Date().toISOString(),
        user: 'Current User'
      };
      setStockMovements(prev => [...prev, movement]);
      
      toast.success('Product added successfully');
    } catch (error) {
      toast.error('Failed to add product');
    }
  };

  const handleRecordSale = async (saleData: any) => {
    try {
      // Update product quantity
      setProducts(prev => prev.map(product => {
        if (product.id === saleData.productId) {
          const newQuantity = product.quantity - saleData.quantity;
          return {
            ...product,
            quantity: newQuantity,
            salesCount: (product.salesCount || 0) + saleData.quantity,
            updatedAt: new Date().toISOString()
          };
        }
        return product;
      }));

      // Add stock movement
      const movement: StockMovement = {
        id: Date.now().toString(),
        productId: saleData.productId,
        type: 'out',
        quantity: saleData.quantity,
        reason: `Sale to ${saleData.customerName}`,
        date: new Date().toISOString(),
        user: 'Current User'
      };
      setStockMovements(prev => [...prev, movement]);

      // Check for low stock alerts
      const product = products.find(p => p.id === saleData.productId);
      if (product && (product.quantity - saleData.quantity) <= (product.reorderLevel || 10)) {
        const alert: InventoryAlert = {
          id: Date.now().toString(),
          productId: product.id,
          productName: product.name,
          type: 'low_stock',
          message: `Stock level below reorder point (${product.quantity - saleData.quantity}/${product.reorderLevel})`,
          severity: 'high',
          date: new Date().toISOString()
        };
        setInventoryAlerts(prev => [...prev, alert]);
      }

      toast.success('Sale recorded successfully');
    } catch (error) {
      toast.error('Failed to record sale');
    }
  };

  const handleStockAdjustment = (productId: string, adjustment: number, reason: string) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        return {
          ...product,
          quantity: product.quantity + adjustment,
          updatedAt: new Date().toISOString()
        };
      }
      return product;
    }));

    // Add stock movement
    const movement: StockMovement = {
      id: Date.now().toString(),
      productId,
      type: 'adjustment',
      quantity: adjustment,
      reason,
      date: new Date().toISOString(),
      user: 'Current User'
    };
    setStockMovements(prev => [...prev, movement]);

    toast.success('Stock adjusted successfully');
  };

  const handleUpdateProduct = async (productData: any) => {
    if (!selectedProduct) return;

    try {
      setProducts(prev => prev.map(product => 
        product.id === selectedProduct.id 
          ? { ...product, ...productData, updatedAt: new Date().toISOString() }
          : product
      ));
      
      toast.success('Product updated successfully');
      setIsEditProductOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      setProducts(prev => prev.filter(product => product.id !== productId));
      setStockMovements(prev => prev.filter(movement => movement.productId !== productId));
      setInventoryAlerts(prev => prev.filter(alert => alert.productId !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate enhanced summary metrics
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const totalCost = products.reduce((sum, product) => sum + ((product.cost || 0) * product.quantity), 0);
  const lowStockProducts = products.filter(product => product.quantity <= (product.reorderLevel || 10)).length;
  const outOfStockProducts = products.filter(product => product.quantity === 0).length;
  const totalSales = products.reduce((sum, product) => sum + (product.salesCount || 0), 0);
  const totalRevenue = products.reduce((sum, product) => sum + ((product.salesCount || 0) * product.price), 0);
  const profitMargin = totalValue > 0 ? ((totalValue - totalCost) / totalValue) * 100 : 0;

  // Stock movement analytics
  const stockInToday = stockMovements
    .filter(movement => 
      movement.type === 'in' && 
      new Date(movement.date).toDateString() === new Date().toDateString()
    )
    .reduce((sum, movement) => sum + movement.quantity, 0);

  const stockOutToday = stockMovements
    .filter(movement => 
      movement.type === 'out' && 
      new Date(movement.date).toDateString() === new Date().toDateString()
    )
    .reduce((sum, movement) => sum + movement.quantity, 0);

  // Category breakdown
  const categoryData = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + product.quantity;
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
    revenue: (product.salesCount || 0) * product.price,
    profit: (product.salesCount || 0) * (product.price - (product.cost || 0))
  }));

  // Stock movement trends (last 7 days)
  const movementTrendData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    
    const inMovements = stockMovements.filter(m => 
      m.type === 'in' && m.date.startsWith(dateStr)
    ).reduce((sum, m) => sum + m.quantity, 0);
    
    const outMovements = stockMovements.filter(m => 
      m.type === 'out' && m.date.startsWith(dateStr)
    ).reduce((sum, m) => sum + m.quantity, 0);
    
    return {
      date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      stockIn: inMovements,
      stockOut: outMovements,
      netChange: inMovements - outMovements
    };
  });

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading inventory...</p>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="bg-gray-50 flex">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Inventory Management</h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Advanced inventory tracking, stock management, and sales analytics
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
                      <h3 className="font-semibold text-blue-900">AI Inventory Assistant</h3>
                      <p className="text-sm text-blue-700">Smart stock tracking • Automated reordering • Sales forecasting</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Sync
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200">
                <Button
                  onClick={() => setActiveTab('overview')}
                  variant={activeTab === 'overview' ? 'default' : 'ghost'}
                  className={activeTab === 'overview' ? 'bg-[#607c47] hover:bg-[#4a6129] text-white' : 'text-[#2C2C2C] hover:bg-gray-100'}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Overview
                </Button>
                <Button
                  onClick={() => setActiveTab('movements')}
                  variant={activeTab === 'movements' ? 'default' : 'ghost'}
                  className={activeTab === 'movements' ? 'bg-[#607c47] hover:bg-[#4a6129] text-white' : 'text-[#2C2C2C] hover:bg-gray-100'}
                >
                  <History className="h-4 w-4 mr-2" />
                  Stock Movements
                </Button>
                <Button
                  onClick={() => setActiveTab('alerts')}
                  variant={activeTab === 'alerts' ? 'default' : 'ghost'}
                  className={activeTab === 'alerts' ? 'bg-[#607c47] hover:bg-[#4a6129] text-white' : 'text-[#2C2C2C] hover:bg-gray-100'}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Alerts ({inventoryAlerts.length})
                </Button>
                <Button
                  onClick={() => setActiveTab('analytics')}
                  variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                  className={activeTab === 'analytics' ? 'bg-[#607c47] hover:bg-[#4a6129] text-white' : 'text-[#2C2C2C] hover:bg-gray-100'}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
          </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Enhanced Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Boxes className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm text-blue-700">Total Products</div>
                            <div className="text-lg font-bold text-blue-900">{totalProducts}</div>
                            <div className="text-xs text-blue-600">Active SKUs</div>
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
                            <div className="text-sm text-green-700">Inventory Value</div>
                            <div className="text-lg font-bold text-green-900">{formatCurrency(totalValue)}</div>
                            <div className="text-xs text-green-600">{formatCurrency(totalCost)} cost</div>
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
                            <div className="text-xs text-red-600">{outOfStockProducts} out of stock</div>
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
                            <div className="text-sm text-purple-700">Profit Margin</div>
                            <div className="text-lg font-bold text-purple-900">{profitMargin.toFixed(1)}%</div>
                            <div className="text-xs text-purple-600">{formatCurrency(totalRevenue)} revenue</div>
                          </div>
                        </div>
              </CardContent>
            </Card>
          </div>

                  {/* Today's Activity */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <ArrowUp className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm text-green-700">Stock In Today</div>
                            <div className="text-lg font-bold text-green-900">{stockInToday}</div>
                            <div className="text-xs text-green-600">units received</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <ArrowDown className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <div className="text-sm text-orange-700">Stock Out Today</div>
                            <div className="text-lg font-bold text-orange-900">{stockOutToday}</div>
                            <div className="text-xs text-orange-600">units sold</div>
                          </div>
                        </div>
              </CardContent>
            </Card>

                    <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Activity className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm text-blue-700">Net Change</div>
                            <div className={`text-lg font-bold ${stockInToday - stockOutToday >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                              {stockInToday - stockOutToday >= 0 ? '+' : ''}{stockInToday - stockOutToday}
                            </div>
                            <div className="text-xs text-blue-600">units today</div>
                          </div>
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
                        </div>
                      </div>
            </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                              <TableHead>Reorder Level</TableHead>
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
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{product.sku}</code>
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
                                    {product.quantity <= (product.reorderLevel || 10) && (
                                      <Badge className="bg-red-100 text-red-700">Low Stock</Badge>
                                    )}
                                    {product.quantity === 0 && (
                                      <Badge className="bg-red-100 text-red-700">Out of Stock</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-[#2C2C2C]">
                                  {product.reorderLevel || 10}
                                </TableCell>
                                <TableCell className="text-[#2C2C2C]">
                                  {product.salesCount || 0}
                                </TableCell>
                      <TableCell>
                                  <Badge className={
                                    product.quantity > 20 
                                      ? 'bg-green-100 text-green-700' 
                                      : product.quantity > (product.reorderLevel || 10)
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                  }>
                                    {product.quantity > 20 ? 'In Stock' : product.quantity > (product.reorderLevel || 10) ? 'Low Stock' : 'Critical'}
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
                                          onClick={() => handleStockAdjustment(product.id, 10, 'Manual adjustment')}
                                          className="border-blue-300 text-blue-600"
                                        >
                                          <Plus className="h-4 w-4" />
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
              )}

              {/* Stock Movements Tab */}
              {activeTab === 'movements' && (
                <div className="space-y-6">
                  <Card className="bg-white rounded-xl border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                        <History className="h-5 w-5 text-[#607c47]" />
                        Stock Movement History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {stockMovements.map((movement) => {
                          const product = products.find(p => p.id === movement.productId);
                          return (
                            <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                  movement.type === 'in' ? 'bg-green-100' :
                                  movement.type === 'out' ? 'bg-red-100' :
                                  'bg-yellow-100'
                                }`}>
                                  {movement.type === 'in' ? <ArrowUp className="h-4 w-4 text-green-600" /> :
                                   movement.type === 'out' ? <ArrowDown className="h-4 w-4 text-red-600" /> :
                                   <RotateCcw className="h-4 w-4 text-yellow-600" />}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-[#2C2C2C]">{product?.name}</h4>
                                  <p className="text-sm text-gray-600">{movement.reason}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className={`text-sm font-medium ${
                                    movement.type === 'in' ? 'text-green-600' :
                                    movement.type === 'out' ? 'text-red-600' :
                                    'text-yellow-600'
                                  }`}>
                                    {movement.type === 'in' ? '+' : ''}{movement.quantity}
                                  </p>
                                  <p className="text-xs text-gray-600">{new Date(movement.date).toLocaleDateString()}</p>
                                </div>
                                <Badge className={
                                  movement.type === 'in' ? 'bg-green-100 text-green-800' :
                                  movement.type === 'out' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }>
                                  {movement.type === 'in' ? 'Stock In' :
                                   movement.type === 'out' ? 'Stock Out' :
                                   'Adjustment'}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Alerts Tab */}
              {activeTab === 'alerts' && (
                <div className="space-y-6">
                  <Card className="bg-white rounded-xl border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-[#607c47]" />
                        Inventory Alerts ({inventoryAlerts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {inventoryAlerts.map((alert) => (
                          <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                            alert.severity === 'high' ? 'bg-red-50 border-red-400' :
                            alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                            'bg-blue-50 border-blue-400'
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                alert.severity === 'high' ? 'bg-red-100' :
                                alert.severity === 'medium' ? 'bg-yellow-100' :
                                'bg-blue-100'
                              }`}>
                                {alert.type === 'low_stock' || alert.type === 'out_of_stock' ? 
                                  <AlertTriangle className={`h-4 w-4 ${
                                    alert.severity === 'high' ? 'text-red-600' :
                                    alert.severity === 'medium' ? 'text-yellow-600' :
                                    'text-blue-600'
                                  }`} /> :
                                  <Clock className={`h-4 w-4 ${
                                    alert.severity === 'high' ? 'text-red-600' :
                                    alert.severity === 'medium' ? 'text-yellow-600' :
                                    'text-blue-600'
                                  }`} />
                                }
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-[#2C2C2C]">{alert.productName}</h4>
                                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                                <p className="text-xs text-gray-500 mt-2">{new Date(alert.date).toLocaleString()}</p>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={
                                  alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }>
                                  {alert.severity.toUpperCase()}
                                </Badge>
                                <Button size="sm" className="bg-[#607c47] hover:bg-[#4a6129] text-white">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Resolve
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
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
                              <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `${value}`} />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.75rem',
                                }}
                                formatter={(value, name) => [
                                  name === 'sales' ? value : formatCurrency(value as number),
                                  name === 'sales' ? 'Sales Count' : name === 'revenue' ? 'Revenue' : 'Profit'
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

                  {/* Stock Movement Trends */}
                  <Card className="bg-white rounded-xl border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-[#607c47]" />
                        Stock Movement Trends (Last 7 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={movementTrendData}>
                            <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.75rem',
                              }}
                            />
                            <Area type="monotone" dataKey="stockIn" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                            <Area type="monotone" dataKey="stockOut" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
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