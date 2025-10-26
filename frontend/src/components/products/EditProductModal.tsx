'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Package, 
  DollarSign, 
  Hash, 
  Tag, 
  FileText,
  Save,
  X,
  TrendingUp,
  AlertTriangle,
  Plus,
  Minus
} from 'lucide-react';
import { Product } from '@/lib/api';
import toast from 'react-hot-toast';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: any) => void;
  product: Product | null;
}

const productCategories = [
  'Electronics',
  'Software',
  'Services',
  'Physical Goods',
  'Digital Products',
  'Consulting',
  'Other'
];

export default function EditProductModal({ isOpen, onClose, onSubmit, product }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    quantity: '',
    minStockLevel: '',
    sku: '',
    cost: ''
  });
  const [loading, setLoading] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState({
    type: 'set' as 'set' | 'add' | 'subtract',
    amount: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category || '',
        price: product.price.toString(),
        quantity: product.quantity.toString(),
        minStockLevel: (product.minStockLevel || 0).toString(),
        sku: product.sku || '',
        cost: (product.cost || 0).toString()
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        id: product?.id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        minStockLevel: parseInt(formData.minStockLevel) || 0,
        sku: formData.sku,
        cost: parseFloat(formData.cost) || 0,
        salesCount: product?.salesCount || 0
      };
      
      onSubmit(productData);
      handleClose();
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      quantity: '',
      minStockLevel: '',
      sku: '',
      cost: ''
    });
    setStockAdjustment({ type: 'set', amount: '' });
    onClose();
  };

  const handleStockAdjustment = () => {
    if (!stockAdjustment.amount) return;
    
    const adjustmentAmount = parseInt(stockAdjustment.amount);
    const currentQuantity = parseInt(formData.quantity);
    
    let newQuantity = currentQuantity;
    
    switch (stockAdjustment.type) {
      case 'add':
        newQuantity = currentQuantity + adjustmentAmount;
        break;
      case 'subtract':
        newQuantity = Math.max(0, currentQuantity - adjustmentAmount);
        break;
      case 'set':
        newQuantity = adjustmentAmount;
        break;
    }
    
    setFormData({ ...formData, quantity: newQuantity.toString() });
    setStockAdjustment({ type: 'set', amount: '' });
    toast.success('Stock updated successfully');
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(number);
  };

  const calculateProfitMargin = () => {
    const price = parseFloat(formData.price);
    const cost = parseFloat(formData.cost);
    if (price && cost && price > cost) {
      return ((price - cost) / price * 100).toFixed(1);
    }
    return null;
  };

  const getStockStatus = () => {
    const currentStock = parseInt(formData.quantity) || 0;
    const minLevel = parseInt(formData.minStockLevel) || 0;
    
    if (currentStock === 0) {
      return { type: 'error', message: 'Out of Stock', color: 'text-red-600' };
    } else if (currentStock <= minLevel) {
      return { type: 'warning', message: 'Low Stock', color: 'text-yellow-600' };
    } else {
      return { type: 'success', message: 'In Stock', color: 'text-green-600' };
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#2C2C2C] flex items-center gap-2">
            <Package className="h-5 w-5 text-[#607c47]" />
            Edit Product: {product.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
              <Package className="h-5 w-5 text-[#607c47]" />
              Product Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-[#2C2C2C]">
                  Product Name *
                </Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    placeholder="e.g., Premium Software License"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku" className="text-sm font-medium text-[#2C2C2C]">
                  SKU
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="sku"
                    placeholder="e.g., PS-LIC-001"
                    className="pl-10"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-[#2C2C2C]">
                Description
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="description"
                  placeholder="Describe your product..."
                  rows={3}
                  className="pl-10"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2C2C2C]">
                Category
              </Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {productCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-500" />
                        {category}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#607c47]" />
              Pricing & Cost
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium text-[#2C2C2C]">
                  Selling Price *
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-10"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                {formData.price && (
                  <div className="text-sm text-gray-600">
                    {formatCurrency(formData.price)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium text-[#2C2C2C]">
                  Cost Price
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-10"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>
                {formData.cost && (
                  <div className="text-sm text-gray-600">
                    {formatCurrency(formData.cost)}
                  </div>
                )}
              </div>
            </div>

            {/* Profit Margin Display */}
            {formData.price && formData.cost && calculateProfitMargin() && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Profit Margin: {calculateProfitMargin()}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Inventory Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
              <Hash className="h-5 w-5 text-[#607c47]" />
              Inventory Management
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium text-[#2C2C2C]">
                  Current Stock *
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="0"
                    className="pl-10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="text-xs text-gray-600">
                  Current quantity in inventory
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStockLevel" className="text-sm font-medium text-[#2C2C2C]">
                  Minimum Stock Level
                </Label>
                <div className="relative">
                  <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="minStockLevel"
                    type="number"
                    placeholder="0"
                    className="pl-10"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                  />
                </div>
                <div className="text-xs text-gray-600">
                  Alert when stock falls below this level
                </div>
              </div>
            </div>

            {/* Quick Stock Adjustment */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Quick Stock Adjustment</span>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-sm text-blue-700">Adjustment Type</Label>
                    <Select value={stockAdjustment.type} onValueChange={(value: 'set' | 'add' | 'subtract') => setStockAdjustment({ ...stockAdjustment, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="set">Set to</SelectItem>
                        <SelectItem value="add">Add</SelectItem>
                        <SelectItem value="subtract">Subtract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm text-blue-700">Amount</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={stockAdjustment.amount}
                      onChange={(e) => setStockAdjustment({ ...stockAdjustment, amount: e.target.value })}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleStockAdjustment}
                    disabled={!stockAdjustment.amount}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stock Status */}
            <Card className={`border ${
              getStockStatus().type === 'error' ? 'bg-red-50 border-red-200' :
              getStockStatus().type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
              'bg-green-50 border-green-200'
            }`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  {getStockStatus().type === 'error' ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : getStockStatus().type === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <Package className="h-4 w-4 text-green-600" />
                  )}
                  <span className={`text-sm font-medium ${getStockStatus().color}`}>
                    {getStockStatus().message}
                  </span>
                </div>
                <div className={`text-xs mt-1 ${
                  getStockStatus().type === 'error' ? 'text-red-700' :
                  getStockStatus().type === 'warning' ? 'text-yellow-700' :
                  'text-green-700'
                }`}>
                  Current stock: {formData.quantity} units | Min level: {formData.minStockLevel || 0} units
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Summary */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-[#607c47]" />
                <span className="font-medium text-[#2C2C2C]">Product Summary</span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div><strong>Name:</strong> {formData.name}</div>
                <div><strong>Price:</strong> {formatCurrency(formData.price)}</div>
                <div><strong>Current Stock:</strong> {formData.quantity} units</div>
                <div><strong>Status:</strong> {getStockStatus().message}</div>
                {formData.category && <div><strong>Category:</strong> {formData.category}</div>}
                {formData.sku && <div><strong>SKU:</strong> {formData.sku}</div>}
                {calculateProfitMargin() && <div><strong>Profit Margin:</strong> {calculateProfitMargin()}%</div>}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-gray-300 text-[#2C2C2C]"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.price || !formData.quantity}
              className="flex-1 bg-[#607c47] hover:bg-[#4a6129] text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
