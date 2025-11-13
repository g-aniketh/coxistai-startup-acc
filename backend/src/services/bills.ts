import { Prisma, BillType, BillStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface CreateBillInput {
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

export interface SettleBillInput {
  billId: string;
  voucherId: string;
  voucherEntryId: string;
  settlementAmount: number;
  reference?: string;
  remarks?: string;
}

/**
 * Create a new bill (receivable or payable)
 */
export const createBill = async (startupId: string, input: CreateBillInput) => {
  const { billType, billNumber, ledgerName, ledgerCode, billDate, dueDate, originalAmount, reference, narration, voucherId, voucherEntryId } = input;

  // Check if bill number already exists
  const existingBill = await prisma.bill.findUnique({
    where: {
      startupId_billNumber: {
        startupId,
        billNumber,
      },
    },
  });

  if (existingBill) {
    throw new Error(`Bill number ${billNumber} already exists`);
  }

  // Validate voucher and entry if provided
  if (voucherId) {
    const voucher = await prisma.voucher.findFirst({
      where: { id: voucherId, startupId },
    });
    if (!voucher) {
      throw new Error('Voucher not found or does not belong to your startup');
    }
  }

  if (voucherEntryId) {
    const entry = await prisma.voucherEntry.findFirst({
      where: { id: voucherEntryId },
      include: { voucher: true },
    });
    if (!entry || entry.voucher.startupId !== startupId) {
      throw new Error('Voucher entry not found or does not belong to your startup');
    }
  }

  const billDateValue = billDate ? new Date(billDate) : new Date();
  const dueDateValue = dueDate ? new Date(dueDate) : null;

  if (Number.isNaN(billDateValue.getTime())) {
    throw new Error('Invalid bill date');
  }

  if (dueDateValue && Number.isNaN(dueDateValue.getTime())) {
    throw new Error('Invalid due date');
  }

  const amount = new Prisma.Decimal(originalAmount);
  if (amount.lte(0)) {
    throw new Error('Bill amount must be greater than zero');
  }

  const bill = await prisma.bill.create({
    data: {
      startupId,
      billType,
      billNumber,
      ledgerName: ledgerName.trim(),
      ledgerCode: ledgerCode?.trim() || null,
      billDate: billDateValue,
      dueDate: dueDateValue,
      originalAmount: amount,
      settledAmount: new Prisma.Decimal(0),
      outstandingAmount: amount, // Initially equals originalAmount
      status: BillStatus.OPEN,
      reference: reference?.trim() || null,
      narration: narration?.trim() || null,
      voucherId: voucherId || null,
      voucherEntryId: voucherEntryId || null,
    },
    include: {
      voucher: {
        include: {
          voucherType: true,
        },
      },
      voucherEntry: true,
      settlements: {
        include: {
          voucher: {
            include: {
              voucherType: true,
            },
          },
          voucherEntry: true,
        },
        orderBy: {
          settlementDate: 'desc',
        },
      },
    },
  });

  return bill;
};

/**
 * Settle a bill against a voucher entry (Payment/Receipt)
 */
export const settleBill = async (startupId: string, input: SettleBillInput) => {
  const { billId, voucherId, voucherEntryId, settlementAmount, reference, remarks } = input;

  return prisma.$transaction(async (tx) => {
    // Verify bill exists and belongs to startup
    const bill = await tx.bill.findFirst({
      where: { id: billId, startupId },
    });

    if (!bill) {
      throw new Error('Bill not found or does not belong to your startup');
    }

    if (bill.status === BillStatus.SETTLED) {
      throw new Error('Bill is already fully settled');
    }

    if (bill.status === BillStatus.CANCELLED) {
      throw new Error('Cannot settle a cancelled bill');
    }

    // Verify voucher and entry exist and belong to startup
    const voucher = await tx.voucher.findFirst({
      where: { id: voucherId, startupId },
      include: { entries: true },
    });

    if (!voucher) {
      throw new Error('Voucher not found or does not belong to your startup');
    }

    const entry = voucher.entries.find((e) => e.id === voucherEntryId);
    if (!entry) {
      throw new Error('Voucher entry not found');
    }

    // Validate settlement amount
    const settlementAmountDecimal = new Prisma.Decimal(settlementAmount);
    if (settlementAmountDecimal.lte(0)) {
      throw new Error('Settlement amount must be greater than zero');
    }

    const currentOutstanding = new Prisma.Decimal(bill.outstandingAmount);
    if (settlementAmountDecimal.gt(currentOutstanding)) {
      throw new Error(
        `Settlement amount (${settlementAmount}) exceeds outstanding amount (${bill.outstandingAmount})`
      );
    }

    // Create settlement record
    const settlement = await tx.billSettlement.create({
      data: {
        startupId,
        billId: bill.id,
        voucherId: voucher.id,
        voucherEntryId: entry.id,
        settlementAmount: settlementAmountDecimal,
        settlementDate: new Date(),
        reference: reference?.trim() || null,
        remarks: remarks?.trim() || null,
      },
    });

    // Update bill status and amounts
    const newSettledAmount = new Prisma.Decimal(bill.settledAmount).plus(settlementAmountDecimal);
    const newOutstandingAmount = new Prisma.Decimal(bill.originalAmount).minus(newSettledAmount);

    let newStatus: BillStatus = bill.status;
    if (newOutstandingAmount.lte(0)) {
      newStatus = BillStatus.SETTLED;
    } else if (newSettledAmount.gt(0) && newSettledAmount.lt(bill.originalAmount)) {
      newStatus = BillStatus.PARTIAL;
    }

    const updatedBill = await tx.bill.update({
      where: { id: bill.id },
      data: {
        settledAmount: newSettledAmount,
        outstandingAmount: newOutstandingAmount.gt(0) ? newOutstandingAmount : new Prisma.Decimal(0),
        status: newStatus,
      },
      include: {
        voucher: {
          include: {
            voucherType: true,
          },
        },
        voucherEntry: true,
        settlements: {
          include: {
            voucher: {
              include: {
                voucherType: true,
              },
            },
            voucherEntry: true,
          },
          orderBy: {
            settlementDate: 'desc',
          },
        },
      },
    });

    return { settlement, bill: updatedBill };
  });
};

/**
 * List bills with filtering and pagination
 */
export const listBills = async (
  startupId: string,
  filters?: {
    billType?: BillType;
    status?: BillStatus;
    ledgerName?: string;
    fromDate?: string;
    toDate?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    limit?: number;
    offset?: number;
  }
) => {
  const where: Prisma.BillWhereInput = {
    startupId,
  };

  if (filters?.billType) {
    where.billType = filters.billType;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.ledgerName) {
    where.ledgerName = { contains: filters.ledgerName, mode: 'insensitive' };
  }

  if (filters?.fromDate || filters?.toDate) {
    where.billDate = {};
    if (filters.fromDate) {
      where.billDate.gte = new Date(filters.fromDate);
    }
    if (filters.toDate) {
      where.billDate.lte = new Date(filters.toDate);
    }
  }

  if (filters?.dueDateFrom || filters?.dueDateTo) {
    where.dueDate = {};
    if (filters.dueDateFrom) {
      where.dueDate.gte = new Date(filters.dueDateFrom);
    }
    if (filters.dueDateTo) {
      where.dueDate.lte = new Date(filters.dueDateTo);
    }
  }

  const limit = Math.min(filters?.limit ?? 50, 200);
  const offset = filters?.offset ?? 0;

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      include: {
        voucher: {
          include: {
            voucherType: true,
          },
        },
        voucherEntry: true,
        settlements: {
          include: {
            voucher: {
              include: {
                voucherType: true,
              },
            },
            voucherEntry: true,
          },
          orderBy: {
            settlementDate: 'desc',
          },
        },
      },
      orderBy: { billDate: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.bill.count({ where }),
  ]);

  return { bills, total };
};

/**
 * Get bill aging report (outstanding bills grouped by age buckets)
 */
export const getBillAgingReport = async (
  startupId: string,
  billType?: BillType
) => {
  const where: Prisma.BillWhereInput = {
    startupId,
    status: { in: [BillStatus.OPEN, BillStatus.PARTIAL] },
    outstandingAmount: { gt: 0 },
  };

  if (billType) {
    where.billType = billType;
  }

  const bills = await prisma.bill.findMany({
    where,
    include: {
      settlements: {
        orderBy: { settlementDate: 'desc' },
        take: 1, // Get latest settlement for reference
      },
    },
  });

  const now = new Date();
  const agingBuckets = {
    current: { count: 0, amount: new Prisma.Decimal(0) }, // Not overdue
    days30: { count: 0, amount: new Prisma.Decimal(0) }, // 1-30 days overdue
    days60: { count: 0, amount: new Prisma.Decimal(0) }, // 31-60 days overdue
    days90: { count: 0, amount: new Prisma.Decimal(0) }, // 61-90 days overdue
    over90: { count: 0, amount: new Prisma.Decimal(0) }, // Over 90 days overdue
  };

  for (const bill of bills) {
    const dueDate = bill.dueDate || bill.billDate;
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOverdue <= 0) {
      agingBuckets.current.count++;
      agingBuckets.current.amount = agingBuckets.current.amount.plus(bill.outstandingAmount);
    } else if (daysOverdue <= 30) {
      agingBuckets.days30.count++;
      agingBuckets.days30.amount = agingBuckets.days30.amount.plus(bill.outstandingAmount);
    } else if (daysOverdue <= 60) {
      agingBuckets.days60.count++;
      agingBuckets.days60.amount = agingBuckets.days60.amount.plus(bill.outstandingAmount);
    } else if (daysOverdue <= 90) {
      agingBuckets.days90.count++;
      agingBuckets.days90.amount = agingBuckets.days90.amount.plus(bill.outstandingAmount);
    } else {
      agingBuckets.over90.count++;
      agingBuckets.over90.amount = agingBuckets.over90.amount.plus(bill.outstandingAmount);
    }
  }

  return {
    summary: {
      totalBills: bills.length,
      totalOutstanding: bills.reduce(
        (sum, bill) => sum.plus(bill.outstandingAmount),
        new Prisma.Decimal(0)
      ),
    },
    aging: {
      current: {
        count: agingBuckets.current.count,
        amount: Number(agingBuckets.current.amount),
      },
      days30: {
        count: agingBuckets.days30.count,
        amount: Number(agingBuckets.days30.amount),
      },
      days60: {
        count: agingBuckets.days60.count,
        amount: Number(agingBuckets.days60.amount),
      },
      days90: {
        count: agingBuckets.days90.count,
        amount: Number(agingBuckets.days90.amount),
      },
      over90: {
        count: agingBuckets.over90.count,
        amount: Number(agingBuckets.over90.amount),
      },
    },
    bills: bills.map((bill) => ({
      id: bill.id,
      billNumber: bill.billNumber,
      billType: bill.billType,
      ledgerName: bill.ledgerName,
      billDate: bill.billDate,
      dueDate: bill.dueDate,
      originalAmount: Number(bill.originalAmount),
      outstandingAmount: Number(bill.outstandingAmount),
      status: bill.status,
      daysOverdue: Math.floor(
        (now.getTime() - (bill.dueDate || bill.billDate).getTime()) / (1000 * 60 * 60 * 24)
      ),
    })),
  };
};

