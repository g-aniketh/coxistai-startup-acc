'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient, BankAccount } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

// Zod validation schema
const transactionSchema = z.object({
  accountId: z.string().min(1, 'Please select an account'),
  type: z.enum(['CREDIT', 'DEBIT'], {
    required_error: 'Please select a transaction type'
  }),
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description must be less than 200 characters'),
  amount: z.number()
    .positive('Amount must be greater than 0')
    .max(1000000000, 'Amount is too large'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: BankAccount[];
}

export default function AddTransactionModal({ isOpen, onClose, onSuccess, accounts }: AddTransactionModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'CREDIT',
      description: '',
    },
  });

  const selectedType = watch('type');
  const selectedAccountId = watch('accountId');

  const onSubmit = async (data: TransactionFormData) => {
    try {
      const response = await apiClient.transactions.create({
        amount: data.amount,
        type: data.type,
        description: data.description,
        accountId: data.accountId,
      });

      if (response.success) {
        toast.success(`${data.type === 'CREDIT' ? 'Income' : 'Expense'} transaction added successfully!`);
        reset();
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to add transaction');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add transaction');
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
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Simulate a financial transaction (income or expense).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Bank Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="account">Bank Account *</Label>
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

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type *</Label>
            <Select
              value={selectedType}
              onValueChange={(value: 'CREDIT' | 'DEBIT') => setValue('type', value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CREDIT">
                  <span className="text-green-500">💰 Income (Credit)</span>
                </SelectItem>
                <SelectItem value="DEBIT">
                  <span className="text-red-500">💸 Expense (Debit)</span>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="Client payment, Office rent, etc."
              {...register('description')}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="5000.00"
              {...register('amount', { valueAsNumber: true })}
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
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
                  Adding...
                </>
              ) : (
                'Add Transaction'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
