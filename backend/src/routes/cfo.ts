import { Router, Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../lib/prisma';

const cfoRoutes: Router = Router();

// Get all financial accounts for the tenant
cfoRoutes.get('/accounts', async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const accounts = await prisma.mockBankAccount.findMany({
      where: {
        startupId: req.user.startupId,
      },
      include: {
        transactions: {
          take: 5,
          orderBy: { date: 'desc' },
          include: {
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        balance: 'desc',
      },
    });

    // Calculate total balance
    const totalBalance = accounts.reduce((sum, account) => {
      return sum + Number(account.balance);
    }, 0);

    return res.json({
      success: true,
      data: {
        accounts,
        summary: {
          totalAccounts: accounts.length,
          totalBalance,
          currency: 'USD', // Assuming USD for now
        },
      },
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch accounts',
    });
  }
});

// Get paginated transactions with filters
cfoRoutes.get('/transactions', async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const {
      page = '1',
      limit = '50',
      startDate,
      endDate,
      categoryId,
      accountId,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      account: {
        startupId: req.user.startupId,
      },
    };

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    // Category filter
    if (categoryId) {
      where.categoryId = parseInt(categoryId as string, 10);
    }

    // Account filter
    if (accountId) {
      where.accountId = accountId as string;
    }

    // Search filter (description)
    if (search) {
      where.description = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder as 'asc' | 'desc';

    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              accountName: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Calculate summary for the filtered results
    const totalAmount = transactions.reduce((sum, transaction) => {
      return sum + Number(transaction.amount);
    }, 0);

    const incomeAmount = transactions
      .filter(t => Number(t.amount) > 0)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const expenseAmount = Math.abs(
      transactions
        .filter(t => Number(t.amount) < 0)
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    );

    return res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage,
          hasPrevPage,
        },
        summary: {
          totalAmount,
          incomeAmount,
          expenseAmount,
          transactionCount: transactions.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
    });
  }
});

// Get dashboard summary with key metrics
cfoRoutes.get('/dashboard/summary', async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { period = '30' } = req.query; // Default to last 30 days
    const days = parseInt(period as string, 10);
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all accounts for the tenant
    const accounts = await prisma.mockBankAccount.findMany({
      where: {
        startupId: req.user.startupId,
      },
      include: {
      },
    });

    // Calculate total balance
    const totalBalance = accounts.reduce((sum, account) => {
      return sum + Number(account.balance);
    }, 0);

    // Get transactions for the period
    const transactions = await prisma.transaction.findMany({
      where: {
        account: {
          startupId: req.user.startupId,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        account: true,
      },
      orderBy: { date: 'desc' },
    });

    // Calculate cash flow metrics
    const income = transactions
      .filter(t => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = Math.abs(
      transactions
        .filter(t => Number(t.amount) < 0)
        .reduce((sum, t) => sum + Number(t.amount), 0)
    );

    const netCashFlow = income - expenses;
    const burnRate = expenses / days; // Daily burn rate
    const runway = totalBalance > 0 ? totalBalance / Math.abs(burnRate) : 0; // Days of runway

    // Get recent transactions (last 10)
    const recentTransactions = transactions.slice(0, 10);

    // Calculate category breakdown
    const categoryBreakdown = transactions.reduce((acc, transaction) => {
      const categoryName = 'Uncategorized'; // TODO: Implement categories
      const amount = Number(transaction.amount);
      
      if (!acc[categoryName]) {
        acc[categoryName] = { income: 0, expenses: 0, count: 0 };
      }
      
      if (amount > 0) {
        acc[categoryName].income += amount;
      } else {
        acc[categoryName].expenses += Math.abs(amount);
      }
      acc[categoryName].count += 1;
      
      return acc;
    }, {} as Record<string, { income: number; expenses: number; count: number }>);

    // Get account breakdown
    const accountBreakdown = accounts.map(account => ({
      id: account.id,
      name: account.accountName,
      mask: '****', // TODO: Implement account masking
      type: 'checking', // TODO: Implement account types
      subtype: 'checking', // TODO: Implement account subtypes
      balance: Number(account.balance),
      institution: 'Mock Bank', // TODO: Implement institution data
    }));

    // Calculate daily breakdown for the chart
    const dailyBreakdown = [];
    for (let i = 0; i < days; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + i);
      const dayStart = new Date(dayDate.setHours(0, 0, 0, 0));
      const dayEnd = new Date(dayDate.setHours(23, 59, 59, 999));

      const dayTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate >= dayStart && transDate <= dayEnd;
      });

      const dayIncome = dayTransactions
        .filter(t => Number(t.amount) > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const dayExpenses = Math.abs(
        dayTransactions
          .filter(t => Number(t.amount) < 0)
          .reduce((sum, t) => sum + Number(t.amount), 0)
      );

      dailyBreakdown.push({
        date: dayStart.toISOString().split('T')[0],
        income: dayIncome,
        expenses: dayExpenses,
        net: dayIncome - dayExpenses,
      });
    }

    // Calculate monthly trends (if we have enough data)
    const monthlyData = [];
    for (let i = 0; i < Math.min(6, Math.floor(days / 30)); i++) {
      const monthStart = new Date(endDate);
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      const monthTransactions = transactions.filter(t => 
        t.date >= monthStart && t.date <= monthEnd
      );

      const monthIncome = monthTransactions
        .filter(t => Number(t.amount) > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthExpenses = Math.abs(
        monthTransactions
          .filter(t => Number(t.amount) < 0)
          .reduce((sum, t) => sum + Number(t.amount), 0)
      );

      monthlyData.unshift({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        income: monthIncome,
        expenses: monthExpenses,
        netCashFlow: monthIncome - monthExpenses,
        transactionCount: monthTransactions.length,
      });
    }

    return res.json({
      success: true,
      data: {
        period: {
          days,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        balance: {
          total: totalBalance,
          currency: 'USD',
        },
        cashFlow: {
          income,
          expenses,
          netCashFlow,
          burnRate: Math.abs(burnRate),
          runway: Math.round(runway),
          dailyBreakdown,
        },
        accounts: {
          total: accounts.length,
          breakdown: accountBreakdown,
        },
        transactions: {
          total: transactions.length,
          recent: recentTransactions,
        },
        categories: {
          breakdown: Object.entries(categoryBreakdown)
            .map(([name, data]) => ({
              name,
              income: data.income,
              expenses: data.expenses,
              net: data.income - data.expenses,
              count: data.count,
            }))
            .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
            .slice(0, 10), // Top 10 categories
        },
        trends: {
          monthly: monthlyData,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard summary',
    });
  }
});

// Get transaction categories
cfoRoutes.get('/categories', async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // TODO: Implement transaction categories
    const categories = []; // await prisma.transactionCategory.findMany(...);

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch categories',
    });
  }
});

