'use client';

import { useState } from 'react';
import { apiClient, BankAccount, Product } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

interface SimulateSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: BankAccount[];
  products: Product[];
}

export default function SimulateSaleModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  accounts,
  products 
}: SimulateSaleModalProps) {
  const [formData, setFormData] = useState({
    productId: '',
    quantitySold: '',
    accountId: '',
  });
  const [loading, setLoading] = useState(false);

  const selectedProduct = products.find(p => p.id === formData.productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.inventory.sales.simulate({
        productId: formData.productId,
        quantitySold: parseInt(formData.quantitySold),
        accountId: formData.accountId,
      });

      if (response.success) {
        const totalPrice = response.data?.sale.totalPrice || 0;
        toast.success(`Sale simulated! Revenue: $${totalPrice.toLocaleString()}`);
        setFormData({ productId: '', quantitySold: '', accountId: '' });
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to simulate sale');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to simulate sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Simulate Product Sale</DialogTitle>
          <DialogDescription>
            Simulate a customer purchase. This will update inventory and create a revenue transaction.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product">Product</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) => setFormData({ ...formData, productId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - ${product.price} (Stock: {product.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProduct && (
              <p className="text-xs text-muted-foreground mt-1">
                Available stock: {selectedProduct.quantity} units
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="quantitySold">Quantity Sold</Label>
            <Input
              id="quantitySold"
              type="number"
              min="1"
              max={selectedProduct?.quantity || undefined}
              placeholder="5"
              value={formData.quantitySold}
              onChange={(e) => setFormData({ ...formData, quantitySold: e.target.value })}
              required
            />
            {selectedProduct && formData.quantitySold && (
              <p className="text-xs text-muted-foreground mt-1">
                Total: ${(selectedProduct.price * parseInt(formData.quantitySold)).toLocaleString()}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="account">Deposit to Account</Label>
            <Select
              value={formData.accountId}
              onValueChange={(value) => setFormData({ ...formData, accountId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.accountName} (${account.balance.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Simulate Sale'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

