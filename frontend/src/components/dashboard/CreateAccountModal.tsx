'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

// Zod validation schema
const accountSchema = z.object({
  accountName: z.string()
    .min(3, 'Account name must be at least 3 characters')
    .max(50, 'Account name must be less than 50 characters'),
  balance: z.number()
    .nonnegative('Balance cannot be negative')
    .max(1000000000, 'Balance is too large'),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAccountModal({ isOpen, onClose, onSuccess }: CreateAccountModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      accountName: '',
      balance: 0,
    },
  });

  const onSubmit = async (data: AccountFormData) => {
    try {
      const response = await apiClient.accounts.create({
        accountName: data.accountName,
        balance: data.balance,
      });

      if (response.success) {
        toast.success('Bank account created successfully!');
        reset();
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to create account');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create account');
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
          <DialogTitle>Create Mock Bank Account</DialogTitle>
          <DialogDescription>
            Create a simulated bank account to track transactions and cashflow.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name *</Label>
            <Input
              id="accountName"
              placeholder="Main Checking Account"
              {...register('accountName')}
              className={errors.accountName ? 'border-red-500' : ''}
            />
            {errors.accountName && (
              <p className="text-sm text-red-500">{errors.accountName.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              e.g., "Main Checking", "Business Savings", "Payroll Account"
            </p>
          </div>

          {/* Initial Balance */}
          <div className="space-y-2">
            <Label htmlFor="balance">Initial Balance *</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="50000"
              {...register('balance', { valueAsNumber: true })}
              className={errors.balance ? 'border-red-500' : ''}
            />
            {errors.balance && (
              <p className="text-sm text-red-500">{errors.balance.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter your current account balance
            </p>
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
                  Creating...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
