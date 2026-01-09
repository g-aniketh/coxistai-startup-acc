// Centralized constants for hospital financial management
// This ensures consistency across all pages

export interface HospitalBankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  accountType: "checking" | "savings" | "credit";
  purpose: string;
  balancePercentage: number; // Percentage of total balance
}

// Hospital bank accounts configuration
// These accounts are displayed consistently across dashboard, banking-payments, and financial-dashboard
export const HOSPITAL_BANK_ACCOUNTS: HospitalBankAccount[] = [
  {
    id: "1",
    name: "Hospital Operating Account",
    bankName: "HDFC Bank",
    accountNumber: "XXX-XXXX-5678",
    accountType: "checking",
    purpose: "Operating",
    balancePercentage: 50, // 50% of total balance
  },
  {
    id: "2",
    name: "Patient Trust Account",
    bankName: "ICICI Bank",
    accountNumber: "XXX-XXXX-9012",
    accountType: "savings",
    purpose: "Trust",
    balancePercentage: 30, // 30% of total balance
  },
  {
    id: "3",
    name: "Capital Reserve Account",
    bankName: "Axis Bank",
    accountNumber: "XXX-XXXX-3456",
    accountType: "checking",
    purpose: "Reserve",
    balancePercentage: 20, // 20% of total balance (remaining)
  },
];

// Function to get bank accounts with calculated balances
export const getHospitalBankAccountsWithBalance = (totalBalance: number) => {
  const account1Balance = Math.round(totalBalance * 0.5);
  const account2Balance = Math.round(totalBalance * 0.3);
  const account3Balance = totalBalance - account1Balance - account2Balance;

  return HOSPITAL_BANK_ACCOUNTS.map((account, index) => ({
    ...account,
    balance: index === 0 ? account1Balance : index === 1 ? account2Balance : account3Balance,
  }));
};

// Bank connections for the banking page
export const HOSPITAL_BANK_CONNECTIONS = [
  {
    id: "hdfc",
    bankName: "HDFC Bank",
    logo: "🏦",
    status: "connected" as const,
    lastConnected: new Date().toISOString(),
    accountsCount: 1,
  },
  {
    id: "icici",
    bankName: "ICICI Bank",
    logo: "🏛️",
    status: "connected" as const,
    lastConnected: new Date().toISOString(),
    accountsCount: 1,
  },
  {
    id: "axis",
    bankName: "Axis Bank",
    logo: "🏦",
    status: "connected" as const,
    lastConnected: new Date().toISOString(),
    accountsCount: 1,
  },
  {
    id: "sbi",
    bankName: "State Bank of India",
    logo: "🏛️",
    status: "available" as const,
    accountsCount: 0,
  },
  {
    id: "kotak",
    bankName: "Kotak Mahindra",
    logo: "🏦",
    status: "available" as const,
    accountsCount: 0,
  },
];

// Healthcare-specific expense categories
export const HEALTHCARE_EXPENSE_CATEGORIES = [
  { name: "Payroll", color: "#0d9488" },
  { name: "Medical Supplies", color: "#10b981" },
  { name: "Pharmaceuticals", color: "#f59e0b" },
  { name: "Lab Costs", color: "#6366f1" },
  { name: "Equipment Lease", color: "#ec4899" },
  { name: "Utilities", color: "#8b5cf6" },
  { name: "IT & Software", color: "#14b8a6" },
  { name: "Facility Maintenance", color: "#f97316" },
  { name: "Insurance", color: "#06b6d4" },
  { name: "Other Operating", color: "#84cc16" },
];

// Healthcare-specific revenue categories
export const HEALTHCARE_REVENUE_CATEGORIES = [
  { name: "Patient Services", color: "#0d9488" },
  { name: "Insurance Payments", color: "#10b981" },
  { name: "Lab & Diagnostics", color: "#6366f1" },
  { name: "Pharmacy Sales", color: "#f59e0b" },
  { name: "Government Grants", color: "#8b5cf6" },
  { name: "Other Revenue", color: "#ec4899" },
];

// Common departments
export const HOSPITAL_DEPARTMENTS = [
  "General Medicine",
  "Cardiology",
  "Orthopedics",
  "Gynecology",
  "Pediatrics",
  "Neurology",
  "Oncology",
  "Emergency",
  "Surgery",
  "Radiology",
  "Pathology",
  "Pharmacy",
  "Administration",
];

// Currency formatter for INR
export const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatINR = (amount: number) => currencyFormatter.format(amount);

