import OpenAI from 'openai';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

// Initialize OpenAI only if API key is provided
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.warn('Failed to initialize OpenAI service:', error);
    openai = null;
  }
} else {
  console.warn('OPENAI_API_KEY not provided. AI functionality will be disabled.');
}

export interface ScenarioInput {
  revenueChange?: number; // Percentage change
  expenseChange?: number; // Percentage change
  newHires?: number;
  averageSalary?: number;
  additionalFunding?: number;
  timeHorizon?: number; // Months
  customAssumptions?: string;
}

export class AICFOService {
  /**
   * Generate AI-powered forecast
   */
  static async generateForecast(startupId: string, months: number = 12) {
    if (!openai) {
      throw new Error('OpenAI service is not available. Please check your API key configuration.');
    }

    try {
      // Get historical data
      const history = await prisma.cashflowMetric.findMany({
        where: { startupId },
        orderBy: { periodStart: 'asc' },
        take: 12,
      });

      if (history.length === 0) {
        throw new Error('Insufficient historical data for forecasting');
      }

      // Prepare data for AI
      const historicalData = history.map((m) => ({
        month: m.periodStart.toISOString().slice(0, 7),
        revenue: m.totalRevenue.toNumber(),
        expenses: m.totalExpenses.toNumber(),
        cashflow: m.netCashflow.toNumber(),
        mrr: m.mrr.toNumber(),
        customers: m.activeCustomers,
      }));

      const latestMetrics = history[history.length - 1];

      // Create AI prompt
      const prompt = `You are an expert CFO analyzing a startup's financial data. 

Historical Data (last ${history.length} months):
${JSON.stringify(historicalData, null, 2)}

Current Metrics:
- Cash Balance: $${latestMetrics.cashBalance.toNumber().toLocaleString()}
- Monthly Burn Rate: $${latestMetrics.burnRate.toNumber().toLocaleString()}
- MRR: $${latestMetrics.mrr.toNumber().toLocaleString()}
- ARR: $${latestMetrics.arr.toNumber().toLocaleString()}
- Active Customers: ${latestMetrics.activeCustomers}
- Runway: ${latestMetrics.runway.toNumber().toFixed(1)} months

Task: Generate a ${months}-month financial forecast with:
1. Projected monthly revenue (based on growth trends)
2. Projected monthly expenses (based on historical patterns)
3. Projected cashflow
4. Key insights and assumptions
5. Risk factors
6. Recommendations

Respond in JSON format:
{
  "forecast": [
    {
      "month": "2025-01",
      "revenue": 50000,
      "expenses": 45000,
      "cashflow": 5000,
      "cashBalance": 150000
    }
  ],
  "insights": ["insight 1", "insight 2"],
  "assumptions": ["assumption 1", "assumption 2"],
  "risks": ["risk 1", "risk 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "confidence": 0.85
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert CFO providing financial forecasts and strategic advice to startups. Always respond in valid JSON format.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');

      // Calculate summary metrics from forecast
      const lastForecastMonth = response.forecast[response.forecast.length - 1];
      const totalProjectedRevenue = response.forecast.reduce(
        (sum: number, m: any) => sum + m.revenue,
        0
      );
      const totalProjectedExpenses = response.forecast.reduce(
        (sum: number, m: any) => sum + m.expenses,
        0
      );

      // Store scenario
      const scenario = await prisma.aIScenario.create({
        data: {
          startupId,
          name: `${months}-Month Forecast`,
          description: `AI-generated ${months}-month financial forecast`,
          scenarioType: 'forecast',
          inputParameters: { months, baseDate: new Date() },
          projectedRevenue: new Prisma.Decimal(totalProjectedRevenue),
          projectedExpenses: new Prisma.Decimal(totalProjectedExpenses),
          projectedCashflow: new Prisma.Decimal(totalProjectedRevenue - totalProjectedExpenses),
          projectedRunway: lastForecastMonth?.cashBalance > 0 
            ? new Prisma.Decimal(lastForecastMonth.cashBalance / (totalProjectedExpenses / months))
            : new Prisma.Decimal(0),
          confidence: new Prisma.Decimal(response.confidence || 0.8),
          insights: response.insights || [],
          recommendations: response.recommendations || [],
          risks: response.risks || [],
        },
      });

      return {
        scenario,
        forecast: response.forecast,
        insights: response.insights,
        assumptions: response.assumptions,
        risks: response.risks,
        recommendations: response.recommendations,
        confidence: response.confidence,
      };
    } catch (error: any) {
      console.error('Error generating forecast:', error);
      throw new Error(`Failed to generate forecast: ${error.message}`);
    }
  }

  /**
   * Run "What If" scenario analysis
   */
  static async runScenario(startupId: string, scenarioName: string, inputs: ScenarioInput) {
    if (!openai) {
      throw new Error('OpenAI service is not available. Please check your API key configuration.');
    }

    try {
      // Get current metrics
      const latestMetrics = await prisma.cashflowMetric.findFirst({
        where: { startupId },
        orderBy: { periodEnd: 'desc' },
      });

      if (!latestMetrics) {
        throw new Error('No historical data available');
      }

      // Calculate scenario impacts
      const timeHorizon = inputs.timeHorizon || 12;
      const currentRevenue = latestMetrics.totalRevenue.toNumber();
      const currentExpenses = latestMetrics.totalExpenses.toNumber();
      const currentCashBalance = latestMetrics.cashBalance.toNumber();

      // Apply changes
      let projectedRevenue = currentRevenue;
      let projectedExpenses = currentExpenses;

      if (inputs.revenueChange) {
        projectedRevenue *= 1 + inputs.revenueChange / 100;
      }

      if (inputs.expenseChange) {
        projectedExpenses *= 1 + inputs.expenseChange / 100;
      }

      if (inputs.newHires && inputs.averageSalary) {
        projectedExpenses += inputs.newHires * inputs.averageSalary;
      }

      let projectedCashBalance = currentCashBalance;
      if (inputs.additionalFunding) {
        projectedCashBalance += inputs.additionalFunding;
      }

      // Project over time horizon
      const monthlyBurnRate = projectedExpenses - projectedRevenue;
      const finalCashBalance = projectedCashBalance - monthlyBurnRate * timeHorizon;
      const projectedRunway = monthlyBurnRate > 0 ? projectedCashBalance / monthlyBurnRate : 999;

      // Create AI analysis prompt
      const prompt = `You are an expert CFO analyzing a "What If" scenario for a startup.

Current Situation:
- Monthly Revenue: $${currentRevenue.toLocaleString()}
- Monthly Expenses: $${currentExpenses.toLocaleString()}
- Cash Balance: $${currentCashBalance.toLocaleString()}
- Current Runway: ${latestMetrics.runway.toNumber().toFixed(1)} months

Proposed Scenario: "${scenarioName}"
Changes:
${inputs.revenueChange ? `- Revenue Change: ${inputs.revenueChange > 0 ? '+' : ''}${inputs.revenueChange}%` : ''}
${inputs.expenseChange ? `- Expense Change: ${inputs.expenseChange > 0 ? '+' : ''}${inputs.expenseChange}%` : ''}
${inputs.newHires ? `- New Hires: ${inputs.newHires} @ $${inputs.averageSalary?.toLocaleString()}/month each` : ''}
${inputs.additionalFunding ? `- Additional Funding: $${inputs.additionalFunding.toLocaleString()}` : ''}
${inputs.customAssumptions ? `- Custom Assumptions: ${inputs.customAssumptions}` : ''}

Projected Results:
- New Monthly Revenue: $${projectedRevenue.toLocaleString()}
- New Monthly Expenses: $${projectedExpenses.toLocaleString()}
- Projected Runway: ${projectedRunway.toFixed(1)} months
- Cash at End of ${timeHorizon} months: $${finalCashBalance.toLocaleString()}

Provide:
1. Detailed analysis of this scenario
2. Key insights (3-5 points)
3. Potential risks (2-4 points)
4. Strategic recommendations (3-5 actionable items)
5. Overall assessment (is this scenario viable?)

Respond in JSON format:
{
  "analysis": "Detailed analysis text",
  "insights": ["insight 1", "insight 2"],
  "risks": ["risk 1", "risk 2"],
  "recommendations": ["rec 1", "rec 2"],
  "viability": "high|medium|low",
  "viabilityReason": "Explanation of viability assessment",
  "confidence": 0.85
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert CFO providing strategic scenario analysis. Always respond in valid JSON format.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

      // Store scenario
      const scenario = await prisma.aIScenario.create({
        data: {
          startupId,
          name: scenarioName,
          description: `What-if analysis: ${scenarioName}`,
          scenarioType: 'what_if',
          inputParameters: inputs as any,
          projectedRevenue: new Prisma.Decimal(projectedRevenue * timeHorizon),
          projectedExpenses: new Prisma.Decimal(projectedExpenses * timeHorizon),
          projectedCashflow: new Prisma.Decimal((projectedRevenue - projectedExpenses) * timeHorizon),
          projectedRunway: new Prisma.Decimal(projectedRunway),
          confidence: new Prisma.Decimal(aiResponse.confidence || 0.8),
          insights: aiResponse.insights || [],
          recommendations: aiResponse.recommendations || [],
          risks: aiResponse.risks || [],
        },
      });

      return {
        scenario,
        projectedMetrics: {
          revenue: projectedRevenue,
          expenses: projectedExpenses,
          runway: projectedRunway,
          cashBalance: finalCashBalance,
        },
        analysis: aiResponse.analysis,
        insights: aiResponse.insights,
        risks: aiResponse.risks,
        recommendations: aiResponse.recommendations,
        viability: aiResponse.viability,
        viabilityReason: aiResponse.viabilityReason,
        confidence: aiResponse.confidence,
      };
    } catch (error: any) {
      console.error('Error running scenario:', error);
      throw new Error(`Failed to run scenario: ${error.message}`);
    }
  }

  /**
   * Generate investor update using AI
   */
  static async generateInvestorUpdate(startupId: string, periodStart: Date, periodEnd: Date) {
    if (!openai) {
      throw new Error('OpenAI service is not available. Please check your API key configuration.');
    }

    try {
      // Get metrics for the period
      const metrics = await prisma.cashflowMetric.findMany({
        where: {
          startupId,
          periodStart: { gte: periodStart },
          periodEnd: { lte: periodEnd },
        },
        orderBy: { periodStart: 'asc' },
      });

      if (metrics.length === 0) {
        throw new Error('No data available for the selected period');
      }

      const latestMetrics = metrics[metrics.length - 1];
      const firstMetrics = metrics[0];

      // Calculate period totals
      const totalRevenue = metrics.reduce(
        (sum, m) => sum.add(m.totalRevenue),
        new Prisma.Decimal(0)
      );
      const totalExpenses = metrics.reduce(
        (sum, m) => sum.add(m.totalExpenses),
        new Prisma.Decimal(0)
      );

      const revenueGrowth = firstMetrics.totalRevenue.gt(0)
        ? latestMetrics.totalRevenue
            .sub(firstMetrics.totalRevenue)
            .div(firstMetrics.totalRevenue)
            .mul(100)
        : new Prisma.Decimal(0);

      // Get recent scenarios/insights
      const scenarios = await prisma.aIScenario.findMany({
        where: { startupId },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      // Create AI prompt
      const prompt = `You are writing an investor update for a startup. Be professional, data-driven, and honest.

Period: ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()}

Financial Metrics:
- Total Revenue: $${totalRevenue.toNumber().toLocaleString()}
- Total Expenses: $${totalExpenses.toNumber().toLocaleString()}
- MRR: $${latestMetrics.mrr.toNumber().toLocaleString()}
- ARR: $${latestMetrics.arr.toNumber().toLocaleString()}
- Revenue Growth: ${revenueGrowth.toNumber().toFixed(1)}%
- Burn Rate: $${latestMetrics.burnRate.toNumber().toLocaleString()}/month
- Runway: ${latestMetrics.runway.toNumber().toFixed(1)} months
- Cash Balance: $${latestMetrics.cashBalance.toNumber().toLocaleString()}
- Active Customers: ${latestMetrics.activeCustomers}
- New Customers: ${latestMetrics.newCustomers}
- Customer Churn: ${latestMetrics.churnedCustomers}

Create an investor update with:
1. Executive Summary (2-3 sentences highlighting key achievements)
2. Key Highlights (4-6 bullet points of major wins)
3. Challenges (2-3 honest challenges faced)
4. Next Steps (3-4 actionable items for next period)

Respond in JSON format:
{
  "executiveSummary": "2-3 sentence summary",
  "highlights": [
    "Highlight 1 with specific numbers",
    "Highlight 2"
  ],
  "challenges": [
    "Challenge 1 with mitigation plan",
    "Challenge 2"
  ],
  "nextSteps": [
    "Next step 1 with timeline",
    "Next step 2"
  ]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing investor updates. Be concise, data-driven, and strategic. Always respond in valid JSON format.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

      // Store investor update
      const update = await prisma.investorUpdate.create({
        data: {
          startupId,
          title: `Investor Update: ${periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
          periodStart,
          periodEnd,
          metrics: {
            revenue: totalRevenue.toNumber(),
            expenses: totalExpenses.toNumber(),
            mrr: latestMetrics.mrr.toNumber(),
            arr: latestMetrics.arr.toNumber(),
            customers: latestMetrics.activeCustomers,
            revenueGrowth: revenueGrowth.toNumber(),
          },
          executiveSummary: aiResponse.executiveSummary,
          highlights: aiResponse.highlights || [],
          challenges: aiResponse.challenges || [],
          nextSteps: aiResponse.nextSteps || [],
          revenueGrowth: revenueGrowth,
          burnRate: latestMetrics.burnRate,
          runway: latestMetrics.runway,
          isDraft: true,
        },
      });

      return update;
    } catch (error: any) {
      console.error('Error generating investor update:', error);
      throw new Error(`Failed to generate investor update: ${error.message}`);
    }
  }

  /**
   * Get AI-powered insights for current financial state
   */
  static async getInsights(startupId: string) {
    if (!openai) {
      throw new Error('OpenAI service is not available. Please check your API key configuration.');
    }

    try {
      const latestMetrics = await prisma.cashflowMetric.findFirst({
        where: { startupId },
        orderBy: { periodEnd: 'desc' },
      });

      if (!latestMetrics) {
        throw new Error('No metrics available');
      }

      const history = await prisma.cashflowMetric.findMany({
        where: { startupId },
        orderBy: { periodStart: 'asc' },
        take: 6,
      });

      const prompt = `Analyze this startup's financial health and provide actionable insights.

Current Metrics:
- Revenue: $${latestMetrics.totalRevenue.toNumber().toLocaleString()}
- Expenses: $${latestMetrics.totalExpenses.toNumber().toLocaleString()}
- Burn Rate: $${latestMetrics.burnRate.toNumber().toLocaleString()}/month
- Runway: ${latestMetrics.runway.toNumber().toFixed(1)} months
- MRR: $${latestMetrics.mrr.toNumber().toLocaleString()}
- Growth Rate: ${latestMetrics.growthRate.toNumber().toFixed(1)}%
- Active Customers: ${latestMetrics.activeCustomers}

Historical Trend (last ${history.length} months):
${history
  .map(
    (m) =>
      `${m.periodStart.toISOString().slice(0, 7)}: Revenue $${m.totalRevenue.toNumber().toLocaleString()}, Expenses $${m.totalExpenses.toNumber().toLocaleString()}`
  )
  .join('\n')}

Provide:
1. Overall health assessment (1-2 sentences)
2. Top 3 positive indicators
3. Top 3 concerns
4. 3-5 actionable recommendations

Respond in JSON format:
{
  "healthScore": 75,
  "healthAssessment": "Overall assessment",
  "positives": ["positive 1", "positive 2", "positive 3"],
  "concerns": ["concern 1", "concern 2", "concern 3"],
  "recommendations": ["rec 1", "rec 2", "rec 3"]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert CFO providing financial insights. Always respond in valid JSON format.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');

      return response;
    } catch (error: any) {
      console.error('Error getting insights:', error);
      throw new Error(`Failed to get insights: ${error.message}`);
    }
  }

  /**
   * Get all scenarios for a tenant
   */
  static async getScenarios(startupId: string) {
    return await prisma.aIScenario.findMany({
      where: { startupId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get investor updates for a tenant
   */
  static async getInvestorUpdates(startupId: string) {
    return await prisma.investorUpdate.findMany({
      where: { startupId },
      orderBy: { periodEnd: 'desc' },
    });
  }

  /**
   * Publish investor update
   */
  static async publishInvestorUpdate(updateId: string) {
    return await prisma.investorUpdate.update({
      where: { id: updateId },
      data: {
        isDraft: false,
        publishedAt: new Date(),
      },
    });
  }

  /**
   * Chat with AI CFO using financial context
   */
  static async chat(startupId: string, userMessage: string): Promise<string> {
    if (!openai) {
      throw new Error('OpenAI service is not available. Please check your API key configuration.');
    }

    try {
      // Get dashboard summary for context
      const { getDashboardSummary } = await import('../dashboard/dashboard.service');
      const summary = await getDashboardSummary(startupId);

      // Format financial context
      const financialContext = `
CURRENT FINANCIAL STATE:
- Total Cash Balance: ₹${summary.financial.totalBalance.toLocaleString('en-IN')}
- Monthly Revenue: ₹${summary.financial.monthlyRevenue.toLocaleString('en-IN')}
- Monthly Burn Rate: ₹${summary.financial.monthlyBurn.toLocaleString('en-IN')}
- Net Cash Flow: ₹${summary.financial.netCashflow.toLocaleString('en-IN')}
- Runway: ${summary.financial.runwayMonths ? `${summary.financial.runwayMonths.toFixed(1)} months` : 'Infinite'}
- Total Income (last 3 months): ₹${summary.financial.income.toLocaleString('en-IN')}
- Total Expenses (last 3 months): ₹${summary.financial.expenses.toLocaleString('en-IN')}
      `.trim();

      // Create AI prompt
      const systemPrompt = `You are an expert AI CFO assistant for startups. You help founders understand their financial situation in a friendly, conversational, and professional manner. 

You have access to their current financial data and should provide specific, actionable insights. Always use Indian Rupee (₹) currency format. Be conversational and natural, as if you're having a friendly chat with the founder.

Key principles:
- Provide specific numbers from their actual financial data
- Give actionable advice based on their current situation
- Be encouraging but honest about challenges
- Use simple language, avoid jargon unless necessary
- Format numbers in Indian numbering system (e.g., ₹4,41,13,501 not ₹44,113,501)
- Be warm and supportive, like a trusted advisor`;

      const userPrompt = `${financialContext}

USER'S QUESTION: ${userMessage}

Please provide a helpful, specific answer based on their actual financial data. Be conversational and natural.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return completion.choices[0].message.content || "I'm sorry, I couldn't generate a response. Please try again.";
    } catch (error: any) {
      console.error('Error in AI chat:', error);
      throw new Error(error.message || 'Failed to generate chat response');
    }
  }
}

