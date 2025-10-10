import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export class AnalyticsService {
  /**
   * Calculate and store cashflow metrics for a tenant
   */
  static async calculateMetrics(tenantId: string, periodStart: Date, periodEnd: Date) {
    try {
      // Get all transactions in the period
      const transactions = await prisma.transaction.findMany({
        where: {
          account: {
            plaidItem: {
              tenantId,
            },
          },
          date: {
            gte: periodStart,
            lte: periodEnd,
          },
          pending: false,
        },
        include: {
          category: true,
        },
      });

      // Get Stripe data
      const stripeAccount = await prisma.stripeAccount.findFirst({
        where: { tenantId, isActive: true },
      });

      let stripeRevenue = new Prisma.Decimal(0);
      let activeCustomers = 0;
      let newCustomers = 0;
      let churnedCustomers = 0;
      let mrr = new Prisma.Decimal(0);
      let arr = new Prisma.Decimal(0);

      if (stripeAccount) {
        // Calculate revenue from Stripe payments
        const payments = await prisma.stripePayment.findMany({
          where: {
            stripeAccountId: stripeAccount.id,
            paidAt: {
              gte: periodStart,
              lte: periodEnd,
            },
            status: 'succeeded',
          },
        });

        stripeRevenue = payments.reduce(
          (sum, payment) => sum.add(payment.amount),
          new Prisma.Decimal(0)
        );

        // Convert from cents to dollars
        stripeRevenue = stripeRevenue.div(100);

        // Get active subscriptions
        const activeSubscriptions = await prisma.stripeSubscription.findMany({
          where: {
            stripeAccountId: stripeAccount.id,
            status: 'active',
            currentPeriodEnd: {
              gte: periodEnd,
            },
          },
        });

        activeCustomers = activeSubscriptions.length;

        // Calculate MRR
        for (const sub of activeSubscriptions) {
          let monthlyAmount = new Prisma.Decimal(sub.planAmount).div(100);
          
          // Convert to monthly if annual
          if (sub.planInterval === 'year') {
            monthlyAmount = monthlyAmount.div(12);
          }
          
          mrr = mrr.add(monthlyAmount.mul(sub.quantity));
        }

        arr = mrr.mul(12);

        // Get new customers (created in this period)
        const newCustomersData = await prisma.stripeCustomer.findMany({
          where: {
            stripeAccountId: stripeAccount.id,
            createdAt: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
        });

        newCustomers = newCustomersData.length;

        // Get churned customers (subscriptions canceled in this period)
        const churnedSubscriptions = await prisma.stripeSubscription.findMany({
          where: {
            stripeAccountId: stripeAccount.id,
            status: { in: ['canceled', 'unpaid'] },
            canceledAt: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
        });

        churnedCustomers = churnedSubscriptions.length;
      }

      // Calculate expenses (negative transactions)
      const expenses = transactions
        .filter((t) => new Prisma.Decimal(t.amount).lt(0))
        .reduce((sum, t) => sum.add(new Prisma.Decimal(t.amount).abs()), new Prisma.Decimal(0));

      // Calculate revenue from transactions (positive transactions)
      const transactionRevenue = transactions
        .filter((t) => new Prisma.Decimal(t.amount).gt(0))
        .reduce((sum, t) => sum.add(t.amount), new Prisma.Decimal(0));

      // Total revenue (Stripe + transactions)
      const totalRevenue = stripeRevenue.add(transactionRevenue);

      // Net cashflow
      const netCashflow = totalRevenue.sub(expenses);

      // Calculate burn rate (average monthly expenses)
      const periodMonths = this.getMonthsDifference(periodStart, periodEnd);
      const burnRate = periodMonths > 0 ? expenses.div(periodMonths) : expenses;

      // Get current cash balance
      const accounts = await prisma.account.findMany({
        where: {
          plaidItem: {
            tenantId,
          },
        },
      });

      const cashBalance = accounts.reduce(
        (sum, acc) => sum.add(acc.currentBalance),
        new Prisma.Decimal(0)
      );

      // Calculate runway (months)
      const runway = burnRate.gt(0) ? cashBalance.div(burnRate) : new Prisma.Decimal(999);

      // Calculate growth rate (compare with previous period)
      const previousPeriodStart = new Date(periodStart);
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
      const previousPeriodEnd = new Date(periodStart);
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);

      const previousMetrics = await prisma.cashflowMetric.findFirst({
        where: {
          tenantId,
          periodStart: {
            gte: previousPeriodStart,
          },
          periodEnd: {
            lte: previousPeriodEnd,
          },
        },
        orderBy: {
          periodEnd: 'desc',
        },
      });

      let growthRate = new Prisma.Decimal(0);
      if (previousMetrics && previousMetrics.totalRevenue.gt(0)) {
        growthRate = totalRevenue
          .sub(previousMetrics.totalRevenue)
          .div(previousMetrics.totalRevenue)
          .mul(100);
      }

      // Calculate CAC and LTV (simplified)
      const customerAcquisitionCost = newCustomers > 0 
        ? expenses.div(newCustomers) 
        : new Prisma.Decimal(0);
      
      const lifetimeValue = activeCustomers > 0 && mrr.gt(0)
        ? mrr.div(activeCustomers).mul(24) // Assume 24 month lifetime
        : new Prisma.Decimal(0);

      // Store metrics
      const metric = await prisma.cashflowMetric.create({
        data: {
          tenantId,
          periodStart,
          periodEnd,
          totalRevenue,
          totalExpenses: expenses,
          netCashflow,
          burnRate,
          runway,
          mrr,
          arr,
          growthRate,
          cashBalance,
          accountsReceivable: new Prisma.Decimal(0), // TODO: Calculate from invoices
          accountsPayable: new Prisma.Decimal(0), // TODO: Calculate from bills
          activeCustomers,
          newCustomers,
          churnedCustomers,
          customerAcquisitionCost,
          lifetimeValue,
          metadata: {},
        },
      });

      return metric;
    } catch (error: any) {
      console.error('Error calculating metrics:', error);
      throw new Error(`Failed to calculate metrics: ${error.message}`);
    }
  }

  /**
   * Get latest metrics for a tenant
   */
  static async getLatestMetrics(tenantId: string) {
    return await prisma.cashflowMetric.findFirst({
      where: { tenantId },
      orderBy: { periodEnd: 'desc' },
    });
  }

  /**
   * Get metrics history for a tenant
   */
  static async getMetricsHistory(tenantId: string, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return await prisma.cashflowMetric.findMany({
      where: {
        tenantId,
        periodStart: {
          gte: startDate,
        },
      },
      orderBy: {
        periodStart: 'asc',
      },
    });
  }

  /**
   * Calculate metrics for current month
   */
  static async calculateCurrentMonthMetrics(tenantId: string) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return await this.calculateMetrics(tenantId, periodStart, periodEnd);
  }

  /**
   * Get dashboard summary
   */
  static async getDashboardSummary(tenantId: string) {
    const latestMetrics = await this.getLatestMetrics(tenantId);
    const history = await this.getMetricsHistory(tenantId, 6);

    // Get active alerts
    const alerts = await prisma.alert.findMany({
      where: {
        tenantId,
        isRead: false,
        isDismissed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        account: {
          plaidItem: {
            tenantId,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 10,
      include: {
        category: true,
        account: true,
      },
    });

    // Calculate trends
    let revenueTrend = 0;
    let expensesTrend = 0;
    
    if (history.length >= 2) {
      const current = history[history.length - 1];
      const previous = history[history.length - 2];
      
      if (previous.totalRevenue.gt(0)) {
        revenueTrend = current.totalRevenue
          .sub(previous.totalRevenue)
          .div(previous.totalRevenue)
          .mul(100)
          .toNumber();
      }
      
      if (previous.totalExpenses.gt(0)) {
        expensesTrend = current.totalExpenses
          .sub(previous.totalExpenses)
          .div(previous.totalExpenses)
          .mul(100)
          .toNumber();
      }
    }

    return {
      metrics: latestMetrics,
      history,
      alerts,
      recentTransactions,
      trends: {
        revenue: revenueTrend,
        expenses: expensesTrend,
      },
    };
  }

  /**
   * Get revenue breakdown by source
   */
  static async getRevenueBreakdown(tenantId: string, startDate: Date, endDate: Date) {
    const stripeAccount = await prisma.stripeAccount.findFirst({
      where: { tenantId, isActive: true },
    });

    let stripeRevenue = new Prisma.Decimal(0);
    if (stripeAccount) {
      const payments = await prisma.stripePayment.findMany({
        where: {
          stripeAccountId: stripeAccount.id,
          paidAt: { gte: startDate, lte: endDate },
          status: 'succeeded',
        },
      });

      stripeRevenue = payments.reduce(
        (sum, p) => sum.add(p.amount),
        new Prisma.Decimal(0)
      ).div(100);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        account: { plaidItem: { tenantId } },
        date: { gte: startDate, lte: endDate },
        amount: { gt: 0 },
        pending: false,
      },
    });

    const transactionRevenue = transactions.reduce(
      (sum, t) => sum.add(t.amount),
      new Prisma.Decimal(0)
    );

    return {
      stripe: stripeRevenue,
      transactions: transactionRevenue,
      total: stripeRevenue.add(transactionRevenue),
    };
  }

  /**
   * Helper: Calculate months between two dates
   */
  private static getMonthsDifference(start: Date, end: Date): number {
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(months, 1);
  }
}

