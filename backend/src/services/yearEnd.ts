import {
  Prisma,
  LedgerCategory,
  LedgerBalanceType,
  VoucherCategory,
  VoucherNumberingMethod,
  VoucherEntryType,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createVoucher } from "./vouchers";

export interface ClosingEntryInput {
  financialYearEnd: string; // ISO date string
  narration?: string;
  createdById?: string;
}

export interface DepreciationRunInput {
  asOnDate: string; // ISO date string
  assetLedgerGroupIds?: string[]; // Optional: specific asset groups
  depreciationRate?: number; // Optional: override default rate
  narration?: string;
}

/**
 * Generate closing entries for year-end
 * Transfers P&L balances to Capital/Retained Earnings
 */
type VoucherWithRelations = Prisma.VoucherGetPayload<{
  include: {
    entries: {
      include: {
        billReferences: true;
      };
    };
    inventoryLines: {
      include: {
        item: true;
        warehouse: true;
      };
    };
    voucherType: true;
    numberingSeries: true;
    partyLedger: true;
  };
}>;

interface ClosingEntry {
  ledgerName: string;
  entryType: VoucherEntryType;
  amount: number;
  narration?: string;
}

export async function generateClosingEntries(
  startupId: string,
  input: ClosingEntryInput
): Promise<{ voucher: VoucherWithRelations; entries: ClosingEntry[] }> {
  const yearEndDate = new Date(input.financialYearEnd);

  // Get all income and expense ledgers
  const incomeExpenseLedgers = await prisma.ledger.findMany({
    where: {
      startupId,
      group: {
        category: {
          in: [
            LedgerCategory.DIRECT_INCOME,
            LedgerCategory.INDIRECT_INCOME,
            LedgerCategory.DIRECT_EXPENSE,
            LedgerCategory.INDIRECT_EXPENSE,
          ],
        },
      },
    },
    include: { group: true },
  });

  // Calculate closing balances for each ledger
  const closingBalances = new Map<
    string,
    { amount: number; type: "DEBIT" | "CREDIT" }
  >();

  for (const ledger of incomeExpenseLedgers) {
    const openingBalance = Number(ledger.openingBalance || 0);
    const openingType = ledger.openingBalanceType || LedgerBalanceType.DEBIT;

    const entries = await prisma.voucherEntry.findMany({
      where: {
        voucher: {
          startupId,
          date: { lte: yearEndDate },
        },
        ledgerName: ledger.name,
      },
      select: {
        entryType: true,
        amount: true,
      },
    });

    let debitTotal =
      openingType === LedgerBalanceType.DEBIT ? openingBalance : 0;
    let creditTotal =
      openingType === LedgerBalanceType.CREDIT ? openingBalance : 0;

    for (const entry of entries) {
      if (entry.entryType === "DEBIT") {
        debitTotal += Number(entry.amount);
      } else {
        creditTotal += Number(entry.amount);
      }
    }

    const balance = Math.abs(debitTotal - creditTotal);
    const balanceType = debitTotal >= creditTotal ? "DEBIT" : "CREDIT";

    if (balance > 0) {
      closingBalances.set(ledger.name, { amount: balance, type: balanceType });
    }
  }

  // Calculate net profit/loss
  let totalIncome = 0;
  let totalExpense = 0;

  for (const [ledgerName, balance] of closingBalances) {
    const ledger = incomeExpenseLedgers.find((l) => l.name === ledgerName);
    if (!ledger) continue;

    const category = ledger.group.category;
    if (
      category === LedgerCategory.DIRECT_INCOME ||
      category === LedgerCategory.INDIRECT_INCOME
    ) {
      // Incomes are credits
      if (balance.type === "CREDIT") {
        totalIncome += balance.amount;
      } else {
        totalExpense += balance.amount;
      }
    } else {
      // Expenses are debits
      if (balance.type === "DEBIT") {
        totalExpense += balance.amount;
      } else {
        totalIncome += balance.amount;
      }
    }
  }

  const netProfit = totalIncome - totalExpense;

  // Find or create Capital/Retained Earnings account
  let capitalLedger = await prisma.ledger.findFirst({
    where: {
      startupId,
      name: { contains: "Capital", mode: "insensitive" },
      group: {
        category: LedgerCategory.CAPITAL,
      },
    },
  });

  if (!capitalLedger) {
    // Create capital ledger if not exists
    const capitalGroup = await prisma.ledgerGroup.findFirst({
      where: {
        startupId,
        category: LedgerCategory.CAPITAL,
      },
    });

    if (!capitalGroup) {
      throw new Error(
        "Capital account group not found. Please create it first."
      );
    }

    capitalLedger = await prisma.ledger.create({
      data: {
        startupId,
        groupId: capitalGroup.id,
        name: "Capital Account",
        openingBalance: 0,
        openingBalanceType: LedgerBalanceType.CREDIT,
      },
    });
  }

  // Build closing entry
  const closingEntries = [];

  // Close all income/expense accounts
  for (const [ledgerName, balance] of closingBalances) {
    const ledger = incomeExpenseLedgers.find((l) => l.name === ledgerName);
    if (!ledger) continue;

    const category = ledger.group.category;
    const isIncome =
      category === LedgerCategory.DIRECT_INCOME ||
      category === LedgerCategory.INDIRECT_INCOME;

    if (isIncome) {
      // Income accounts: debit to close (opposite of balance)
      if (balance.type === "CREDIT") {
        closingEntries.push({
          ledgerName: ledger.name,
          entryType: VoucherEntryType.DEBIT,
          amount: balance.amount,
          narration: `Closing entry - ${input.narration || "Year end"}`,
        });
      }
    } else {
      // Expense accounts: credit to close (opposite of balance)
      if (balance.type === "DEBIT") {
        closingEntries.push({
          ledgerName: ledger.name,
          entryType: VoucherEntryType.CREDIT,
          amount: balance.amount,
          narration: `Closing entry - ${input.narration || "Year end"}`,
        });
      }
    }
  }

  // Transfer net profit/loss to Capital
  if (netProfit !== 0) {
    closingEntries.push({
      ledgerName: capitalLedger.name,
      entryType:
        netProfit > 0 ? VoucherEntryType.CREDIT : VoucherEntryType.DEBIT,
      amount: Math.abs(netProfit),
      narration: `Net ${netProfit > 0 ? "Profit" : "Loss"} transferred - ${input.narration || "Year end"}`,
    });
  }

  if (closingEntries.length === 0) {
    throw new Error("No closing entries to generate");
  }

  // Find or create Closing Entry voucher type
  let closingType = await prisma.voucherType.findFirst({
    where: {
      startupId,
      category: VoucherCategory.JOURNAL,
      name: { contains: "Closing", mode: "insensitive" },
    },
  });

  if (!closingType) {
    closingType = await prisma.voucherType.create({
      data: {
        startupId,
        name: "Closing Entry",
        category: VoucherCategory.JOURNAL,
        numberingMethod: VoucherNumberingMethod.AUTOMATIC,
      },
    });
  }

  // Create closing voucher
  const closingVoucher = await createVoucher(startupId, {
    voucherTypeId: closingType.id,
    date: yearEndDate.toISOString().split("T")[0],
    narration:
      input.narration ||
      `Year-end closing entries for ${yearEndDate.getFullYear()}`,
    entries: closingEntries,
    createdById: input.createdById,
  });

  return {
    voucher: closingVoucher,
    entries: closingEntries,
  };
}

