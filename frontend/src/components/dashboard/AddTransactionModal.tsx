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
  DollarSign, 
  Calendar, 
  FileText, 
  Tag, 
  Building2,
  TrendingUp,
  TrendingDown,
  Plus,
  X
} from 'lucide-react';
import { BankAccount } from '@/lib/api';
import toast from 'react-hot-toast';

// Demo Account interface for the modal
interface DemoAccount {
  id: string;
  name: string;
  balance: number;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: DemoAccount[];
}

const transactionCategories = [
  { value: 'income', label: 'Income', icon: TrendingUp, color: 'text-green-600' },
  { value: 'expense', label: 'Expense', icon: TrendingDown, color: 'text-red-600' },
];

const incomeSubcategories = [
  'Sales Revenue',
  'Investment',
  'Grant',
  'Interest Income',
  'Other Income'
];

const expenseSubcategories = [
  'Office Rent',
  'Salaries',
  'Marketing',
  'Software/SaaS',
  'Equipment',
  'Travel',
  'Professional Services',
  'Utilities',
  'Insurance',
  'Other Expenses'
];

export default function AddTransactionModal({ isOpen, onClose, onSuccess, accounts }: AddTransactionModalProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category || !formData.accountId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Mock API call - in real implementation, this would call the backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Transaction added successfully!');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast.error('Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      category: '',
      accountId: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    onClose();
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(number);
  };

  const selectedCategory = transactionCategories.find(cat => cat.value === formData.type);
  const subcategories = formData.type === 'income' ? incomeSubcategories : expenseSubcategories;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#2C2C2C] flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#607c47]" />
            Add New Transaction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[#2C2C2C]">Transaction Type *</Label>
            <div className="grid grid-cols-2 gap-3">
              {transactionCategories.map((category) => (
                <Card 
                  key={category.value}
                  className={`cursor-pointer transition-all bg-white border-gray-200 ${
                    formData.type === category.value 
                      ? 'ring-2 ring-[#607c47] border-[#607c47]' 
                      : 'hover:shadow-md hover:border-gray-300'
                  }`}
                  onClick={() => setFormData({ ...formData, type: category.value as 'income' | 'expense', category: '' })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <category.icon className={`h-5 w-5 ${category.color}`} />
                      <div>
                        <div className="font-medium text-gray-900">{category.label}</div>
                        <div className="text-xs text-gray-600">
                          {category.value === 'income' ? 'Money coming in' : 'Money going out'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-[#2C2C2C]">
                Description *
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="description"
                  placeholder="e.g., Office rent payment"
                  className="pl-10"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-[#2C2C2C]">
                Amount *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-10"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              {formData.amount && (
                <div className="text-sm text-gray-600">
                  {formatCurrency(formData.amount)}
                </div>
              )}
            </div>
          </div>

          {/* Category and Account */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2C2C2C]">
                Category *
              </Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory} value={subcategory}>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-500" />
                        {subcategory}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2C2C2C]">
                Bank Account *
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
                            Balance: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(account.balance)}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-[#2C2C2C]">
              Transaction Date *
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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-[#2C2C2C]">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional details about this transaction..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Transaction Summary */}
          {formData.description && formData.amount && formData.category && (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-white rounded">
                    {selectedCategory?.icon && <selectedCategory.icon className={`h-4 w-4 ${selectedCategory.color}`} />}
                  </div>
                  <span className="font-medium text-[#2C2C2C]">Transaction Summary</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div><strong>Description:</strong> {formData.description}</div>
                  <div><strong>Amount:</strong> {formatCurrency(formData.amount)}</div>
                  <div><strong>Type:</strong> {selectedCategory?.label}</div>
                  <div><strong>Category:</strong> {formData.category}</div>
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
              disabled={loading || !formData.description || !formData.amount || !formData.category || !formData.accountId}
              className="flex-1 bg-[#607c47] hover:bg-[#4a6129] text-white"
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}