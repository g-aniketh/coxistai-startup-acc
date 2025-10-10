import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class AlertsService {
  /**
   * Generate all alerts for a tenant
   */
  static async generateAlerts(tenantId: string): Promise<void> {
    const latestMetrics = await prisma.cashflowMetric.findFirst({
      where: { tenantId },
      orderBy: { periodEnd: 'desc' },
    });

    if (!latestMetrics) {
      return; // No metrics to analyze
    }

    // Check runway
    await this.checkRunway(tenantId, latestMetrics);

    // Check burn rate
    await this.checkBurnRate(tenantId, latestMetrics);

    // Check cash low
    await this.checkCashLow(tenantId, latestMetrics);

    // Check customer churn
    await this.checkChurn(tenantId, latestMetrics);

    // Check for anomalies
    await this.checkAnomalies(tenantId, latestMetrics);
  }

  /**
   * Check runway and generate alert if critical
   */
  private static async checkRunway(tenantId: string, metrics: any) {
    const runway = metrics.runway.toNumber();

    if (runway <= 0) {
      return; // No runway means already out of cash or no burn
    }

    let severity: string;
    let message: string;

    if (runway <= 3) {
      severity = 'critical';
      message = `URGENT: Runway critically low at ${runway.toFixed(1)} months. Immediate action required.`;
    } else if (runway <= 6) {
      severity = 'warning';
      message = `Runway at ${runway.toFixed(1)} months. Time to start fundraising or reduce burn.`;
    } else if (runway <= 9) {
      severity = 'info';
      message = `Runway at ${runway.toFixed(1)} months. Consider planning fundraising activities.`;
    } else {
      return; // Runway is healthy
    }

    // Get AI recommendations
    const recommendations = await this.getRunwayRecommendations(metrics);

    // Create alert
    await prisma.alert.create({
      data: {
        tenantId,
        type: 'runway',
        severity,
        title: 'Runway Alert',
        message,
        currentValue: metrics.runway,
        thresholdValue: new Prisma.Decimal(6),
        recommendations,
      },
    });
  }

  /**
   * Check burn rate changes
   */
  private static async checkBurnRate(tenantId: string, metrics: any) {
    // Get previous month's metrics
    const previousMetrics = await prisma.cashflowMetric.findFirst({
      where: {
        tenantId,
        periodEnd: { lt: metrics.periodStart },
      },
      orderBy: { periodEnd: 'desc' },
    });

    if (!previousMetrics) {
      return; // No comparison data
    }

    const currentBurn = metrics.burnRate.toNumber();
    const previousBurn = previousMetrics.burnRate.toNumber();

    if (previousBurn === 0) {
      return;
    }

    const burnChange = ((currentBurn - previousBurn) / previousBurn) * 100;

    if (burnChange > 20) {
      // Burn rate increased by more than 20%
      const recommendations = await this.getBurnRateRecommendations(metrics, burnChange);

      await prisma.alert.create({
        data: {
          tenantId,
          type: 'burn_rate',
          severity: burnChange > 50 ? 'critical' : 'warning',
          title: 'Burn Rate Increase',
          message: `Burn rate increased by ${burnChange.toFixed(1)}% to $${currentBurn.toLocaleString()}/month.`,
          currentValue: new Prisma.Decimal(currentBurn),
          thresholdValue: new Prisma.Decimal(previousBurn),
          recommendations,
        },
      });
    } else if (burnChange < -15) {
      // Burn rate decreased significantly (good news!)
      await prisma.alert.create({
        data: {
          tenantId,
          type: 'burn_rate',
          severity: 'info',
          title: 'Burn Rate Improvement',
          message: `Great news! Burn rate decreased by ${Math.abs(burnChange).toFixed(1)}% to $${currentBurn.toLocaleString()}/month.`,
          currentValue: new Prisma.Decimal(currentBurn),
          thresholdValue: new Prisma.Decimal(previousBurn),
          recommendations: [],
        },
      });
    }
  }

  /**
   * Check if cash balance is critically low
   */
  private static async checkCashLow(tenantId: string, metrics: any) {
    const cashBalance = metrics.cashBalance.toNumber();
    const burnRate = metrics.burnRate.toNumber();

    if (burnRate <= 0) {
      return; // No burn, so cash low doesn't matter
    }

    const monthsOfCash = cashBalance / burnRate;

    if (monthsOfCash <= 2) {
      const recommendations = await this.getCashLowRecommendations(metrics);

      await prisma.alert.create({
        data: {
          tenantId,
          type: 'cash_low',
          severity: 'critical',
          title: 'Critical Cash Level',
          message: `Cash balance is critically low at $${cashBalance.toLocaleString()}. Only ${monthsOfCash.toFixed(1)} months remaining at current burn.`,
          currentValue: new Prisma.Decimal(cashBalance),
          thresholdValue: new Prisma.Decimal(burnRate * 3),
          recommendations,
        },
      });
    }
  }

  /**
   * Check customer churn
   */
  private static async checkChurn(tenantId: string, metrics: any) {
    if (metrics.activeCustomers === 0) {
      return;
    }

    const churnRate =
      (metrics.churnedCustomers / (metrics.activeCustomers + metrics.churnedCustomers)) * 100;

    if (churnRate > 5) {
      // Churn rate above 5% is concerning
      const recommendations = await this.getChurnRecommendations(metrics);

      await prisma.alert.create({
        data: {
          tenantId,
          type: 'churn',
          severity: churnRate > 10 ? 'critical' : 'warning',
          title: 'High Customer Churn',
          message: `Customer churn rate at ${churnRate.toFixed(1)}%. Lost ${metrics.churnedCustomers} customers this period.`,
          currentValue: new Prisma.Decimal(churnRate),
          thresholdValue: new Prisma.Decimal(5),
          recommendations,
        },
      });
    }
  }

  /**
   * Check for financial anomalies
   */
  private static async checkAnomalies(tenantId: string, metrics: any) {
    const history = await prisma.cashflowMetric.findMany({
      where: { tenantId },
      orderBy: { periodStart: 'asc' },
      take: 6,
    });

    if (history.length < 3) {
      return; // Need more data
    }

    // Calculate average revenue and expenses
    const avgRevenue =
      history.reduce((sum, m) => sum + m.totalRevenue.toNumber(), 0) / history.length;
    const avgExpenses =
      history.reduce((sum, m) => sum + m.totalExpenses.toNumber(), 0) / history.length;

    const currentRevenue = metrics.totalRevenue.toNumber();
    const currentExpenses = metrics.totalExpenses.toNumber();

    // Check for significant deviations (>30%)
    const revenueDeviation = Math.abs((currentRevenue - avgRevenue) / avgRevenue) * 100;
    const expensesDeviation = Math.abs((currentExpenses - avgExpenses) / avgExpenses) * 100;

    if (revenueDeviation > 30 || expensesDeviation > 30) {
      const message = [];
      if (revenueDeviation > 30) {
        const direction = currentRevenue > avgRevenue ? 'increased' : 'decreased';
        message.push(
          `Revenue ${direction} by ${revenueDeviation.toFixed(1)}% from average`
        );
      }
      if (expensesDeviation > 30) {
        const direction = currentExpenses > avgExpenses ? 'increased' : 'decreased';
        message.push(
          `Expenses ${direction} by ${expensesDeviation.toFixed(1)}% from average`
        );
      }

      await prisma.alert.create({
        data: {
          tenantId,
          type: 'anomaly',
          severity: 'info',
          title: 'Financial Anomaly Detected',
          message: `Unusual patterns detected: ${message.join('; ')}. Review your finances to ensure everything is correct.`,
          currentValue: new Prisma.Decimal(revenueDeviation + expensesDeviation),
          thresholdValue: new Prisma.Decimal(30),
          recommendations: [],
        },
      });
    }
  }

  /**
   * Get AI recommendations for runway issues
   */
  private static async getRunwayRecommendations(metrics: any): Promise<any[]> {
    try {
      const prompt = `A startup has ${metrics.runway.toNumber().toFixed(1)} months of runway remaining.
Current metrics:
- Monthly Burn: $${metrics.burnRate.toNumber().toLocaleString()}
- Cash Balance: $${metrics.cashBalance.toNumber().toLocaleString()}
- MRR: $${metrics.mrr.toNumber().toLocaleString()}
- Monthly Expenses: $${metrics.totalExpenses.toNumber().toLocaleString()}

Provide 3-5 specific, actionable recommendations to extend runway.

Respond in JSON format:
{
  "recommendations": [
    { "action": "Specific action to take", "impact": "Expected impact", "effort": "low|medium|high" }
  ]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a CFO providing actionable recommendations. Always respond in valid JSON format.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      return response.recommendations || [];
    } catch (error) {
      console.error('Error getting runway recommendations:', error);
      return [
        {
          action: 'Review and cut non-essential SaaS subscriptions',
          impact: 'Could reduce burn by 10-15%',
          effort: 'low',
        },
        {
          action: 'Start fundraising conversations immediately',
          impact: 'Secure 12-18 months runway',
          effort: 'high',
        },
        {
          action: 'Negotiate payment terms with vendors',
          impact: 'Improve cash flow by 30-60 days',
          effort: 'medium',
        },
      ];
    }
  }

  /**
   * Get AI recommendations for burn rate issues
   */
  private static async getBurnRateRecommendations(
    metrics: any,
    burnChange: number
  ): Promise<any[]> {
    try {
      const prompt = `A startup's burn rate increased by ${burnChange.toFixed(1)}%.
Current metrics:
- Current Burn Rate: $${metrics.burnRate.toNumber().toLocaleString()}/month
- Total Expenses: $${metrics.totalExpenses.toNumber().toLocaleString()}
- Revenue: $${metrics.totalRevenue.toNumber().toLocaleString()}

Identify why burn might have increased and provide 3-5 recommendations to control it.

Respond in JSON format:
{
  "recommendations": [
    { "action": "Specific action", "impact": "Expected impact", "effort": "low|medium|high" }
  ]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a CFO providing actionable recommendations. Always respond in valid JSON format.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      return response.recommendations || [];
    } catch (error) {
      console.error('Error getting burn rate recommendations:', error);
      return [];
    }
  }

  /**
   * Get AI recommendations for low cash
   */
  private static async getCashLowRecommendations(metrics: any): Promise<any[]> {
    return [
      {
        action: 'Immediately freeze all non-essential spending',
        impact: 'Extend runway by 1-2 months',
        effort: 'low',
      },
      {
        action: 'Accelerate collections on outstanding invoices',
        impact: 'Improve cash position within days',
        effort: 'low',
      },
      {
        action: 'Consider bridge financing or line of credit',
        impact: 'Immediate cash injection',
        effort: 'high',
      },
    ];
  }

  /**
   * Get AI recommendations for churn
   */
  private static async getChurnRecommendations(metrics: any): Promise<any[]> {
    return [
      {
        action: 'Conduct exit interviews with churned customers',
        impact: 'Identify root causes',
        effort: 'low',
      },
      {
        action: 'Implement proactive customer success outreach',
        impact: 'Reduce churn by 20-30%',
        effort: 'medium',
      },
      {
        action: 'Review product roadmap against customer needs',
        impact: 'Improve retention',
        effort: 'high',
      },
    ];
  }

  /**
   * Get all alerts for a tenant
   */
  static async getAlerts(tenantId: string, includeRead: boolean = false) {
    const where: any = { tenantId, isDismissed: false };
    
    if (!includeRead) {
      where.isRead = false;
    }

    return await prisma.alert.findMany({
      where,
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Mark alert as read
   */
  static async markAsRead(alertId: string) {
    return await prisma.alert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  }

  /**
   * Dismiss alert
   */
  static async dismissAlert(alertId: string) {
    return await prisma.alert.update({
      where: { id: alertId },
      data: { isDismissed: true, dismissedAt: new Date() },
    });
  }

  /**
   * Get alert counts by severity
   */
  static async getAlertCounts(tenantId: string) {
    const alerts = await prisma.alert.findMany({
      where: {
        tenantId,
        isDismissed: false,
        isRead: false,
      },
    });

    return {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      info: alerts.filter((a) => a.severity === 'info').length,
    };
  }
}