/**
 * Run depreciation calculation
 */
interface DepreciationEntry {
  ledgerName: string;
  entryType: VoucherEntryType;
  amount: number;
  narration?: string;
}

export async function runDepreciation(
  startupId: string,
  input: DepreciationRunInput
): Promise<{ voucher: VoucherWithRelations; depreciationEntries: DepreciationEntry[] }> {
  const asOnDate = new Date(input.asOnDate);

  // Get fixed asset ledgers
  const assetGroups = await prisma.ledgerGroup.findMany({
    where: {
      startupId,
      category: LedgerCategory.CURRENT_ASSET, // In production, use FIXED_ASSET category
    },
  });

  if (assetGroups.length === 0) {
    throw new Error("No asset groups found for depreciation");
  }

  const assetLedgers = await prisma.ledger.findMany({
    where: {
      startupId,
      groupId: { in: assetGroups.map((g) => g.id) },
    },
    include: { group: true },
  });

  const depreciationRate = input.depreciationRate || 10; // Default 10% per annum
  const depreciationEntries = [];

  for (const ledger of assetLedgers) {
    const openingBalance = Number(ledger.openingBalance || 0);

    // Calculate current book value
    const entries = await prisma.voucherEntry.findMany({
      where: {
        voucher: {
          startupId,
          date: { lte: asOnDate },
        },
        ledgerName: ledger.name,
      },
      select: {
        entryType: true,
        amount: true,
      },
    });

    let bookValue = openingBalance;
    for (const entry of entries) {
      if (entry.entryType === "DEBIT") {
        bookValue += Number(entry.amount);
      } else {
        bookValue -= Number(entry.amount);
      }
    }

    if (bookValue > 0) {
      const depreciationAmount = (bookValue * depreciationRate) / 100;

      // Debit Depreciation Expense, Credit Asset
      depreciationEntries.push({
        ledgerName: "Depreciation Expense", // Should exist or be created
        entryType: "DEBIT" as const,
        amount: depreciationAmount,
        narration: `Depreciation on ${ledger.name} - ${input.narration || "Annual depreciation"}`,
      });

      depreciationEntries.push({
        ledgerName: ledger.name,
        entryType: "CREDIT" as const,
        amount: depreciationAmount,
        narration: `Depreciation on ${ledger.name} - ${input.narration || "Annual depreciation"}`,
      });
    }
  }

  if (depreciationEntries.length === 0) {
    throw new Error("No depreciation entries to generate");
  }

  // Find or create Depreciation voucher type
  let depType = await prisma.voucherType.findFirst({
    where: {
      startupId,
      category: VoucherCategory.JOURNAL,
      name: { contains: "Depreciation", mode: "insensitive" },
    },
  });

  if (!depType) {
    depType = await prisma.voucherType.create({
      data: {
        startupId,
        name: "Depreciation Entry",
        category: VoucherCategory.JOURNAL,
        numberingMethod: VoucherNumberingMethod.AUTOMATIC,
      },
    });
  }

  // Create depreciation voucher
  const depVoucher = await createVoucher(startupId, {
    voucherTypeId: depType.id,
    date: asOnDate.toISOString().split("T")[0],
    narration:
      input.narration ||
      `Depreciation run as on ${asOnDate.toISOString().split("T")[0]}`,
    entries: depreciationEntries,
  });

  return {
    voucher: depVoucher,
    depreciationEntries,
  };
}

