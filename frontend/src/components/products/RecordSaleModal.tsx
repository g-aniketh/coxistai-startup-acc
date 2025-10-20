'use client';

import { useState } from 'react';
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
  ShoppingBag, 
  DollarSign, 
  Hash, 
  Calendar, 
  User,
  Building2,
  Plus,
  X,
  Package,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Product, BankAccount } from '@/lib/api';
import toast from 'react-hot-toast';

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (saleData: any) => void;
  products: Product[];
  accounts: BankAccount[];
}

export default function RecordSaleModal({ isOpen, onClose, onSubmit, products, accounts }: RecordSaleModalProps) {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    unitPrice: '',
    customerName: '',
    customerEmail: '',
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const selectedProduct = products.find(p => p.id === formData.productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.quantity || !formData.accountId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedProduct && parseInt(formData.quantity) > selectedProduct.quantity) {
      toast.error('Insufficient stock available');
      return;
    }

    try {
      setLoading(true);
      
      const saleData = {
        productId: formData.productId,
        quantity: parseInt(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice) || selectedProduct?.price || 0,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        accountId: formData.accountId,
        date: formData.date,
        notes: formData.notes,
        totalAmount: (parseFloat(formData.unitPrice) || selectedProduct?.price || 0) * parseInt(formData.quantity)
      };
      
      onSubmit(saleData);
      handleClose();
    } catch (error) {
      console.error('Failed to record sale:', error);
      toast.error('Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      productId: '',
      quantity: '',
      unitPrice: '',
      customerName: '',
      customerEmail: '',
      accountId: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateTotal = () => {
    const quantity = parseInt(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || selectedProduct?.price || 0;
    return quantity * unitPrice;
  };

  const getStockStatus = () => {
    if (!selectedProduct) return null;
    
    const requestedQuantity = parseInt(formData.quantity) || 0;
    const availableStock = selectedProduct.quantity;
    const minStockLevel = selectedProduct.minStockLevel || 0;
    
    if (requestedQuantity > availableStock) {
      return { type: 'error', message: 'Insufficient stock' };
    }
    
    if (availableStock - requestedQuantity <= minStockLevel) {
      return { type: 'warning', message: 'Stock will be below minimum level' };
    }
    
    return { type: 'success', message: 'Stock available' };
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#2C2C2C] flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#607c47]" />
            Record Product Sale
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
              <Package className="h-5 w-5 text-[#607c47]" />
              Product Details
            </h3>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2C2C2C]">
                Select Product *
              </Label>
              <Select value={formData.productId} onValueChange={(value) => {
                const product = products.find(p => p.id === value);
                setFormData({ 
                  ...formData, 
                  productId: value,
                  unitPrice: product?.price.toString() || ''
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            Stock: {product.quantity} | Price: {formatCurrency(product.price)}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Info Display */}
            {selectedProduct && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Product Information</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-blue-700"><strong>Name:</strong> {selectedProduct.name}</div>
                      <div className="text-blue-700"><strong>Category:</strong> {selectedProduct.category}</div>
                    </div>
                    <div>
                      <div className="text-blue-700"><strong>Available Stock:</strong> {selectedProduct.quantity}</div>
                      <div className="text-blue-700"><strong>Price:</strong> {formatCurrency(selectedProduct.price)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sale Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#607c47]" />
              Sale Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium text-[#2C2C2C]">
                  Quantity *
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="1"
                    className="pl-10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice" className="text-sm font-medium text-[#2C2C2C]">
                  Unit Price
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    placeholder={selectedProduct?.price.toString() || "0.00"}
                    className="pl-10"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  />
                </div>
                <div className="text-xs text-gray-600">
                  Default: {selectedProduct ? formatCurrency(selectedProduct.price) : '$0.00'}
                </div>
              </div>
            </div>

            {/* Stock Status */}
            {formData.productId && formData.quantity && (
              <Card className={`border ${
                getStockStatus()?.type === 'error' ? 'bg-red-50 border-red-200' :
                getStockStatus()?.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    {getStockStatus()?.type === 'error' ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : getStockStatus()?.type === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <Package className="h-4 w-4 text-green-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      getStockStatus()?.type === 'error' ? 'text-red-900' :
                      getStockStatus()?.type === 'warning' ? 'text-yellow-900' :
                      'text-green-900'
                    }`}>
                      {getStockStatus()?.message}
                    </span>
                  </div>
                  {selectedProduct && (
                    <div className={`text-xs mt-1 ${
                      getStockStatus()?.type === 'error' ? 'text-red-700' :
                      getStockStatus()?.type === 'warning' ? 'text-yellow-700' :
                      'text-green-700'
                    }`}>
                      After sale: {selectedProduct.quantity - (parseInt(formData.quantity) || 0)} units remaining
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
              <User className="h-5 w-5 text-[#607c47]" />
              Customer Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm font-medium text-[#2C2C2C]">
                  Customer Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="customerName"
                    placeholder="e.g., John Doe"
                    className="pl-10"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail" className="text-sm font-medium text-[#2C2C2C]">
                  Customer Email
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="e.g., john@example.com"
                    className="pl-10"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Date */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#607c47]" />
              Payment & Date
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#2C2C2C]">
                  Payment Account *
                </Label>
                <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{account.name}</div>
                            <div className="text-xs text-gray-500">
                              Balance: {formatCurrency(account.balance)}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-[#2C2C2C]">
                  Sale Date *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="date"
                    type="date"
                    className="pl-10"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-[#2C2C2C]">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional details about this sale..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Sale Summary */}
          {formData.productId && formData.quantity && (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-[#607c47]" />
                  <span className="font-medium text-[#2C2C2C]">Sale Summary</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div><strong>Product:</strong> {selectedProduct?.name}</div>
                  <div><strong>Quantity:</strong> {formData.quantity}</div>
                  <div><strong>Unit Price:</strong> {formatCurrency(parseFloat(formData.unitPrice) || selectedProduct?.price || 0)}</div>
                  <div><strong>Total Amount:</strong> {formatCurrency(calculateTotal())}</div>
                  <div><strong>Date:</strong> {new Date(formData.date).toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>
          )}

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
              disabled={loading || !formData.productId || !formData.quantity || !formData.accountId || (getStockStatus()?.type === 'error')}
              className="flex-1 bg-[#607c47] hover:bg-[#4a6129] text-white"
            >
              {loading ? 'Recording...' : 'Record Sale'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}