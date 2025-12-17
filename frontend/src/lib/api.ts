import axios, { AxiosInstance } from "axios";

// API Configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  startupId: string;
  startup: Startup;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyAddress {
  id: string;
  label?: string | null;
  line1: string;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  isPrimary: boolean;
  isBilling: boolean;
  isShipping: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfile {
  id: string;
  displayName: string;
  legalName?: string | null;
  mailingName?: string | null;
  baseCurrency: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  website?: string | null;
  createdAt: string;
  updatedAt: string;
  addresses: CompanyAddress[];
}

export interface CompanyFiscalConfig {
  id: string;
  financialYearStart: string;
  booksStart: string;
  allowBackdatedEntries: boolean;
  backdatedFrom?: string | null;
  enableEditLog: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFiscalInput {
  financialYearStart: string;
  booksStart: string;
  allowBackdatedEntries?: boolean;
  backdatedFrom?: string | null;
  enableEditLog?: boolean;
}

export interface CompanySecurityConfig {
  id: string;
  tallyVaultEnabled: boolean;
  userAccessControlEnabled: boolean;
  multiFactorRequired: boolean;
  tallyVaultPasswordHint?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySecurityInput {
  tallyVaultEnabled?: boolean;
  newTallyVaultPassword?: string;
  currentTallyVaultPassword?: string;
  tallyVaultPasswordHint?: string | null;
  userAccessControlEnabled?: boolean;
  multiFactorRequired?: boolean;
}

export interface CompanyCurrencyConfig {
  id: string;
  baseCurrencyCode: string;
  baseCurrencySymbol: string;
  baseCurrencyFormalName?: string | null;
  decimalPlaces: number;
  decimalSeparator: string;
  thousandSeparator: string;
  symbolOnRight: boolean;
  spaceBetweenAmountAndSymbol: boolean;
  showAmountInMillions: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyCurrencyInput {
  baseCurrencyCode?: string;
  baseCurrencySymbol?: string;
  baseCurrencyFormalName?: string | null;
  decimalPlaces?: number;
  decimalSeparator?: string;
  thousandSeparator?: string;
  symbolOnRight?: boolean;
  spaceBetweenAmountAndSymbol?: boolean;
  showAmountInMillions?: boolean;
}

export interface CompanyFeatureToggle {
  id: string;
  enableAccounting: boolean;
  enableInventory: boolean;
  enableTaxation: boolean;
  enablePayroll: boolean;
  enableAIInsights: boolean;
  enableScenarioPlanning: boolean;
  enableAutomations: boolean;
  enableVendorManagement: boolean;
  enableBillingAndInvoicing: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFeatureToggleInput {
  enableAccounting?: boolean;
  enableInventory?: boolean;
  enableTaxation?: boolean;
  enablePayroll?: boolean;
  enableAIInsights?: boolean;
  enableScenarioPlanning?: boolean;
  enableAutomations?: boolean;
  enableVendorManagement?: boolean;
  enableBillingAndInvoicing?: boolean;
}

export type VoucherCategory =
  | "PAYMENT"
  | "RECEIPT"
  | "CONTRA"
  | "JOURNAL"
  | "SALES"
  | "PURCHASE"
  | "DEBIT_NOTE"
  | "CREDIT_NOTE"
  | "MEMO"
  | "REVERSING_JOURNAL"
  | "OPTIONAL"
  | "DELIVERY_NOTE"
  | "RECEIPT_NOTE"
  | "REJECTION_IN"
  | "REJECTION_OUT"
  | "STOCK_JOURNAL"
  | "PHYSICAL_STOCK"
  | "JOB_WORK_IN"
  | "JOB_WORK_OUT"
  | "MATERIAL_IN"
  | "MATERIAL_OUT";

export type VoucherNumberingMethod =
  | "NONE"
  | "MANUAL"
  | "AUTOMATIC"
  | "AUTOMATIC_WITH_OVERRIDE"
  | "MULTI_USER_AUTO";

export type VoucherNumberingBehavior = "RENUMBER" | "RETAIN";

export interface VoucherNumberingSeries {
  id: string;
  startupId: string;
  voucherTypeId: string;
  name: string;
  prefix?: string | null;
  suffix?: string | null;
  startNumber: number;
  nextNumber: number;
  numberingMethod: VoucherNumberingMethod;
  numberingBehavior: VoucherNumberingBehavior;
  allowManualOverride: boolean;
  allowDuplicateNumbers: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherType {
  id: string;
  startupId: string;
  name: string;
  abbreviation?: string | null;
  category: VoucherCategory;
  isDefault: boolean;
  numberingMethod: VoucherNumberingMethod;
  numberingBehavior: VoucherNumberingBehavior;
  nextNumber: number;
  prefix?: string | null;
  suffix?: string | null;
  allowManualOverride: boolean;
  allowDuplicateNumbers: boolean;
  createdAt: string;
  updatedAt: string;
  numberingSeries: VoucherNumberingSeries[];
}

export interface VoucherTypeInput {
  name: string;
  abbreviation?: string;
  category: VoucherCategory;
  numberingMethod?: VoucherNumberingMethod;
  numberingBehavior?: VoucherNumberingBehavior;
  prefix?: string;
  suffix?: string;
  allowManualOverride?: boolean;
  allowDuplicateNumbers?: boolean;
}

export interface VoucherTypeUpdateInput {
  abbreviation?: string | null;
  numberingMethod?: VoucherNumberingMethod;
  numberingBehavior?: VoucherNumberingBehavior;
  prefix?: string | null;
  suffix?: string | null;
  allowManualOverride?: boolean;
  allowDuplicateNumbers?: boolean;
  nextNumber?: number;
}

export interface VoucherNumberingSeriesInput {
  name: string;
  prefix?: string;
  suffix?: string;
  numberingMethod?: VoucherNumberingMethod;
  numberingBehavior?: VoucherNumberingBehavior;
  startNumber?: number;
  allowManualOverride?: boolean;
  allowDuplicateNumbers?: boolean;
  isDefault?: boolean;
}

export type VoucherEntryType = "DEBIT" | "CREDIT";
export type VoucherBillReferenceType =
  | "AGAINST"
  | "NEW"
  | "ADVANCE"
  | "ON_ACCOUNT";

export interface VoucherBillReference {
  id: string;
  voucherEntryId: string;
  reference: string;
  referenceType: VoucherBillReferenceType;
  amount: number;
  dueDate?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherEntry {
  id: string;
  voucherId: string;
  ledgerName: string;
  ledgerCode?: string | null;
  entryType: VoucherEntryType;
  amount: number;
  narration?: string | null;
  costCenterName?: string | null;
  costCategory?: string | null;
  createdAt: string;
  updatedAt: string;
  billReferences: VoucherBillReference[];
}

export interface Voucher {
  id: string;
  startupId: string;
  voucherTypeId: string;
  numberingSeriesId?: string | null;
  voucherNumber: string;
  date: string;
  reference?: string | null;
  narration?: string | null;
  createdById?: string | null;
  transactionId?: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  voucherType: VoucherType;
  numberingSeries?: VoucherNumberingSeries | null;
  entries: VoucherEntry[];
}

export interface CreateVoucherRequest {
  voucherTypeId: string;
  numberingSeriesId?: string | null;
  date?: string;
  reference?: string;
  narration?: string;
  createdById?: string;
  entries: Array<{
    ledgerName: string;
    ledgerCode?: string;
    entryType: VoucherEntryType;
    amount: number;
    narration?: string;
    costCenterName?: string;
    costCategory?: string;
    billReferences?: Array<{
      reference: string;
      amount: number;
      referenceType?: VoucherBillReferenceType;
      dueDate?: string;
      remarks?: string;
    }>;
  }>;
}

export type BillType = "RECEIVABLE" | "PAYABLE";

export type BillStatus = "OPEN" | "PARTIAL" | "SETTLED" | "CANCELLED";

export interface BillSettlement {
  id: string;
  startupId: string;
  billId: string;
  voucherId: string;
  voucherEntryId: string;
  settlementAmount: number;
  settlementDate: string;
  reference?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  voucher?: Voucher;
  voucherEntry?: VoucherEntry;
}

export interface Bill {
  id: string;
  startupId: string;
  billType: BillType;
  billNumber: string;
  ledgerName: string;
  ledgerCode?: string | null;
  billDate: string;
  dueDate?: string | null;
  originalAmount: number;
  settledAmount: number;
  outstandingAmount: number;
  status: BillStatus;
  reference?: string | null;
  narration?: string | null;
  voucherId?: string | null;
  voucherEntryId?: string | null;
  createdAt: string;
  updatedAt: string;
  voucher?: Voucher | null;
  voucherEntry?: VoucherEntry | null;
  settlements?: BillSettlement[];
}

export interface CreateBillRequest {
  billType: BillType;
  billNumber: string;
  ledgerName: string;
  ledgerCode?: string;
  billDate?: string;
  dueDate?: string;
  originalAmount: number;
  reference?: string;
  narration?: string;
  voucherId?: string;
  voucherEntryId?: string;
}

export interface SettleBillRequest {
  voucherId: string;
  voucherEntryId: string;
  settlementAmount: number;
  reference?: string;
  remarks?: string;
}

export interface BillAgingBucket {
  count: number;
  amount: number;
}

export interface BillAgingReport {
  summary: {
    totalBills: number;
    totalOutstanding: number;
  };
  aging: {
    current: BillAgingBucket;
    days30: BillAgingBucket;
    days60: BillAgingBucket;
    days90: BillAgingBucket;
    over90: BillAgingBucket;
  };
  bills: Array<{
    id: string;
    billNumber: string;
    billType: BillType;
    ledgerName: string;
    billDate: string;
    dueDate?: string | null;
    originalAmount: number;
    outstandingAmount: number;
    status: BillStatus;
    daysOverdue: number;
  }>;
}

export interface OutstandingLedgerSummary {
  ledgerName: string;
  ledgerCode?: string | null;
  billCount: number;
  totalOutstanding: number;
  bills: Array<{
    billNumber: string;
    billDate: string;
    dueDate?: string | null;
    outstandingAmount: number;
  }>;
}

export interface CostCategory {
  id: string;
  startupId: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  costCenters?: CostCenter[];
  children?: CostCategory[];
}

export interface CostCenter {
  id: string;
  startupId: string;
  categoryId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  parentId?: string | null;
  isBillable: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string };
  parent?: { id: string; name: string } | null;
}

export interface CostCategoryInput {
  name: string;
  description?: string;
  parentId?: string | null;
  isPrimary?: boolean;
}

export interface CostCenterInput {
  categoryId: string;
  name: string;
  code?: string;
  description?: string;
  parentId?: string | null;
  isBillable?: boolean;
  status?: "active" | "inactive";
}

export type LedgerCategoryCode =
  | "CAPITAL"
  | "LOAN"
  | "CURRENT_ASSET"
  | "CURRENT_LIABILITY"
  | "SUNDRY_DEBTOR"
  | "SUNDRY_CREDITOR"
  | "BANK_ACCOUNT"
  | "CASH"
  | "INVESTMENT"
  | "STOCK"
  | "PURCHASE"
  | "SALES"
  | "DIRECT_EXPENSE"
  | "DIRECT_INCOME"
  | "INDIRECT_EXPENSE"
  | "INDIRECT_INCOME"
  | "OTHER";

export type LedgerBalanceTypeCode = "DEBIT" | "CREDIT";
export type InterestComputationCode = "NONE" | "SIMPLE" | "COMPOUND";

export interface LedgerMailingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface LedgerBankDetails {
  bankName?: string;
  branch?: string;
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  swift?: string;
}

export interface LedgerGroup {
  id: string;
  startupId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  category: LedgerCategoryCode;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerGroupInput {
  name: string;
  category: LedgerCategoryCode;
  code?: string | null;
  description?: string | null;
  parentId?: string | null;
}

export interface Ledger {
  id: string;
  startupId: string;
  groupId: string;
  name: string;
  alias?: string | null;
  description?: string | null;
  inventoryAffectsStock: boolean;
  maintainBillByBill: boolean;
  defaultCreditPeriodDays?: number | null;
  creditLimit?: number | null;
  interestComputation: InterestComputationCode;
  interestRate?: number | null;
  penalRate?: number | null;
  interestGraceDays?: number | null;
  taxNumber?: string | null;
  panNumber?: string | null;
  gstNumber?: string | null;
  mailingAddress?: LedgerMailingAddress | null;
  bankDetails?: LedgerBankDetails | null;
  costCenterApplicable: boolean;
  openingBalance?: number | null;
  openingBalanceType: LedgerBalanceTypeCode;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  group?: LedgerGroup;
}

export interface LedgerInput {
  name: string;
  groupId: string;
  alias?: string | null;
  description?: string | null;
  inventoryAffectsStock?: boolean;
  maintainBillByBill?: boolean;
  defaultCreditPeriodDays?: number | null;
  creditLimit?: number | null;
  interestComputation?: InterestComputationCode;
  interestRate?: number | null;
  penalRate?: number | null;
  interestGraceDays?: number | null;
  taxNumber?: string | null;
  panNumber?: string | null;
  gstNumber?: string | null;
  mailingAddress?: LedgerMailingAddress | null;
  bankDetails?: LedgerBankDetails | null;
  costCenterApplicable?: boolean;
  openingBalance?: number | null;
  openingBalanceType?: LedgerBalanceTypeCode;
  metadata?: Record<string, unknown> | null;
}

export type InterestCalculationMode = "SIMPLE" | "COMPOUND";
export type InterestCompoundingFrequency =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

export interface InterestProfile {
  id: string;
  startupId: string;
  name: string;
  description?: string | null;
  calculationMode: InterestCalculationMode;
  rate: number;
  compoundingFrequency: InterestCompoundingFrequency;
  gracePeriodDays?: number | null;
  calculateFromDueDate: boolean;
  penalRate: number;
  penalGraceDays?: number | null;
  createdAt: string;
  updatedAt: string;
  partySettings?: PartyInterestSetting[];
}

export interface InterestProfileInput {
  name: string;
  description?: string;
  calculationMode?: InterestCalculationMode;
  rate: number;
  compoundingFrequency?: InterestCompoundingFrequency;
  gracePeriodDays?: number | null;
  calculateFromDueDate?: boolean;
  penalRate?: number | null;
  penalGraceDays?: number | null;
}

export interface PartyInterestSetting {
  id: string;
  startupId: string;
  partyId: string;
  interestProfileId: string;
  overrideRate?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  applyOnReceivables: boolean;
  applyOnPayables: boolean;
  createdAt: string;
  updatedAt: string;
  party?: { id: string; name: string; type: string };
  interestProfile?: { id: string; name: string };
}

export interface PartyInterestInput {
  partyId: string;
  interestProfileId: string;
  overrideRate?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  applyOnReceivables?: boolean;
  applyOnPayables?: boolean;
}

export interface Party {
  id: string;
  name: string;
  type: string;
  email?: string | null;
  phone?: string | null;
  openingBalance: number;
  balanceType: string;
  startupId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartyInput {
  name: string;
  type: string;
  email?: string;
  phone?: string;
  openingBalance?: number;
  balanceType?: string;
}

export type GstRegistrationType =
  | "REGULAR"
  | "COMPOSITION"
  | "SEZ"
  | "ISD"
  | "TDS"
  | "TCS";

export type GstTaxSupplyType = "GOODS" | "SERVICES";

export type GstLedgerMappingType =
  | "OUTPUT_CGST"
  | "OUTPUT_SGST"
  | "OUTPUT_IGST"
  | "OUTPUT_CESS"
  | "INPUT_CGST"
  | "INPUT_SGST"
  | "INPUT_IGST"
  | "INPUT_CESS"
  | "RCM_PAYABLE"
  | "RCM_INPUT";

export interface GstRegistration {
  id: string;
  startupId: string;
  gstin: string;
  legalName?: string | null;
  tradeName?: string | null;
  registrationType: GstRegistrationType;
  stateCode: string;
  stateName?: string | null;
  startDate: string;
  endDate?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GstRegistrationInput {
  gstin: string;
  legalName?: string;
  tradeName?: string;
  registrationType?: GstRegistrationType;
  stateCode: string;
  stateName?: string;
  startDate: string;
  endDate?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface GstTaxRate {
  id: string;
  startupId: string;
  registrationId?: string | null;
  supplyType: GstTaxSupplyType;
  hsnOrSac?: string | null;
  description?: string | null;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cessRate: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GstTaxRateInput {
  registrationId?: string | null;
  supplyType?: GstTaxSupplyType;
  hsnOrSac?: string;
  description?: string;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  cessRate?: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isActive?: boolean;
}

export interface GstLedgerMapping {
  id: string;
  startupId: string;
  registrationId?: string | null;
  mappingType: GstLedgerMappingType;
  ledgerName: string;
  ledgerCode?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GstLedgerMappingInput {
  registrationId?: string | null;
  mappingType: GstLedgerMappingType;
  ledgerName: string;
  ledgerCode?: string;
  description?: string;
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  VIEW = "VIEW",
  EXPORT = "EXPORT",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  CANCEL = "CANCEL",
}

export enum AuditEntityType {
  VOUCHER = "VOUCHER",
  VOUCHER_ENTRY = "VOUCHER_ENTRY",
  BILL = "BILL",
  BILL_SETTLEMENT = "BILL_SETTLEMENT",
  COMPANY_PROFILE = "COMPANY_PROFILE",
  COMPANY_ADDRESS = "COMPANY_ADDRESS",
  FISCAL_CONFIG = "FISCAL_CONFIG",
  SECURITY_CONFIG = "SECURITY_CONFIG",
  CURRENCY_CONFIG = "CURRENCY_CONFIG",
  FEATURE_TOGGLE = "FEATURE_TOGGLE",
  VOUCHER_TYPE = "VOUCHER_TYPE",
  VOUCHER_NUMBERING_SERIES = "VOUCHER_NUMBERING_SERIES",
  COST_CATEGORY = "COST_CATEGORY",
  COST_CENTER = "COST_CENTER",
  INTEREST_PROFILE = "INTEREST_PROFILE",
  PARTY_INTEREST_SETTING = "PARTY_INTEREST_SETTING",
  GST_REGISTRATION = "GST_REGISTRATION",
  GST_TAX_RATE = "GST_TAX_RATE",
  GST_LEDGER_MAPPING = "GST_LEDGER_MAPPING",
  PARTY_MASTER = "PARTY_MASTER",
  PRODUCT = "PRODUCT",
  TRANSACTION = "TRANSACTION",
  USER = "USER",
  ROLE = "ROLE",
  PERMISSION = "PERMISSION",
}

export interface AuditLog {
  id: string;
  startupId: string;
  userId?: string | null;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  description?: string | null;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface AuditLogFilters {
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  userId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogSummary {
  totalLogs: number;
  byAction: Array<{ action: AuditAction; count: number }>;
  byEntityType: Array<{ entityType: AuditEntityType; count: number }>;
  recentActivity: AuditLog[];
}

// ============================================================================
// ROLE MANAGEMENT TYPES
// ============================================================================

export interface Permission {
  id: string;
  action: string;
  subject: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    roles: number;
  };
}

export interface PermissionInput {
  action: string;
  subject: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: Array<{
    id: string;
    action: string;
    subject: string;
    description?: string | null;
  }>;
  _count?: {
    users: number;
  };
  users?: Array<{
    user: {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      isActive: boolean;
    };
  }>;
}

export interface RoleInput {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: string;
  role: Role;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export interface UserWithRoles {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles: Array<{
    role: Role;
    assignedAt: string;
  }>;
}

// ============================================================================
// VOUCHER AI TYPES
// ============================================================================

export interface VoucherAlert {
  type: "anomaly" | "pattern" | "risk" | "opportunity";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  voucherIds: string[];
  recommendations?: string[];
  metadata?: any;
}

export interface VoucherVariance {
  period: string;
  category: string;
  expected: number;
  actual: number;
  variance: number;
  variancePercent: number;
  vouchers: Array<{
    id: string;
    voucherNumber: string;
    date: string;
    amount: number;
  }>;
}

export interface VoucherInsights {
  summary: string;
  trends: string[];
  insights: string[];
  recommendations: string[];
}

export interface Startup {
  id: string;
  name: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  trialEndsAt?: string;
  companyProfile?: CompanyProfile | null;
  fiscalConfig?: CompanyFiscalConfig | null;
  securityConfig?: CompanySecurityConfig | null;
  currencyConfig?: CompanyCurrencyConfig | null;
  featureToggle?: CompanyFeatureToggle | null;
  voucherTypes?: VoucherType[];
}

export interface SignupRequest {
  email: string;
  password: string;
  startupName: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiListResponse<T = any> extends ApiResponse<T> {
  total?: number;
}

export interface CompanyAddressInput {
  id?: string;
  label?: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isPrimary?: boolean;
  isBilling?: boolean;
  isShipping?: boolean;
}

export interface CompanyProfileInput {
  displayName: string;
  legalName?: string;
  mailingName?: string;
  baseCurrency?: string;
  country?: string;
  state?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  addresses?: CompanyAddressInput[];
}

// Transaction Types
export interface Transaction {
  id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  description: string;
  date: string;
  startupId: string;
  accountId: string;
  account?: {
    id: string;
    accountName: string;
  };
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  quantity: number;
  price: number;
  cost?: number;
  sku?: string;
  reorderLevel?: number;
  minStockLevel?: number;
  maxStock?: number;
  supplier?: string;
  lastRestocked?: string;
  salesCount?: number;
  startupId: string;
  createdAt: string;
  updatedAt: string;
  sales?: Sale[];
}

// Sale Types
export interface Sale {
  id: string;
  quantitySold: number;
  totalPrice: number;
  saleDate: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
  transactionId: string;
  transaction: {
    id: string;
    amount: number;
    date: string;
  };
}

// Bank Account Types
export interface BankAccount {
  id: string;
  accountName: string;
  balance: number;
  startupId: string;
  createdAt: string;
  updatedAt: string;
  transactions?: Transaction[];
}

// Dashboard Types
export interface DashboardSummary {
  financial: {
    totalBalance: number;
    monthlyBurn: number;
    monthlyRevenue: number;
    netCashflow: number;
    runwayMonths: number | null;
    income: number;
    expenses: number;
  };
  inventory: {
    totalProducts: number;
    totalInventoryValue: number;
    lowStockProducts: number;
  };
  sales: {
    totalSales30Days: number;
    unitsSold30Days: number;
    salesCount: number;
  };
  accounts: {
    count: number;
    breakdown: Array<{
      id: string;
      name: string;
      balance: number;
      institution?: string;
      mask?: string;
    }>;
  };
  balance: {
    total: number;
  };
  cashFlow: {
    netCashFlow: number;
    burnRate: number;
    runway: number;
    dailyBreakdown: Array<{
      date: string;
      value: number;
    }>;
  };
  categories: {
    breakdown: Array<{
      name: string;
      amount: number;
      percentage: number;
    }>;
  };
}

export interface CashflowChartData {
  date: string;
  income: number;
  expenses: number;
  netCashflow: number;
}

export interface RecentActivity {
  type: "transaction" | "sale";
  id: string;
  description: string;
  amount: number;
  transactionType: "CREDIT" | "DEBIT";
  date: string;
  account?: string;
  product?: string;
}

// Team Member Types
export interface TeamMember {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tempPassword?: string;
}

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for long-running imports
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("authToken");
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// API METHODS
// ============================================================================

export const apiClient = {
  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  auth: {
    signup: async (data: SignupRequest): Promise<AuthResponse> => {
      const response = await api.post("/auth/signup", data);
      return response.data;
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
      const response = await api.post("/auth/login", data);
      return response.data;
    },

    me: async (): Promise<ApiResponse<{ user: User; startup: Startup }>> => {
      const response = await api.get("/auth/me");
      return response.data;
    },

    logout: async (): Promise<ApiResponse> => {
      const response = await api.post("/auth/logout");
      return response.data;
    },
  },

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  transactions: {
    create: async (data: {
      amount: number;
      type: "CREDIT" | "DEBIT";
      description: string;
      accountId: string;
    }): Promise<ApiResponse<Transaction>> => {
      const response = await api.post("/transactions", data);
      return response.data;
    },

    list: async (params?: {
      accountId?: string;
      type?: "CREDIT" | "DEBIT";
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }): Promise<ApiResponse<Transaction[]>> => {
      const response = await api.get("/transactions", { params });
      return response.data;
    },

    getById: async (id: string): Promise<ApiResponse<Transaction>> => {
      const response = await api.get(`/transactions/${id}`);
      return response.data;
    },

    delete: async (id: string): Promise<ApiResponse> => {
      const response = await api.delete(`/transactions/${id}`);
      return response.data;
    },
  },

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  dashboard: {
    summary: async (): Promise<ApiResponse<DashboardSummary>> => {
      const response = await api.get("/dashboard/summary");
      return response.data;
    },

    cashflowChart: async (
      months?: number
    ): Promise<ApiResponse<CashflowChartData[]>> => {
      const response = await api.get("/dashboard/cashflow-chart", {
        params: months ? { months } : {},
      });
      return response.data;
    },

    recentActivity: async (
      limit?: number
    ): Promise<ApiResponse<RecentActivity[]>> => {
      const response = await api.get("/dashboard/recent-activity", {
        params: limit ? { limit } : {},
      });
      return response.data;
    },

    // Additional dashboard methods
    dashboard: async (period: string): Promise<ApiResponse<any>> => {
      const response = await api.get("/dashboard", { params: { period } });
      return response.data;
    },

    getScenarios: async (): Promise<ApiResponse<any[]>> => {
      const response = await api.get("/ai-cfo/scenarios");
      return response.data;
    },

    forecast: async (months: number): Promise<ApiResponse<any>> => {
      const response = await api.post("/ai-cfo/forecast", { months });
      return response.data;
    },

    runScenario: async (
      name: string,
      inputs: any
    ): Promise<ApiResponse<any>> => {
      const response = await api.post("/ai-cfo/scenario", { name, inputs });
      return response.data;
    },

    latest: async (): Promise<ApiResponse<any>> => {
      const response = await api.get("/analytics/latest");
      return response.data;
    },

    history: async (months: number): Promise<ApiResponse<any>> => {
      const response = await api.get("/analytics/history", {
        params: { months },
      });
      return response.data;
    },

    calculate: async (): Promise<ApiResponse<any>> => {
      const response = await api.post("/analytics/calculate");
      return response.data;
    },

    plaid: {
      exchangePublicToken: async (
        publicToken: string
      ): Promise<ApiResponse<any>> => {
        const response = await api.post("/plaid/exchange-token", {
          public_token: publicToken,
        });
        return response.data;
      },

      syncTransactions: async (itemId: string): Promise<ApiResponse<any>> => {
        const response = await api.post("/plaid/sync", { item_id: itemId });
        return response.data;
      },
    },
  },

  // ============================================================================
  // INVENTORY
  // ============================================================================

  inventory: {
    products: {
      create: async (data: {
        name: string;
        quantity: number;
        price: number;
      }): Promise<ApiResponse<Product>> => {
        const response = await api.post("/inventory/products", data);
        return response.data;
      },

      list: async (): Promise<ApiResponse<Product[]>> => {
        const response = await api.get("/inventory/products");
        return response.data;
      },

      getById: async (id: string): Promise<ApiResponse<Product>> => {
        const response = await api.get(`/inventory/products/${id}`);
        return response.data;
      },

      update: async (
        id: string,
        data: {
          name?: string;
          quantity?: number;
          price?: number;
        }
      ): Promise<ApiResponse<Product>> => {
        const response = await api.put(`/inventory/products/${id}`, data);
        return response.data;
      },

      delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/inventory/products/${id}`);
        return response.data;
      },
    },

    sales: {
      simulate: async (data: {
        productId: string;
        quantitySold: number;
        accountId: string;
      }): Promise<
        ApiResponse<{ sale: Sale; transaction: Transaction; product: Product }>
      > => {
        const response = await api.post("/inventory/sales", data);
        return response.data;
      },

      list: async (limit?: number): Promise<ApiResponse<Sale[]>> => {
        const response = await api.get("/inventory/sales", {
          params: limit ? { limit } : {},
        });
        return response.data;
      },
    },
  },

  // ============================================================================
  // BANK ACCOUNTS
  // ============================================================================

  accounts: {
    create: async (data: {
      accountName: string;
      balance?: number;
    }): Promise<ApiResponse<BankAccount>> => {
      const response = await api.post("/accounts", data);
      return response.data;
    },

    list: async (): Promise<ApiResponse<BankAccount[]>> => {
      const response = await api.get("/accounts");
      return response.data;
    },

    getById: async (id: string): Promise<ApiResponse<BankAccount>> => {
      const response = await api.get(`/accounts/${id}`);
      return response.data;
    },

    update: async (
      id: string,
      data: {
        accountName?: string;
        balance?: number;
      }
    ): Promise<ApiResponse<BankAccount>> => {
      const response = await api.put(`/accounts/${id}`, data);
      return response.data;
    },

    delete: async (id: string): Promise<ApiResponse> => {
      const response = await api.delete(`/accounts/${id}`);
      return response.data;
    },

    plaid: {
      createLinkToken: async (): Promise<
        ApiResponse<{ link_token: string }>
      > => {
        const response = await api.post("/plaid/link-token");
        return response.data;
      },

      exchangePublicToken: async (
        publicToken: string
      ): Promise<ApiResponse<any>> => {
        const response = await api.post("/plaid/exchange-token", {
          public_token: publicToken,
        });
        return response.data;
      },

      syncTransactions: async (itemId: string): Promise<ApiResponse<any>> => {
        const response = await api.post("/plaid/sync", { item_id: itemId });
        return response.data;
      },
    },
  },

  // ============================================================================
  // TEAM MANAGEMENT
  // ============================================================================

  team: {
    invite: async (data: {
      email: string;
      roleName: string;
      firstName?: string;
      lastName?: string;
    }): Promise<ApiResponse<TeamMember>> => {
      const response = await api.post("/team/invite", data);
      return response.data;
    },

    list: async (): Promise<ApiResponse<TeamMember[]>> => {
      const response = await api.get("/team");
      return response.data;
    },

    updateRole: async (
      userId: string,
      roleName: string
    ): Promise<ApiResponse<TeamMember>> => {
      const response = await api.put(`/team/${userId}/role`, { roleName });
      return response.data;
    },

    deactivate: async (userId: string): Promise<ApiResponse> => {
      const response = await api.post(`/team/${userId}/deactivate`);
      return response.data;
    },
  },

  // ============================================================================
  // COMPANY PROFILE
  // ============================================================================

  company: {
    getProfile: async (): Promise<ApiResponse<CompanyProfile | null>> => {
      const response = await api.get("/company/profile");
      return response.data;
    },

    updateProfile: async (
      data: CompanyProfileInput
    ): Promise<ApiResponse<CompanyProfile>> => {
      const response = await api.put("/company/profile", data);
      return response.data;
    },

    getFiscal: async (): Promise<ApiResponse<CompanyFiscalConfig | null>> => {
      const response = await api.get("/company/fiscal");
      return response.data;
    },

    updateFiscal: async (
      data: CompanyFiscalInput
    ): Promise<ApiResponse<CompanyFiscalConfig>> => {
      const response = await api.put("/company/fiscal", data);
      return response.data;
    },

    getSecurity: async (): Promise<
      ApiResponse<CompanySecurityConfig | null>
    > => {
      const response = await api.get("/company/security");
      return response.data;
    },

    updateSecurity: async (
      data: CompanySecurityInput
    ): Promise<ApiResponse<CompanySecurityConfig>> => {
      const response = await api.put("/company/security", data);
      return response.data;
    },

    getCurrency: async (): Promise<
      ApiResponse<CompanyCurrencyConfig | null>
    > => {
      const response = await api.get("/company/currency");
      return response.data;
    },

    updateCurrency: async (
      data: CompanyCurrencyInput
    ): Promise<ApiResponse<CompanyCurrencyConfig>> => {
      const response = await api.put("/company/currency", data);
      return response.data;
    },

    getFeatureToggles: async (): Promise<
      ApiResponse<CompanyFeatureToggle | null>
    > => {
      const response = await api.get("/company/feature-toggles");
      return response.data;
    },

    updateFeatureToggles: async (
      data: CompanyFeatureToggleInput
    ): Promise<ApiResponse<CompanyFeatureToggle>> => {
      const response = await api.put("/company/feature-toggles", data);
      return response.data;
    },
  },

  // ============================================================================
  // BILL-WISE TRACKING
  // ============================================================================

  bills: {
    list: async (params?: {
      billType?: BillType;
      status?: BillStatus;
      ledgerName?: string;
      fromDate?: string;
      toDate?: string;
      dueDateFrom?: string;
      dueDateTo?: string;
      limit?: number;
      offset?: number;
    }): Promise<ApiListResponse<Bill[]>> => {
      const response = await api.get("/bills", { params });
      return response.data;
    },

    create: async (data: CreateBillRequest): Promise<ApiResponse<Bill>> => {
      const response = await api.post("/bills", data);
      return response.data;
    },

    settle: async (
      billId: string,
      data: SettleBillRequest
    ): Promise<ApiResponse<{ settlement: BillSettlement; bill: Bill }>> => {
      const response = await api.post(`/bills/${billId}/settle`, data);
      return response.data;
    },

    getAgingReport: async (
      billType?: BillType
    ): Promise<ApiResponse<BillAgingReport>> => {
      const response = await api.get("/bills/aging", {
        params: billType ? { billType } : undefined,
      });
      return response.data;
    },

    getOutstandingByLedger: async (
      billType?: BillType
    ): Promise<ApiResponse<OutstandingLedgerSummary[]>> => {
      const response = await api.get("/bills/outstanding-by-ledger", {
        params: billType ? { billType } : undefined,
      });
      return response.data;
    },

    getReminders: async (params?: {
      billType?: BillType;
      daysBeforeReminder?: number;
    }): Promise<ApiResponse<any>> => {
      const response = await api.get("/bills/reminders", { params });
      return response.data;
    },

    getCashFlowProjections: async (params?: {
      months?: number;
    }): Promise<ApiResponse<any>> => {
      const response = await api.get("/bills/cash-flow-projections", {
        params,
      });
      return response.data;
    },

    getAnalytics: async (params?: {
      fromDate?: string;
      toDate?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.get("/bills/analytics", { params });
      return response.data;
    },
  },

  costing: {
    listCategories: async (): Promise<ApiResponse<CostCategory[]>> => {
      const response = await api.get("/costing/categories");
      return response.data;
    },

    createCategory: async (
      data: CostCategoryInput
    ): Promise<ApiResponse<CostCategory>> => {
      const response = await api.post("/costing/categories", data);
      return response.data;
    },

    updateCategory: async (
      categoryId: string,
      data: Partial<CostCategoryInput>
    ): Promise<ApiResponse<CostCategory>> => {
      const response = await api.put(`/costing/categories/${categoryId}`, data);
      return response.data;
    },

    deleteCategory: async (categoryId: string): Promise<ApiResponse> => {
      const response = await api.delete(`/costing/categories/${categoryId}`);
      return response.data;
    },

    listCenters: async (params?: {
      categoryId?: string;
      status?: string;
    }): Promise<ApiResponse<CostCenter[]>> => {
      const response = await api.get("/costing/centers", { params });
      return response.data;
    },

    createCenter: async (
      data: CostCenterInput
    ): Promise<ApiResponse<CostCenter>> => {
      const response = await api.post("/costing/centers", data);
      return response.data;
    },

    updateCenter: async (
      centerId: string,
      data: Partial<CostCenterInput>
    ): Promise<ApiResponse<CostCenter>> => {
      const response = await api.put(`/costing/centers/${centerId}`, data);
      return response.data;
    },

    deleteCenter: async (centerId: string): Promise<ApiResponse> => {
      const response = await api.delete(`/costing/centers/${centerId}`);
      return response.data;
    },

    listInterestProfiles: async (): Promise<ApiResponse<InterestProfile[]>> => {
      const response = await api.get("/costing/interest-profiles");
      return response.data;
    },

    createInterestProfile: async (
      data: InterestProfileInput
    ): Promise<ApiResponse<InterestProfile>> => {
      const response = await api.post("/costing/interest-profiles", data);
      return response.data;
    },

    updateInterestProfile: async (
      profileId: string,
      data: Partial<InterestProfileInput>
    ): Promise<ApiResponse<InterestProfile>> => {
      const response = await api.put(
        `/costing/interest-profiles/${profileId}`,
        data
      );
      return response.data;
    },

    deleteInterestProfile: async (profileId: string): Promise<ApiResponse> => {
      const response = await api.delete(
        `/costing/interest-profiles/${profileId}`
      );
      return response.data;
    },

    listPartyInterestSettings: async (): Promise<
      ApiResponse<PartyInterestSetting[]>
    > => {
      const response = await api.get("/costing/interest-settings");
      return response.data;
    },

    assignInterestToParty: async (
      data: PartyInterestInput
    ): Promise<ApiResponse<PartyInterestSetting>> => {
      const response = await api.post("/costing/interest-settings", data);
      return response.data;
    },

    removeInterestForParty: async (partyId: string): Promise<ApiResponse> => {
      const response = await api.delete(
        `/costing/interest-settings/${partyId}`
      );
      return response.data;
    },
  },

  bookkeeping: {
    listLedgerGroups: async (): Promise<ApiResponse<LedgerGroup[]>> => {
      const response = await api.get("/bookkeeping/ledger-groups");
      return response.data;
    },

    createLedgerGroup: async (
      data: LedgerGroupInput
    ): Promise<ApiResponse<LedgerGroup>> => {
      const response = await api.post("/bookkeeping/ledger-groups", data);
      return response.data;
    },

    updateLedgerGroup: async (
      groupId: string,
      data: Partial<LedgerGroupInput>
    ): Promise<ApiResponse<LedgerGroup>> => {
      const response = await api.put(
        `/bookkeeping/ledger-groups/${groupId}`,
        data
      );
      return response.data;
    },

    deleteLedgerGroup: async (groupId: string): Promise<ApiResponse> => {
      const response = await api.delete(
        `/bookkeeping/ledger-groups/${groupId}`
      );
      return response.data;
    },

    listLedgers: async (): Promise<ApiResponse<Ledger[]>> => {
      const response = await api.get("/bookkeeping/ledgers");
      return response.data;
    },

    createLedger: async (data: LedgerInput): Promise<ApiResponse<Ledger>> => {
      const response = await api.post("/bookkeeping/ledgers", data);
      return response.data;
    },

    updateLedger: async (
      ledgerId: string,
      data: Partial<LedgerInput>
    ): Promise<ApiResponse<Ledger>> => {
      const response = await api.put(`/bookkeeping/ledgers/${ledgerId}`, data);
      return response.data;
    },

    deleteLedger: async (ledgerId: string): Promise<ApiResponse> => {
      const response = await api.delete(`/bookkeeping/ledgers/${ledgerId}`);
      return response.data;
    },

    getTrialBalance: async (asOnDate?: string): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/trial-balance", {
        params: { asOnDate },
      });
      return response.data;
    },

    getProfitAndLoss: async (params?: {
      fromDate?: string;
      toDate?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/profit-loss", {
        params,
      });
      return response.data;
    },

    getBalanceSheet: async (asOnDate?: string): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/balance-sheet", {
        params: { asOnDate },
      });
      return response.data;
    },

    getCashFlow: async (params?: {
      fromDate?: string;
      toDate?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/cash-flow", {
        params,
      });
      return response.data;
    },

    getFinancialRatios: async (
      asOnDate?: string
    ): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/financial-ratios", {
        params: { asOnDate },
      });
      return response.data;
    },

    getCashBook: async (params?: {
      fromDate?: string;
      toDate?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/cash-book", {
        params,
      });
      return response.data;
    },

    getBankBook: async (params?: {
      bankLedgerName?: string;
      fromDate?: string;
      toDate?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/bank-book", {
        params,
      });
      return response.data;
    },

    getDayBook: async (date: string): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/day-book", {
        params: { date },
      });
      return response.data;
    },

    getLedgerBook: async (params?: {
      ledgerName?: string;
      fromDate?: string;
      toDate?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/ledger-book", {
        params,
      });
      return response.data;
    },

    getJournals: async (params?: {
      journalType?:
        | "SALES"
        | "PURCHASE"
        | "PAYMENT"
        | "RECEIPT"
        | "CONTRA"
        | "JOURNAL";
      fromDate?: string;
      toDate?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/journals", {
        params,
      });
      return response.data;
    },

    getExceptionReports: async (params?: {
      asOnDate?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/exception-reports", {
        params,
      });
      return response.data;
    },

    getCostCentrePL: async (params?: {
      costCentreId?: string;
      fromDate?: string;
      toDate?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/cost-centre-pl", {
        params,
      });
      return response.data;
    },

    createBudget: async (data: any): Promise<ApiResponse<any>> => {
      const response = await api.post("/bookkeeping/budgets", data);
      return response.data;
    },

    listBudgets: async (params?: {
      budgetType?: "LEDGER" | "GROUP" | "COST_CENTRE";
      periodStart?: string;
      periodEnd?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/budgets", { params });
      return response.data;
    },

    getBudgetVariance: async (params?: {
      budgetType?: "LEDGER" | "GROUP" | "COST_CENTRE";
      periodStart?: string;
      periodEnd?: string;
      includeBreaches?: boolean;
    }): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/budgets/variance", {
        params,
      });
      return response.data;
    },

    getBudgetBreaches: async (params?: {
      asOnDate?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.get("/bookkeeping/budgets/breaches", {
        params,
      });
      return response.data;
    },

    generateClosingEntries: async (data: {
      financialYearEnd: string;
      narration?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post(
        "/bookkeeping/year-end/closing-entries",
        data
      );
      return response.data;
    },

    runDepreciation: async (data: {
      asOnDate: string;
      depreciationRate?: number;
      narration?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post(
        "/bookkeeping/year-end/depreciation",
        data
      );
      return response.data;
    },

    carryForwardBalances: async (data: {
      fromFinancialYearEnd: string;
      toFinancialYearStart: string;
    }): Promise<ApiResponse<any>> => {
      const response = await api.post(
        "/bookkeeping/year-end/carry-forward",
        data
      );
      return response.data;
    },
  },

  gst: {
    listRegistrations: async (): Promise<ApiResponse<GstRegistration[]>> => {
      const response = await api.get("/gst/registrations");
      return response.data;
    },

    createRegistration: async (
      data: GstRegistrationInput
    ): Promise<ApiResponse<GstRegistration>> => {
      const response = await api.post("/gst/registrations", data);
      return response.data;
    },

    updateRegistration: async (
      registrationId: string,
      data: Partial<GstRegistrationInput>
    ): Promise<ApiResponse<GstRegistration>> => {
      const response = await api.put(
        `/gst/registrations/${registrationId}`,
        data
      );
      return response.data;
    },

    deleteRegistration: async (
      registrationId: string
    ): Promise<ApiResponse> => {
      const response = await api.delete(`/gst/registrations/${registrationId}`);
      return response.data;
    },

    listTaxRates: async (params?: {
      registrationId?: string;
      supplyType?: GstTaxSupplyType;
      hsnOrSac?: string;
    }): Promise<ApiResponse<GstTaxRate[]>> => {
      const response = await api.get("/gst/tax-rates", { params });
      return response.data;
    },

    createTaxRate: async (
      data: GstTaxRateInput
    ): Promise<ApiResponse<GstTaxRate>> => {
      const response = await api.post("/gst/tax-rates", data);
      return response.data;
    },

    updateTaxRate: async (
      taxRateId: string,
      data: GstTaxRateInput
    ): Promise<ApiResponse<GstTaxRate>> => {
      const response = await api.put(`/gst/tax-rates/${taxRateId}`, data);
      return response.data;
    },

    deleteTaxRate: async (taxRateId: string): Promise<ApiResponse> => {
      const response = await api.delete(`/gst/tax-rates/${taxRateId}`);
      return response.data;
    },

    listLedgerMappings: async (params?: {
      registrationId?: string;
      mappingType?: GstLedgerMappingType;
    }): Promise<ApiResponse<GstLedgerMapping[]>> => {
      const response = await api.get("/gst/ledger-mappings", { params });
      return response.data;
    },

    createLedgerMapping: async (
      data: GstLedgerMappingInput
    ): Promise<ApiResponse<GstLedgerMapping>> => {
      const response = await api.post("/gst/ledger-mappings", data);
      return response.data;
    },

    updateLedgerMapping: async (
      mappingId: string,
      data: Partial<GstLedgerMappingInput>
    ): Promise<ApiResponse<GstLedgerMapping>> => {
      const response = await api.put(`/gst/ledger-mappings/${mappingId}`, data);
      return response.data;
    },

    deleteLedgerMapping: async (mappingId: string): Promise<ApiResponse> => {
      const response = await api.delete(`/gst/ledger-mappings/${mappingId}`);
      return response.data;
    },
  },

  vouchers: {
    listTypes: async (): Promise<ApiResponse<VoucherType[]>> => {
      const response = await api.get("/vouchers/types");
      return response.data;
    },

    createType: async (
      data: VoucherTypeInput
    ): Promise<ApiResponse<VoucherType>> => {
      const response = await api.post("/vouchers/types", data);
      return response.data;
    },

    updateType: async (
      voucherTypeId: string,
      data: VoucherTypeUpdateInput
    ): Promise<ApiResponse<VoucherType>> => {
      const response = await api.put(`/vouchers/types/${voucherTypeId}`, data);
      return response.data;
    },

    createSeries: async (
      voucherTypeId: string,
      data: VoucherNumberingSeriesInput
    ): Promise<ApiResponse<VoucherNumberingSeries>> => {
      const response = await api.post(
        `/vouchers/types/${voucherTypeId}/series`,
        data
      );
      return response.data;
    },

    generateNextNumber: async (
      voucherTypeId: string,
      numberingSeriesId?: string
    ): Promise<ApiResponse<{ voucherNumber: string }>> => {
      const response = await api.post(
        `/vouchers/types/${voucherTypeId}/next-number`,
        {
          numberingSeriesId,
        }
      );
      return response.data;
    },
    list: async (params?: {
      voucherTypeId?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
    }): Promise<ApiResponse<Voucher[]>> => {
      const response = await api.get("/vouchers", { params });
      return response.data;
    },
    create: async (
      data: CreateVoucherRequest
    ): Promise<ApiResponse<Voucher>> => {
      const response = await api.post("/vouchers", data);
      return response.data;
    },

    reverse: async (
      voucherId: string,
      params?: {
        reversalDate?: string;
        narration?: string;
      }
    ): Promise<ApiResponse<any>> => {
      const response = await api.post(`/vouchers/${voucherId}/reverse`, params);
      return response.data;
    },
  },

  // ============================================================================
  // AI FEATURES (OpenAI Integration)
  // ============================================================================

  ai: {
    getInsights: async (): Promise<
      ApiResponse<{
        burnAnalysis: string;
        topSpendingCategories: string[];
        costSavingSuggestions: string[];
        revenueOpportunities: string[];
        cashflowHealth: string;
        keyMetrics: {
          totalBalance: number;
          monthlyBurn: number;
          monthlyRevenue: number;
          runway: number | null;
        };
      }>
    > => {
      const response = await api.post("/ai/insights");
      return response.data;
    },

    runWhatIfScenario: async (
      scenario: string
    ): Promise<
      ApiResponse<{
        scenario: string;
        impact: {
          runwayChange: string;
          burnRateChange: string;
          recommendation: string;
        };
        explanation: string;
        risks: string[];
        opportunities: string[];
      }>
    > => {
      const response = await api.post("/ai/scenarios", { scenario });
      return response.data;
    },

    generateInvestorUpdate: async (
      periodStart: string,
      periodEnd: string
    ): Promise<
      ApiResponse<{
        id: string;
        executiveSummary: string;
        highlights: string[];
        challenges: string[];
        nextSteps: string[];
        financialSummary: string;
        financialData: {
          revenue: number;
          expenses: number;
          netCashflow: number;
        };
      }>
    > => {
      const response = await api.post("/ai/investor-update", {
        periodStart,
        periodEnd,
      });
      return response.data;
    },

    chat: async (
      message: string
    ): Promise<ApiResponse<{ response: string }>> => {
      const response = await api.post("/ai-cfo/chat", { message });
      return response.data;
    },
  },

  // ============================================================================
  // STRIPE
  // ============================================================================

  stripe: {
    sync: async (): Promise<ApiResponse<any>> => {
      const response = await api.post("/stripe/sync");
      return response.data;
    },

    connect: async (apiKey: string): Promise<ApiResponse<any>> => {
      const response = await api.post("/stripe/connect", { apiKey });
      return response.data;
    },

    getAccount: async (): Promise<ApiResponse<any>> => {
      const response = await api.get("/stripe/account");
      return response.data;
    },

    disconnect: async (): Promise<ApiResponse<any>> => {
      const response = await api.delete("/stripe/disconnect");
      return response.data;
    },
  },

  // ============================================================================
  // IMPORT
  // ============================================================================

  import: {
    tally: async (importData: any): Promise<ApiResponse<any>> => {
      const response = await api.post("/import/tally", importData);
      return response.data;
    },

    tallyEnhanced: async (importData: any): Promise<ApiResponse<any>> => {
      const response = await api.post("/import/tally-enhanced", importData);
      return response.data;
    },

    downloadTemplate: async (): Promise<Blob> => {
      const response = await api.get("/import/template", {
        responseType: "blob",
      });
      return response.data;
    },
  },

  export: {
    vouchers: async (params?: {
      voucherTypeId?: string;
      fromDate?: string;
      toDate?: string;
      numberingSeriesId?: string;
    }): Promise<Blob> => {
      const response = await api.get("/import/export/vouchers", {
        params,
        responseType: "blob",
      });
      return response.data;
    },

    ledgers: async (): Promise<Blob> => {
      const response = await api.get("/import/export/ledgers", {
        responseType: "blob",
      });
      return response.data;
    },

    gst: async (): Promise<Blob> => {
      const response = await api.get("/import/export/gst", {
        responseType: "blob",
      });
      return response.data;
    },
  },

  // ============================================================================
  // PARTY MASTER
  // ============================================================================

  parties: {
    list: async (): Promise<ApiResponse<Party[]>> => {
      const response = await api.get("/parties");
      return response.data;
    },

    create: async (data: PartyInput): Promise<ApiResponse<Party>> => {
      const response = await api.post("/parties", data);
      return response.data;
    },
  },

  // ============================================================================
  // AUDIT LOG
  // ============================================================================

  audit: {
    list: async (
      filters?: AuditLogFilters
    ): Promise<ApiResponse<{ data: AuditLog[]; total: number }>> => {
      const response = await api.get("/audit", { params: filters });
      return response.data;
    },

    getEntityLog: async (
      entityType: AuditEntityType,
      entityId: string
    ): Promise<ApiResponse<AuditLog[]>> => {
      const response = await api.get(`/audit/entity/${entityType}/${entityId}`);
      return response.data;
    },

    getSummary: async (
      fromDate?: string,
      toDate?: string
    ): Promise<ApiResponse<AuditLogSummary>> => {
      const response = await api.get("/audit/summary", {
        params: { fromDate, toDate },
      });
      return response.data;
    },
  },

  // ============================================================================
  // VOUCHER AI
  // ============================================================================

  voucherAI: {
    getAnomalies: async (
      fromDate?: string,
      toDate?: string
    ): Promise<ApiResponse<VoucherAlert[]>> => {
      const response = await api.get("/voucher-ai/anomalies", {
        params: { fromDate, toDate },
      });
      return response.data;
    },

    getVariances: async (
      period?: "monthly" | "quarterly" | "yearly"
    ): Promise<ApiResponse<VoucherVariance[]>> => {
      const response = await api.get("/voucher-ai/variances", {
        params: { period },
      });
      return response.data;
    },

    getInsights: async (
      fromDate?: string,
      toDate?: string
    ): Promise<ApiResponse<VoucherInsights>> => {
      const response = await api.get("/voucher-ai/insights", {
        params: { fromDate, toDate },
      });
      return response.data;
    },
  },

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  roles: {
    list: async (): Promise<ApiResponse<Role[]>> => {
      const response = await api.get("/admin/roles");
      return response.data;
    },

    get: async (roleId: string): Promise<ApiResponse<Role>> => {
      const response = await api.get(`/admin/roles/${roleId}`);
      return response.data;
    },

    create: async (data: RoleInput): Promise<ApiResponse<Role>> => {
      const response = await api.post("/admin/roles", data);
      return response.data;
    },

    update: async (
      roleId: string,
      data: Partial<RoleInput>
    ): Promise<ApiResponse<Role>> => {
      const response = await api.put(`/admin/roles/${roleId}`, data);
      return response.data;
    },

    delete: async (roleId: string): Promise<ApiResponse> => {
      const response = await api.delete(`/admin/roles/${roleId}`);
      return response.data;
    },
  },

  permissions: {
    list: async (): Promise<ApiResponse<Permission[]>> => {
      const response = await api.get("/admin/permissions");
      return response.data;
    },

    get: async (permissionId: string): Promise<ApiResponse<Permission>> => {
      const response = await api.get(`/admin/permissions/${permissionId}`);
      return response.data;
    },

    create: async (data: PermissionInput): Promise<ApiResponse<Permission>> => {
      const response = await api.post("/admin/permissions", data);
      return response.data;
    },

    update: async (
      permissionId: string,
      data: Partial<PermissionInput>
    ): Promise<ApiResponse<Permission>> => {
      const response = await api.put(
        `/admin/permissions/${permissionId}`,
        data
      );
      return response.data;
    },

    delete: async (permissionId: string): Promise<ApiResponse> => {
      const response = await api.delete(`/admin/permissions/${permissionId}`);
      return response.data;
    },
  },

  userRoles: {
    list: async (): Promise<ApiResponse<UserWithRoles[]>> => {
      const response = await api.get("/admin/users");
      return response.data;
    },

    assign: async (
      userId: string,
      roleId: string
    ): Promise<ApiResponse<UserRole>> => {
      const response = await api.post(`/admin/users/${userId}/roles`, {
        roleId,
      });
      return response.data;
    },

    remove: async (userId: string, roleId: string): Promise<ApiResponse> => {
      const response = await api.delete(
        `/admin/users/${userId}/roles/${roleId}`
      );
      return response.data;
    },

    set: async (
      userId: string,
      roleIds: string[]
    ): Promise<ApiResponse<UserWithRoles>> => {
      const response = await api.put(`/admin/users/${userId}/roles`, {
        roleIds,
      });
      return response.data;
    },
  },
};

export default api;
