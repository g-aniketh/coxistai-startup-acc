'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/Badge';
import { 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Building,
  Search,
  Filter,
  Download,
  Plus,
  Settings,
  Wifi,
  WifiOff,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Zap
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'credit';
  balance: number;
  lastSync: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  transactionsCount: number;
  pendingTransactions: number;
}

interface BankConnection {
  id: string;
  bankName: string;
  logo: string;
  status: 'available' | 'connected' | 'error';
  lastSync?: string;
  accountsCount?: number;
}

interface SyncLog {
  id: string;
  timestamp: string;
  account: string;
  action: 'sync_start' | 'sync_complete' | 'sync_error' | 'reconciliation';
  status: 'success' | 'error' | 'warning';
  message: string;
  transactionsProcessed?: number;
}

const currency = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

const MOCK_BANKS: BankConnection[] = [
  { id: '1', bankName: 'Bank of America', logo: '🏦', status: 'connected', lastSync: '2024-01-20T10:30:00Z', accountsCount: 2 },
  { id: '2', bankName: 'Chase Bank', logo: '🏛️', status: 'connected', lastSync: '2024-01-20T10:25:00Z', accountsCount: 1 },
  { id: '3', bankName: 'Wells Fargo', logo: '🏪', status: 'available' },
  { id: '4', bankName: 'American Express', logo: '💳', status: 'connected', lastSync: '2024-01-20T10:20:00Z', accountsCount: 1 },
];

const MOCK_ACCOUNTS: BankAccount[] = [
  {
    id: '1',
    name: 'Business Checking',
    bankName: 'Bank of America',
    accountNumber: '****1234',
    accountType: 'checking',
    balance: 45678.90,
    lastSync: '2024-01-20T10:30:00Z',
    status: 'connected',
    transactionsCount: 45,
    pendingTransactions: 2
  },
  {
    id: '2',
    name: 'Business Savings',
    bankName: 'Bank of America',
    accountNumber: '****5678',
    accountType: 'savings',
    balance: 125000.00,
    lastSync: '2024-01-20T10:30:00Z',
    status: 'connected',
    transactionsCount: 12,
    pendingTransactions: 0
  },
  {
    id: '3',
    name: 'Chase Business',
    bankName: 'Chase Bank',
    accountNumber: '****9876',
    accountType: 'checking',
    balance: 23456.78,
    lastSync: '2024-01-20T10:25:00Z',
    status: 'connected',
    transactionsCount: 23,
    pendingTransactions: 1
  },
  {
    id: '4',
    name: 'Amex Business Card',
    bankName: 'American Express',
    accountNumber: '****5432',
    accountType: 'credit',
    balance: -1234.56,
    lastSync: '2024-01-20T10:20:00Z',
    status: 'connected',
    transactionsCount: 18,
    pendingTransactions: 0
  }
];

const MOCK_SYNC_LOGS: SyncLog[] = [
  {
    id: '1',
    timestamp: '2024-01-20T10:30:00Z',
    account: 'Bank of America - Business Checking',
    action: 'sync_complete',
    status: 'success',
    message: 'Successfully synced 5 new transactions',
    transactionsProcessed: 5
  },
  {
    id: '2',
    timestamp: '2024-01-20T10:25:00Z',
    account: 'Chase Bank - Business',
    action: 'sync_complete',
    status: 'success',
    message: 'Successfully synced 3 new transactions',
    transactionsProcessed: 3
  },
  {
    id: '3',
    timestamp: '2024-01-20T10:20:00Z',
    account: 'American Express - Business Card',
    action: 'reconciliation',
    status: 'success',
    message: 'Reconciled 2 pending transactions',
    transactionsProcessed: 2
  },
  {
    id: '4',
    timestamp: '2024-01-20T09:45:00Z',
    account: 'Wells Fargo - Business',
    action: 'sync_error',
    status: 'error',
    message: 'Connection timeout - retry scheduled'
  }
];