/**
 * Get outstanding summary by ledger (party-wise outstanding)
 */
export const getOutstandingByLedger = async (
  startupId: string,
  billType?: BillType
) => {
  const where: Prisma.BillWhereInput = {
    startupId,
    status: { in: [BillStatus.OPEN, BillStatus.PARTIAL] },
    outstandingAmount: { gt: 0 },
  };

  if (billType) {
    where.billType = billType;
  }

  const bills = await prisma.bill.findMany({
    where,
    orderBy: [{ ledgerName: 'asc' }, { billDate: 'asc' }],
  });

  // Group by ledger name
  const ledgerMap = new Map<
    string,
    {
      ledgerName: string;
      ledgerCode: string | null;
      billCount: number;
      totalOutstanding: Prisma.Decimal;
      bills: Array<{
        billNumber: string;
        billDate: Date;
        dueDate: Date | null;
        outstandingAmount: Prisma.Decimal;
      }>;
    }
  >();

  for (const bill of bills) {
    const key = bill.ledgerName;
    if (!ledgerMap.has(key)) {
      ledgerMap.set(key, {
        ledgerName: bill.ledgerName,
        ledgerCode: bill.ledgerCode,
        billCount: 0,
        totalOutstanding: new Prisma.Decimal(0),
        bills: [],
      });
    }

    const ledger = ledgerMap.get(key)!;
    ledger.billCount++;
    ledger.totalOutstanding = ledger.totalOutstanding.plus(bill.outstandingAmount);
    ledger.bills.push({
      billNumber: bill.billNumber,
      billDate: bill.billDate,
      dueDate: bill.dueDate,
      outstandingAmount: bill.outstandingAmount,
    });
  }

  return Array.from(ledgerMap.values()).map((ledger) => ({
    ledgerName: ledger.ledgerName,
    ledgerCode: ledger.ledgerCode,
    billCount: ledger.billCount,
    totalOutstanding: Number(ledger.totalOutstanding),
    bills: ledger.bills.map((bill) => ({
      billNumber: bill.billNumber,
      billDate: bill.billDate,
      dueDate: bill.dueDate,
      outstandingAmount: Number(bill.outstandingAmount),
    })),
  }));
};