// Get financial health score
cfoRoutes.get('/health-score', async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { period = '30' } = req.query;
    const days = parseInt(period as string, 10);
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get accounts and transactions
    const [accounts, transactions] = await Promise.all([
      prisma.mockBankAccount.findMany({
        where: {
          startupId: req.user.startupId,
        },
      }),
      prisma.transaction.findMany({
        where: {
          startupId: req.user.startupId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    // Calculate health score components
    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
    const income = transactions.filter(t => Number(t.amount) > 0).reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = Math.abs(transactions.filter(t => Number(t.amount) < 0).reduce((sum, t) => sum + Number(t.amount), 0));
    const netCashFlow = income - expenses;
    const burnRate = expenses / days;

    // Calculate score (0-100)
    let score = 0;
    const factors = [];

    // Balance factor (0-25 points)
    if (totalBalance > 0) {
      const balanceScore = Math.min(25, (totalBalance / 10000) * 25); // $10k = 25 points
      score += balanceScore;
      factors.push({ name: 'Positive Balance', score: balanceScore, max: 25 });
    } else {
      factors.push({ name: 'Positive Balance', score: 0, max: 25 });
    }

    // Cash flow factor (0-25 points)
    if (netCashFlow > 0) {
      const cashFlowScore = Math.min(25, (netCashFlow / 5000) * 25); // $5k positive = 25 points
      score += cashFlowScore;
      factors.push({ name: 'Positive Cash Flow', score: cashFlowScore, max: 25 });
    } else {
      factors.push({ name: 'Positive Cash Flow', score: 0, max: 25 });
    }

    // Burn rate factor (0-25 points) - lower burn rate is better
    if (burnRate > 0) {
      const burnRateScore = Math.max(0, 25 - (burnRate / 1000) * 25); // $1k/day = 0 points
      score += burnRateScore;
      factors.push({ name: 'Low Burn Rate', score: burnRateScore, max: 25 });
    } else {
      factors.push({ name: 'Low Burn Rate', score: 25, max: 25 });
    }

    // Transaction consistency factor (0-25 points)
    const transactionCount = transactions.length;
    const expectedTransactions = days * 2; // Assume 2 transactions per day
    const consistencyScore = Math.min(25, (transactionCount / expectedTransactions) * 25);
    score += consistencyScore;
    factors.push({ name: 'Transaction Consistency', score: consistencyScore, max: 25 });

    // Determine health level
    let healthLevel = 'Poor';
    if (score >= 80) healthLevel = 'Excellent';
    else if (score >= 60) healthLevel = 'Good';
    else if (score >= 40) healthLevel = 'Fair';

    return res.json({
      success: true,
      data: {
        score: Math.round(score),
        healthLevel,
        factors,
        metrics: {
          totalBalance,
          netCashFlow,
          burnRate,
          transactionCount,
          period: days,
        },
        recommendations: generateRecommendations(score, factors, totalBalance, netCashFlow, burnRate),
      },
    });
  } catch (error) {
    console.error('Error calculating health score:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate health score',
    });
  }
});

// Helper function to generate recommendations
function generateRecommendations(score: number, factors: any[], totalBalance: number, netCashFlow: number, burnRate: number): string[] {
  const recommendations = [];

  if (score < 40) {
    recommendations.push('Consider reducing expenses to improve cash flow');
    recommendations.push('Focus on increasing revenue streams');
  }

  if (totalBalance < 1000) {
    recommendations.push('Build up emergency fund - aim for 3-6 months of expenses');
  }

  if (netCashFlow < 0) {
    recommendations.push('Address negative cash flow immediately');
    recommendations.push('Review and cut unnecessary expenses');
  }

  if (burnRate > 1000) {
    recommendations.push('High burn rate detected - review spending patterns');
  }

  if (factors.find(f => f.name === 'Transaction Consistency' && f.score < 15)) {
    recommendations.push('Ensure regular transaction monitoring and categorization');
  }

  if (recommendations.length === 0) {
    recommendations.push('Financial health looks good - continue current practices');
  }

  return recommendations;
}

export default cfoRoutes;
