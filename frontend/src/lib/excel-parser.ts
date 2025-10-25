// Tally Excel Import Parser
// Handles parsing of Tally exported Excel files into our system format

import * as XLSX from 'xlsx';

export interface TallyLedgerEntry {
  ledgerName: string;
  accountGroup: string;
  openingBalance: number;
  openingType: 'Debit' | 'Credit';
  transactions: TallyTransaction[];
}

export interface TallyTransaction {
  voucherNo: string;
  voucherType: 'Sales' | 'Purchase' | 'Journal' | 'Receipt' | 'Payment' | 'Contra';
  date: string;
  narration: string;
  particulars: string;
  amount: number;
  debit: number;
  credit: number;
  reference?: string;
}

export interface TallyParty {
  name: string;
  type: 'Customer' | 'Supplier' | 'Employee' | 'Other';
  partyType: string;
  mobileNumber?: string;
  email?: string;
  openingBalance: number;
  balanceType: 'Debit' | 'Credit';
}

export interface TallyImportData {
  ledgers: TallyLedgerEntry[];
  parties: TallyParty[];
  summary: {
    totalLedgers: number;
    totalParties: number;
    totalTransactions: number;
    dateRange: {
      from: string;
      to: string;
    };
    totalDebit: number;
    totalCredit: number;
  };
  errors: string[];
  warnings: string[];
}

// Parse the Excel file
export async function parseTallyExcel(file: File): Promise<TallyImportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result: TallyImportData = {
          ledgers: [],
          parties: [],
          summary: {
            totalLedgers: 0,
            totalParties: 0,
            totalTransactions: 0,
            dateRange: { from: '', to: '' },
            totalDebit: 0,
            totalCredit: 0,
          },
          errors: [],
          warnings: [],
        };

        // Parse different sheets based on what's available
        if (workbook.SheetNames.includes('Ledger')) {
          result.ledgers = parseLedgerSheet(workbook.Sheets['Ledger'], result);
        }
        if (workbook.SheetNames.includes('Party Ledger')) {
          result.parties = parsePartySheet(workbook.Sheets['Party Ledger'], result);
        }
        if (workbook.SheetNames.includes('Parties')) {
          result.parties = parsePartySheet(workbook.Sheets['Parties'], result);
        }
        if (workbook.SheetNames.includes('Transactions')) {
          parseTransactionSheet(workbook.Sheets['Transactions'], result);
        }

        // Calculate summary
        result.summary.totalLedgers = result.ledgers.length;
        result.summary.totalParties = result.parties.length;
        result.summary.totalTransactions = result.ledgers.reduce((sum, l) => sum + l.transactions.length, 0);
        result.summary.totalDebit = result.ledgers.reduce((sum, l) => sum + l.transactions.reduce((tsum, t) => tsum + t.debit, 0), 0);
        result.summary.totalCredit = result.ledgers.reduce((sum, l) => sum + l.transactions.reduce((tsum, t) => tsum + t.credit, 0), 0);

        // Validate data
        validateTallyData(result);

        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

