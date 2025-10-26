'use client';

import { useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Eye,
  X,
  Loader,
  BarChart3,
  DollarSign,
  Users,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { parseTallyExcel, generateTallySampleTemplate, TallyImportData } from '@/lib/excel-parser';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';

type ImportStep = 'upload' | 'preview' | 'confirm' | 'processing' | 'complete';

export default function TallyImportPage() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [importData, setImportData] = useState<TallyImportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedLedgerIndex, setSelectedLedgerIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    ledgers: true,
    parties: true,
    summary: true,
  });

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast.error('Please upload an Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const data = await parseTallyExcel(file);
      
      if (data.errors.length > 0) {
        toast.error(`Import errors found: ${data.errors[0]}`);
        return;
      }

      setImportData(data);
      
      if (data.warnings.length > 0) {
        toast.success(`File parsed! Found ${data.warnings.length} warning(s)`, {
          duration: 4000,
        });
      } else {
        toast.success('File parsed successfully!');
      }

      setStep('preview');
    } catch (error) {
      toast.error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Parse error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const downloadSampleTemplate = () => {
    try {
      const wb = generateTallySampleTemplate();
      XLSX.writeFile(wb, 'Tally_Import_Template.xlsx');
      toast.success('Sample template downloaded!');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const handleImport = async () => {
    if (!importData) return;

    setStep('processing');
    setImportProgress(0);

    try {
      // Simulate processing
      for (let i = 0; i <= 100; i += 10) {
        setImportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Call API endpoint to save the data
      const response = await apiClient.import.tally(importData);

      setStep('complete');
      toast.success('Data imported successfully! Your dashboard will now reflect the new records.');
    } catch (error) {
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStep('preview');
    }
  };

  const resetImport = () => {
    setStep('upload');
    setFileName('');
    setImportData(null);
    setImportProgress(0);
    setSelectedLedgerIndex(0);
  };

  // Render different steps
  if (step === 'upload') {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto bg-white min-h-screen">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Upload className="h-8 w-8 text-blue-600" />
                Import from Tally
              </h1>
              <p className="text-gray-700">
                Migrate your Tally financial records to Coxist AI. Your data will be seamlessly integrated into your dashboard.
              </p>
            </div>

            {/* Upload Area */}
            <Card className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg overflow-hidden">
              <div
                className={`p-12 text-center cursor-pointer transition-all ${
                  dragActive ? 'bg-blue-100 border-4 border-blue-500' : ''
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <FileText className="h-12 w-12 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Drop your Tally Excel file here</h3>
                    <p className="text-gray-700 mt-1">or click to browse your computer</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <label>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleInputChange}
                        className="hidden"
                        disabled={isLoading}
                      />
                      <Button 
                        asChild 
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading}
                      >
                        <span className="cursor-pointer">
                          {isLoading ? (
                            <>
                              <Loader className="h-4 w-4 animate-spin mr-2" />
                              Parsing...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Select File
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                  <p className="text-sm text-gray-700">Supported formats: .xlsx, .xls, .csv</p>
                </div>
              </div>
            </Card>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-0">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">What will be imported?</p>
                      <p className="text-sm text-gray-700 mt-1">Ledgers, parties, opening balances, and all transactions.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-0">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Your data is safe</p>
                      <p className="text-sm text-gray-700 mt-1">All transactions are verified and balanced before import.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-0">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Instant dashboards</p>
                      <p className="text-sm text-gray-700 mt-1">See your financial metrics immediately after import.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sample Template */}
            <Card className="border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Need a sample template?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-800">Download our sample Tally import template to see the required format and example data.</p>
                <Button 
                  onClick={downloadSampleTemplate}
                  className="bg-gray-800 hover:bg-gray-900"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Sample Template
                </Button>
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  How to export from Tally
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-900">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Open your Tally account</li>
                  <li>Go to Reports → Ledgers (or Party Ledgers)</li>
                  <li>Select the period and accounts you want to export</li>
                  <li>Click Export → Excel Format</li>
                  <li>Upload the file here</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  if (step === 'preview' && importData) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto bg-white min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Eye className="h-8 w-8 text-blue-600" />
                  Review Import Data
                </h1>
                <p className="text-gray-600 mt-1">File: {fileName}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={resetImport}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Ledgers</p>
                    <p className="text-2xl font-bold text-gray-900">{importData.summary.totalLedgers}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Parties</p>
                    <p className="text-2xl font-bold text-gray-900">{importData.summary.totalParties}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <BarChart3 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{importData.summary.totalTransactions}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <DollarSign className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(importData.summary.totalDebit)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Warnings and Errors */}
            {importData.errors.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-900">
                    <AlertCircle className="h-5 w-5" />
                    Errors Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {importData.errors.map((error, idx) => (
                      <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                        <span className="mt-1">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {importData.warnings.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="h-5 w-5" />
                    Warnings ({importData.warnings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {importData.warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                        <span className="mt-1">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Ledgers Preview */}
            {importData.ledgers.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedSections(prev => ({ ...prev, ledgers: !prev.ledgers }))}>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Ledgers ({importData.ledgers.length})
                    </CardTitle>
                    <Badge variant="outline">{expandedSections.ledgers ? 'Hide' : 'Show'}</Badge>
                  </div>
                </CardHeader>
                {expandedSections.ledgers && (
                  <CardContent>
                    <div className="space-y-2">
                      {importData.ledgers.map((ledger, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 transition">
                          <div>
                            <p className="font-semibold text-gray-900">{ledger.ledgerName}</p>
                            <p className="text-sm text-gray-600">{ledger.accountGroup || 'No group'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatCurrency(ledger.openingBalance)}</p>
                            <p className="text-xs text-gray-600">{ledger.openingType}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Parties Preview */}
            {importData.parties.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedSections(prev => ({ ...prev, parties: !prev.parties }))}>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Parties ({importData.parties.length})
                    </CardTitle>
                    <Badge variant="outline">{expandedSections.parties ? 'Hide' : 'Show'}</Badge>
                  </div>
                </CardHeader>
                {expandedSections.parties && (
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Party Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Opening Balance</TableHead>
                            <TableHead>Balance Type</TableHead>
                            <TableHead>Email</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importData.parties.map((party, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-semibold">{party.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{party.type}</Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(party.openingBalance)}</TableCell>
                              <TableCell>
                                <Badge className={party.balanceType === 'Debit' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                                  {party.balanceType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{party.email || '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={resetImport}>
                Cancel
              </Button>
              <Button 
                onClick={() => setStep('confirm')}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={importData.errors.length > 0}
              >
                {importData.errors.length > 0 ? 'Fix Errors First' : 'Continue to Import'}
              </Button>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  if (step === 'confirm' && importData) {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto bg-white min-h-screen">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Ready to Import?</h1>
              <p className="text-gray-600">Review the summary below and confirm to proceed</p>
            </div>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Import Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Ledgers to Import</p>
                    <p className="text-2xl font-bold text-gray-900">{importData.summary.totalLedgers}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Parties to Import</p>
                    <p className="text-2xl font-bold text-gray-900">{importData.summary.totalParties}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{importData.summary.totalTransactions}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(importData.summary.totalDebit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Confirmation Card */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900">All checks passed</p>
                    <p className="text-sm text-blue-800 mt-1">Your data is ready to be imported. This will update your financial dashboard with all ledgers, parties, and transactions.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep('preview')} className="flex-1">
                Back to Review
              </Button>
              <Button 
                onClick={handleImport}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm & Import
              </Button>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  if (step === 'processing') {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] bg-white">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"
                    style={{
                      borderTopColor: '#2563eb',
                    }}
                  />
                </div>
              </div>
              <h1 className="text-3xl font-bold">Importing Your Data</h1>
              <p className="text-gray-600">Please wait while we process your Tally records...</p>
              
              {/* Progress bar */}
              <div className="w-full max-w-md mt-6">
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">{importProgress}% Complete</p>
              </div>

              <div className="mt-6 space-y-2 text-sm text-gray-700">
                <p>✓ Validating ledgers</p>
                <p>✓ Processing parties</p>
                <p>✓ Importing transactions</p>
              </div>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  if (step === 'complete') {
    return (
      <AuthGuard requireAuth={true}>
        <MainLayout>
          <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] bg-white">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold">Import Successful!</h1>
              <p className="text-gray-600">Your Tally data has been successfully imported</p>
              
              {importData && (
                <Card className="mt-6 text-left">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Ledgers Imported:</span>
                        <span className="font-bold text-gray-900">{importData.summary.totalLedgers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Parties Added:</span>
                        <span className="font-bold text-gray-900">{importData.summary.totalParties}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Transactions Recorded:</span>
                        <span className="font-bold text-gray-900">{importData.summary.totalTransactions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Total Amount:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(importData.summary.totalDebit)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <p className="text-sm text-gray-600 mt-4">Your financial dashboard has been updated with all imported records.</p>

              <div className="flex gap-3 pt-4 w-full">
                <Button 
                  variant="outline"
                  onClick={resetImport}
                  className="flex-1"
                >
                  Import Another File
                </Button>
                <Button 
                  onClick={() => window.location.href = '/financial-dashboard'}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  View Dashboard
                </Button>
              </div>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }
}
