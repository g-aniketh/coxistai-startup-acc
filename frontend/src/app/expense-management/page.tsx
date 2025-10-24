'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/Badge';
import { 
  Upload,
  FileText,
  Camera,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Bot,
  Receipt,
  DollarSign,
  Calendar,
  Tag,
  User,
  Building,
  CreditCard,
  Image as ImageIcon,
  Zap,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

interface ExpenseReceipt {
  id: string;
  fileName: string;
  uploadDate: string;
  amount: number;
  merchant: string;
  category: string;
  description: string;
  status: 'processing' | 'reviewed' | 'approved' | 'rejected';
  confidence: number;
  ocrText?: string;
  imageUrl?: string;
  tags: string[];
  submittedBy: string;
  approvedBy?: string;
  notes?: string;
}

const currency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const EXPENSE_CATEGORIES = [
  'Meals & Entertainment',
  'Travel & Transportation',
  'Office Supplies',
  'Software & Subscriptions',
  'Marketing & Advertising',
  'Professional Services',
  'Utilities',
  'Equipment',
  'Training & Education',
  'Other'
];

const MOCK_RECEIPTS: ExpenseReceipt[] = [
  {
    id: '1',
    fileName: 'receipt_restaurant_001.jpg',
    uploadDate: '2024-01-20',
    amount: 45.67,
    merchant: 'Blue Moon Restaurant',
    category: 'Meals & Entertainment',
    description: 'Client dinner meeting',
    status: 'approved',
    confidence: 0.94,
    ocrText: 'Blue Moon Restaurant\n123 Main St\nDate: 01/20/2024\nTotal: ₹3,800',
    tags: ['client-meeting', 'dinner'],
    submittedBy: 'John Doe',
    approvedBy: 'Jane Smith',
    notes: 'Client acquisition dinner'
  },
  {
    id: '2',
    fileName: 'receipt_office_supplies.pdf',
    uploadDate: '2024-01-19',
    amount: 127.50,
    merchant: 'Office Depot',
    category: 'Office Supplies',
    description: 'Office supplies and stationery',
    status: 'reviewed',
    confidence: 0.87,
    ocrText: 'Office Depot\n456 Business Ave\nReceipt #12345\nTotal: ₹10,600',
    tags: ['office-supplies', 'stationery'],
    submittedBy: 'Mike Johnson',
    notes: 'Monthly office supplies order'
  },
  {
    id: '3',
    fileName: 'receipt_travel_flight.jpg',
    uploadDate: '2024-01-18',
    amount: 450.00,
    merchant: 'Delta Airlines',
    category: 'Travel & Transportation',
    description: 'Flight to client meeting',
    status: 'processing',
    confidence: 0.92,
    ocrText: 'Delta Airlines\nFlight DL1234\nFrom: NYC To: LAX\nAmount: ₹37,500',
    tags: ['travel', 'flight'],
    submittedBy: 'Sarah Wilson'
  }
];

export default function ExpenseManagementPage() {
  const [receipts, setReceipts] = useState<ExpenseReceipt[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    setReceipts(MOCK_RECEIPTS);
  }, []);

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = [receipt.fileName, receipt.merchant, receipt.description, receipt.submittedBy]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : receipt.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' ? true : receipt.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newReceipt: ExpenseReceipt = {
      id: Date.now().toString(),
      fileName: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      amount: Math.random() * 17000 + 850, // Random amount between ₹850-₹18,500
      merchant: 'Detected Merchant',
      category: 'Other',
      description: 'Auto-detected from receipt',
      status: 'processing',
      confidence: 0.75 + Math.random() * 0.2,
      ocrText: 'OCR processing completed\nMerchant: Detected Merchant\nAmount: ₹' + (Math.random() * 17000 + 850).toFixed(0),
      tags: [],
      submittedBy: 'Current User'
    };
    
    setReceipts(prev => [newReceipt, ...prev]);
    toast.success('Receipt uploaded and processed with AI OCR');
    setIsProcessing(false);
  };

  const updateReceipt = (id: string, updates: Partial<ExpenseReceipt>) => {
    setReceipts(prev => prev.map(receipt => 
      receipt.id === id ? { ...receipt, ...updates } : receipt
    ));
  };

  const approveReceipt = (id: string) => {
    updateReceipt(id, { status: 'approved', approvedBy: 'Current User' });
    toast.success('Receipt approved');
  };

  const rejectReceipt = (id: string) => {
    updateReceipt(id, { status: 'rejected' });
    toast.success('Receipt rejected');
  };

  const deleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(receipt => receipt.id !== id));
    toast.success('Receipt deleted');
  };

  const addTag = (id: string, tag: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (receipt && !receipt.tags.includes(tag)) {
      updateReceipt(id, { tags: [...receipt.tags, tag] });
    }
  };

  const removeTag = (id: string, tag: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (receipt) {
      updateReceipt(id, { tags: receipt.tags.filter(t => t !== tag) });
    }
  };

  const exportExpenses = () => {
    const csvContent = [
      'Date,Merchant,Amount,Category,Description,Status,Submitted By',
      ...receipts.map(r => `${r.uploadDate},"${r.merchant}",${r.amount},"${r.category}","${r.description}",${r.status},"${r.submittedBy}"`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Expenses exported to CSV');
  };

  const totalAmount = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const pendingAmount = receipts.filter(r => r.status === 'processing' || r.status === 'reviewed').reduce((sum, r) => sum + r.amount, 0);
  const approvedAmount = receipts.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0);
  const processingCount = receipts.filter(r => r.status === 'processing').length;

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="bg-gray-50 flex">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Expense Management</h1>
                  <p className="text-sm text-[#2C2C2C]/70">
                    AI-powered receipt processing, expense tracking, and approval workflow
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search receipts..." 
                      className="pl-10 bg-white rounded-lg"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isProcessing}
                    className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Receipt
                      </>
                    )}
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </div>
              </div>

              {/* AI Status Banner */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Bot className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-900">AI Receipt Processor</h3>
                      <p className="text-sm text-purple-700">OCR text extraction • Smart categorization • Auto-tagging</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Active Processing
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
                        <div className="text-sm text-blue-700">Total Expenses</div>
                        <div className="text-lg font-bold text-blue-900">{currency(totalAmount)}</div>
                        <div className="text-xs text-blue-600">{receipts.length} receipts</div>
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
                        <div className="text-sm text-yellow-700">Pending Approval</div>
                        <div className="text-lg font-bold text-yellow-900">{currency(pendingAmount)}</div>
                        <div className="text-xs text-yellow-600">{processingCount} processing</div>
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
                        <div className="text-sm text-green-700">Approved</div>
                        <div className="text-lg font-bold text-green-900">{currency(approvedAmount)}</div>
                        <div className="text-xs text-green-600">{receipts.filter(r => r.status === 'approved').length} receipts</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Zap className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm text-purple-700">AI Accuracy</div>
                        <div className="text-lg font-bold text-purple-900">
                          {(receipts.reduce((sum, r) => sum + r.confidence, 0) / receipts.length * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-purple-600">Average confidence</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px] bg-white">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {EXPENSE_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" className="border-gray-300 text-[#2C2C2C]" onClick={exportExpenses}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {/* Receipts Table */}
              <Card className="bg-white rounded-xl border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-[#2C2C2C]">
                    Expense Receipts ({filteredReceipts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt</TableHead>
                          <TableHead>Merchant</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>AI Confidence</TableHead>
                          <TableHead>Submitted By</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReceipts.map((receipt) => (
                          <TableRow key={receipt.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Receipt className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-[#2C2C2C]">{receipt.fileName}</div>
                                  <div className="text-sm text-gray-600">{receipt.uploadDate}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-[#2C2C2C]">{receipt.merchant}</span>
                                <span className="text-sm text-gray-600">{receipt.description}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-[#2C2C2C]">
                              {currency(receipt.amount)}
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={receipt.category} 
                                onValueChange={(value) => updateReceipt(receipt.id, { category: value })}
                              >
                                <SelectTrigger className="w-[180px] bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {EXPENSE_CATEGORIES.map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                receipt.status === 'approved' ? 'bg-green-100 text-green-800' :
                                receipt.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                receipt.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }>
                                {receipt.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {(receipt.confidence * 100).toFixed(0)}%
                                </span>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      receipt.confidence > 0.9 ? 'bg-green-500' :
                                      receipt.confidence > 0.7 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${receipt.confidence * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm text-[#2C2C2C]">{receipt.submittedBy}</span>
                                {receipt.approvedBy && (
                                  <span className="text-xs text-gray-600">Approved by: {receipt.approvedBy}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-300 text-[#2C2C2C]"
                                  onClick={() => {
                                    // Mock view receipt
                                    toast.success('Opening receipt viewer...');
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {receipt.status === 'reviewed' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-green-300 text-green-700"
                                      onClick={() => approveReceipt(receipt.id)}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-red-300 text-red-700"
                                      onClick={() => rejectReceipt(receipt.id)}
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-300 text-[#2C2C2C]"
                                  onClick={() => {
                                    // Mock edit receipt
                                    toast.success('Opening receipt editor...');
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                  onClick={() => deleteReceipt(receipt.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
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

              {/* OCR Processing Demo */}
              <Card className="bg-white rounded-xl border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                    <Bot className="h-5 w-5 text-[#607c47]" />
                    AI OCR Processing Demo
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-[#2C2C2C]">Upload Receipt</h4>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Drag & drop receipt images or PDFs here</p>
                        <Button 
                          onClick={() => document.getElementById('demo-upload')?.click()}
                          className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Choose File
                        </Button>
                        <input
                          id="demo-upload"
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-[#2C2C2C]">AI Processing Features</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-[#2C2C2C]">OCR Text Extraction</div>
                            <div className="text-sm text-gray-600">Extract text from receipts automatically</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Tag className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-[#2C2C2C]">Smart Categorization</div>
                            <div className="text-sm text-gray-600">AI suggests expense categories</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <DollarSign className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium text-[#2C2C2C]">Amount Detection</div>
                            <div className="text-sm text-gray-600">Automatically detect totals and taxes</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Building className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-medium text-[#2C2C2C]">Merchant Recognition</div>
                            <div className="text-sm text-gray-600">Identify merchant names and locations</div>
                          </div>
                        </div>
                      </div>
                    </div>
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
