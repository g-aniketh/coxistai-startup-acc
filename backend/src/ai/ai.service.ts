import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

// Initialize OpenAI only if API key is provided
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  } catch (error) {
    console.warn('Failed to initialize OpenAI service:', error);
    openai = null;
  }
} else {
  console.warn('OPENAI_API_KEY not provided. AI functionality will be disabled.');
}

interface FinancialInsights {
  burnAnalysis: string;
  topSpendingCategories: string[];
  costSavingSuggestions: string[];
  revenueOpportunities: string[];
  cashflowHealth: string;
  keyMetrics: {
    totalBalance: number;
    monthlyBurn: number;
    monthlyRevenue: number;
    runway: number | null;
  };
}

interface WhatIfScenario {
  scenario: string;
  impact: {
    runwayChange: string;
    burnRateChange: string;
    recommendation: string;
  };
  explanation: string;
  risks: string[];
  opportunities: string[];
}

export const getFinancialInsights = async (startupId: string): Promise<FinancialInsights> => {
  if (!openai) {
    throw new Error('OpenAI service is not available. Please check your API key configuration.');
  }

  // 1. Fetch relevant financial data
  const [transactions, accounts, products, sales] = await Promise.all([
    prisma.transaction.findMany({
      where: { startupId },
      orderBy: { date: 'desc' },
      take: 100,
      include: {
        account: {
          select: {
            accountName: true
          }
        }
      }
    }),
    prisma.mockBankAccount.findMany({
      where: { startupId }
    }),
    prisma.product.findMany({
      where: { startupId }
    }),
    prisma.sale.findMany({
      where: { startupId },
      orderBy: { saleDate: 'desc' },
      take: 50
    })
  ]);

  // 2. Calculate key metrics
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const recentTransactions = transactions.filter(t => t.date >= threeMonthsAgo);
  const income = recentTransactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
  const expenses = recentTransactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);
  
  const monthlyBurn = expenses / 3;
  const monthlyRevenue = income / 3;
  const runway = monthlyBurn > 0 ? totalBalance / monthlyBurn : null;

  // 3. Format data for AI
  const transactionSummary = transactions.slice(0, 50).map(t => 
    `${t.date.toISOString().split('T')[0]}: ${t.type === 'DEBIT' ? '-' : '+'}$${t.amount.toFixed(2)} - ${t.description}`
  ).join('\n');

  const debitTransactions = recentTransactions
    .filter(t => t.type === 'DEBIT')
    .map(t => `${t.description}: $${t.amount}`)
    .join('\n');

  const creditTransactions = recentTransactions
    .filter(t => t.type === 'CREDIT')
    .map(t => `${t.description}: $${t.amount}`)
    .join('\n');

  // 4. Engineer the prompt
  const systemPrompt = `You are an expert startup CFO providing actionable financial analysis. 
Analyze the provided data and return insights in JSON format with these keys:
- burnAnalysis: A brief analysis of spending patterns
- topSpendingCategories: Array of top 3-5 expense categories identified
- costSavingSuggestions: Array of 3-5 specific cost-cutting recommendations
- revenueOpportunities: Array of 3-5 revenue growth suggestions
- cashflowHealth: Overall assessment of financial health (one paragraph)

Be specific, actionable, and concise.`;

  const userPrompt = `Analyze this startup's financial data:

KEY METRICS:
- Total Balance: $${totalBalance.toFixed(2)}
- Monthly Burn Rate: $${monthlyBurn.toFixed(2)}
- Monthly Revenue: $${monthlyRevenue.toFixed(2)}
- Runway: ${runway ? `${runway.toFixed(1)} months` : 'Infinite'}
- Net Cashflow (3mo): $${(income - expenses).toFixed(2)}

RECENT EXPENSES (Last 3 months):
${debitTransactions || 'No expenses recorded'}

RECENT INCOME (Last 3 months):
${creditTransactions || 'No income recorded'}

RECENT TRANSACTIONS (Last 50):
${transactionSummary || 'No transactions'}

INVENTORY:
- Products: ${products.length}
- Total Inventory Value: $${products.reduce((sum, p) => sum + (p.quantity * p.price), 0).toFixed(2)}
- Recent Sales: ${sales.length} sales in last period

Provide actionable insights to help this startup manage cashflow better.`;

  // 5. Call OpenAI API
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500,
    });

    const insights = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      ...insights,
      keyMetrics: {
        totalBalance,
        monthlyBurn,
        monthlyRevenue,
        runway,
      }
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate insights');
  }
};

