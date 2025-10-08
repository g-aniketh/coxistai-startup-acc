'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, Transaction, TransactionCategory, Account } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  Search,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  X,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  FileSearch,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import SplitText from '@/components/SplitText';
import { cn } from '@/lib/utils';
import AnimatedList from '@/components/AnimatedList';

type SortConfig = {
  key: keyof Transaction;
  direction: 'ascending' | 'descending';
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    categoryId: '',
    accountId: '',
    limit: 15,
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'date',
    direction: 'descending',
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: filters.limit,
        sortBy: sortConfig.key,
        sortOrder:
          sortConfig.direction === 'ascending' ? ('asc' as const) : ('desc' as const),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.categoryId && { categoryId: parseInt(filters.categoryId) }),
        ...(filters.accountId && { accountId: filters.accountId }),
      };
      const response = await api.cfo.transactions(params);
      if (response.success && response.data) {
        setTransactions(response.data.transactions);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCount(response.data.pagination.totalCount);
      } else {
        setError(response.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    filters.limit,
    sortConfig,
    debouncedSearch,
    filters.startDate,
    filters.endDate,
    filters.categoryId,
    filters.accountId,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [catRes, accRes] = await Promise.all([
          api.cfo.categories(),
          api.cfo.accounts(),
        ]);
        if (catRes.success) setCategories(catRes.data || []);
        if (accRes.success) setAccounts(accRes.data?.accounts || []);
      } catch (err) {
        console.error('Failed to fetch filter data:', err);
      }
    };
    fetchDropdownData();
  }, []);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const requestSort = (key: keyof Transaction) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === 'ascending'
          ? 'descending'
          : 'ascending',
    }));
    setCurrentPage(1);
  };
  
  const clearFilters = () => {
    setFilters({ search: '', startDate: '', endDate: '', categoryId: '', accountId: '', limit: 15 });
    setSortConfig({ key: 'date', direction: 'descending' });
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="space-y-6">
          <header>
            <SplitText
              text="Transactions"
              tag="h1"
              className="text-3xl font-bold"
            />
            <p className="mt-1 text-muted-foreground">
              View and manage all your financial transactions.
            </p>
          </header>

          <div className="glass p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by description..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-transparent"
                />
              </div>
              <select value={filters.accountId} onChange={e => handleFilterChange('accountId', e.target.value)} className="w-full border border-border rounded-lg bg-transparent py-2 px-3">
                 <option value="">All Accounts</option>
                 {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
              <select value={filters.categoryId} onChange={e => handleFilterChange('categoryId', e.target.value)} className="w-full border border-border rounded-lg bg-transparent py-2 px-3">
                 <option value="">All Categories</option>
                 {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} className="w-full border border-border rounded-lg bg-transparent py-2 px-3" />
                <input type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} className="w-full border border-border rounded-lg bg-transparent py-2 px-3" />
              </div>
            </div>
             <div className="flex justify-between items-center mt-4">
               <p className="text-sm text-muted-foreground">{totalCount.toLocaleString()} results</p>
               <button onClick={clearFilters} className="text-sm text-primary hover:underline flex items-center gap-1">
                 <X className="h-4 w-4" /> Clear Filters
               </button>
             </div>
          </div>

          <div className="glass rounded-lg overflow-hidden">
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-border">
                 <thead className="bg-muted/50">
                   <tr>
                     {['date', 'description', 'account', 'category', 'amount'].map(key => (
                       <th key={key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                         <button onClick={() => requestSort(key as keyof Transaction)} className="flex items-center gap-1">
                           {key.replace('_', ' ')}
                           {sortConfig.key === key && (sortConfig.direction === 'ascending' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                         </button>
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                   {loading ? (
                     <tr><td colSpan={5} className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></td></tr>
                   ) : error ? (
                     <tr><td colSpan={5} className="text-center py-10 text-destructive">{error}</td></tr>
                   ) : transactions.length > 0 ? (
                     <AnimatedList items={
                       transactions.map((transaction) => (
                         <tr key={transaction.id} className="hover:bg-muted/50">
                           <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(transaction.date)}</td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium max-w-xs truncate">{transaction.description}</td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{transaction.account.name}</td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm">
                             <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">
                               {transaction.category?.name || 'Uncategorized'}
                             </span>
                           </td>
                           <td className={cn("px-6 py-4 whitespace-nowrap text-sm font-medium", transaction.amount < 0 ? 'text-red-400' : 'text-green-400')}>
                             {formatCurrency(transaction.amount)}
                           </td>
                         </tr>
                       ))
                     } />
                   ) : (
                     <tr>
                       <td colSpan={5} className="text-center py-16">
                         <FileSearch className="mx-auto h-12 w-12 text-muted-foreground" />
                         <h3 className="mt-2 text-sm font-medium">No Transactions Found</h3>
                         <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters.</p>
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
             {totalPages > 1 && (
               <div className="p-4 flex items-center justify-between border-t border-border">
                 <p className="text-sm text-muted-foreground">
                   Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                 </p>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-muted disabled:opacity-50">
                      <ChevronLeft className="h-5 w-5" />
                   </button>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-muted disabled:opacity-50">
                       <ChevronRight className="h-5 w-5" />
                   </button>
                 </div>
               </div>
             )}
           </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