// Parse the Ledger sheet
function parseLedgerSheet(sheet: XLSX.WorkSheet, result: TallyImportData): TallyLedgerEntry[] {
  const ledgers: TallyLedgerEntry[] = [];
  const rows = XLSX.utils.sheet_to_json(sheet);

  interface RawRow {
    [key: string]: any;
  }

  (rows as RawRow[]).forEach((row, index) => {
    try {
      // Handle different possible column names
      const ledgerName = row['Ledger Name'] || row['Account Name'] || row['Account'] || '';
      const accountGroup = row['Group'] || row['Group Name'] || row['Account Group'] || '';
      
      if (!ledgerName) {
        result.warnings.push(`Row ${index + 1}: Missing ledger name`);
        return;
      }

      const openingBalance = parseFloat(row['Opening Balance'] || row['Opening Bal'] || '0') || 0;
      const openingType = (row['Balance Type'] || row['Opening Type'] || 'Debit').trim();

      const ledger: TallyLedgerEntry = {
        ledgerName: ledgerName.toString().trim(),
        accountGroup: accountGroup.toString().trim(),
        openingBalance: Math.abs(openingBalance),
        openingType: openingType === 'Credit' ? 'Credit' : 'Debit',
        transactions: [],
      };

      ledgers.push(ledger);
    } catch (error) {
      result.errors.push(`Row ${index + 1}: Error parsing ledger - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return ledgers;
}

// Parse the Party (Debtors/Creditors) sheet
function parsePartySheet(sheet: XLSX.WorkSheet, result: TallyImportData): TallyParty[] {
  const parties: TallyParty[] = [];
  const rows = XLSX.utils.sheet_to_json(sheet);

  interface RawRow {
    [key: string]: any;
  }

  (rows as RawRow[]).forEach((row, index) => {
    try {
      const name = row['Party Name'] || row['Name'] || row['Debtor/Creditor'] || '';
      const type = row['Type'] || row['Party Type'] || 'Other';
      
      if (!name) {
        result.warnings.push(`Row ${index + 1}: Missing party name`);
        return;
      }

      const openingBalance = parseFloat(row['Opening Balance'] || row['Opening Bal'] || '0') || 0;
      const balanceType = (row['Balance Type'] || 'Debit').trim();

      const party: TallyParty = {
        name: name.toString().trim(),
        type: mapPartyType(type.toString().trim()),
        partyType: type.toString().trim(),
        mobileNumber: row['Mobile'] || row['Phone'] || undefined,
        email: row['Email'] || undefined,
        openingBalance: Math.abs(openingBalance),
        balanceType: balanceType === 'Credit' ? 'Credit' : 'Debit',
      };

      parties.push(party);
    } catch (error) {
      result.errors.push(`Row ${index + 1}: Error parsing party - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return parties;
}

// Parse transactions from separate sheet
function parseTransactionSheet(sheet: XLSX.WorkSheet, result: TallyImportData): void {
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  interface RawRow {
    [key: string]: any;
  }

  (rows as RawRow[]).forEach((row, index) => {
    try {
      const ledgerName = row['Ledger Name'] || row['Account Name'] || '';
      const date = row['Date'] || row['Transaction Date'] || '';
      
      if (!ledgerName || !date) return;

      const transaction: TallyTransaction = {
        voucherNo: (row['Voucher No'] || row['Ref No'] || `${index}`).toString(),
        voucherType: mapVoucherType(row['Voucher Type'] || 'Journal'),
        date: formatDate(date),
        narration: row['Narration'] || row['Description'] || '',
        particulars: row['Particulars'] || '',
        amount: parseFloat(row['Amount'] || '0') || 0,
        debit: parseFloat(row['Debit'] || '0') || 0,
        credit: parseFloat(row['Credit'] || '0') || 0,
        reference: row['Reference'] || undefined,
      };

      // Find and add to corresponding ledger
      const ledger = result.ledgers.find(l => l.ledgerName === ledgerName);
      if (ledger) {
        ledger.transactions.push(transaction);
      }
    } catch (error) {
      result.errors.push(`Row ${index + 1}: Error parsing transaction - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

// Helper functions
function mapVoucherType(type: string): TallyTransaction['voucherType'] {
  const mapping: { [key: string]: TallyTransaction['voucherType'] } = {
    'sales': 'Sales',
    'purchase': 'Purchase',
    'journal': 'Journal',
    'receipt': 'Receipt',
    'payment': 'Payment',
    'contra': 'Contra',
  };
  return mapping[type.toLowerCase()] || 'Journal';
}

function mapPartyType(type: string): TallyParty['type'] {
  const mapping: { [key: string]: TallyParty['type'] } = {
    'customer': 'Customer',
    'supplier': 'Supplier',
    'debtor': 'Customer',
    'creditor': 'Supplier',
    'employee': 'Employee',
  };
  return mapping[type.toLowerCase()] || 'Other';
}

function formatDate(dateValue: any): string {
  if (!dateValue) return new Date().toISOString().split('T')[0];
  
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return dateValue;
  }

  if (typeof dateValue === 'number') {
    // Excel serial date
    const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
    return excelDate.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

// Validate the parsed data
function validateTallyData(result: TallyImportData): void {
  if (result.ledgers.length === 0 && result.parties.length === 0) {
    result.errors.push('No ledgers or parties found in the Excel file');
  }

  // Check for duplicate ledgers
  const ledgerNames = result.ledgers.map(l => l.ledgerName);
  const duplicateLedgers = ledgerNames.filter((name, index) => ledgerNames.indexOf(name) !== index);
  if (duplicateLedgers.length > 0) {
    result.warnings.push(`Duplicate ledgers found: ${duplicateLedgers.join(', ')}`);
  }

  // Check for duplicate parties
  const partyNames = result.parties.map(p => p.name);
  const duplicateParties = partyNames.filter((name, index) => partyNames.indexOf(name) !== index);
  if (duplicateParties.length > 0) {
    result.warnings.push(`Duplicate parties found: ${duplicateParties.join(', ')}`);
  }

  // Validate debit-credit balance
  const totalDebit = result.summary.totalDebit;
  const totalCredit = result.summary.totalCredit;
  
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    result.warnings.push(`Debit-Credit mismatch: Debit ₹${totalDebit.toFixed(2)} vs Credit ₹${totalCredit.toFixed(2)}`);
  }
}

// Generate a sample Tally Excel template
export function generateTallySampleTemplate(): XLSX.WorkBook {
  const ledgerData = [
    {
      'Ledger Name': 'Cash',
      'Group Name': 'Cash & Bank',
      'Opening Balance': 500000,
      'Balance Type': 'Debit'
    },
    {
      'Ledger Name': 'Bank Account',
      'Group Name': 'Cash & Bank',
      'Opening Balance': 1000000,
      'Balance Type': 'Debit'
    },
  ];

  const partyData = [
    {
      'Party Name': 'ABC Corporation',
      'Type': 'Customer',
      'Opening Balance': 50000,
      'Balance Type': 'Debit',
      'Email': 'contact@abc.com'
    },
    {
      'Party Name': 'XYZ Suppliers',
      'Type': 'Supplier',
      'Opening Balance': 75000,
      'Balance Type': 'Credit',
      'Email': 'sales@xyz.com'
    },
  ];

  const transactionData = [
    {
      'Date': '2024-01-01',
      'Voucher No': 'JNL001',
      'Voucher Type': 'Journal',
      'Ledger Name': 'Cash',
      'Debit': 50000,
      'Credit': 0,
      'Narration': 'Opening cash balance'
    },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ledgerData), 'Ledger');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(partyData), 'Party Ledger');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactionData), 'Transactions');

  return wb;
}
