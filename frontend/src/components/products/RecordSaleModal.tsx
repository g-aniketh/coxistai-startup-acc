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

const saleSchema = z.object({
  quantitySold: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0'),
  accountId: z.string().min(1, 'Please select an account'),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: BankAccount[];
  product: Product | null;
}

export default function RecordSaleModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  accounts,
  product 
}: RecordSaleModalProps) {
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
      quantitySold: 1,
      accountId: '',
    },
  });

  const selectedAccountId = watch('accountId');
  const quantitySold = watch('quantitySold');
  const totalPrice = product && quantitySold ? product.price * quantitySold : 0;

  const onSubmit = async (data: SaleFormData) => {
    if (!product) return;

    if (data.quantitySold > product.quantity) {
      setError('quantitySold', { message: `Only ${product.quantity} units available` });
      return;
    }

    try {
      const response = await apiClient.inventory.sales.simulate({
        productId: product.id,
        quantitySold: data.quantitySold,
        accountId: data.accountId,
      });

      if (response.success) {
        toast.success(`Sale recorded! Revenue: ${totalPrice}`);
        reset();
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to record sale');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record sale');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Sale for {product?.name}</DialogTitle>
          <DialogDescription>
            This will create a new transaction and update the product's stock.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="quantitySold">Quantity Sold</Label>
            <Input
              id="quantitySold"
              type="number"
              {...register('quantitySold', { valueAsNumber: true })}
            />
            {errors.quantitySold && <p className="text-red-500 text-sm">{errors.quantitySold.message}</p>}
          </div>
          <div>
            <Label htmlFor="accountId">Deposit to Account</Label>
            <Select onValueChange={(value) => setValue('accountId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.accountName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && <p className="text-red-500 text-sm">{errors.accountId.message}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Sale'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
