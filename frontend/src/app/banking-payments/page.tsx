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
  CreditCard,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
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
  Zap,
  FileText,
  Calendar,
  User as UserIcon,
  Send,
  Mail,
  Eye,
  Edit,
  Trash2,
  X,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { pdf } from '@react-pdf/renderer';

// Multi-Bank Sync interfaces
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
  status: 'available' | 'connected' | 'maintenance';
  lastConnected?: string;
  accountsCount: number;
}

// Smart Invoicing interfaces
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  status: "Draft" | "Sent" | "Overdue" | "Paid" | "Partially Paid";
  items: InvoiceItem[];
  notes?: string;
  total: number;
  balanceDue: number;
  reminders: number;
}

export default function BankingPaymentsHubPage() {
  const [activeTab, setActiveTab] = useState<'banking' | 'invoicing'>('banking');
  
  // Banking state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankConnections, setBankConnections] = useState<BankConnection[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Invoicing state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showInvoiceView, setShowInvoiceView] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    clientName: '',
    clientEmail: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ id: '1', description: '', quantity: 1, unitPrice: 0 }],
    notes: '',
    total: 0,
    balanceDue: 0,
    reminders: 0
  });

  // Initialize mock data
  useEffect(() => {
    // Banking mock data
    setBankAccounts([
      {
        id: '1',
        name: 'Business Checking',
        bankName: 'Chase Bank',
        accountNumber: '****1234',
        accountType: 'checking',
        balance: 287500,
        lastSync: '2024-01-20T10:30:00Z',
        status: 'connected',
        transactionsCount: 45,
        pendingTransactions: 2
      },
      {
        id: '2',
        name: 'Business Savings',
        bankName: 'Wells Fargo',
        accountNumber: '****5678',
        accountType: 'savings',
        balance: 125000,
        lastSync: '2024-01-20T09:15:00Z',
        status: 'connected',
        transactionsCount: 12,
        pendingTransactions: 0
      },
      {
        id: '3',
        name: 'Business Credit Card',
        bankName: 'American Express',
        accountNumber: '****9012',
        accountType: 'credit',
        balance: -8500,
        lastSync: '2024-01-19T16:45:00Z',
        status: 'syncing',
        transactionsCount: 23,
        pendingTransactions: 5
      }
    ]);

    setBankConnections([
      {
        id: '1',
        bankName: 'Chase Bank',
        logo: '/chase-logo.png',
        status: 'connected',
        lastConnected: '2024-01-20T10:30:00Z',
        accountsCount: 2
      },
      {
        id: '2',
        bankName: 'Wells Fargo',
        logo: '/wells-fargo-logo.png',
        status: 'connected',
        lastConnected: '2024-01-20T09:15:00Z',
        accountsCount: 1
      },
      {
        id: '3',
        bankName: 'Bank of America',
        logo: '/boa-logo.png',
        status: 'available',
        accountsCount: 0
      },
      {
        id: '4',
        bankName: 'American Express',
        logo: '/amex-logo.png',
        status: 'connected',
        lastConnected: '2024-01-19T16:45:00Z',
        accountsCount: 1
      }
    ]);

    // Invoicing mock data
    setInvoices([
      {
        id: '1',
        number: 'INV-2024-001',
        clientName: 'ABC Corporation',
        clientEmail: 'billing@abccorp.com',
        issueDate: '2024-01-15',
        dueDate: '2024-02-15',
        status: 'Sent',
        items: [
          { id: '1', description: 'Software Development Services', quantity: 40, unitPrice: 150 },
          { id: '2', description: 'Project Management', quantity: 20, unitPrice: 100 }
        ],
        notes: 'Payment due within 30 days',
        total: 8000,
        balanceDue: 8000,
        reminders: 1
      },
      {
        id: '2',
        number: 'INV-2024-002',
        clientName: 'XYZ Tech Solutions',
        clientEmail: 'accounts@xyztech.com',
        issueDate: '2024-01-10',
        dueDate: '2024-02-10',
        status: 'Overdue',
        items: [
          { id: '1', description: 'Consulting Services', quantity: 25, unitPrice: 200 }
        ],
        notes: 'Urgent payment required',
        total: 5000,
        balanceDue: 5000,
        reminders: 3
      },
      {
        id: '3',
        number: 'INV-2024-003',
        clientName: 'Global Enterprises',
        clientEmail: 'finance@globalent.com',
        issueDate: '2024-01-05',
        dueDate: '2024-02-05',
        status: 'Paid',
        items: [
          { id: '1', description: 'System Integration', quantity: 60, unitPrice: 120 }
        ],
        notes: 'Thank you for your business',
        total: 7200,
        balanceDue: 0,
        reminders: 0
      }
    ]);
  }, []);

  // Banking functions
  const handleSyncAll = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setBankAccounts(prev => prev.map(account => ({
      ...account,
      status: 'connected' as const,
      lastSync: new Date().toISOString(),
      pendingTransactions: 0
    })));
    
    toast.success('All accounts synced successfully!');
    setIsSyncing(false);
  };

  const handleSyncAccount = async (accountId: string) => {
    setBankAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, status: 'syncing' as const }
        : account
    ));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setBankAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { 
            ...account, 
            status: 'connected' as const,
            lastSync: new Date().toISOString(),
            pendingTransactions: 0
          }
        : account
    ));
    
    toast.success('Account synced successfully!');
  };

  const connectBank = async (bankId: string) => {
    const bank = bankConnections.find(b => b.id === bankId);
    if (!bank) return;
    
    setBankConnections(prev => prev.map(b => 
      b.id === bankId 
        ? { ...b, status: 'connected' as const, lastConnected: new Date().toISOString() }
        : b
    ));
    
    toast.success(`Connected to ${bank.bankName} successfully!`);
  };

  // Invoicing functions
  const handleCreateInvoice = async () => {
    if (!newInvoice.clientName || !newInvoice.clientEmail) {
      toast.error('Please fill in client details');
      return;
    }

    const total = newInvoice.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
    const invoiceNumber = `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`;
    
    const invoice: Invoice = {
      id: Date.now().toString(),
      number: invoiceNumber,
      clientName: newInvoice.clientName,
      clientEmail: newInvoice.clientEmail,
      issueDate: newInvoice.issueDate || new Date().toISOString().split('T')[0],
      dueDate: newInvoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Draft',
      items: newInvoice.items || [],
      notes: newInvoice.notes,
      total,
      balanceDue: total,
      reminders: 0
    };

    setInvoices(prev => [invoice, ...prev]);
    setShowCreateInvoice(false);
    setNewInvoice({
      clientName: '',
      clientEmail: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ id: '1', description: '', quantity: 1, unitPrice: 0 }],
      notes: '',
      total: 0,
      balanceDue: 0,
      reminders: 0
    });
    
    toast.success('Invoice created successfully!');
  };

  const sendInvoice = async (invoiceId: string) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, status: 'Sent' as const }
        : invoice
    ));
    
    toast.success('Invoice sent successfully!');
  };

  const sendReminder = async (invoiceId: string) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, reminders: invoice.reminders + 1 }
        : invoice
    ));
    
    toast.success('Payment reminder sent!');
  };

  const generateInvoicePDF = async (invoice: Invoice) => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-generation' });
      
      // Create PDF using jsPDF directly without html2canvas
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      
      // Helper function to add text with automatic line breaks
      const addText = (text: string, x: number, y: number, options: any = {}) => {
        const maxWidth = pageWidth - x - 20;
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return y + (lines.length * (options.fontSize || 12) * 0.35);
      };
      
      // Set font
      pdf.setFont('helvetica');
      
      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(31, 41, 55); // #1f2937
      pdf.text('Coxist AI CFO', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.setTextColor(107, 114, 128); // #6b7280
      pdf.text('AI-Powered Financial Management', 20, yPosition);
      yPosition += 5;
      pdf.text('123 Business Street, Suite 100', 20, yPosition);
      yPosition += 5;
      pdf.text('San Francisco, CA 94105', 20, yPosition);
      yPosition += 15;
      
      // Invoice title and details (right side)
      pdf.setFontSize(20);
      pdf.setTextColor(31, 41, 55);
      pdf.text('INVOICE', pageWidth - 20, 20, { align: 'right' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Invoice #: ${invoice.number}`, pageWidth - 20, 30, { align: 'right' });
      pdf.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, pageWidth - 20, 35, { align: 'right' });
      pdf.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, pageWidth - 20, 40, { align: 'right' });
      
      yPosition = 50;
      
      // Bill To section
      pdf.setFontSize(14);
      pdf.setTextColor(31, 41, 55);
      pdf.text('Bill To:', 20, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(12);
      pdf.setTextColor(31, 41, 55);
      pdf.text(invoice.clientName, 20, yPosition);
      yPosition += 5;
      pdf.setTextColor(107, 114, 128);
      pdf.text(invoice.clientEmail, 20, yPosition);
      yPosition += 15;
      
      // Status badge (simplified)
      pdf.setFontSize(10);
      pdf.setTextColor(31, 41, 55);
      pdf.text(`Status: ${invoice.status}`, pageWidth - 20, yPosition - 10, { align: 'right' });
      
      // Items table header
      pdf.setFontSize(12);
      pdf.setTextColor(31, 41, 55);
      pdf.text('Items', 20, yPosition);
      yPosition += 10;
      
      // Table headers
      pdf.setFontSize(10);
      pdf.setTextColor(31, 41, 55);
      pdf.text('Description', 20, yPosition);
      pdf.text('Qty', 120, yPosition);
      pdf.text('Unit Price', 140, yPosition);
      pdf.text('Total', 170, yPosition);
      yPosition += 5;
      
      // Draw line under headers
      pdf.setDrawColor(229, 231, 235); // #e5e7eb
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 5;
      
      // Table rows
      invoice.items.forEach((item) => {
        pdf.setFontSize(9);
        pdf.setTextColor(31, 41, 55);
        
        // Description (with word wrap)
        const descLines = pdf.splitTextToSize(item.description, 90);
        pdf.text(descLines, 20, yPosition);
        
        // Quantity
        pdf.text(item.quantity.toString(), 120, yPosition);
        
        // Unit Price
        pdf.text(`$${item.unitPrice.toFixed(2)}`, 140, yPosition);
        
        // Total
        pdf.text(`$${(item.quantity * item.unitPrice).toFixed(2)}`, 170, yPosition);
        
        yPosition += Math.max(descLines.length * 4, 8);
        
        // Draw line under row
        pdf.setDrawColor(243, 244, 246); // #f3f4f6
        pdf.line(20, yPosition - 2, pageWidth - 20, yPosition - 2);
        yPosition += 3;
      });
      
      yPosition += 10;
      
      // Totals section
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Subtotal:', pageWidth - 80, yPosition);
      pdf.setTextColor(31, 41, 55);
      pdf.text(`$${invoice.total.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 5;
      
      pdf.setTextColor(107, 114, 128);
      pdf.text('Tax (0%):', pageWidth - 80, yPosition);
      pdf.setTextColor(31, 41, 55);
      pdf.text('$0.00', pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 5;
      
      // Draw line above total
      pdf.setDrawColor(229, 231, 235);
      pdf.line(pageWidth - 80, yPosition, pageWidth - 20, yPosition);
      yPosition += 5;
      
      pdf.setFontSize(12);
      pdf.setTextColor(31, 41, 55);
      pdf.text('Total:', pageWidth - 80, yPosition);
      pdf.text(`$${invoice.total.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 5;
      
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Balance Due:', pageWidth - 80, yPosition);
      pdf.setTextColor(invoice.balanceDue > 0 ? 220 : 5, invoice.balanceDue > 0 ? 38 : 150, invoice.balanceDue > 0 ? 38 : 105);
      pdf.text(`$${invoice.balanceDue.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 20;
      
      // Notes section
      if (invoice.notes) {
        pdf.setFontSize(12);
        pdf.setTextColor(31, 41, 55);
        pdf.text('Notes:', 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setTextColor(107, 114, 128);
        const notesLines = pdf.splitTextToSize(invoice.notes, pageWidth - 40);
        pdf.text(notesLines, 20, yPosition);
        yPosition += notesLines.length * 5 + 10;
      }
      
      // Payment Information
      pdf.setFontSize(12);
      pdf.setTextColor(30, 64, 175); // #1e40af
      pdf.text('Payment Information', 20, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setTextColor(30, 64, 175);
      pdf.text('Bank Transfer:', 20, yPosition);
      yPosition += 5;
      pdf.setTextColor(29, 78, 216); // #1d4ed8
      pdf.text('Account: ****1234', 20, yPosition);
      yPosition += 4;
      pdf.text('Routing: 123456789', 20, yPosition);
      yPosition += 10;
      
      pdf.setTextColor(30, 64, 175);
      pdf.text('Online Payment:', 20, yPosition);
      yPosition += 5;
      pdf.setTextColor(29, 78, 216);
      pdf.text('Pay securely via our portal', 20, yPosition);
      yPosition += 4;
      pdf.text(`Reference: ${invoice.number}`, 20, yPosition);
      yPosition += 20;
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      pdf.text('Generated by Coxist AI CFO - AI-Powered Financial Management', pageWidth / 2, yPosition, { align: 'center' });
      
      // Download PDF
      pdf.save(`invoice-${invoice.number}.pdf`);
      
      toast.success('PDF generated successfully!', { id: 'pdf-generation' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.', { id: 'pdf-generation' });
    }
  };

  const viewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceView(true);
  };

  const addInvoiceItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const updateInvoiceItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items?.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeInvoiceItem = (itemId: string) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.id !== itemId)
    }));
  };

  // Filtered data
  const filteredAccounts = bankAccounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.bankName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
                         invoice.number.toLowerCase().includes(invoiceSearchTerm.toLowerCase());
    const matchesStatus = invoiceStatusFilter === 'all' || invoice.status === invoiceStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Sent': return 'bg-blue-100 text-blue-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Partially Paid': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'disconnected': return <WifiOff className="h-4 w-4" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="bg-gray-50 flex">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C] flex items-center gap-2">
                    <CreditCard className="h-8 w-8 text-[#607c47]" />
                    Banking & Payments
                  </h1>
                  <p className="text-sm text-[#2C2C2C]/70 mt-1">
                    Multi-bank synchronization and intelligent invoicing system
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button className="bg-[#607c47] hover:bg-[#4a6129] text-white">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Shield className="h-4 w-4 mr-2" />
                    Security
                  </Button>
                </div>
              </div>

              {/* AI Status Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">AI Banking Assistant</h3>
                      <p className="text-sm text-blue-700">Real-time sync • Smart invoicing • Payment tracking</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live Sync
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200">
                <Button
                  onClick={() => setActiveTab('banking')}
                  variant={activeTab === 'banking' ? 'default' : 'ghost'}
                  className={activeTab === 'banking' ? 'bg-[#607c47] hover:bg-[#4a6129] text-white' : 'text-[#2C2C2C] hover:bg-gray-100'}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Multi-Bank Sync
                </Button>
                <Button
                  onClick={() => setActiveTab('invoicing')}
                  variant={activeTab === 'invoicing' ? 'default' : 'ghost'}
                  className={activeTab === 'invoicing' ? 'bg-[#607c47] hover:bg-[#4a6129] text-white' : 'text-[#2C2C2C] hover:bg-gray-100'}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Smart Invoicing
                </Button>
              </div>

              {/* Banking Tab */}
              {activeTab === 'banking' && (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Building className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm text-blue-700">Connected Banks</div>
                            <div className="text-lg font-bold text-blue-900">
                              {bankConnections.filter(b => b.status === 'connected').length}
                            </div>
                            <div className="text-xs text-blue-600">Active connections</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm text-green-700">Synced Accounts</div>
                            <div className="text-lg font-bold text-green-900">
                              {bankAccounts.filter(a => a.status === 'connected').length}
                            </div>
                            <div className="text-xs text-green-600">Out of {bankAccounts.length}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Clock className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <div className="text-sm text-orange-700">Pending Transactions</div>
                            <div className="text-lg font-bold text-orange-900">
                              {bankAccounts.reduce((sum, a) => sum + a.pendingTransactions, 0)}
                            </div>
                            <div className="text-xs text-orange-600">Awaiting sync</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <DollarSign className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm text-purple-700">Total Balance</div>
                            <div className="text-lg font-bold text-purple-900">
                              {formatCurrency(bankAccounts.reduce((sum, a) => sum + a.balance, 0))}
                            </div>
                            <div className="text-xs text-purple-600">All accounts</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Bank Connections */}
                  <Card className="bg-white rounded-xl border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium text-[#2C2C2C]">
                          Bank Connections
                        </CardTitle>
                        <Button
                          onClick={handleSyncAll}
                          disabled={isSyncing}
                          className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                        >
                          {isSyncing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bankConnections.map((bank) => (
                          <div key={bank.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Building className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-[#2C2C2C]">{bank.bankName}</h4>
                                  <p className="text-sm text-gray-600">{bank.accountsCount} accounts</p>
                                </div>
                              </div>
                              <Badge 
                                className={`${getStatusColor(bank.status)}`}
                                style={{ color: '#1f2937' }}
                              >
                                {getStatusIcon(bank.status)}
                                <span className="ml-1">{bank.status}</span>
                              </Badge>
                            </div>
                            
                            {bank.status === 'connected' && bank.lastConnected && (
                              <p className="text-xs text-gray-500 mb-3">
                                Last connected: {new Date(bank.lastConnected).toLocaleDateString()}
                              </p>
                            )}
                            
                            <div className="flex gap-2">
                              {bank.status === 'available' ? (
                                <Button
                                  onClick={() => connectBank(bank.id)}
                                  className="flex-1 bg-[#607c47] hover:bg-[#4a6129] text-white"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Connect
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  className="flex-1 border-gray-300 text-[#2C2C2C]"
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Manage
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account List */}
                  <Card className="bg-white rounded-xl border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium text-[#2C2C2C]">
                          Bank Accounts ({filteredAccounts.length})
                        </CardTitle>
                        <div className="flex gap-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search accounts..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10 bg-white w-64"
                            />
                          </div>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="connected">Connected</SelectItem>
                              <SelectItem value="disconnected">Disconnected</SelectItem>
                              <SelectItem value="syncing">Syncing</SelectItem>
                              <SelectItem value="error">Error</SelectItem>
                            </SelectContent>
                          </Select>
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
                              <TableHead>Status</TableHead>
                              <TableHead>Last Sync</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAccounts.map((account) => (
                              <TableRow key={account.id} className="hover:bg-gray-50">
                                <TableCell>
                                  <div>
                                    <div className="font-medium text-[#2C2C2C]">{account.name}</div>
                                    <div className="text-sm text-gray-600">{account.accountNumber}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-[#2C2C2C]">
                                  {account.bankName}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                                    {account.accountType}
                                  </Badge>
                                </TableCell>
                                <TableCell className={`font-semibold ${
                                  account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(account.balance)}
                                </TableCell>
                                <TableCell className="text-[#2C2C2C]">
                                  <div className="text-sm">
                                    <div>{account.transactionsCount} total</div>
                                    {account.pendingTransactions > 0 && (
                                      <div className="text-orange-600">{account.pendingTransactions} pending</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    className={`${getStatusColor(account.status)}`}
                                    style={{ color: '#1f2937' }}
                                  >
                                    {getStatusIcon(account.status)}
                                    <span className="ml-1">{account.status}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-[#2C2C2C]">
                                  {new Date(account.lastSync).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSyncAccount(account.id)}
                                      disabled={account.status === 'syncing'}
                                      className="border-gray-300 text-[#2C2C2C]"
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" className="border-gray-300 text-[#2C2C2C]">
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
                </div>
              )}

              {/* Invoicing Tab */}
              {activeTab === 'invoicing' && (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm text-blue-700">Total Invoices</div>
                            <div className="text-lg font-bold text-blue-900">
                              {invoices.length}
                            </div>
                            <div className="text-xs text-blue-600">All time</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm text-green-700">Total Revenue</div>
                            <div className="text-lg font-bold text-green-900">
                              {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total, 0))}
                            </div>
                            <div className="text-xs text-green-600">All invoices</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <div className="text-sm text-orange-700">Overdue</div>
                            <div className="text-lg font-bold text-orange-900">
                              {invoices.filter(inv => inv.status === 'Overdue').length}
                            </div>
                            <div className="text-xs text-orange-600">Requires attention</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Mail className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm text-purple-700">AI Reminders</div>
                            <div className="text-lg font-bold text-purple-900">
                              {invoices.reduce((sum, inv) => sum + inv.reminders, 0)}
                            </div>
                            <div className="text-xs text-purple-600">Sent this month</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Create Invoice Modal */}
                  {showCreateInvoice && (
                    <Card className="bg-white rounded-xl border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium text-[#2C2C2C] flex items-center gap-2">
                          <Plus className="h-5 w-5 text-[#607c47]" />
                          Create New Invoice
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-[#2C2C2C]">Client Name</label>
                              <Input
                                value={newInvoice.clientName}
                                onChange={(e) => setNewInvoice(prev => ({ ...prev, clientName: e.target.value }))}
                                className="mt-1"
                                placeholder="Enter client name"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#2C2C2C]">Client Email</label>
                              <Input
                                value={newInvoice.clientEmail}
                                onChange={(e) => setNewInvoice(prev => ({ ...prev, clientEmail: e.target.value }))}
                                className="mt-1"
                                placeholder="Enter client email"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-[#2C2C2C]">Issue Date</label>
                              <Input
                                type="date"
                                value={newInvoice.issueDate}
                                onChange={(e) => setNewInvoice(prev => ({ ...prev, issueDate: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#2C2C2C]">Due Date</label>
                              <Input
                                type="date"
                                value={newInvoice.dueDate}
                                onChange={(e) => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-[#2C2C2C]">Invoice Items</label>
                            <div className="space-y-2 mt-2">
                              {newInvoice.items?.map((item, index) => (
                                <div key={item.id} className="flex gap-2 items-end">
                                  <div className="flex-1">
                                    <Input
                                      value={item.description}
                                      onChange={(e) => updateInvoiceItem(item.id, 'description', e.target.value)}
                                      placeholder="Item description"
                                    />
                                  </div>
                                  <div className="w-24">
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => updateInvoiceItem(item.id, 'quantity', Number(e.target.value))}
                                      placeholder="Qty"
                                    />
                                  </div>
                                  <div className="w-32">
                                    <Input
                                      type="number"
                                      value={item.unitPrice}
                                      onChange={(e) => updateInvoiceItem(item.id, 'unitPrice', Number(e.target.value))}
                                      placeholder="Unit Price"
                                    />
                                  </div>
                                  <div className="w-20">
                                    <span className="text-sm font-medium">
                                      {formatCurrency(item.quantity * item.unitPrice)}
                                    </span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeInvoiceItem(item.id)}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              onClick={addInvoiceItem}
                              className="mt-2 border-gray-300 text-[#2C2C2C]"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Item
                            </Button>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-[#2C2C2C]">Notes</label>
                            <Textarea
                              value={newInvoice.notes}
                              onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                              className="mt-1"
                              placeholder="Additional notes..."
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={handleCreateInvoice}
                              className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Create Invoice
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowCreateInvoice(false)}
                              className="border-gray-300 text-[#2C2C2C]"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Invoice List */}
                  <Card className="bg-white rounded-xl border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium text-[#2C2C2C]">
                          Invoices ({filteredInvoices.length})
                        </CardTitle>
                        <div className="flex gap-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search invoices..."
                              value={invoiceSearchTerm}
                              onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                              className="pl-10 bg-white w-64"
                            />
                          </div>
                          <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="Draft">Draft</SelectItem>
                              <SelectItem value="Sent">Sent</SelectItem>
                              <SelectItem value="Overdue">Overdue</SelectItem>
                              <SelectItem value="Paid">Paid</SelectItem>
                              <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => setShowCreateInvoice(true)}
                            className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            New Invoice
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead>Issue Date</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Balance Due</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Reminders</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredInvoices.map((invoice) => (
                              <TableRow key={invoice.id} className="hover:bg-gray-50">
                                <TableCell>
                                  <div>
                                    <div className="font-medium text-[#2C2C2C]">{invoice.number}</div>
                                    <div className="text-sm text-gray-600">{invoice.items.length} items</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium text-[#2C2C2C]">{invoice.clientName}</div>
                                    <div className="text-sm text-gray-600">{invoice.clientEmail}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-[#2C2C2C]">
                                  {new Date(invoice.issueDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-[#2C2C2C]">
                                  {new Date(invoice.dueDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="font-semibold text-[#2C2C2C]">
                                  {formatCurrency(invoice.total)}
                                </TableCell>
                                <TableCell className={`font-semibold ${
                                  invoice.balanceDue > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {formatCurrency(invoice.balanceDue)}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    className={`${getStatusColor(invoice.status)}`}
                                    style={{ color: '#1f2937' }}
                                  >
                                    {invoice.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-[#2C2C2C]">
                                  {invoice.reminders}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => viewInvoice(invoice)}
                                      className="border-gray-300 text-[#2C2C2C] hover:bg-gray-50"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" className="border-gray-300 text-[#2C2C2C]">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    {invoice.status === 'Draft' && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => sendInvoice(invoice.id)}
                                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                      >
                                        <Send className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {(invoice.status === 'Sent' || invoice.status === 'Overdue') && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => sendReminder(invoice.id)}
                                        className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                      >
                                        <Mail className="h-4 w-4" />
                                      </Button>
                                    )}
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
              )}
            </div>
          </div>
        </div>

        {/* Invoice View Dialog */}
        <Dialog open={showInvoiceView} onOpenChange={setShowInvoiceView}>
          <DialogContent className="!max-w-50vw] !w-[40vw] max-h-[80vh] overflow-y-auto bg-white border border-gray-200 shadow-xl" style={{ maxWidth: '95vw', width: '95vw' }}>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold text-[#2C2C2C]">
                  Invoice Details
                </DialogTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInvoiceView(false)}
                  className="border-gray-300 text-[#2C2C2C]"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="space-y-4 pb-4">
                {/* Invoice Header */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-semibold text-[#2C2C2C] mb-3">Coxist AI CFO</h3>
                      <p className="text-sm text-gray-600 mb-1">AI-Powered Financial Management</p>
                      <p className="text-sm text-gray-600 mb-1">123 Business Street, Suite 100</p>
                      <p className="text-sm text-gray-600">San Francisco, CA 94105</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-bold text-[#2C2C2C] mb-3">INVOICE</h2>
                      <p className="text-sm text-gray-600 mb-1">Invoice #: {selectedInvoice.number}</p>
                      <p className="text-sm text-gray-600 mb-1">Issue Date: {new Date(selectedInvoice.issueDate).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Client Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#2C2C2C] mb-4">Bill To:</h3>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div>
                      <p className="font-medium text-[#2C2C2C] text-lg">{selectedInvoice.clientName}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedInvoice.clientEmail}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        className={`${getStatusColor(selectedInvoice.status)} px-4 py-2 text-sm font-medium`}
                        style={{ color: '#1f2937' }}
                      >
                        {selectedInvoice.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#2C2C2C] mb-4">Items</h3>
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[#2C2C2C] min-w-[400px] font-semibold">Description</TableHead>
                        <TableHead className="text-[#2C2C2C] w-32 font-semibold">Quantity</TableHead>
                        <TableHead className="text-[#2C2C2C] w-40 font-semibold">Unit Price</TableHead>
                        <TableHead className="text-[#2C2C2C] w-40 font-semibold">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-[#2C2C2C] py-4">{item.description}</TableCell>
                          <TableCell className="text-[#2C2C2C] py-4">{item.quantity}</TableCell>
                          <TableCell className="text-[#2C2C2C] py-4">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-[#2C2C2C] font-semibold py-4">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Invoice Totals */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-end">
                    <div className="w-96 space-y-3">
                      <div className="flex justify-between text-base">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-[#2C2C2C] font-medium">{formatCurrency(selectedInvoice.total)}</span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-gray-600">Tax (0%):</span>
                        <span className="text-[#2C2C2C] font-medium">$0.00</span>
                      </div>
                      <div className="border-t border-gray-300 pt-3">
                        <div className="flex justify-between font-bold text-lg">
                          <span className="text-[#2C2C2C]">Total:</span>
                          <span className="text-[#2C2C2C]">{formatCurrency(selectedInvoice.total)}</span>
                        </div>
                        <div className="flex justify-between text-base mt-2">
                          <span className="text-gray-600">Balance Due:</span>
                          <span className={`font-bold ${
                            selectedInvoice.balanceDue > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(selectedInvoice.balanceDue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#2C2C2C] mb-3">Notes</h3>
                    <p className="text-gray-600 text-base">{selectedInvoice.notes}</p>
                  </div>
                )}

                {/* Payment Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Payment Information</h3>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-base">
                    <div>
                      <p className="text-blue-800 font-semibold mb-2">Bank Transfer:</p>
                      <p className="text-blue-700 mb-1">Account: ****1234</p>
                      <p className="text-blue-700">Routing: 123456789</p>
                    </div>
                    <div>
                      <p className="text-blue-800 font-semibold mb-2">Online Payment:</p>
                      <p className="text-blue-700 mb-1">Pay securely via our portal</p>
                      <p className="text-blue-700">Reference: {selectedInvoice.number}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setShowInvoiceView(false)}
                    className="border-gray-300 text-[#2C2C2C] px-6 py-2"
                  >
                    Close
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    onClick={() => generateInvoicePDF(selectedInvoice)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  {selectedInvoice.status === 'Draft' && (
                    <Button
                      onClick={() => {
                        sendInvoice(selectedInvoice.id);
                        setShowInvoiceView(false);
                      }}
                      className="bg-[#607c47] hover:bg-[#4a6129] text-white px-6 py-2"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Invoice
                    </Button>
                  )}
                  {(selectedInvoice.status === 'Sent' || selectedInvoice.status === 'Overdue') && (
                    <Button
                      onClick={() => {
                        sendReminder(selectedInvoice.id);
                        setShowInvoiceView(false);
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Reminder
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </MainLayout>
    </AuthGuard>
  );
}
