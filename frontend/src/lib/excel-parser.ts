// Tally Excel Import Parser
// Handles parsing of Tally exported Excel files into our system format

import * as XLSX from "xlsx";

export interface TallyLedgerEntry {
  ledgerName: string;
  accountGroup: string;
  openingBalance: number;
  openingType: "Debit" | "Credit";
  transactions: TallyTransaction[];
}

export interface TallyTransaction {
  voucherNo: string;
  voucherType:
    | "Sales"
    | "Purchase"
    | "Journal"
    | "Receipt"
    | "Payment"
    | "Contra";
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
  type: "Customer" | "Supplier" | "Employee" | "Other";
  partyType: string;
  mobileNumber?: string;
  email?: string;
  openingBalance: number;
  balanceType: "Debit" | "Credit";
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
  financialMetrics?: {
    runway?: number; // Months of runway
    burnRate?: number; // Monthly burn rate
    monthlyRevenue?: number; // Monthly revenue
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
        const workbook = XLSX.read(data, { type: "array" });

        const result: TallyImportData = {
          ledgers: [],
          parties: [],
          summary: {
            totalLedgers: 0,
            totalParties: 0,
            totalTransactions: 0,
            dateRange: { from: "", to: "" },
            totalDebit: 0,
            totalCredit: 0,
          },
          financialMetrics: undefined,
          errors: [],
          warnings: [],
        };

        // Parse different sheets based on what's available
        if (workbook.SheetNames.includes("Ledger")) {
          result.ledgers = parseLedgerSheet(workbook.Sheets["Ledger"], result);
        }
        if (workbook.SheetNames.includes("Party Ledger")) {
          result.parties = parsePartySheet(
            workbook.Sheets["Party Ledger"],
            result
          );
        }
        if (workbook.SheetNames.includes("Parties")) {
          result.parties = parsePartySheet(workbook.Sheets["Parties"], result);
        }
        if (workbook.SheetNames.includes("Transactions")) {
          parseTransactionSheet(workbook.Sheets["Transactions"], result);
        }
        if (workbook.SheetNames.includes("Financial Metrics")) {
          result.financialMetrics = parseFinancialMetricsSheet(
            workbook.Sheets["Financial Metrics"],
            result
          );
        }

        // Calculate summary
        result.summary.totalLedgers = result.ledgers.length;
        result.summary.totalParties = result.parties.length;
        result.summary.totalTransactions = result.ledgers.reduce(
          (sum, l) => sum + l.transactions.length,
          0
        );
        result.summary.totalDebit = result.ledgers.reduce(
          (sum, l) =>
            sum + l.transactions.reduce((tsum, t) => tsum + t.debit, 0),
          0
        );
        result.summary.totalCredit = result.ledgers.reduce(
          (sum, l) =>
            sum + l.transactions.reduce((tsum, t) => tsum + t.credit, 0),
          0
        );

        // Validate data
        validateTallyData(result);

        resolve(result);
      } catch (error) {
        reject(
          new Error(
            `Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`
          )
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
}

// Parse the Ledger sheet
function parseLedgerSheet(
  sheet: XLSX.WorkSheet,
  result: TallyImportData
): TallyLedgerEntry[] {
  const ledgers: TallyLedgerEntry[] = [];
  const rows = XLSX.utils.sheet_to_json(sheet);

  interface RawRow {
    [key: string]: any;
  }

  (rows as RawRow[]).forEach((row, index) => {
    try {
      // Handle different possible column names
      const ledgerName =
        row["Ledger Name"] || row["Account Name"] || row["Account"] || "";
      const accountGroup =
        row["Group"] || row["Group Name"] || row["Account Group"] || "";

      if (!ledgerName) {
        result.warnings.push(`Row ${index + 1}: Missing ledger name`);
        return;
      }

      const openingBalance =
        parseFloat(row["Opening Balance"] || row["Opening Bal"] || "0") || 0;
      const openingType = (
        row["Balance Type"] ||
        row["Opening Type"] ||
        "Debit"
      ).trim();

      const ledger: TallyLedgerEntry = {
        ledgerName: ledgerName.toString().trim(),
        accountGroup: accountGroup.toString().trim(),
        openingBalance: Math.abs(openingBalance),
        openingType: openingType === "Credit" ? "Credit" : "Debit",
        transactions: [],
      };

      ledgers.push(ledger);
    } catch (error) {
      result.errors.push(
        `Row ${index + 1}: Error parsing ledger - ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  });

  return ledgers;
}

// Parse the Party (Debtors/Creditors) sheet
function parsePartySheet(
  sheet: XLSX.WorkSheet,
  result: TallyImportData
): TallyParty[] {
  const parties: TallyParty[] = [];
  const rows = XLSX.utils.sheet_to_json(sheet);

  interface RawRow {
    [key: string]: any;
  }

  (rows as RawRow[]).forEach((row, index) => {
    try {
      const name =
        row["Party Name"] || row["Name"] || row["Debtor/Creditor"] || "";
      const type = row["Type"] || row["Party Type"] || "Other";

      if (!name) {
        result.warnings.push(`Row ${index + 1}: Missing party name`);
        return;
      }

      const openingBalance =
        parseFloat(row["Opening Balance"] || row["Opening Bal"] || "0") || 0;
      const balanceType = (row["Balance Type"] || "Debit").trim();

      const party: TallyParty = {
        name: name.toString().trim(),
        type: mapPartyType(type.toString().trim()),
        partyType: type.toString().trim(),
        mobileNumber: row["Mobile"] || row["Phone"] || undefined,
        email: row["Email"] || undefined,
        openingBalance: Math.abs(openingBalance),
        balanceType: balanceType === "Credit" ? "Credit" : "Debit",
      };

      parties.push(party);
    } catch (error) {
      result.errors.push(
        `Row ${index + 1}: Error parsing party - ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  });

  return parties;
}

// Parse transactions from separate sheet
function parseTransactionSheet(
  sheet: XLSX.WorkSheet,
  result: TallyImportData
): void {
  const rows = XLSX.utils.sheet_to_json(sheet);

  interface RawRow {
    [key: string]: any;
  }

  (rows as RawRow[]).forEach((row, index) => {
    try {
      const ledgerName = row["Ledger Name"] || row["Account Name"] || "";
      const date = row["Date"] || row["Transaction Date"] || "";

      if (!ledgerName || !date) return;

      const transaction: TallyTransaction = {
        voucherNo: (
          row["Voucher No"] ||
          row["Ref No"] ||
          `${index}`
        ).toString(),
        voucherType: mapVoucherType(row["Voucher Type"] || "Journal"),
        date: formatDate(date),
        narration: row["Narration"] || row["Description"] || "",
        particulars: row["Particulars"] || "",
        amount: parseFloat(row["Amount"] || "0") || 0,
        debit: parseFloat(row["Debit"] || "0") || 0,
        credit: parseFloat(row["Credit"] || "0") || 0,
        reference: row["Reference"] || undefined,
      };

      // Find and add to corresponding ledger
      const ledger = result.ledgers.find((l) => l.ledgerName === ledgerName);
      if (ledger) {
        ledger.transactions.push(transaction);
      }
    } catch (error) {
      result.errors.push(
        `Row ${index + 1}: Error parsing transaction - ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  });
}

// Helper functions
function mapVoucherType(type: string): TallyTransaction["voucherType"] {
  const mapping: { [key: string]: TallyTransaction["voucherType"] } = {
    sales: "Sales",
    purchase: "Purchase",
    journal: "Journal",
    receipt: "Receipt",
    payment: "Payment",
    contra: "Contra",
  };
  return mapping[type.toLowerCase()] || "Journal";
}

function mapPartyType(type: string): TallyParty["type"] {
  const mapping: { [key: string]: TallyParty["type"] } = {
    customer: "Customer",
    supplier: "Supplier",
    debtor: "Customer",
    creditor: "Supplier",
    employee: "Employee",
  };
  return mapping[type.toLowerCase()] || "Other";
}

function formatDate(dateValue: any): string {
  if (!dateValue) return new Date().toISOString().split("T")[0];

  if (typeof dateValue === "string") {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
    return dateValue;
  }

  if (typeof dateValue === "number") {
    // Excel serial date
    const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
    return excelDate.toISOString().split("T")[0];
  }

  return new Date().toISOString().split("T")[0];
}

// Parse Financial Metrics sheet
function parseFinancialMetricsSheet(
  sheet: XLSX.WorkSheet,
  result: TallyImportData
): TallyImportData["financialMetrics"] {
  const rows = XLSX.utils.sheet_to_json(sheet);
  const metrics: TallyImportData["financialMetrics"] = {};

  interface RawRow {
    [key: string]: any;
  }

  (rows as RawRow[]).forEach((row, index) => {
    try {
      const metricName = (row["Metric"] || row["Metric Name"] || "").toString().trim();
      const value = parseFloat(row["Value"] || row["Amount"] || "0") || 0;

      if (!metricName) {
        result.warnings.push(`Row ${index + 1}: Missing metric name`);
        return;
      }

      const metricLower = metricName.toLowerCase();
      if (metricLower.includes("runway")) {
        metrics.runway = value;
      } else if (metricLower.includes("burn") || metricLower.includes("burn rate")) {
        metrics.burnRate = value;
      } else if (metricLower.includes("revenue") || metricLower.includes("monthly revenue")) {
        metrics.monthlyRevenue = value;
      }
    } catch (error) {
      result.warnings.push(
        `Row ${index + 1}: Error parsing financial metric - ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  });

  return Object.keys(metrics).length > 0 ? metrics : undefined;
}

// Validate the parsed data
function validateTallyData(result: TallyImportData): void {
  if (result.ledgers.length === 0 && result.parties.length === 0) {
    result.errors.push("No ledgers or parties found in the Excel file");
  }

  // Check for duplicate ledgers
  const ledgerNames = result.ledgers.map((l) => l.ledgerName);
  const duplicateLedgers = ledgerNames.filter(
    (name, index) => ledgerNames.indexOf(name) !== index
  );
  if (duplicateLedgers.length > 0) {
    result.warnings.push(
      `Duplicate ledgers found: ${duplicateLedgers.join(", ")}`
    );
  }

  // Check for duplicate parties
  const partyNames = result.parties.map((p) => p.name);
  const duplicateParties = partyNames.filter(
    (name, index) => partyNames.indexOf(name) !== index
  );
  if (duplicateParties.length > 0) {
    result.warnings.push(
      `Duplicate parties found: ${duplicateParties.join(", ")}`
    );
  }

  // Validate debit-credit balance
  const totalDebit = result.summary.totalDebit;
  const totalCredit = result.summary.totalCredit;

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    result.warnings.push(
      `Debit-Credit mismatch: Debit ₹${totalDebit.toFixed(2)} vs Credit ₹${totalCredit.toFixed(2)}`
    );
  }
}

// Generate a comprehensive Tally Excel template with all fields
export function generateTallySampleTemplate(): XLSX.WorkBook {
  // Comprehensive Ledger Data - All major account groups
  const ledgerData = [
    // Cash & Bank Accounts
    {
      "Ledger Name": "Cash Account",
      "Group Name": "Cash & Bank",
      "Opening Balance": 50000,
      "Balance Type": "Debit",
    },
    {
      "Ledger Name": "HDFC Current Account",
      "Group Name": "Cash & Bank",
      "Opening Balance": 200000,
      "Balance Type": "Debit",
    },
    {
      "Ledger Name": "ICICI Savings Account",
      "Group Name": "Cash & Bank",
      "Opening Balance": 150000,
      "Balance Type": "Debit",
    },

    // Revenue Accounts
    {
      "Ledger Name": "Product Sales",
      "Group Name": "Revenue",
      "Opening Balance": 0,
      "Balance Type": "Credit",
    },
    {
      "Ledger Name": "Service Revenue",
      "Group Name": "Revenue",
      "Opening Balance": 0,
      "Balance Type": "Credit",
    },
    {
      "Ledger Name": "Interest Income",
      "Group Name": "Revenue",
      "Opening Balance": 0,
      "Balance Type": "Credit",
    },

    // Expense Accounts
    {
      "Ledger Name": "Salaries & Wages",
      "Group Name": "Expenses",
      "Opening Balance": 0,
      "Balance Type": "Debit",
    },
    {
      "Ledger Name": "Office Rent",
      "Group Name": "Expenses",
      "Opening Balance": 0,
      "Balance Type": "Debit",
    },
    {
      "Ledger Name": "Internet & Phone",
      "Group Name": "Expenses",
      "Opening Balance": 0,
      "Balance Type": "Debit",
    },
    {
      "Ledger Name": "Travel Expenses",
      "Group Name": "Expenses",
      "Opening Balance": 0,
      "Balance Type": "Debit",
    },
    {
      "Ledger Name": "Office Supplies",
      "Group Name": "Expenses",
      "Opening Balance": 0,
      "Balance Type": "Debit",
    },
    {
      "Ledger Name": "Marketing & Advertising",
      "Group Name": "Expenses",
      "Opening Balance": 0,
      "Balance Type": "Debit",
    },

    // Receivables - Customers
    {
      "Ledger Name": "ABC Technologies Pvt Ltd",
      "Group Name": "Receivables",
      "Opening Balance": 25000,
      "Balance Type": "Debit",
    },
    {
      "Ledger Name": "XYZ Solutions Inc",
      "Group Name": "Receivables",
      "Opening Balance": 18000,
      "Balance Type": "Debit",
    },
    {
      "Ledger Name": "Global Enterprises",
      "Group Name": "Receivables",
      "Opening Balance": 20000,
      "Balance Type": "Debit",
    },

    // Payables - Suppliers
    {
      "Ledger Name": "Premium Suppliers",
      "Group Name": "Payables",
      "Opening Balance": 15000,
      "Balance Type": "Credit",
    },
    {
      "Ledger Name": "Quality Vendors Ltd",
      "Group Name": "Payables",
      "Opening Balance": 12000,
      "Balance Type": "Credit",
    },
    {
      "Ledger Name": "Trusted Partners",
      "Group Name": "Payables",
      "Opening Balance": 10000,
      "Balance Type": "Credit",
    },

    // Fixed Assets
    {
      "Ledger Name": "Office Equipment",
      "Group Name": "Fixed Assets",
      "Opening Balance": 100000,
      "Balance Type": "Debit",
    },
    {
      "Ledger Name": "Computer & Software",
      "Group Name": "Fixed Assets",
      "Opening Balance": 80000,
      "Balance Type": "Debit",
    },
    {
      "Ledger Name": "Furniture & Fixtures",
      "Group Name": "Fixed Assets",
      "Opening Balance": 40000,
      "Balance Type": "Debit",
    },

    // Investment
    {
      "Ledger Name": "Equity Investments",
      "Group Name": "Investment",
      "Opening Balance": 200000,
      "Balance Type": "Debit",
    },

    // Capital & Equity
    {
      "Ledger Name": "Share Capital",
      "Group Name": "Capital",
      "Opening Balance": 500000,
      "Balance Type": "Credit",
    },
    {
      "Ledger Name": "Retained Earnings",
      "Group Name": "Capital",
      "Opening Balance": 50000,
      "Balance Type": "Credit",
    },

    // Loans & Liabilities
    {
      "Ledger Name": "Bank Loan - HDFC",
      "Group Name": "Liabilities",
      "Opening Balance": 300000,
      "Balance Type": "Credit",
    },
    {
      "Ledger Name": "Outstanding Taxes",
      "Group Name": "Liabilities",
      "Opening Balance": 15000,
      "Balance Type": "Credit",
    },
    {
      "Ledger Name": "GST Payable",
      "Group Name": "Liabilities",
      "Opening Balance": 12000,
      "Balance Type": "Credit",
    },
  ];

  // Comprehensive Party Data
  const partyData = [
    {
      "Party Name": "ABC Technologies Pvt Ltd",
      Type: "Customer",
      "Opening Balance": 25000,
      "Balance Type": "Debit",
      Email: "accounts@abc-tech.com",
      Mobile: "9876543210",
      Address: "123 Tech Park, Bangalore",
      GSTIN: "29ABCDE1234F1Z5",
    },
    {
      "Party Name": "XYZ Solutions Inc",
      Type: "Customer",
      "Opening Balance": 18000,
      "Balance Type": "Debit",
      Email: "info@xyz-solutions.com",
      Mobile: "9876543211",
      Address: "456 Business Center, Mumbai",
      GSTIN: "27FGHIJ5678K2Z9",
    },
    {
      "Party Name": "Global Enterprises",
      Type: "Customer",
      "Opening Balance": 20000,
      "Balance Type": "Debit",
      Email: "contact@global-ent.com",
      Mobile: "9876543212",
      Address: "789 Corporate Hub, Delhi",
      GSTIN: "07MNOPQ9012R3Z5",
    },
    {
      "Party Name": "Premium Suppliers",
      Type: "Supplier",
      "Opening Balance": 15000,
      "Balance Type": "Credit",
      Email: "sales@premium-suppliers.com",
      Mobile: "9876543213",
      Address: "321 Supplier Street, Chennai",
      GSTIN: "33STUVW3456X7Z8",
    },
    {
      "Party Name": "Quality Vendors Ltd",
      Type: "Supplier",
      "Opening Balance": 12000,
      "Balance Type": "Credit",
      Email: "purchase@quality-vendors.com",
      Mobile: "9876543214",
      Address: "654 Vendor Road, Pune",
      GSTIN: "27YZXAB8901C2Z3",
    },
    {
      "Party Name": "Trusted Partners",
      Type: "Supplier",
      "Opening Balance": 10000,
      "Balance Type": "Credit",
      Email: "ops@trusted-partners.com",
      Mobile: "9876543215",
      Address: "987 Partner Avenue, Hyderabad",
      GSTIN: "36DEFGH4567I8Z9",
    },
  ];

  // Comprehensive Transactions - Real-world scenarios (ALL BALANCED)
  const transactionData = [
    // Opening Balance Entries - Balance: Debit = 400000, Credit = 400000
    {
      Date: "2024-01-01",
      "Voucher No": "OB001",
      "Voucher Type": "Journal",
      "Ledger Name": "Cash Account",
      Debit: 50000,
      Credit: 0,
      Narration: "Opening balance",
      Particulars: "Opening stock",
      Reference: "OB-2024",
    },
    {
      Date: "2024-01-01",
      "Voucher No": "OB001",
      "Voucher Type": "Journal",
      "Ledger Name": "Share Capital",
      Debit: 0,
      Credit: 50000,
      Narration: "Opening balance",
      Particulars: "Capital contribution",
      Reference: "OB-2024",
    },

    {
      Date: "2024-01-01",
      "Voucher No": "OB002",
      "Voucher Type": "Journal",
      "Ledger Name": "HDFC Current Account",
      Debit: 200000,
      Credit: 0,
      Narration: "Opening balance",
      Particulars: "Opening stock",
      Reference: "OB-2024",
    },
    {
      Date: "2024-01-01",
      "Voucher No": "OB002",
      "Voucher Type": "Journal",
      "Ledger Name": "Share Capital",
      Debit: 0,
      Credit: 200000,
      Narration: "Opening balance",
      Particulars: "Capital contribution",
      Reference: "OB-2024",
    },

    // Sales Entries (February) - Balance: Debit = 70000, Credit = 70000
    {
      Date: "2024-02-05",
      "Voucher No": "SL-2024-001",
      "Voucher Type": "Sales",
      "Ledger Name": "ABC Technologies Pvt Ltd",
      Debit: 35000,
      Credit: 0,
      Narration: "Sale of products",
      Particulars: "Invoice #INV-001",
      Reference: "INV-001",
    },
    {
      Date: "2024-02-05",
      "Voucher No": "SL-2024-001",
      "Voucher Type": "Sales",
      "Ledger Name": "Product Sales",
      Debit: 0,
      Credit: 35000,
      Narration: "Sale of products",
      Particulars: "Revenue recognition",
      Reference: "INV-001",
    },

    {
      Date: "2024-02-10",
      "Voucher No": "SL-2024-002",
      "Voucher Type": "Sales",
      "Ledger Name": "XYZ Solutions Inc",
      Debit: 35000,
      Credit: 0,
      Narration: "Sale of services",
      Particulars: "Invoice #INV-002",
      Reference: "INV-002",
    },
    {
      Date: "2024-02-10",
      "Voucher No": "SL-2024-002",
      "Voucher Type": "Sales",
      "Ledger Name": "Service Revenue",
      Debit: 0,
      Credit: 35000,
      Narration: "Sale of services",
      Particulars: "Revenue recognition",
      Reference: "INV-002",
    },

    // Purchase Entries (February) - Balance: Debit = 35000, Credit = 35000
    {
      Date: "2024-02-12",
      "Voucher No": "PR-2024-001",
      "Voucher Type": "Purchase",
      "Ledger Name": "Premium Suppliers",
      Debit: 0,
      Credit: 25000,
      Narration: "Purchase of goods",
      Particulars: "Bill #BILL-001",
      Reference: "BILL-001",
    },
    {
      Date: "2024-02-12",
      "Voucher No": "PR-2024-001",
      "Voucher Type": "Purchase",
      "Ledger Name": "Office Supplies",
      Debit: 25000,
      Credit: 0,
      Narration: "Purchase of goods",
      Particulars: "Inventory",
      Reference: "BILL-001",
    },

    {
      Date: "2024-02-15",
      "Voucher No": "PR-2024-002",
      "Voucher Type": "Purchase",
      "Ledger Name": "Quality Vendors Ltd",
      Debit: 0,
      Credit: 10000,
      Narration: "Purchase of raw materials",
      Particulars: "Bill #BILL-002",
      Reference: "BILL-002",
    },
    {
      Date: "2024-02-15",
      "Voucher No": "PR-2024-002",
      "Voucher Type": "Purchase",
      "Ledger Name": "Office Supplies",
      Debit: 10000,
      Credit: 0,
      Narration: "Purchase of raw materials",
      Particulars: "Inventory",
      Reference: "BILL-002",
    },

    // Payment Entries (March) - Balance: Debit = 75000, Credit = 75000
    {
      Date: "2024-03-01",
      "Voucher No": "PY-2024-001",
      "Voucher Type": "Payment",
      "Ledger Name": "Salaries & Wages",
      Debit: 50000,
      Credit: 0,
      Narration: "Salary payment",
      Particulars: "March 2024 salary",
      Reference: "SAL-MAR-2024",
    },
    {
      Date: "2024-03-01",
      "Voucher No": "PY-2024-001",
      "Voucher Type": "Payment",
      "Ledger Name": "HDFC Current Account",
      Debit: 0,
      Credit: 50000,
      Narration: "Salary payment",
      Particulars: "Bank transfer",
      Reference: "SAL-MAR-2024",
    },

    {
      Date: "2024-03-05",
      "Voucher No": "PY-2024-002",
      "Voucher Type": "Payment",
      "Ledger Name": "Office Rent",
      Debit: 25000,
      Credit: 0,
      Narration: "Office rent",
      Particulars: "March 2024 rent",
      Reference: "RENT-MAR-2024",
    },
    {
      Date: "2024-03-05",
      "Voucher No": "PY-2024-002",
      "Voucher Type": "Payment",
      "Ledger Name": "Cash Account",
      Debit: 0,
      Credit: 25000,
      Narration: "Office rent",
      Particulars: "Cash payment",
      Reference: "RENT-MAR-2024",
    },

    // Receipt Entries (March) - Balance: Debit = 53000, Credit = 53000
    {
      Date: "2024-03-10",
      "Voucher No": "RC-2024-001",
      "Voucher Type": "Receipt",
      "Ledger Name": "Cash Account",
      Debit: 35000,
      Credit: 0,
      Narration: "Customer payment received",
      Particulars: "Payment from ABC Technologies",
      Reference: "PYM-001",
    },
    {
      Date: "2024-03-10",
      "Voucher No": "RC-2024-001",
      "Voucher Type": "Receipt",
      "Ledger Name": "ABC Technologies Pvt Ltd",
      Debit: 0,
      Credit: 35000,
      Narration: "Customer payment received",
      Particulars: "Outstanding cleared",
      Reference: "PYM-001",
    },

    {
      Date: "2024-03-15",
      "Voucher No": "RC-2024-002",
      "Voucher Type": "Receipt",
      "Ledger Name": "HDFC Current Account",
      Debit: 18000,
      Credit: 0,
      Narration: "Customer payment via bank",
      Particulars: "Payment from XYZ Solutions",
      Reference: "PYM-002",
    },
    {
      Date: "2024-03-15",
      "Voucher No": "RC-2024-002",
      "Voucher Type": "Receipt",
      "Ledger Name": "XYZ Solutions Inc",
      Debit: 0,
      Credit: 18000,
      Narration: "Customer payment via bank",
      Particulars: "Outstanding cleared",
      Reference: "PYM-002",
    },

    // Journal Entries (April) - Balance: Debit = 15000, Credit = 15000
    {
      Date: "2024-04-01",
      "Voucher No": "JNL-2024-001",
      "Voucher Type": "Journal",
      "Ledger Name": "Internet & Phone",
      Debit: 5000,
      Credit: 0,
      Narration: "Monthly internet charges",
      Particulars: "April 2024",
      Reference: "INT-APR-2024",
    },
    {
      Date: "2024-04-01",
      "Voucher No": "JNL-2024-001",
      "Voucher Type": "Journal",
      "Ledger Name": "HDFC Current Account",
      Debit: 0,
      Credit: 5000,
      Narration: "Monthly internet charges",
      Particulars: "Bank transfer",
      Reference: "INT-APR-2024",
    },

    {
      Date: "2024-04-05",
      "Voucher No": "JNL-2024-002",
      "Voucher Type": "Journal",
      "Ledger Name": "Travel Expenses",
      Debit: 10000,
      Credit: 0,
      Narration: "Business travel expense",
      Particulars: "Client meeting travel",
      Reference: "TRAV-001",
    },
    {
      Date: "2024-04-05",
      "Voucher No": "JNL-2024-002",
      "Voucher Type": "Journal",
      "Ledger Name": "Cash Account",
      Debit: 0,
      Credit: 10000,
      Narration: "Business travel expense",
      Particulars: "Cash reimbursement",
      Reference: "TRAV-001",
    },

    // Sales Entries (May) - Balance: Debit = 20000, Credit = 20000
    {
      Date: "2024-05-10",
      "Voucher No": "SL-2024-003",
      "Voucher Type": "Sales",
      "Ledger Name": "Global Enterprises",
      Debit: 20000,
      Credit: 0,
      Narration: "Sale of products",
      Particulars: "Invoice #INV-003",
      Reference: "INV-003",
    },
    {
      Date: "2024-05-10",
      "Voucher No": "SL-2024-003",
      "Voucher Type": "Sales",
      "Ledger Name": "Product Sales",
      Debit: 0,
      Credit: 20000,
      Narration: "Sale of products",
      Particulars: "Revenue recognition",
      Reference: "INV-003",
    },

    // Payment Entries (June) - Balance: Debit = 20000, Credit = 20000
    {
      Date: "2024-06-01",
      "Voucher No": "PY-2024-003",
      "Voucher Type": "Payment",
      "Ledger Name": "Marketing & Advertising",
      Debit: 20000,
      Credit: 0,
      Narration: "Marketing campaign expenses",
      Particulars: "Digital marketing",
      Reference: "MRK-001",
    },
    {
      Date: "2024-06-01",
      "Voucher No": "PY-2024-003",
      "Voucher Type": "Payment",
      "Ledger Name": "HDFC Current Account",
      Debit: 0,
      Credit: 20000,
      Narration: "Marketing campaign expenses",
      Particulars: "Online payment",
      Reference: "MRK-001",
    },
  ];

  // Financial Metrics Data
  const financialMetricsData = [
    {
      Metric: "Runway",
      Value: 8.2,
      Description: "Months of runway based on current burn rate",
    },
    {
      Metric: "Burn Rate",
      Value: 290000,
      Description: "Monthly burn rate in INR",
    },
    {
      Metric: "Monthly Revenue",
      Value: 450000,
      Description: "Monthly revenue in INR",
    },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(ledgerData),
    "Ledger"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(partyData),
    "Party Ledger"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(transactionData),
    "Transactions"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(financialMetricsData),
    "Financial Metrics"
  );

  return wb;
}
