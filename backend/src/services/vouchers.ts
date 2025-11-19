import {
  AuditAction,
  AuditEntityType,
  Prisma,
  VoucherBillReferenceType,
  VoucherEntryType,
  VoucherCategory,
  VoucherNumberingMethod,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createAuditLog } from "./auditLog";

export interface VoucherBillReferenceInput {
  reference: string;
  amount: number;
  referenceType?: VoucherBillReferenceType;
  dueDate?: string;
  remarks?: string;
}

export interface VoucherEntryInput {
  ledgerName: string;
  ledgerCode?: string;
  entryType: VoucherEntryType;
  amount: number;
  narration?: string;
  costCenterName?: string;
  costCategory?: string;
  billReferences?: VoucherBillReferenceInput[];
}

export interface CreateVoucherInput {
  voucherTypeId: string;
  numberingSeriesId?: string | null;
  date?: string;
  reference?: string;
  narration?: string;
  entries: VoucherEntryInput[];
  createdById?: string;
}

interface VoucherNumberingContext {
  nextNumber: number;
  prefix?: string | null;
  suffix?: string | null;
}

const buildVoucherNumber = (ctx: VoucherNumberingContext) => {
  const sequence = ctx.nextNumber.toString();
  return `${ctx.prefix ?? ""}${sequence}${ctx.suffix ?? ""}`;
};

const assertBalancedEntries = (entries: VoucherEntryInput[]) => {
  if (!entries || entries.length < 2) {
    throw new Error("Voucher requires at least two ledger entries");
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of entries) {
    if (!entry.ledgerName?.trim()) {
      throw new Error("Ledger name is required for each entry");
    }

    if (typeof entry.amount !== "number" || entry.amount <= 0) {
      throw new Error("Entry amount must be a positive number");
    }

    if (entry.entryType === "DEBIT") {
      totalDebit += entry.amount;
    } else if (entry.entryType === "CREDIT") {
      totalCredit += entry.amount;
    } else {
      throw new Error("Invalid entry type");
    }
  }

  const roundedDebit = Math.round(totalDebit * 100) / 100;
  const roundedCredit = Math.round(totalCredit * 100) / 100;

  if (roundedDebit !== roundedCredit) {
    throw new Error(
      "Voucher is not balanced. Total debit must equal total credit."
    );
  }

  return roundedDebit;
};

/**
 * Calculate current balance for a ledger
 */
async function getLedgerCurrentBalance(
  startupId: string,
  ledgerName: string,
  asOnDate?: Date
): Promise<{ balance: number; balanceType: "DEBIT" | "CREDIT" }> {
  const ledger = await prisma.ledger.findFirst({
    where: {
      startupId,
      name: ledgerName,
    },
    include: { group: true },
  });

  if (!ledger) {
    return { balance: 0, balanceType: "DEBIT" };
  }

  const openingBalance = Number(ledger.openingBalance || 0);
  const openingType = ledger.openingBalanceType || "DEBIT";

  // Get voucher entries affecting this ledger
  const dateFilter = asOnDate ? { lte: asOnDate } : {};
  const entries = await prisma.voucherEntry.findMany({
    where: {
      voucher: {
        startupId,
        date: dateFilter,
      },
      ledgerName: ledgerName,
    },
    select: {
      entryType: true,
      amount: true,
    },
  });

  let debitTotal = openingType === "DEBIT" ? openingBalance : 0;
  let creditTotal = openingType === "CREDIT" ? openingBalance : 0;

  for (const entry of entries) {
    if (entry.entryType === "DEBIT") {
      debitTotal += Number(entry.amount);
    } else {
      creditTotal += Number(entry.amount);
    }
  }

  const balance = Math.abs(debitTotal - creditTotal);
  const balanceType = debitTotal >= creditTotal ? "DEBIT" : "CREDIT";

  return { balance, balanceType };
}

/**
 * Check if credit limit will be exceeded
 */
