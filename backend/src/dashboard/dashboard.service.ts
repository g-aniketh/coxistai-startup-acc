import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDashboardSummary = async (startupId: string) => {
  // Get all mock bank accounts
  const accounts = await prisma.mockBankAccount.findMany({
    where: { startupId },
  });

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance),
    0
  );

  // Check for imported financial metrics (prefer these over calculated values)
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const importedMetrics = await prisma.cashflowMetric.findFirst({
    where: {
      startupId: startupId,
      periodStart: {
        lte: periodEnd,
      },
      periodEnd: {
        gte: periodStart,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Calculate monthly burn rate (last 3 months) - fallback if no imported metrics
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      startupId,
      date: { gte: threeMonthsAgo },
    },
    include: {
      account: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  // Calculate income and expenses
  const income = recentTransactions
    .filter((t) => t.type === "CREDIT")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = recentTransactions
    .filter((t) => t.type === "DEBIT")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netCashflow = income - expenses;

  // Use imported metrics if available, otherwise calculate
  const monthlyBurn =
    importedMetrics && Number(importedMetrics.burnRate) > 0
      ? Number(importedMetrics.burnRate)
      : expenses / 3;

  const monthlyRevenue =
    importedMetrics && Number(importedMetrics.mrr) > 0
      ? Number(importedMetrics.mrr)
      : income / 3;

  // Calculate runway (in months) - use imported if available, otherwise calculate
  const runwayMonths =
    importedMetrics && Number(importedMetrics.runway) > 0
      ? Number(importedMetrics.runway)
      : monthlyBurn > 0
        ? totalBalance / monthlyBurn
        : Infinity;

  // Get product inventory stats
  const products = await prisma.product.findMany({
    where: { startupId },
  });

  const totalProducts = products.length;
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + Number(p.quantity) * Number(p.price),
    0
  );
  const lowStockProducts = products.filter((p) => p.quantity < 10).length;

  // Get sales stats (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSales = await prisma.sale.findMany({
    where: {
      startupId,
      saleDate: { gte: thirtyDaysAgo },
    },
  });

  const totalSales = recentSales.reduce(
    (sum, s) => sum + Number(s.totalPrice),
    0
  );
  const unitsSold = recentSales.reduce(
    (sum, s) => sum + Number(s.quantitySold),
    0
  );

  return {
    financial: {
      totalBalance: Number(totalBalance),
      monthlyBurn: Number(monthlyBurn),
      monthlyRevenue: Number(monthlyRevenue),
      netCashflow: Number(netCashflow),
      runwayMonths:
        runwayMonths === Infinity ? null : Number(runwayMonths.toFixed(1)),
      income: Number(income),
      expenses: Number(expenses),
    },
    inventory: {
      totalProducts,
      totalInventoryValue: Number(totalInventoryValue),
      lowStockProducts,
    },
    sales: {
      totalSales30Days: Number(totalSales),
      unitsSold30Days: unitsSold,
      salesCount: recentSales.length,
    },
    accounts: accounts.length,
  };
};

export const getCashflowChart = async (
  startupId: string,
  months: number = 6
) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const transactions = await prisma.transaction.findMany({
    where: {
      startupId,
      date: { gte: startDate },
    },
    include: {
      account: true,
    },
    orderBy: { date: "asc" },
  });

  // Group by month
  const monthlyData: {
    [key: string]: { income: number; expenses: number; date: string };
  } = {};

  transactions.forEach((t) => {
    const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0, date: monthKey };
    }

    if (t.type === "CREDIT") {
      monthlyData[monthKey].income += Number(t.amount);
    } else {
      monthlyData[monthKey].expenses += Number(t.amount);
    }
  });

  const chartData = Object.values(monthlyData).map((data) => ({
    date: data.date,
    income: data.income,
    expenses: data.expenses,
    netCashflow: data.income - data.expenses,
  }));

  return chartData;
};

export const getRecentActivity = async (
  startupId: string,
  limit: number = 10
) => {
  const [recentTransactions, recentSales] = await Promise.all([
    prisma.transaction.findMany({
      where: { startupId },
      include: {
        account: {
          select: {
            accountName: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: limit,
    }),
    prisma.sale.findMany({
      where: { startupId },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { saleDate: "desc" },
      take: limit,
    }),
  ]);

  // Combine and sort by date
  const activities = [
    ...recentTransactions.map((t) => ({
      type: "transaction" as const,
      id: t.id,
      description: t.description,
      amount: t.amount,
      transactionType: t.type,
      date: t.date,
      account: t.account.accountName,
    })),
    ...recentSales.map((s) => ({
      type: "sale" as const,
      id: s.id,
      description: `Sale of ${s.quantitySold}x ${s.product.name}`,
      amount: s.totalPrice,
      transactionType: "CREDIT" as const,
      date: s.saleDate,
      product: s.product.name,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);

  return activities;
};
