import {
  VoucherCategory,
  VoucherEntryType,
  LedgerSubtype,
  PaymentMode,
  Prisma,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { Voucher, VoucherInventoryLine, Ledger } from "@prisma/client";

export interface VoucherPostingEntry {
  ledgerId?: string;
  ledgerName: string;
  ledgerCode?: string;
  entryType: VoucherEntryType;
  amount: number;
  narration?: string;
}

export interface VoucherPostingData {
  voucher: Voucher & {
    voucherType: { category: VoucherCategory };
    partyLedger?: Ledger | null;
    inventoryLines?: VoucherInventoryLine[];
  };
  inventoryLines?: Array<{
    itemId: string;
    warehouseId: string;
    quantity: number;
    rate: number;
    amount: number;
    discountAmount?: number;
    gstRatePercent?: number;
  }>;
  gstAmounts?: {
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
    total: number;
  };
  companyState?: string;
  placeOfSupply?: string;
}

/**
 * Apply posting rules for PAYMENT voucher
 * DR: paid_to_ledger (expense/supplier)
 * CR: paid_from_ledger (CASH/BANK)
 *
 * Note: For payment vouchers, we use the existing entries if they exist (from manual entry),
 * otherwise we derive from partyLedgerId and find a cash/bank ledger.
 */
export async function applyPaymentRules(
  data: VoucherPostingData
): Promise<VoucherPostingEntry[]> {
  const { voucher } = data;

  // Check if entries already exist (from manual entry form)
  const existingEntries = await prisma.voucherEntry.findMany({
    where: { voucherId: voucher.id },
  });

  if (existingEntries.length >= 2) {
    // Use existing entries (manual entry)
    return existingEntries.map((e) => ({
      ledgerId: e.ledgerId || undefined,
      ledgerName: e.ledgerName,
      ledgerCode: e.ledgerCode || undefined,
      entryType: e.entryType,
      amount: Number(e.amount),
      narration: e.narration || undefined,
    }));
  }

  // Auto-generate entries from party ledger
  if (!voucher.partyLedgerId) {
    throw new Error("Payment voucher requires party ledger (paid_to_ledger)");
  }

  const paidToLedger = await prisma.ledger.findUnique({
    where: { id: voucher.partyLedgerId },
  });

  if (!paidToLedger) {
    throw new Error("Paid to ledger not found");
  }

  // Find cash/bank ledger - prefer CASH, then BANK
  const cashLedgers = await prisma.ledger.findMany({
    where: {
      startupId: voucher.startupId,
      ledgerSubtype: LedgerSubtype.CASH,
    },
    take: 1,
  });

  const bankLedgers = await prisma.ledger.findMany({
    where: {
      startupId: voucher.startupId,
      ledgerSubtype: LedgerSubtype.BANK,
    },
    take: 1,
  });

  const paidFromLedger = cashLedgers[0] || bankLedgers[0];

  if (!paidFromLedger) {
    throw new Error(
      "No CASH or BANK ledger found for payment. Please create a cash or bank ledger."
    );
  }

  const entries: VoucherPostingEntry[] = [
    {
      ledgerId: paidToLedger.id,
      ledgerName: paidToLedger.name,
      ledgerCode: undefined,
      entryType: VoucherEntryType.DEBIT,
      amount: Number(voucher.totalAmount),
      narration: voucher.narration || undefined,
    },
    {
      ledgerId: paidFromLedger.id,
      ledgerName: paidFromLedger.name,
      ledgerCode: undefined,
      entryType: VoucherEntryType.CREDIT,
      amount: Number(voucher.totalAmount),
      narration: voucher.narration || undefined,
    },
  ];

  return entries;
}

/**
 * Apply posting rules for RECEIPT voucher
 * DR: received_into_ledger (CASH/BANK)
 * CR: received_from_ledger (customer/income)
 */
export async function applyReceiptRules(
  data: VoucherPostingData
): Promise<VoucherPostingEntry[]> {
  const { voucher } = data;

  // Check if entries already exist (from manual entry form)
  const existingEntries = await prisma.voucherEntry.findMany({
    where: { voucherId: voucher.id },
  });

  if (existingEntries.length >= 2) {
    // Use existing entries (manual entry)
    return existingEntries.map((e) => ({
      ledgerId: e.ledgerId || undefined,
      ledgerName: e.ledgerName,
      ledgerCode: e.ledgerCode || undefined,
      entryType: e.entryType,
      amount: Number(e.amount),
      narration: e.narration || undefined,
    }));
  }

  // Auto-generate entries from party ledger
  if (!voucher.partyLedgerId) {
    throw new Error(
      "Receipt voucher requires party ledger (received_from_ledger)"
    );
  }

  const receivedFromLedger = await prisma.ledger.findUnique({
    where: { id: voucher.partyLedgerId },
  });

  if (!receivedFromLedger) {
    throw new Error("Received from ledger not found");
  }

  // Find cash/bank ledger - prefer CASH, then BANK
  const cashLedgers = await prisma.ledger.findMany({
    where: {
      startupId: voucher.startupId,
      ledgerSubtype: LedgerSubtype.CASH,
    },
    take: 1,
  });

  const bankLedgers = await prisma.ledger.findMany({
    where: {
      startupId: voucher.startupId,
      ledgerSubtype: LedgerSubtype.BANK,
    },
    take: 1,
  });

  const receivedIntoLedger = cashLedgers[0] || bankLedgers[0];

  if (!receivedIntoLedger) {
    throw new Error(
      "No CASH or BANK ledger found for receipt. Please create a cash or bank ledger."
    );
  }

  const entries: VoucherPostingEntry[] = [
    {
      ledgerId: receivedIntoLedger.id,
      ledgerName: receivedIntoLedger.name,
      ledgerCode: undefined,
      entryType: VoucherEntryType.DEBIT,
      amount: Number(voucher.totalAmount),
      narration: voucher.narration || undefined,
    },
    {
      ledgerId: receivedFromLedger.id,
      ledgerName: receivedFromLedger.name,
      ledgerCode: undefined,
      entryType: VoucherEntryType.CREDIT,
      amount: Number(voucher.totalAmount),
      narration: voucher.narration || undefined,
    },
  ];

  return entries;
}

/**
 * Apply posting rules for CONTRA voucher
 * DR: destination_ledger (CASH/BANK)
 * CR: source_ledger (CASH/BANK)
 */
export async function applyContraRules(
  data: VoucherPostingData
): Promise<VoucherPostingEntry[]> {
  const { voucher } = data;

  // For contra, we need source and destination ledgers
  // This is a limitation - we might need to add sourceLedgerId and destinationLedgerId
  // For now, we'll use partyLedgerId as destination and find a source
  if (!voucher.partyLedgerId) {
    throw new Error("Contra voucher requires destination ledger");
  }

  const destinationLedger = await prisma.ledger.findUnique({
    where: { id: voucher.partyLedgerId },
  });

  if (!destinationLedger) {
    throw new Error("Destination ledger not found");
  }

  if (
    destinationLedger.ledgerSubtype !== LedgerSubtype.CASH &&
    destinationLedger.ledgerSubtype !== LedgerSubtype.BANK
  ) {
    throw new Error("Contra destination ledger must be CASH or BANK");
  }

  // Find another CASH/BANK ledger as source
  const sourceLedgers = await prisma.ledger.findMany({
    where: {
      startupId: voucher.startupId,
      ledgerSubtype: {
        in: [LedgerSubtype.CASH, LedgerSubtype.BANK],
      },
      id: {
        not: destinationLedger.id,
      },
    },
    take: 1,
  });

  if (sourceLedgers.length === 0) {
    throw new Error("No source CASH or BANK ledger found for contra");
  }

  const sourceLedger = sourceLedgers[0];

  const entries: VoucherPostingEntry[] = [
    {
      ledgerId: destinationLedger.id,
      ledgerName: destinationLedger.name,
      ledgerCode: undefined,
      entryType: VoucherEntryType.DEBIT,
      amount: Number(voucher.totalAmount),
      narration: voucher.narration || undefined,
    },
    {
      ledgerId: sourceLedger.id,
      ledgerName: sourceLedger.name,
      ledgerCode: undefined,
      entryType: VoucherEntryType.CREDIT,
      amount: Number(voucher.totalAmount),
      narration: voucher.narration || undefined,
    },
  ];

  return entries;
}

/**
 * Apply posting rules for SALES voucher
 * DR: customer_ledger (grand_total)
 * CR: sales_ledger (net_amount)
 * CR: GST output ledgers (tax_amount)
 */
export async function applySalesRules(
  data: VoucherPostingData
): Promise<VoucherPostingEntry[]> {
  const { voucher, inventoryLines, gstAmounts } = data;

  if (!voucher.partyLedgerId) {
    throw new Error("Sales voucher requires customer ledger");
  }

  if (!inventoryLines || inventoryLines.length === 0) {
    throw new Error("Sales voucher requires at least one inventory line");
  }

  const customerLedger = await prisma.ledger.findUnique({
    where: { id: voucher.partyLedgerId },
  });

  if (!customerLedger) {
    throw new Error("Customer ledger not found");
  }

  // Calculate net amount (sum of all line amounts)
  const netAmount = inventoryLines.reduce(
    (sum, line) => sum + Number(line.amount),
    0
  );

  // Find sales ledger - first try by subtype, then by group category
  let salesLedger = await prisma.ledger.findFirst({
    where: {
      startupId: voucher.startupId,
      ledgerSubtype: LedgerSubtype.SALES,
    },
  });

  if (!salesLedger) {
    // Try finding by group category
    const salesLedgers = await prisma.ledger.findMany({
      where: {
        startupId: voucher.startupId,
        group: {
          category: "SALES",
        },
      },
      take: 1,
    });
    salesLedger = salesLedgers[0] || null;
  }

  if (!salesLedger) {
    throw new Error(
      "No SALES ledger found. Please create a sales ledger with ledgerSubtype=SALES or in a SALES group."
    );
  }

  const entries: VoucherPostingEntry[] = [
    {
      ledgerId: customerLedger.id,
      ledgerName: customerLedger.name,
      ledgerCode: undefined,
      entryType: VoucherEntryType.DEBIT,
      amount: Number(voucher.totalAmount), // Grand total including GST
      narration: voucher.narration || undefined,
    },
    {
      ledgerId: salesLedger.id,
      ledgerName: salesLedger.name,
      ledgerCode: undefined,
      entryType: VoucherEntryType.CREDIT,
      amount: netAmount, // Net amount excluding GST
      narration: voucher.narration || undefined,
    },
  ];

  // Add GST output entries if GST is applicable
  if (gstAmounts && gstAmounts.total > 0) {
    // GST entries will be added by the posting engine using GST ledger mappings
    // We return the GST amounts in the data for the posting engine to handle
  }

  return entries;
}

/**
 * Apply posting rules for PURCHASE voucher
 * DR: purchase_ledger (net_amount)
 * DR: GST input ledgers (tax_amount)
 * CR: supplier_ledger (grand_total)
 */
export async function applyPurchaseRules(
  data: VoucherPostingData
): Promise<VoucherPostingEntry[]> {
  const { voucher, inventoryLines, gstAmounts } = data;

  if (!voucher.partyLedgerId) {
    throw new Error("Purchase voucher requires supplier ledger");
  }

  if (!inventoryLines || inventoryLines.length === 0) {
    throw new Error("Purchase voucher requires at least one inventory line");
  }

  const supplierLedger = await prisma.ledger.findUnique({
    where: { id: voucher.partyLedgerId },
  });

  if (!supplierLedger) {
    throw new Error("Supplier ledger not found");
  }

  // Calculate net amount
  const netAmount = inventoryLines.reduce(
    (sum, line) => sum + Number(line.amount),
    0
  );

  // Find purchase ledger - first try by subtype, then by group category
  let purchaseLedger = await prisma.ledger.findFirst({
    where: {
      startupId: voucher.startupId,
      ledgerSubtype: LedgerSubtype.PURCHASE,
    },
  });

  if (!purchaseLedger) {
    // Try finding by group category
    const purchaseLedgers = await prisma.ledger.findMany({
      where: {
        startupId: voucher.startupId,
        group: {
          category: "PURCHASE",
        },
      },
      take: 1,
    });
    purchaseLedger = purchaseLedgers[0] || null;
  }

  if (!purchaseLedger) {
    throw new Error(
      "No PURCHASE ledger found. Please create a purchase ledger with ledgerSubtype=PURCHASE or in a PURCHASE group."
    );
  }

  const entries: VoucherPostingEntry[] = [
    {
      ledgerId: purchaseLedger.id,
      ledgerName: purchaseLedger.name,
      ledgerCode: undefined,
      entryType: VoucherEntryType.DEBIT,
      amount: netAmount, // Net amount excluding GST
      narration: voucher.narration || undefined,
    },
    {
      ledgerId: supplierLedger.id,
      ledgerName: supplierLedger.name,
      ledgerCode: undefined,
      entryType: VoucherEntryType.CREDIT,
      amount: Number(voucher.totalAmount), // Grand total including GST
      narration: voucher.narration || undefined,
    },
  ];

  // GST input entries will be added by the posting engine

  return entries;
}

/**
 * Apply posting rules for JOURNAL voucher
 * Multi-line DR/CR grid - entries are provided manually
 */
export async function applyJournalRules(
  data: VoucherPostingData
): Promise<VoucherPostingEntry[]> {
  // Journal vouchers have manual entries, so we return the existing entries
  // The entries should already be in voucher.entries
  const { voucher } = data;

  const existingEntries = await prisma.voucherEntry.findMany({
    where: { voucherId: voucher.id },
  });

  if (existingEntries.length < 2) {
    throw new Error("Journal voucher requires at least two entries");
  }

  // Validate that DR = CR
  const totalDebit = existingEntries
    .filter((e) => e.entryType === VoucherEntryType.DEBIT)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalCredit = existingEntries
    .filter((e) => e.entryType === VoucherEntryType.CREDIT)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Journal voucher is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`
    );
  }

  // Return entries as-is (they're already created)
  return existingEntries.map((e) => ({
    ledgerId: e.ledgerId || undefined,
    ledgerName: e.ledgerName,
    ledgerCode: e.ledgerCode || undefined,
    entryType: e.entryType,
    amount: Number(e.amount),
    narration: e.narration || undefined,
  }));
}

/**
 * Apply posting rules for CREDIT_NOTE (Sales Return)
 * DR: sales_return_ledger (net_amount)
 * DR: GST reversal ledgers (tax_amount)
 * CR: customer_ledger (grand_total)
 */
export async function applyCreditNoteRules(
  data: VoucherPostingData
): Promise<VoucherPostingEntry[]> {
  const { voucher, inventoryLines, gstAmounts } = data;

  if (!voucher.partyLedgerId) {
    throw new Error("Credit note requires customer ledger");
  }

  const customerLedger = await prisma.ledger.findUnique({
    where: { id: voucher.partyLedgerId },
  });

  if (!customerLedger) {
    throw new Error("Customer ledger not found");
  }

  const netAmount = inventoryLines
    ? inventoryLines.reduce((sum, line) => sum + Number(line.amount), 0)
    : Number(voucher.totalAmount);

  // Find sales return ledger - try by group category first
  let salesReturnLedger = await prisma.ledger.findFirst({
    where: {
      startupId: voucher.startupId,
      group: {
        category: "INDIRECT_INCOME", // Sales return is typically in indirect income
      },
    },
  });

  // If not found, try to find any income ledger
  if (!salesReturnLedger) {
    const incomeLedgers = await prisma.ledger.findMany({
      where: {
        startupId: voucher.startupId,
        group: {
          category: {
            in: ["DIRECT_INCOME", "INDIRECT_INCOME"],
          },
        },
      },
      take: 1,
    });
    salesReturnLedger = incomeLedgers[0] || null;
  }

  if (!salesReturnLedger) {
    throw new Error(
      "No sales return ledger found. Please create a ledger in INDIRECT_INCOME group."
    );
  }

  const entries: VoucherPostingEntry[] = [
    {
      ledgerId: salesReturnLedger.id,
      ledgerName: salesReturnLedger.name,
      ledgerCode: undefined,
      entryType: VoucherEntryType.DEBIT,
      amount: netAmount,
      narration: voucher.narration || undefined,
    },
    {
      ledgerId: customerLedger.id,
      ledgerName: customerLedger.name,
      ledgerCode: undefined,
      entryType: VoucherEntryType.CREDIT,
      amount: Number(voucher.totalAmount),
      narration: voucher.narration || undefined,
    },
  ];

  return entries;
}

/**
 * Apply posting rules for DEBIT_NOTE (Purchase Return)
 * DR: supplier_ledger (grand_total)
 * CR: purchase_return_ledger (net_amount)
 * CR: GST reversal ledgers (tax_amount)
 */
export async function applyDebitNoteRules(
  data: VoucherPostingData
): Promise<VoucherPostingEntry[]> {
  const { voucher, inventoryLines, gstAmounts } = data;

  if (!voucher.partyLedgerId) {
    throw new Error("Debit note requires supplier ledger");
  }

  const supplierLedger = await prisma.ledger.findUnique({
    where: { id: voucher.partyLedgerId },
  });

  if (!supplierLedger) {
    throw new Error("Supplier ledger not found");
  }

  const netAmount = inventoryLines
    ? inventoryLines.reduce((sum, line) => sum + Number(line.amount), 0)
    : Number(voucher.totalAmount);

  // Find purchase return ledger - try by group category first
  let purchaseReturnLedger = await prisma.ledger.findFirst({
    where: {
      startupId: voucher.startupId,
      group: {
        category: "INDIRECT_EXPENSE", // Purchase return is typically in indirect expense
      },
    },
  });

  // If not found, try to find any expense ledger
  if (!purchaseReturnLedger) {
    const expenseLedgers = await prisma.ledger.findMany({
      where: {
        startupId: voucher.startupId,
        group: {
          category: {
            in: ["DIRECT_EXPENSE", "INDIRECT_EXPENSE"],
          },
        },
      },
      take: 1,
    });
    purchaseReturnLedger = expenseLedgers[0] || null;
  }

  if (!purchaseReturnLedger) {
    throw new Error(
      "No purchase return ledger found. Please create a ledger in INDIRECT_EXPENSE group."
    );
  }

  const entries: VoucherPostingEntry[] = [
    {
      ledgerId: supplierLedger.id,
      ledgerName: supplierLedger.name,
      ledgerCode: undefined,
      entryType: VoucherEntryType.DEBIT,
      amount: Number(voucher.totalAmount),
      narration: voucher.narration || undefined,
    },
    {
      ledgerId: purchaseReturnLedger.id,
      ledgerName: purchaseReturnLedger.name,
      ledgerCode: undefined,
      entryType: VoucherEntryType.CREDIT,
      amount: netAmount,
      narration: voucher.narration || undefined,
    },
  ];

  return entries;
}

/**
 * Apply posting rules based on voucher category
 */
export async function applyPostingRules(
  data: VoucherPostingData
): Promise<VoucherPostingEntry[]> {
  const category = data.voucher.voucherType.category;

  switch (category) {
    case VoucherCategory.PAYMENT:
      return applyPaymentRules(data);
    case VoucherCategory.RECEIPT:
      return applyReceiptRules(data);
    case VoucherCategory.CONTRA:
      return applyContraRules(data);
    case VoucherCategory.JOURNAL:
      return applyJournalRules(data);
    case VoucherCategory.SALES:
      return applySalesRules(data);
    case VoucherCategory.PURCHASE:
      return applyPurchaseRules(data);
    case VoucherCategory.CREDIT_NOTE:
      return applyCreditNoteRules(data);
    case VoucherCategory.DEBIT_NOTE:
      return applyDebitNoteRules(data);
    case VoucherCategory.DELIVERY_NOTE:
    case VoucherCategory.RECEIPT_NOTE:
    case VoucherCategory.STOCK_JOURNAL:
      // These don't have ledger entries, only inventory updates
      return [];
    case VoucherCategory.MEMO:
      // Memo vouchers don't affect ledgers
      return [];
    default:
      throw new Error(
        `Posting rules not implemented for voucher category: ${category}`
      );
  }
}
