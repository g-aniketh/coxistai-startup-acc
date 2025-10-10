'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient, BankAccount, Product } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

// Zod validation schema
const saleSchema = z.object({
  productId: z.string().min(1, 'Please select a product'),
  quantitySold: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(10000, 'Quantity is too large'),
  accountId: z.string().min(1, 'Please select an account'),
});

type SaleFormData = z.infer<typeof saleSchema>;

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    setError,
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      productId: '',
      quantitySold: 1,
      accountId: '',
    },
  });

  const selectedProductId = watch('productId');
  const selectedAccountId = watch('accountId');
  const quantitySold = watch('quantitySold');

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const totalPrice = selectedProduct && quantitySold ? selectedProduct.price * quantitySold : 0;

  const onSubmit = async (data: SaleFormData) => {
    // Additional validation: check stock availability
    if (selectedProduct && data.quantitySold > selectedProduct.quantity) {
      setError('quantitySold', {
        message: `Only ${selectedProduct.quantity} units available in stock`
      });
      return;
    }

    try {
      const response = await apiClient.inventory.sales.simulate({
        productId: data.productId,
        quantitySold: data.quantitySold,
        accountId: data.accountId,
      });

      if (response.success) {
        const revenue = response.data?.sale.totalPrice || totalPrice;
        toast.success(`Sale simulated! Revenue: $${revenue.toLocaleString()}`);
        reset();
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to simulate sale');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to simulate sale');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Simulate Product Sale</DialogTitle>
          <DialogDescription>
            Simulate a customer purchase. This will update inventory and create a revenue transaction.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            <Select
              value={selectedProductId}
              onValueChange={(value) => setValue('productId', value, { shouldValidate: true })}
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
            {errors.productId && (
              <p className="text-sm text-red-500">{errors.productId.message}</p>
            )}
            {selectedProduct && (
              <p className="text-xs text-muted-foreground">
                Available stock: {selectedProduct.quantity} units at ${selectedProduct.price}/unit
              </p>
            )}
          </div>

          {/* Quantity Sold */}
          <div className="space-y-2">
            <Label htmlFor="quantitySold">Quantity Sold *</Label>
            <Input
              id="quantitySold"
              type="number"
              min="1"
              placeholder="5"
              {...register('quantitySold', { valueAsNumber: true })}
              className={errors.quantitySold ? 'border-red-500' : ''}
            />
            {errors.quantitySold && (
              <p className="text-sm text-red-500">{errors.quantitySold.message}</p>
            )}
            {selectedProduct && quantitySold > 0 && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-medium text-primary">
                  Sale Total: ${totalPrice.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {quantitySold} × ${selectedProduct.price}
                </p>
              </div>
            )}
          </div>

          {/* Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="account">Deposit to Account *</Label>
            <Select
              value={selectedAccountId}
              onValueChange={(value) => setValue('accountId', value, { shouldValidate: true })}
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
            {errors.accountId && (
              <p className="text-sm text-red-500">{errors.accountId.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                'Simulate Sale'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