export default function MultiBankSyncPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [banks, setBanks] = useState<BankConnection[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    setAccounts(MOCK_ACCOUNTS);
    setBanks(MOCK_BANKS);
    setSyncLogs(MOCK_SYNC_LOGS);
  }, []);

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = [account.name, account.bankName, account.accountNumber]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : account.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const syncAllAccounts = async () => {
    setIsSyncing(true);
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update account sync times
    setAccounts(prev => prev.map(account => ({
      ...account,
      lastSync: new Date().toISOString(),
      status: 'connected' as const,
      transactionsCount: account.transactionsCount + Math.floor(Math.random() * 5),
      pendingTransactions: Math.floor(Math.random() * 3)
    })));
    
    // Add sync log entries
    const newLogs: SyncLog[] = accounts.map(account => ({
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toISOString(),
      account: `${account.bankName} - ${account.name}`,
      action: 'sync_complete',
      status: 'success',
      message: `Successfully synced ${Math.floor(Math.random() * 5) + 1} new transactions`,
      transactionsProcessed: Math.floor(Math.random() * 5) + 1
    }));
    
    setSyncLogs(prev => [...newLogs, ...prev]);
    toast.success('All accounts synced successfully');
    setIsSyncing(false);
  };

  const syncAccount = async (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    
    // Update account status to syncing
    setAccounts(prev => prev.map(a => 
      a.id === accountId ? { ...a, status: 'syncing' as const } : a
    ));
    
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update account after sync
    setAccounts(prev => prev.map(a => 
      a.id === accountId ? {
        ...a,
        status: 'connected' as const,
        lastSync: new Date().toISOString(),
        transactionsCount: a.transactionsCount + Math.floor(Math.random() * 3),
        pendingTransactions: Math.max(0, a.pendingTransactions - 1)
      } : a
    ));
    
    // Add sync log
    const newLog: SyncLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      account: `${account.bankName} - ${account.name}`,
      action: 'sync_complete',
      status: 'success',
      message: `Successfully synced ${Math.floor(Math.random() * 3) + 1} new transactions`,
      transactionsProcessed: Math.floor(Math.random() * 3) + 1
    };
    
    setSyncLogs(prev => [newLog, ...prev]);
    toast.success(`${account.name} synced successfully`);
  };

  const connectBank = (bankId: string) => {
    const bank = banks.find(b => b.id === bankId);
    if (!bank) return;
    
    setBanks(prev => prev.map(b => 
      b.id === bankId ? { ...b, status: 'connected' as const, lastSync: new Date().toISOString(), accountsCount: 1 } : b
    ));
    
    // Add a new account for the connected bank
    const newAccount: BankAccount = {
      id: Date.now().toString(),
      name: `${bank.bankName} Account`,
      bankName: bank.bankName,
      accountNumber: `****${Math.floor(Math.random() * 9000) + 1000}`,
      accountType: 'checking',
      balance: Math.random() * 50000,
      lastSync: new Date().toISOString(),
      status: 'connected',
      transactionsCount: 0,
      pendingTransactions: 0
    };
    
    setAccounts(prev => [...prev, newAccount]);
    toast.success(`Connected to ${bank.bankName}`);
  };

  const disconnectBank = (bankId: string) => {
    const bank = banks.find(b => b.id === bankId);
    if (!bank) return;
    
    setBanks(prev => prev.map(b => 
      b.id === bankId ? { ...b, status: 'available' as const, lastSync: undefined, accountsCount: undefined } : b
    ));
    
    setAccounts(prev => prev.filter(a => a.bankName !== bank.bankName));
    toast.success(`Disconnected from ${bank.bankName}`);
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const connectedAccounts = accounts.filter(a => a.status === 'connected').length;
  const pendingTransactions = accounts.reduce((sum, account) => sum + account.pendingTransactions, 0);
  const totalTransactions = accounts.reduce((sum, account) => sum + account.transactionsCount, 0);

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="bg-gray-50 flex">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Multi-Bank Sync</h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    Real-time bank account synchronization and reconciliation
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search accounts..." 
                      className="pl-10 bg-white rounded-lg"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={syncAllAccounts}
                    disabled={isSyncing}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync All
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* AI Status Banner */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Zap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">Real-time Bank Sync</h3>
                      <p className="text-sm text-green-700">Automated reconciliation • Live transaction updates • Multi-bank support</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Sync Active
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-blue-700">Total Balance</div>
                        <div className="text-lg font-bold text-blue-900">{currency(totalBalance)}</div>
                        <div className="text-xs text-blue-600">Across all accounts</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm text-green-700">Connected Accounts</div>
                        <div className="text-lg font-bold text-green-900">{connectedAccounts}</div>
                        <div className="text-xs text-green-600">of {accounts.length} total</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-sm text-yellow-700">Pending Transactions</div>
                        <div className="text-lg font-bold text-yellow-900">{pendingTransactions}</div>
                        <div className="text-xs text-yellow-600">Awaiting reconciliation</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Activity className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm text-purple-700">Total Transactions</div>
                        <div className="text-lg font-bold text-purple-900">{totalTransactions}</div>
                        <div className="text-xs text-purple-600">This month</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bank Connections */}
              <Card className="bg-white rounded-xl border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                    <Building className="h-5 w-5 text-[#607c47]" />
                    Bank Connections
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {banks.map((bank) => (
                      <div key={bank.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{bank.logo}</span>
                            <span className="font-medium text-[#2C2C2C]">{bank.bankName}</span>
                          </div>
                          <Badge className={
                            bank.status === 'connected' ? 'bg-green-100 text-green-800' :
                            bank.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {bank.status === 'connected' ? (
                              <Wifi className="h-3 w-3 mr-1" />
                            ) : (
                              <WifiOff className="h-3 w-3 mr-1" />
                            )}
                            {bank.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {bank.status === 'connected' && (
                            <>
                              <div className="text-sm text-gray-600">
                                Last sync: {bank.lastSync ? new Date(bank.lastSync).toLocaleString() : 'Never'}
                              </div>
                              <div className="text-sm text-gray-600">
                                Accounts: {bank.accountsCount || 0}
                              </div>
                            </>
                          )}
                          <div className="flex gap-2">
                            {bank.status === 'connected' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-700"
                                onClick={() => disconnectBank(bank.id)}
                              >
                                Disconnect
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                                onClick={() => connectBank(bank.id)}
                              >
                                Connect
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-300 text-[#2C2C2C]"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Accounts Table */}
              <Card className="bg-white rounded-xl border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-[#2C2C2C]">
                      Bank Accounts ({filteredAccounts.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] bg-white">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="connected">Connected</SelectItem>
                          <SelectItem value="syncing">Syncing</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="disconnected">Disconnected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" className="border-gray-300 text-[#2C2C2C]">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead>Bank</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Transactions</TableHead>
                          <TableHead>Pending</TableHead>
                          <TableHead>Last Sync</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAccounts.map((account) => (
                          <TableRow key={account.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <CreditCard className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-[#2C2C2C]">{account.name}</div>
                                  <div className="text-sm text-gray-600">{account.accountNumber}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-[#2C2C2C]">{account.bankName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-gray-300 text-gray-700">
                                {account.accountType}
                              </Badge>
                            </TableCell>
                            <TableCell className={`font-semibold ${account.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {currency(account.balance)}
                            </TableCell>
                            <TableCell className="text-[#2C2C2C]">{account.transactionsCount}</TableCell>
                            <TableCell>
                              {account.pendingTransactions > 0 ? (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  {account.pendingTransactions}
                                </Badge>
                              ) : (
                                <span className="text-gray-500">0</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {new Date(account.lastSync).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                account.status === 'connected' ? 'bg-green-100 text-green-800' :
                                account.status === 'syncing' ? 'bg-blue-100 text-blue-800' :
                                account.status === 'error' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {account.status === 'syncing' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                                {account.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-300 text-[#2C2C2C]"
                                  onClick={() => syncAccount(account.id)}
                                  disabled={account.status === 'syncing'}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-300 text-[#2C2C2C]"
                                >
                                  <Settings className="h-4 w-4" />
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

              {/* Sync Logs */}
              <Card className="bg-white rounded-xl border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#607c47]" />
                    Sync Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {syncLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            log.status === 'success' ? 'bg-green-100' :
                            log.status === 'error' ? 'bg-red-100' :
                            'bg-yellow-100'
                          }`}>
                            {log.status === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : log.status === 'error' ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#2C2C2C]">{log.account}</h4>
                            <p className="text-sm text-gray-600">{log.message}</p>
                            {log.transactionsProcessed && (
                              <p className="text-xs text-gray-500">
                                {log.transactionsProcessed} transactions processed
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                          <Badge className={
                            log.status === 'success' ? 'bg-green-100 text-green-800' :
                            log.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {log.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
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