/**
 * Carry forward opening balances to new financial year
 */
export async function carryForwardBalances(
  startupId: string,
  fromFinancialYearEnd: string,
  toFinancialYearStart: string
): Promise<{ success: boolean; message: string }> {
  const yearEndDate = new Date(fromFinancialYearEnd);
  const yearStartDate = new Date(toFinancialYearStart);

  // Get all ledgers
  const ledgers = await prisma.ledger.findMany({
    where: { startupId },
    include: { group: true },
  });

  // Calculate closing balances for each ledger
  for (const ledger of ledgers) {
    const openingBalance = Number(ledger.openingBalance || 0);
    const openingType = ledger.openingBalanceType || LedgerBalanceType.DEBIT;

    const entries = await prisma.voucherEntry.findMany({
      where: {
        voucher: {
          startupId,
          date: { lte: yearEndDate },
        },
        ledgerName: ledger.name,
      },
      select: {
        entryType: true,
        amount: true,
      },
    });

    let debitTotal =
      openingType === LedgerBalanceType.DEBIT ? openingBalance : 0;
    let creditTotal =
      openingType === LedgerBalanceType.CREDIT ? openingBalance : 0;

    for (const entry of entries) {
      if (entry.entryType === "DEBIT") {
        debitTotal += Number(entry.amount);
      } else {
        creditTotal += Number(entry.amount);
      }
    }

    const closingBalance = Math.abs(debitTotal - creditTotal);
    const closingType =
      debitTotal >= creditTotal
        ? LedgerBalanceType.DEBIT
        : LedgerBalanceType.CREDIT;

    // Update opening balance for new year
    await prisma.ledger.update({
      where: { id: ledger.id },
      data: {
        openingBalance: closingBalance,
        openingBalanceType: closingType,
      },
    });
  }

  return {
    success: true,
    message: `Opening balances carried forward from ${yearEndDate.toISOString().split("T")[0]} to ${yearStartDate.toISOString().split("T")[0]}`,
  };
}
