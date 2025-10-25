// STUB: Analytics service - simplified implementation
// This is a placeholder to prevent build errors

import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export class AnalyticsService {
  static async getMetrics(startupId: string, periodStart: Date, periodEnd: Date) {
    try {
      // Get basic transaction data
      const transactions = await prisma.transaction.findMany({
        where: {
          startupId,
          date: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
        include: {
          account: true,
        },
      });

      // Calculate basic metrics
      const totalRevenue = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = Math.abs(transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0));

      const netIncome = totalRevenue - totalExpenses;

      return {
        success: true,
        data: {
          totalRevenue: new Prisma.Decimal(totalRevenue),
          totalExpenses: new Prisma.Decimal(totalExpenses),
          netIncome: new Prisma.Decimal(netIncome),
          transactionCount: transactions.length,
          // Stub values for unimplemented features
          stripeRevenue: new Prisma.Decimal(0),
          activeCustomers: 0,
          newCustomers: 0,
          churnedCustomers: 0,
          mrr: new Prisma.Decimal(0),
          arr: new Prisma.Decimal(0),
        },
      };
    } catch (error) {
      console.error('Analytics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getAccountBalances(startupId: string) {
    try {
      const accounts = await prisma.mockBankAccount.findMany({
        where: { startupId },
      });

      const totalBalance = accounts.reduce(
        (sum, acc) => sum.add(acc.balance),
        new Prisma.Decimal(0)
      );

      return {
        success: true,
        data: {
          totalBalance,
          accounts: accounts.map(acc => ({
            id: acc.id,
            name: acc.accountName,
            balance: new Prisma.Decimal(acc.balance),
          })),
        },
      };
    } catch (error) {
      console.error('Account balance error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getCashflowMetrics(startupId: string) {
    try {
      const metrics = await prisma.cashflowMetric.findMany({
        where: { startupId },
        orderBy: { periodStart: 'desc' },
        take: 12, // Last 12 months
      });

      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      console.error('Cashflow metrics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async createCashflowMetric(startupId: string, data: any) {
    try {
      const metric = await prisma.cashflowMetric.create({
        data: {
          startupId,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          totalRevenue: data.totalRevenue || data.revenue || 0,
          totalExpenses: data.totalExpenses || data.expenses || 0,
          netCashflow: data.netCashflow || 0,
          burnRate: data.burnRate,
          runway: data.runway,
        },
      });

      return {
        success: true,
        data: metric,
      };
    } catch (error) {
      console.error('Create cashflow metric error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getLatestMetrics(startupId: string) {
    try {
      const latestMetric = await prisma.cashflowMetric.findFirst({
        where: { startupId },
        orderBy: { periodStart: 'desc' },
      });

      return {
        success: true,
        data: latestMetric,
      };
    } catch (error) {
      console.error('Latest metrics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getMetricsHistory(startupId: string, months: number = 12) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const metrics = await prisma.cashflowMetric.findMany({
        where: {
          startupId,
          periodStart: { gte: startDate },
        },
        orderBy: { periodStart: 'asc' },
      });

      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      console.error('Metrics history error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async calculateCurrentMonthMetrics(startupId: string) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return await this.getMetrics(startupId, startOfMonth, endOfMonth);
    } catch (error) {
      console.error('Current month metrics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getDashboardSummary(startupId: string) {
    try {
      const alerts = await prisma.alert.findMany({
        where: { startupId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      const accounts = await prisma.mockBankAccount.findMany({
        where: { startupId },
      });

      const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

      return {
        success: true,
        data: {
          totalBalance: new Prisma.Decimal(totalBalance),
          accountCount: accounts.length,
          alertCount: alerts.length,
          recentAlerts: alerts,
        },
      };
    } catch (error) {
      console.error('Dashboard summary error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getRevenueBreakdown(startupId: string, startDate: Date, endDate: Date) {
    try {
      // Stub implementation - returns mock data
      return {
        success: true,
        data: {
          totalRevenue: new Prisma.Decimal(0),
          stripeRevenue: new Prisma.Decimal(0),
          otherRevenue: new Prisma.Decimal(0),
          breakdown: [],
        },
      };
    } catch (error) {
      console.error('Revenue breakdown error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private static getMonthsDifference(start: Date, end: Date): number {
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }
}