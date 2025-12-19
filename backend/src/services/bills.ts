import { Prisma, BillType, BillStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../lib/prisma";

// Type for bill with relations
type BillWithRelations = Prisma.BillGetPayload<{
  include: {
    voucher: {
      include: {
        voucherType: true;
      };
    };
    voucherEntry: true;
    settlements: {
      include: {
        voucher: {
          include: {
            voucherType: true;
          };
        };
        voucherEntry: true;
      };
    };
  };
}>;

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
  const {
    billType,
    billNumber,
    ledgerName,
    ledgerCode,
    billDate,
    dueDate,
    originalAmount,
    reference,
    narration,
    voucherId,
    voucherEntryId,
  } = input;

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
      throw new Error("Voucher not found or does not belong to your startup");
    }
  }

  if (voucherEntryId) {
    const entry = await prisma.voucherEntry.findFirst({
      where: { id: voucherEntryId },
      include: { voucher: true },
    });
    if (!entry || entry.voucher.startupId !== startupId) {
      throw new Error(
        "Voucher entry not found or does not belong to your startup"
      );
    }
  }

  const billDateValue = billDate ? new Date(billDate) : new Date();
  const dueDateValue = dueDate ? new Date(dueDate) : null;

  if (Number.isNaN(billDateValue.getTime())) {
    throw new Error("Invalid bill date");
  }

  if (dueDateValue && Number.isNaN(dueDateValue.getTime())) {
    throw new Error("Invalid due date");
  }

  const amount = new Decimal(originalAmount);
  if (amount.lte(0)) {
    throw new Error("Bill amount must be greater than zero");
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
      settledAmount: new Decimal(0),
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
          settlementDate: "desc",
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
  const {
    billId,
    voucherId,
    voucherEntryId,
    settlementAmount,
    reference,
    remarks,
  } = input;

  return prisma.$transaction(async (tx) => {
    // Verify bill exists and belongs to startup
    const bill = await tx.bill.findFirst({
      where: { id: billId, startupId },
    });

    if (!bill) {
      throw new Error("Bill not found or does not belong to your startup");
    }

    if (bill.status === BillStatus.SETTLED) {
      throw new Error("Bill is already fully settled");
    }

    if (bill.status === BillStatus.CANCELLED) {
      throw new Error("Cannot settle a cancelled bill");
    }

    // Verify voucher and entry exist and belong to startup
    const voucher = await tx.voucher.findFirst({
      where: { id: voucherId, startupId },
      include: { entries: true },
    });

    if (!voucher) {
      throw new Error("Voucher not found or does not belong to your startup");
    }

    const entry = voucher.entries.find((e) => e.id === voucherEntryId);
    if (!entry) {
      throw new Error("Voucher entry not found");
    }

    // Validate settlement amount
    const settlementAmountDecimal = new Decimal(settlementAmount);
    if (settlementAmountDecimal.lte(0)) {
      throw new Error("Settlement amount must be greater than zero");
    }

    const currentOutstanding = new Decimal(bill.outstandingAmount);
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
    const newSettledAmount = new Decimal(bill.settledAmount).plus(
      settlementAmountDecimal
    );
    const newOutstandingAmount = new Decimal(bill.originalAmount).minus(
      newSettledAmount
    );

    let newStatus: BillStatus = bill.status;
    if (newOutstandingAmount.lte(0)) {
      newStatus = BillStatus.SETTLED;
    } else if (
      newSettledAmount.gt(0) &&
      newSettledAmount.lt(bill.originalAmount)
    ) {
      newStatus = BillStatus.PARTIAL;
    }

    const updatedBill = await tx.bill.update({
      where: { id: bill.id },
      data: {
        settledAmount: newSettledAmount,
        outstandingAmount: newOutstandingAmount.gt(0)
          ? newOutstandingAmount
          : new Decimal(0),
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
            settlementDate: "desc",
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
    where.ledgerName = { contains: filters.ledgerName, mode: "insensitive" };
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
            settlementDate: "desc",
          },
        },
      },
      orderBy: { billDate: "desc" },
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
        orderBy: { settlementDate: "desc" },
        take: 1, // Get latest settlement for reference
      },
    },
  });

  const now = new Date();
  const agingBuckets = {
    current: { count: 0, amount: new Decimal(0) }, // Not overdue
    days30: { count: 0, amount: new Decimal(0) }, // 1-30 days overdue
    days60: { count: 0, amount: new Decimal(0) }, // 31-60 days overdue
    days90: { count: 0, amount: new Decimal(0) }, // 61-90 days overdue
    over90: { count: 0, amount: new Decimal(0) }, // Over 90 days overdue
  };

  for (const bill of bills) {
    const dueDate = bill.dueDate || bill.billDate;
    const daysOverdue = Math.floor(
      (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysOverdue <= 0) {
      agingBuckets.current.count++;
      agingBuckets.current.amount = agingBuckets.current.amount.plus(
        bill.outstandingAmount
      );
    } else if (daysOverdue <= 30) {
      agingBuckets.days30.count++;
      agingBuckets.days30.amount = agingBuckets.days30.amount.plus(
        bill.outstandingAmount
      );
    } else if (daysOverdue <= 60) {
      agingBuckets.days60.count++;
      agingBuckets.days60.amount = agingBuckets.days60.amount.plus(
        bill.outstandingAmount
      );
    } else if (daysOverdue <= 90) {
      agingBuckets.days90.count++;
      agingBuckets.days90.amount = agingBuckets.days90.amount.plus(
        bill.outstandingAmount
      );
    } else {
      agingBuckets.over90.count++;
      agingBuckets.over90.amount = agingBuckets.over90.amount.plus(
        bill.outstandingAmount
      );
    }
  }

  return {
    summary: {
      totalBills: bills.length,
      totalOutstanding: bills.reduce(
        (sum: Decimal, bill) => sum.plus(bill.outstandingAmount),
        new Decimal(0)
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
        (now.getTime() - (bill.dueDate || bill.billDate).getTime()) /
          (1000 * 60 * 60 * 24)
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
    orderBy: [{ ledgerName: "asc" }, { billDate: "asc" }],
  });

  // Group by ledger name
  const ledgerMap = new Map<
    string,
    {
      ledgerName: string;
      ledgerCode: string | null;
      billCount: number;
      totalOutstanding: Decimal;
      bills: Array<{
        billNumber: string;
        billDate: Date;
        dueDate: Date | null;
        outstandingAmount: Decimal;
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
        totalOutstanding: new Decimal(0),
        bills: [],
      });
    }

    const ledger = ledgerMap.get(key)!;
    ledger.billCount++;
    ledger.totalOutstanding = ledger.totalOutstanding.plus(
      bill.outstandingAmount
    );
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

/**
 * Get bills that need reminders (approaching due date or overdue)
 */
export const getBillReminders = async (
  startupId: string,
  billType?: BillType,
  daysBeforeReminder: number = 7
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
    orderBy: { dueDate: "asc" },
  });

  const now = new Date();
  const reminders = bills
    .filter((bill) => {
      const dueDate = bill.dueDate || bill.billDate;
      const daysUntilDue = Math.floor(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysOverdue = Math.floor(
        (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Include if overdue or within reminder window
      return (
        daysOverdue > 0 ||
        (daysUntilDue >= 0 && daysUntilDue <= daysBeforeReminder)
      );
    })
    .map((bill) => {
      const dueDate = bill.dueDate || bill.billDate;
      const daysUntilDue = Math.floor(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysOverdue = Math.floor(
        (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: bill.id,
        billNumber: bill.billNumber,
        billType: bill.billType,
        ledgerName: bill.ledgerName,
        dueDate: bill.dueDate,
        outstandingAmount: Number(bill.outstandingAmount),
        daysUntilDue,
        daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
        isOverdue: daysOverdue > 0,
        reminderType:
          daysOverdue > 0
            ? "OVERDUE"
            : daysUntilDue <= 3
              ? "URGENT"
              : "WARNING",
      };
    });

  return reminders;
};

/**
 * Get cash flow projections based on bills
 */
export const getBillCashFlowProjections = async (
  startupId: string,
  months: number = 6
) => {
  const now = new Date();
  const projections: Array<{
    month: string;
    receivablesExpected: number;
    payablesExpected: number;
    netCashFlow: number;
    bills: Array<{
      billNumber: string;
      ledgerName: string;
      amount: number;
      dueDate: string;
      billType: BillType;
    }>;
  }> = [];

  // Get all open/partial bills
  const bills = await prisma.bill.findMany({
    where: {
      startupId,
      status: { in: [BillStatus.OPEN, BillStatus.PARTIAL] },
      outstandingAmount: { gt: 0 },
    },
    orderBy: { dueDate: "asc" },
  });

  // Group by month
  for (let i = 0; i < months; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);

    const monthBills = bills.filter((bill) => {
      const dueDate = bill.dueDate || bill.billDate;
      return dueDate >= monthDate && dueDate < nextMonth;
    });

    const receivablesExpected = monthBills
      .filter((b) => b.billType === BillType.RECEIVABLE)
      .reduce(
        (sum: Decimal, b) => sum.plus(b.outstandingAmount),
        new Decimal(0)
      );

    const payablesExpected = monthBills
      .filter((b: any) => b.billType === BillType.PAYABLE)
      .reduce(
        (sum: Decimal, b: any) => sum.plus(b.outstandingAmount),
        new Decimal(0)
      );

    projections.push({
      month: monthDate.toISOString().slice(0, 7), // YYYY-MM
      receivablesExpected: Number(receivablesExpected),
      payablesExpected: Number(payablesExpected),
      netCashFlow: Number(receivablesExpected) - Number(payablesExpected),
      bills: monthBills.map((bill) => ({
        billNumber: bill.billNumber,
        ledgerName: bill.ledgerName,
        amount: Number(bill.outstandingAmount),
        dueDate: (bill.dueDate || bill.billDate).toISOString().split("T")[0],
        billType: bill.billType,
      })),
    });
  }

  return projections;
};

/**
 * Get receivables/payables analytics
 */
export const getBillsAnalytics = async (
  startupId: string,
  fromDate?: string,
  toDate?: string
) => {
  const where: Prisma.BillWhereInput = {
    startupId,
  };

  if (fromDate || toDate) {
    where.billDate = {};
    if (fromDate) where.billDate.gte = new Date(fromDate);
    if (toDate) where.billDate.lte = new Date(toDate);
  }

  const bills = await prisma.bill.findMany({
    where,
  });

  // Receivables analytics
  const receivables = bills.filter(
    (b) => b.billType === BillType.RECEIVABLE
  );
  const receivablesTotal = receivables.reduce(
      (sum: Decimal, b) => sum.plus(b.originalAmount),
    new Decimal(0)
  );
  const receivablesOutstanding = receivables
    .filter((b) => b.status !== BillStatus.SETTLED)
    .reduce((sum, b) => sum.plus(b.outstandingAmount), new Decimal(0));
  const receivablesSettled = receivables
    .filter((b) => b.status === BillStatus.SETTLED)
    .reduce(
      (sum: Decimal, b) => sum.plus(b.settledAmount),
      new Decimal(0)
    );

  // Payables analytics
  const payables = bills.filter((b) => b.billType === BillType.PAYABLE);
  const payablesTotal = payables.reduce(
      (sum: Decimal, b) => sum.plus(b.originalAmount),
    new Decimal(0)
  );
  const payablesOutstanding = payables
    .filter((b) => b.status !== BillStatus.SETTLED)
    .reduce((sum, b) => sum.plus(b.outstandingAmount), new Decimal(0));
  const payablesSettled = payables
    .filter((b) => b.status === BillStatus.SETTLED)
    .reduce(
      (sum: Decimal, b) => sum.plus(b.settledAmount),
      new Decimal(0)
    );

  // Calculate collection/payment rates
  const receivablesCollectionRate = receivablesTotal.gt(0)
    ? Number(receivablesSettled.div(receivablesTotal).times(100))
    : 0;
  const payablesPaymentRate = payablesTotal.gt(0)
    ? Number(payablesSettled.div(payablesTotal).times(100))
    : 0;

  // Average collection/payment period
  const now = new Date();
  const receivablesAvgDays =
    receivables
      .filter((b) => b.dueDate && b.status !== BillStatus.SETTLED)
      .reduce((sum: number, b: any) => {
        const days = Math.floor(
          (now.getTime() - (b.dueDate || b.billDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + Math.max(0, days);
      }, 0) /
    (receivables.filter(
      (b) => b.dueDate && b.status !== BillStatus.SETTLED
    ).length || 1);

  const payablesAvgDays =
    payables
      .filter((b) => b.dueDate && b.status !== BillStatus.SETTLED)
      .reduce((sum: number, b: any) => {
        const days = Math.floor(
          (now.getTime() - (b.dueDate || b.billDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + Math.max(0, days);
      }, 0) /
    (payables.filter((b) => b.dueDate && b.status !== BillStatus.SETTLED)
      .length || 1);

  return {
    receivables: {
      total: Number(receivablesTotal),
      outstanding: Number(receivablesOutstanding),
      settled: Number(receivablesSettled),
      count: receivables.length,
      collectionRate: receivablesCollectionRate,
      averageCollectionDays: Math.round(receivablesAvgDays),
    },
    payables: {
      total: Number(payablesTotal),
      outstanding: Number(payablesOutstanding),
      settled: Number(payablesSettled),
      count: payables.length,
      paymentRate: payablesPaymentRate,
      averagePaymentDays: Math.round(payablesAvgDays),
    },
    netPosition: Number(receivablesOutstanding) - Number(payablesOutstanding),
  };
};
