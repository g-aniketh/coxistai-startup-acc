import { Prisma, LedgerCategory } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * Get cost centre-wise P&L report
 */
export async function getCostCentrePL(
  startupId: string,
  costCentreId?: string,
  fromDate?: string,
  toDate?: string
) {
  const from = fromDate ? new Date(fromDate) : undefined;
  const to = toDate ? new Date(toDate) : new Date();

  // Get cost centre if specified
  let costCentre = null;
  if (costCentreId) {
    costCentre = await prisma.costCenter.findFirst({
      where: {
        id: costCentreId,
        startupId,
      },
      include: {
        category: true,
        parent: true,
      },
    });
  }

  // Get all cost centres
  const costCentres = await prisma.costCenter.findMany({
    where: { startupId },
    include: {
      category: true,
    },
  });

  // Get voucher entries with cost centre allocation
  const entryFilters: any = {
    voucher: {
      startupId,
      date: {},
    },
    costCenterId: costCentreId ? costCentreId : undefined,
  };

  if (from) entryFilters.voucher!.date!.gte = from;
  if (to) entryFilters.voucher!.date!.lte = to;

  const entries = await prisma.voucherEntry.findMany({
    where: entryFilters,
    include: {
      voucher: {
        include: {
          voucherType: true,
        },
      },
      costCenter: true,
      costCategoryRef: true,
    },
  });

  // Group by cost centre and ledger category
  const centreData = new Map<
    string,
    {
      costCentreId: string;
      costCentreName: string;
      directIncome: number;
      indirectIncome: number;
      directExpense: number;
      indirectExpense: number;
      purchase: number;
      sales: number;
    }
  >();

  for (const entry of entries) {
    if (!entry.costCenterId || !entry.costCenter) continue;

    const centreId = entry.costCenterId;
    if (!centreData.has(centreId)) {
      centreData.set(centreId, {
        costCentreId: centreId,
        costCentreName: entry.costCenter.name,
        directIncome: 0,
        indirectIncome: 0,
        directExpense: 0,
        indirectExpense: 0,
        purchase: 0,
        sales: 0,
      });
    }

    const data = centreData.get(centreId)!;
    const amount = Number(entry.amount);

    // Get ledger category to determine income/expense
    const ledger = await prisma.ledger.findFirst({
      where: {
        startupId,
        name: entry.ledgerName,
      },
      include: { group: true },
    });

    if (!ledger) continue;

    const category = ledger.group.category;

    if (entry.entryType === 'CREDIT') {
      if (category === LedgerCategory.SALES) {
        data.sales += amount;
      } else if (category === LedgerCategory.DIRECT_INCOME) {
        data.directIncome += amount;
      } else if (category === LedgerCategory.INDIRECT_INCOME) {
        data.indirectIncome += amount;
      }
    } else {
      if (category === LedgerCategory.PURCHASE) {
        data.purchase += amount;
      } else if (category === LedgerCategory.DIRECT_EXPENSE) {
        data.directExpense += amount;
      } else if (category === LedgerCategory.INDIRECT_EXPENSE) {
        data.indirectExpense += amount;
      }
    }
  }

  const centres = Array.from(centreData.values()).map(centre => ({
    ...centre,
    grossProfit: centre.sales - centre.purchase,
    netProfit: centre.directIncome + centre.indirectIncome - centre.directExpense - centre.indirectExpense,
    totalIncome: centre.sales + centre.directIncome + centre.indirectIncome,
    totalExpense: centre.purchase + centre.directExpense + centre.indirectExpense,
  }));

  return {
    costCentre: costCentre ? {
      id: costCentre.id,
      name: costCentre.name,
      category: costCentre.category.name,
    } : null,
    period: {
      fromDate: from?.toISOString().split('T')[0],
      toDate: to.toISOString().split('T')[0],
    },
    centres,
    summary: {
      totalSales: centres.reduce((sum, c) => sum + c.sales, 0),
      totalPurchase: centres.reduce((sum, c) => sum + c.purchase, 0),
      totalDirectIncome: centres.reduce((sum, c) => sum + c.directIncome, 0),
      totalIndirectIncome: centres.reduce((sum, c) => sum + c.indirectIncome, 0),
      totalDirectExpense: centres.reduce((sum, c) => sum + c.directExpense, 0),
      totalIndirectExpense: centres.reduce((sum, c) => sum + c.indirectExpense, 0),
      totalGrossProfit: centres.reduce((sum, c) => sum + c.grossProfit, 0),
      totalNetProfit: centres.reduce((sum, c) => sum + c.netProfit, 0),
    },
  };
}

