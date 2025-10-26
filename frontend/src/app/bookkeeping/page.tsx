'use client';

import { useEffect, useMemo, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/Badge';
import { 
  Bot,
  CheckCircle,
  XCircle,
  RefreshCcw,
  Upload,
  Download,
  Search,
  Tags,
  CreditCard,
  Building,
  FileText,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

interface BankTxn {
  id: string;
  date: string;
  description: string;
  amount: number; // positive = inflow, negative = outflow
  account: string;
  reconciled: boolean;
  category?: string;
  confidence?: number; // AI classification confidence
}

const currency = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

const MOCK_CATEGORIES = [
  'SaaS: Subscriptions',
  'Payroll: Salaries',
  'Marketing: Ads',
  'Operations: Rent',
  'Revenue: Sales',
  'Revenue: Refund',
  'Travel: Flights',
  'Office: Supplies',
];

export default function BookkeepingPage() {
  const [txns, setTxns] = useState<BankTxn[]>([]);
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    setTxns([
      { id: '1', date: '2025-10-18', description: 'Stripe Payout', amount: 12450, account: 'Bank of America - 1234', reconciled: false },
      { id: '2', date: '2025-10-18', description: 'Google Cloud', amount: -780, account: 'Bank of America - 1234', reconciled: false },
      { id: '3', date: '2025-10-17', description: 'Notion Labs', amount: -12, account: 'Chase - 9876', reconciled: true, category: 'SaaS: Subscriptions', confidence: 0.96 },
      { id: '4', date: '2025-10-16', description: 'Facebook Ads', amount: -1500, account: 'Chase - 9876', reconciled: false },
      { id: '5', date: '2025-10-16', description: 'ACME Office Rent', amount: -2500, account: 'Bank of America - 1234', reconciled: true, category: 'Operations: Rent', confidence: 0.88 },
      { id: '6', date: '2025-10-15', description: 'Refund - Order #1024', amount: -199, account: 'Bank of America - 1234', reconciled: false },
      { id: '7', date: '2025-10-15', description: 'ACH Credit - Customer Globex', amount: 4999, account: 'Chase - 9876', reconciled: false },
    ]);
  }, []);

  const filtered = useMemo(() => {
    return txns.filter(t => {
      const matchesText = [t.description, t.account, t.category || ''].join(' ').toLowerCase().includes(search.toLowerCase());
      const matchesAcct = accountFilter === 'all' ? true : t.account === accountFilter;
      return matchesText && matchesAcct;
    });
  }, [txns, search, accountFilter]);

  const accounts = Array.from(new Set(txns.map(t => t.account)));

  const aiClassify = async () => {
    setIsClassifying(true);
    await new Promise(r => setTimeout(r, 1200));
    setTxns(prev => prev.map(t => {
      if (t.category) return t;
      // simple keyword-based mock classifier
      const d = t.description.toLowerCase();
      let category = 'Office: Supplies';
      if (d.includes('stripe') || d.includes('ach credit') || t.amount > 0) category = 'Revenue: Sales';
      else if (d.includes('refund')) category = 'Revenue: Refund';
      else if (d.includes('google') || d.includes('notion') || d.includes('cloud')) category = 'SaaS: Subscriptions';
      else if (d.includes('facebook') || d.includes('ads')) category = 'Marketing: Ads';
      else if (d.includes('rent')) category = 'Operations: Rent';
      else if (d.includes('payroll') || d.includes('salary')) category = 'Payroll: Salaries';
      return { ...t, category, confidence: 0.8 + Math.random() * 0.2 };
    }));
    toast.success('AI classified transactions');
    setIsClassifying(false);
  };

  const setCategory = (id: string, category: string) => {
    setTxns(prev => prev.map(t => t.id === id ? { ...t, category, confidence: 1 } : t));
  };

  const reconcile = (id: string, value: boolean) => {
    setTxns(prev => prev.map(t => t.id === id ? { ...t, reconciled: value } : t));
  };

  const bulkReconcile = () => {
    setTxns(prev => prev.map(t => t.category ? { ...t, reconciled: true } : t));
    toast.success('Reconciled all categorized transactions');
  };

  const exportCSV = () => {
    const header = 'date,description,amount,account,category,reconciled\n';
    const rows = txns.map(t => `${t.date},"${t.description}",${t.amount},${t.account},${t.category || ''},${t.reconciled}`);
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bookkeeping.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported CSV');
  };

  const inflow = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const outflow = filtered.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const categorized = filtered.filter(t => t.category).length;
  const reconciled = filtered.filter(t => t.reconciled).length;

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="bg-gray-50 flex">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Automated Bookkeeping</h1>
                  <p className="text-sm text-[#2C2C2C]/70">AI classification, expense categorization, and bank reconciliation (mock)</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search transactions" className="pl-10 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <Select value={accountFilter} onValueChange={setAccountFilter}>
                    <SelectTrigger className="w-[220px] bg-white">
                      <SelectValue placeholder="Filter account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {accounts.map(a => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Button onClick={aiClassify} disabled={isClassifying} className="bg-[#607c47] hover:bg-[#4a6129] text-white">
                    <Bot className="h-4 w-4 mr-2" /> {isClassifying ? 'Classifying...' : 'AI Classify'}
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4">
                    <div className="text-sm text-green-700">Inflow</div>
                    <div className="text-lg font-bold text-green-900">{currency(inflow)}</div>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
                  <CardContent className="p-4">
                    <div className="text-sm text-red-700">Outflow</div>
                    <div className="text-lg font-bold text-red-900">{currency(outflow)}</div>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardContent className="p-4">
                    <div className="text-sm text-blue-700">Categorized</div>
                    <div className="text-lg font-bold text-blue-900">{categorized}/{filtered.length}</div>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-50">
                  <CardContent className="p-4">
                    <div className="text-sm text-yellow-700">Reconciled</div>
                    <div className="text-lg font-bold text-yellow-900">{reconciled}/{filtered.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Table */}
              <Card className="bg-white rounded-xl border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C]">Bank Transactions</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="border-gray-300 text-[#2C2C2C]" onClick={bulkReconcile}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Reconcile All Categorized
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-300" onClick={exportCSV}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map(t => (
                          <TableRow key={t.id} className="hover:bg-gray-50">
                            <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-[#2C2C2C]">{t.description}</span>
                                {typeof t.confidence === 'number' && (
                                  <span className="text-xs text-gray-500">AI confidence: {(t.confidence * 100).toFixed(0)}%</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{t.account}</TableCell>
                            <TableCell>
                              <Select value={t.category || 'unset'} onValueChange={(v) => setCategory(t.id, v === 'unset' ? '' : v)}>
                                <SelectTrigger className="w-[220px] bg-white">
                                  <SelectValue placeholder="Set category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unset">Uncategorized</SelectItem>
                                  {MOCK_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className={`font-semibold ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>{currency(Math.abs(t.amount))}</TableCell>
                            <TableCell>
                              <Badge className={t.reconciled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {t.reconciled ? 'Reconciled' : 'Unreconciled'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="border-green-300 text-green-700" onClick={() => reconcile(t.id, true)}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-300 text-red-700" onClick={() => reconcile(t.id, false)}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
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
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