async function checkCreditLimit(
  startupId: string,
  ledgerName: string,
  creditAmount: number
): Promise<{
  allowed: boolean;
  currentBalance: number;
  creditLimit: number | null;
  message?: string;
}> {
  const ledger = await prisma.ledger.findFirst({
    where: {
      startupId,
      name: ledgerName,
    },
  });

  if (!ledger || !ledger.creditLimit) {
    return {
      allowed: true,
      currentBalance: 0,
      creditLimit: null,
    };
  }

  const current = await getLedgerCurrentBalance(startupId, ledgerName);
  const currentCreditBalance =
    current.balanceType === "CREDIT" ? current.balance : 0;
  const newCreditBalance = currentCreditBalance + creditAmount;
  const creditLimit = Number(ledger.creditLimit);

  if (newCreditBalance > creditLimit) {
    return {
      allowed: false,
      currentBalance: currentCreditBalance,
      creditLimit,
      message: `Credit limit of ${creditLimit} will be exceeded. Current balance: ${currentCreditBalance}, New transaction: ${creditAmount}, Result: ${newCreditBalance}`,
    };
  }

  return {
    allowed: true,
    currentBalance: currentCreditBalance,
    creditLimit,
  };
}

export const createVoucher = async (
  startupId: string,
  payload: CreateVoucherInput
) => {
  const totalAmount = assertBalancedEntries(payload.entries);

  // Check credit limits for all CREDIT entries
  for (const entry of payload.entries) {
    if (entry.entryType === "CREDIT") {
      const limitCheck = await checkCreditLimit(
        startupId,
        entry.ledgerName,
        entry.amount
      );
      if (!limitCheck.allowed) {
        throw new Error(
          limitCheck.message ||
            `Credit limit exceeded for ledger: ${entry.ledgerName}`
        );
      }
    }
  }

  const voucher = await prisma.$transaction(
    async tx => {
      const voucherType = await tx.voucherType.findFirst({
        where: { id: payload.voucherTypeId, startupId },
        include: { numberingSeries: true },
      });

      if (!voucherType) {
        throw new Error("Voucher type not found");
      }

      let numberingSeries = null;
      if (payload.numberingSeriesId) {
        numberingSeries = await tx.voucherNumberingSeries.findFirst({
          where: {
            id: payload.numberingSeriesId,
            startupId,
            voucherTypeId: voucherType.id,
          },
        });

        if (!numberingSeries) {
          throw new Error("Numbering series not found");
        }
      }

      let voucherNumber: string;
      if (numberingSeries) {
        const next = numberingSeries.nextNumber;
        voucherNumber = buildVoucherNumber({
          nextNumber: next,
          prefix: numberingSeries.prefix ?? voucherType.prefix,
          suffix: numberingSeries.suffix ?? voucherType.suffix,
        });

        await tx.voucherNumberingSeries.update({
          where: { id: numberingSeries.id },
          data: { nextNumber: { increment: 1 } },
        });
      } else {
        const next = voucherType.nextNumber;
        voucherNumber = buildVoucherNumber({
          nextNumber: next,
          prefix: voucherType.prefix,
          suffix: voucherType.suffix,
        });

        await tx.voucherType.update({
          where: { id: voucherType.id },
          data: { nextNumber: { increment: 1 } },
        });
      }

      const dateValue = payload.date ? new Date(payload.date) : new Date();

      if (Number.isNaN(dateValue.getTime())) {
        throw new Error("Invalid voucher date");
      }

      const voucher = await tx.voucher.create({
        data: {
          startupId,
          voucherTypeId: voucherType.id,
          numberingSeriesId: numberingSeries?.id,
          voucherNumber,
          date: dateValue,
          reference: payload.reference?.trim() || null,
          narration: payload.narration?.trim() || null,
          createdById: payload.createdById || null,
          totalAmount,
          entries: {
            create: payload.entries.map(entry => ({
              ledgerName: entry.ledgerName.trim(),
              ledgerCode: entry.ledgerCode?.trim() || null,
              entryType: entry.entryType,
              amount: entry.amount,
              narration: entry.narration?.trim() || null,
              costCenterName: entry.costCenterName?.trim() || null,
              costCategory: entry.costCategory?.trim() || null,
              billReferences:
                entry.billReferences && entry.billReferences.length > 0
                  ? {
                      create: entry.billReferences.map(bill => ({
                        reference: bill.reference.trim(),
                        amount: bill.amount,
                        referenceType: bill.referenceType ?? "AGAINST",
                        dueDate: bill.dueDate ? new Date(bill.dueDate) : null,
                        remarks: bill.remarks?.trim() || null,
                      })),
                    }
                  : undefined,
            })),
          },
        },
        include: {
          entries: {
            include: {
              billReferences: true,
            },
          },
          voucherType: true,
          numberingSeries: true,
        },
      });

      return voucher;
    },
    {
      timeout: 20000,
      maxWait: 5000,
    }
  );

  const simplifiedEntries = voucher.entries.map(entry => ({
    ledgerName: entry.ledgerName,
    entryType: entry.entryType,
    amount: entry.amount,
  }));

  const auditPayload = {
    startupId,
    userId: payload.createdById,
    entityType: AuditEntityType.VOUCHER,
    entityId: voucher.id,
    action: AuditAction.CREATE,
    description: `Voucher ${voucher.voucherNumber} created`,
    newValues: {
      voucherId: voucher.id,
      voucherNumber: voucher.voucherNumber,
      voucherType: voucher.voucherType?.name || voucher.voucherTypeId,
      date: voucher.date,
      totalAmount: voucher.totalAmount,
      entries: simplifiedEntries,
    },
    metadata: {
      reference: voucher.reference,
      numberingSeriesId: voucher.numberingSeriesId,
    },
  };

  createAuditLog(auditPayload).catch(err => {
    console.warn("Failed to write audit log for voucher", voucher.id, err);
  });

  return voucher;
};

