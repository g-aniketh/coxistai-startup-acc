import { Prisma, VoucherBillReferenceType, VoucherEntryType } from '@prisma/client';
import { prisma } from '../lib/prisma';

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
  return `${ctx.prefix ?? ''}${sequence}${ctx.suffix ?? ''}`;
};

const assertBalancedEntries = (entries: VoucherEntryInput[]) => {
  if (!entries || entries.length < 2) {
    throw new Error('Voucher requires at least two ledger entries');
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of entries) {
    if (!entry.ledgerName?.trim()) {
      throw new Error('Ledger name is required for each entry');
    }

    if (typeof entry.amount !== 'number' || entry.amount <= 0) {
      throw new Error('Entry amount must be a positive number');
    }

    if (entry.entryType === 'DEBIT') {
      totalDebit += entry.amount;
    } else if (entry.entryType === 'CREDIT') {
      totalCredit += entry.amount;
    } else {
      throw new Error('Invalid entry type');
    }
  }

  const roundedDebit = Math.round(totalDebit * 100) / 100;
  const roundedCredit = Math.round(totalCredit * 100) / 100;

  if (roundedDebit !== roundedCredit) {
    throw new Error('Voucher is not balanced. Total debit must equal total credit.');
  }

  return roundedDebit;
};

export const createVoucher = async (startupId: string, payload: CreateVoucherInput) => {
  const totalAmount = assertBalancedEntries(payload.entries);

  return prisma.$transaction(async (tx) => {
    const voucherType = await tx.voucherType.findFirst({
      where: { id: payload.voucherTypeId, startupId },
      include: { numberingSeries: true },
    });

    if (!voucherType) {
      throw new Error('Voucher type not found');
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
        throw new Error('Numbering series not found');
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
      throw new Error('Invalid voucher date');
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
          create: payload.entries.map((entry) => ({
            ledgerName: entry.ledgerName.trim(),
            ledgerCode: entry.ledgerCode?.trim() || null,
            entryType: entry.entryType,
            amount: entry.amount,
            narration: entry.narration?.trim() || null,
            costCenterName: entry.costCenterName?.trim() || null,
            costCategory: entry.costCategory?.trim() || null,
            billReferences: entry.billReferences && entry.billReferences.length > 0
              ? {
                  create: entry.billReferences.map((bill) => ({
                    reference: bill.reference.trim(),
                    amount: bill.amount,
                    referenceType: bill.referenceType ?? 'AGAINST',
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
  });
};

export const listVouchers = async (
  startupId: string,
  params?: { voucherTypeId?: string; fromDate?: string; toDate?: string; limit?: number }
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
    orderBy: { date: 'desc' },
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