export const runWhatIfScenario = async (
  startupId: string, 
  scenarioDescription: string
): Promise<WhatIfScenario> => {
  if (!openai) {
    throw new Error('OpenAI service is not available. Please check your API key configuration.');
  }

  // 1. Fetch current financial state
  const [accounts, transactions] = await Promise.all([
    prisma.mockBankAccount.findMany({
      where: { startupId }
    }),
    prisma.transaction.findMany({
      where: { startupId },
      orderBy: { date: 'desc' },
      take: 100
    })
  ]);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const recentTransactions = transactions.filter(t => t.date >= threeMonthsAgo);
  const income = recentTransactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
  const expenses = recentTransactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);
  
  const monthlyBurn = expenses / 3;
  const monthlyRevenue = income / 3;
  const currentRunway = monthlyBurn > 0 ? totalBalance / monthlyBurn : null;

  // 2. Engineer the prompt
  const systemPrompt = `You are an expert financial advisor for startups. Analyze "what-if" scenarios and return structured JSON with these keys:
- scenario: Restate the scenario clearly
- impact: Object with runwayChange, burnRateChange, recommendation
- explanation: Detailed explanation of financial impact
- risks: Array of potential risks
- opportunities: Array of potential opportunities

Be specific with numbers and timelines.`;

  const userPrompt = `CURRENT FINANCIAL STATE:
- Total Balance: $${totalBalance.toFixed(2)}
- Monthly Burn Rate: $${monthlyBurn.toFixed(2)}
- Monthly Revenue: $${monthlyRevenue.toFixed(2)}
- Current Runway: ${currentRunway ? `${currentRunway.toFixed(1)} months` : 'Infinite'}

SCENARIO TO ANALYZE:
${scenarioDescription}

Analyze the financial impact of this scenario. Provide specific calculations and actionable recommendations.`;

  // 3. Call OpenAI API
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 2000,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    // 4. Store scenario in database for history
    await prisma.aIScenario.create({
      data: {
        startupId,
        name: scenarioDescription.substring(0, 100),
        description: scenarioDescription,
        scenarioType: 'what_if',
        inputParameters: {
          currentBalance: totalBalance,
          currentBurn: monthlyBurn,
          currentRevenue: monthlyRevenue,
          currentRunway: currentRunway
        },
        insights: result.explanation ? [result.explanation] : [],
        recommendations: result.impact?.recommendation ? [result.impact.recommendation] : [],
        risks: result.risks || [],
        opportunities: result.opportunities || [],
        confidence: 85
      }
    });

    return result;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to run scenario analysis');
  }
};

export const generateInvestorUpdate = async (
  startupId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<any> => {
  if (!openai) {
    throw new Error('OpenAI service is not available. Please check your API key configuration.');
  }

  // 1. Fetch data for the period
  const [transactions, sales, products] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        startupId,
        date: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    }),
    prisma.sale.findMany({
      where: {
        startupId,
        saleDate: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    }),
    prisma.product.findMany({
      where: { startupId }
    })
  ]);

  const income = transactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);
  const totalSales = sales.reduce((sum, s) => sum + s.totalPrice, 0);

  // 2. Engineer prompt
  const systemPrompt = `You are a professional investor relations advisor. Create a compelling investor update in JSON format with these keys:
- executiveSummary: 2-3 sentence overview
- highlights: Array of 3-5 key achievements
- challenges: Array of 2-3 challenges faced
- nextSteps: Array of 3-5 upcoming initiatives
- financialSummary: Brief financial overview

Write professionally but concisely.`;

  const userPrompt = `Generate an investor update for the period ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}:

FINANCIAL PERFORMANCE:
- Revenue: $${income.toFixed(2)}
- Expenses: $${expenses.toFixed(2)}
- Net: $${(income - expenses).toFixed(2)}
- Sales Count: ${sales.length}
- Total Sales Value: $${totalSales.toFixed(2)}

OPERATIONS:
- Active Products: ${products.length}
- Total Inventory Value: $${products.reduce((sum, p) => sum + (p.quantity * p.price), 0).toFixed(2)}

Create an impressive, honest investor update.`;

  // 3. Call OpenAI
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = JSON.parse(completion.choices[0].message.content || '{}');

    // 4. Store in database
    const investorUpdate = await prisma.investorUpdate.create({
      data: {
        startupId,
        title: `Investor Update - ${periodStart.toLocaleDateString()}`,
        periodStart,
        periodEnd,
        executiveSummary: content.executiveSummary || '',
        highlights: content.highlights || [],
        challenges: content.challenges || [],
        nextSteps: content.nextSteps || [],
        financialData: {
          revenue: income,
          expenses,
          sales: totalSales
        },
        metrics: {
          revenue: income,
          expenses,
          netCashflow: income - expenses,
          salesCount: sales.length
        },
        revenueGrowth: 0,
        burnRate: expenses,
        runway: 0,
        isDraft: true
      }
    });

    return {
      id: investorUpdate.id,
      ...content,
      financialData: {
        revenue: income,
        expenses,
        netCashflow: income - expenses
      }
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate investor update');
  }
};