export const listVouchers = async (
  startupId: string,
  params?: {
    voucherTypeId?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }
) => {
  const filters: Prisma.VoucherWhereInput = {
    startupId,
  };

  if (params?.voucherTypeId) {
    filters.voucherTypeId = params.voucherTypeId;
  }

  if (params?.fromDate || params?.toDate) {
    filters.date = {};
    if (params.fromDate) {
      const from = new Date(params.fromDate);
      if (!Number.isNaN(from.getTime())) {
        filters.date.gte = from;
      }
    }
    if (params.toDate) {
      const to = new Date(params.toDate);
      if (!Number.isNaN(to.getTime())) {
        filters.date.lte = to;
      }
    }
  }

  const limit = Math.min(params?.limit ?? 50, 200);

  return prisma.voucher.findMany({
    where: filters,
    orderBy: { date: "desc" },
    take: limit,
    include: {
      voucherType: true,
      numberingSeries: true,
      entries: {
        include: {
          billReferences: true,
        },
      },
    },
  });
};

/**
 * Create a reversing journal (reverse entry) for an existing voucher
 */
export const createReversingJournal = async (
  startupId: string,
  originalVoucherId: string,
  reversalDate?: string,
  narration?: string
) => {
  // Get the original voucher
  const originalVoucher = await prisma.voucher.findFirst({
    where: {
      id: originalVoucherId,
      startupId,
    },
    include: {
      entries: {
        include: {
          billReferences: true,
        },
      },
      voucherType: true,
    },
  });

  if (!originalVoucher) {
    throw new Error("Original voucher not found");
  }

  // Find REVERSING_JOURNAL voucher type or create it
  let reversingType = await prisma.voucherType.findFirst({
    where: {
      startupId,
      category: VoucherCategory.REVERSING_JOURNAL,
    },
  });

  if (!reversingType) {
    reversingType = await prisma.voucherType.create({
      data: {
        startupId,
        name: "Reversing Journal",
        category: VoucherCategory.REVERSING_JOURNAL,
        numberingMethod: VoucherNumberingMethod.AUTOMATIC,
      },
    });
  }

  const dateValue = reversalDate ? new Date(reversalDate) : new Date();
  if (Number.isNaN(dateValue.getTime())) {
    throw new Error("Invalid reversal date");
  }

  // Build reversing entries (opposite entry types)
  const reversingEntries = originalVoucher.entries.map(entry => ({
    ledgerName: entry.ledgerName,
    ledgerCode: entry.ledgerCode || undefined,
    entryType:
      entry.entryType === "DEBIT"
        ? ("CREDIT" as VoucherEntryType)
        : ("DEBIT" as VoucherEntryType),
    amount: Number(entry.amount),
    narration:
      entry.narration ||
      narration ||
      `Reversal of ${originalVoucher.voucherNumber}`,
    costCenterName: entry.costCenterName || undefined,
    costCategory: entry.costCategory || undefined,
  }));

  // Create reversing voucher
  const reversingVoucher = await createVoucher(startupId, {
    voucherTypeId: reversingType.id,
    date: dateValue.toISOString().split("T")[0],
    narration: narration || `Reversal of ${originalVoucher.voucherNumber}`,
    entries: reversingEntries,
  });

  return {
    originalVoucher,
    reversingVoucher,
  };
};
