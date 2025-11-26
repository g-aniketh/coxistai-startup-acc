import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import OpenAI from "openai";

// Initialize OpenAI only if API key is provided
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.warn("Failed to initialize OpenAI service:", error);
    openai = null;
  }
} else {
  console.warn(
    "OPENAI_API_KEY not provided. AI functionality will be disabled."
  );
}

export interface VoucherAlert {
  type: "anomaly" | "pattern" | "risk" | "opportunity";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  voucherIds: string[];
  recommendations?: string[];
  metadata?: any;
}

export interface VoucherVariance {
  period: string;
  category: string;
  expected: number;
  actual: number;
  variance: number;
  variancePercent: number;
  vouchers: Array<{
    id: string;
    voucherNumber: string;
    date: string;
    amount: number;
  }>;
}

/**
 * Analyze vouchers for anomalies and patterns
 */
export async function analyzeVoucherAnomalies(
  startupId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<VoucherAlert[]> {
  const alerts: VoucherAlert[] = [];

  const where: any = {
    startupId,
  };

  if (fromDate || toDate) {
    where.date = {};
    if (fromDate) {
      where.date.gte = fromDate;
    }
    if (toDate) {
      where.date.lte = toDate;
    }
  } else {
    // Default to last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    where.date = { gte: thirtyDaysAgo };
  }

  // Get vouchers with entries
  const vouchers = await prisma.voucher.findMany({
    where,
    include: {
      voucherType: true,
      entries: true,
    },
    orderBy: { date: "desc" },
  });

  if (vouchers.length === 0) {
    return alerts;
  }

  // 1. Check for unusually large transactions
  const amounts = vouchers.map((v: any) => v.totalAmount.toNumber());
  const avgAmount =
    amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.reduce(
      (sum: number, val: number) => sum + Math.pow(val - avgAmount, 2),
      0
    ) / amounts.length
  );
  const threshold = avgAmount + 3 * stdDev; // 3 standard deviations

  const largeVouchers = vouchers.filter(
    (v: any) => v.totalAmount.toNumber() > threshold
  );
  if (largeVouchers.length > 0) {
    alerts.push({
      type: "anomaly",
      severity: "warning",
      title: "Unusually Large Transactions Detected",
      message: `Found ${
        largeVouchers.length
      } voucher(s) with amounts significantly above average (${avgAmount.toFixed(
        2
      )}).`,
      voucherIds: largeVouchers.map((v: any) => v.id),
      recommendations: [
        "Review these transactions for accuracy",
        "Verify authorization for large amounts",
        "Check for duplicate entries",
      ],
      metadata: {
        averageAmount: avgAmount,
        threshold,
        largeVouchers: largeVouchers.map((v: any) => ({
          id: v.id,
          number: v.voucherNumber,
          amount: v.totalAmount.toNumber(),
          date: v.date,
        })),
      },
    });
  }

  // 2. Check for duplicate voucher numbers
  const voucherNumbers = new Map<string, string[]>();
  vouchers.forEach((v: any) => {
    const key = `${v.voucherTypeId}-${v.voucherNumber}`;
    if (!voucherNumbers.has(key)) {
      voucherNumbers.set(key, []);
    }
    voucherNumbers.get(key)!.push(v.id);
  });

  const duplicates = Array.from(voucherNumbers.entries()).filter(
    ([, ids]) => ids.length > 1
  );
  if (duplicates.length > 0) {
    alerts.push({
      type: "anomaly",
      severity: "critical",
      title: "Duplicate Voucher Numbers Detected",
      message: `Found ${duplicates.length} duplicate voucher number(s). This may indicate data entry errors.`,
      voucherIds: duplicates.flatMap(([, ids]) => ids),
      recommendations: [
        "Review and correct duplicate voucher numbers",
        "Check voucher numbering series configuration",
        "Verify data import accuracy",
      ],
      metadata: {
        duplicates: duplicates.map(([key, ids]) => ({
          voucherNumber: key,
          count: ids.length,
          voucherIds: ids,
        })),
      },
    });
  }

  // 3. Check for unbalanced vouchers (shouldn't happen, but check anyway)
  const unbalancedVouchers = vouchers.filter((v: any) => {
    const totalDebit = v.entries
      .filter((e: any) => e.entryType === "DEBIT")
      .reduce((sum: number, e: any) => sum + e.amount.toNumber(), 0);
    const totalCredit = v.entries
      .filter((e: any) => e.entryType === "CREDIT")
      .reduce((sum: number, e: any) => sum + e.amount.toNumber(), 0);
    return Math.abs(totalDebit - totalCredit) > 0.01; // Allow for rounding
  });

  if (unbalancedVouchers.length > 0) {
    alerts.push({
      type: "anomaly",
      severity: "critical",
      title: "Unbalanced Vouchers Detected",
      message: `Found ${unbalancedVouchers.length} unbalanced voucher(s). Debit and credit totals do not match.`,
      voucherIds: unbalancedVouchers.map((v: any) => v.id),
      recommendations: [
        "Review and correct unbalanced vouchers immediately",
        "Check voucher entry amounts",
        "Verify ledger postings",
      ],
    });
  }

  // 4. Check for vouchers with missing or unusual ledger entries
  const vouchersWithIssues = vouchers.filter((v: any) => {
    if (v.entries.length < 2) return true;
    if (v.entries.some((e: any) => !e.ledgerName || e.ledgerName.trim() === ""))
      return true;
    return false;
  });

  if (vouchersWithIssues.length > 0) {
    alerts.push({
      type: "risk",
      severity: "warning",
      title: "Vouchers with Incomplete Data",
      message: `Found ${vouchersWithIssues.length} voucher(s) with missing or invalid ledger entries.`,
      voucherIds: vouchersWithIssues.map((v: any) => v.id),
      recommendations: [
        "Complete missing ledger information",
        "Review voucher entry requirements",
        "Update vouchers with proper ledger mappings",
      ],
    });
  }

  // 5. AI-powered pattern analysis
  if (openai && vouchers.length >= 10) {
    try {
      const voucherSummary = {
        totalVouchers: vouchers.length,
        totalAmount: vouchers.reduce(
          (sum: number, v: any) => sum + v.totalAmount.toNumber(),
          0
        ),
        byType: vouchers.reduce((acc: any, v: any) => {
          const type = v.voucherType.name;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        dateRange: {
          from: vouchers[vouchers.length - 1].date.toISOString().split("T")[0],
          to: vouchers[0].date.toISOString().split("T")[0],
        },
      };

      const prompt = `Analyze this voucher data for patterns, risks, and opportunities:

${JSON.stringify(voucherSummary, null, 2)}

Provide insights on:
1. Unusual patterns or trends
2. Potential risks or issues
3. Opportunities for improvement
4. Recommendations

Respond in JSON format:
{
  "patterns": ["pattern 1", "pattern 2"],
  "risks": ["risk 1", "risk 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a financial analyst analyzing accounting voucher data. Always respond in valid JSON format.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const aiResponse = JSON.parse(
        completion.choices[0].message.content || "{}"
      );

      if (aiResponse.risks && aiResponse.risks.length > 0) {
        alerts.push({
          type: "risk",
          severity: "warning",
          title: "AI-Detected Risks",
          message: `AI analysis identified ${aiResponse.risks.length} potential risk(s) in voucher patterns.`,
          voucherIds: [],
          recommendations: aiResponse.recommendations || [],
          metadata: {
            patterns: aiResponse.patterns || [],
            risks: aiResponse.risks || [],
            opportunities: aiResponse.opportunities || [],
          },
        });
      }

      if (aiResponse.opportunities && aiResponse.opportunities.length > 0) {
        alerts.push({
          type: "opportunity",
          severity: "info",
          title: "AI-Identified Opportunities",
          message: `AI analysis identified ${aiResponse.opportunities.length} opportunity/opportunities for improvement.`,
          voucherIds: [],
          recommendations: aiResponse.recommendations || [],
          metadata: {
            opportunities: aiResponse.opportunities || [],
          },
        });
      }
    } catch (error) {
      console.error("Error in AI pattern analysis:", error);
    }
  }

  return alerts;
}

/**
 * Detect variances between expected and actual voucher patterns
 */
export async function detectVoucherVariances(
  startupId: string,
  period: "monthly" | "quarterly" | "yearly" = "monthly"
): Promise<VoucherVariance[]> {
  const variances: VoucherVariance[] = [];

  // Get vouchers grouped by period
  const now = new Date();
  const periods: { start: Date; end: Date; label: string }[] = [];

  if (period === "monthly") {
    for (let i = 0; i < 6; i++) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      periods.push({
        start,
        end,
        label: start.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
      });
    }
  } else if (period === "quarterly") {
    for (let i = 0; i < 4; i++) {
      const quarter = Math.floor((now.getMonth() - i * 3) / 3);
      const year =
        now.getFullYear() - Math.floor((now.getMonth() - i * 3) / 12);
      const start = new Date(year, quarter * 3, 1);
      const end = new Date(year, (quarter + 1) * 3, 0);
      periods.push({
        start,
        end,
        label: `Q${quarter + 1} ${year}`,
      });
    }
  }

  // Get vouchers for each period
  for (const periodData of periods) {
    const vouchers = await prisma.voucher.findMany({
      where: {
        startupId,
        date: {
          gte: periodData.start,
          lte: periodData.end,
        },
      },
      include: {
        voucherType: true,
      },
    });

    // Group by voucher type/category
    const byCategory = vouchers.reduce((acc: any, v: any) => {
      const category = v.voucherType.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(v);
      return acc;
    }, {} as Record<string, typeof vouchers>);

    // Calculate expected vs actual for each category
    for (const [category, categoryVouchers] of Object.entries(byCategory)) {
      const actual = (categoryVouchers as any[]).reduce(
        (sum: number, v: any) => sum + v.totalAmount.toNumber(),
        0
      );

      // Calculate expected based on previous periods (simple moving average)
      const previousPeriods = periods
        .filter(p => p.start < periodData.start)
        .slice(0, 3);

      if (previousPeriods.length > 0) {
        let previousTotal = 0;
        for (const prevPeriod of previousPeriods) {
          const prevVouchers = await prisma.voucher.findMany({
            where: {
              startupId,
              date: {
                gte: prevPeriod.start,
                lte: prevPeriod.end,
              },
              voucherType: {
                category: category as any,
              },
            },
          });
          previousTotal += prevVouchers.reduce(
            (sum: number, v: any) => sum + v.totalAmount.toNumber(),
            0
          );
        }
        const expected = previousTotal / previousPeriods.length;

        const variance = actual - expected;
        const variancePercent = expected > 0 ? (variance / expected) * 100 : 0;

        // Only report significant variances (>10%)
        if (Math.abs(variancePercent) > 10) {
          variances.push({
            period: periodData.label,
            category,
            expected,
            actual,
            variance,
            variancePercent,
            vouchers: (categoryVouchers as any[]).map((v: any) => ({
              id: v.id,
              voucherNumber: v.voucherNumber,
              date: v.date.toISOString(),
              amount: v.totalAmount.toNumber(),
            })),
          });
        }
      }
    }
  }

  return variances;
}

/**
 * Generate AI insights based on voucher data
 */
export async function generateVoucherInsights(
  startupId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<{
  summary: string;
  trends: string[];
  insights: string[];
  recommendations: string[];
}> {
  if (!openai) {
    return {
      summary: "AI service not available",
      trends: [],
      insights: [],
      recommendations: [],
    };
  }

  const where: any = {
    startupId,
  };

  if (fromDate || toDate) {
    where.date = {};
    if (fromDate) {
      where.date.gte = fromDate;
    }
    if (toDate) {
      where.date.lte = toDate;
    }
  } else {
    // Default to last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    where.date = { gte: ninetyDaysAgo };
  }

  const vouchers = await prisma.voucher.findMany({
    where,
    include: {
      voucherType: true,
      entries: {
        include: {
          costCenter: true,
          costCategoryRef: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  if (vouchers.length === 0) {
    return {
      summary: "No voucher data available for analysis",
      trends: [],
      insights: [],
      recommendations: [],
    };
  }

  // Prepare data summary
  const summary = {
    totalVouchers: vouchers.length,
    totalAmount: vouchers.reduce(
      (sum: number, v: any) => sum + v.totalAmount.toNumber(),
      0
    ),
    byType: vouchers.reduce((acc: any, v: any) => {
      const type = v.voucherType.name;
      acc[type] = {
        count: (acc[type]?.count || 0) + 1,
        total: (acc[type]?.total || 0) + v.totalAmount.toNumber(),
      };
      return acc;
    }, {} as Record<string, { count: number; total: number }>),
    byCategory: vouchers.reduce((acc: any, v: any) => {
      const category = v.voucherType.category;
      acc[category] = (acc[category] || 0) + v.totalAmount.toNumber();
      return acc;
    }, {} as Record<string, number>),
    dateRange: {
      from: vouchers[vouchers.length - 1].date.toISOString().split("T")[0],
      to: vouchers[0].date.toISOString().split("T")[0],
    },
    topLedgers: vouchers
      .flatMap((v: any) => v.entries)
      .reduce((acc: any, e: any) => {
        acc[e.ledgerName] = (acc[e.ledgerName] || 0) + e.amount.toNumber();
        return acc;
      }, {} as Record<string, number>),
  };

  const topLedgers = Object.entries(summary.topLedgers)
    .sort(([, a], [, b]: any) => (b as any) - (a as any))
    .slice(0, 10)
    .map(([name, amount]) => `${name}: ${(amount as any).toFixed(2)}`);

  const prompt = `Analyze this accounting voucher data and provide comprehensive insights:

Total Vouchers: ${summary.totalVouchers}
Total Amount: ${summary.totalAmount.toFixed(2)}
Date Range: ${summary.dateRange.from} to ${summary.dateRange.to}

Vouchers by Type:
${Object.entries(summary.byType)
  .map(
    ([type, data]) =>
      `  ${type}: ${(data as any).count} vouchers, ${(
        data as any
      ).total.toFixed(2)} total`
  )
  .join("\n")}

Amounts by Category:
${Object.entries(summary.byCategory)
  .map(([cat, amount]) => `  ${cat}: ${(amount as any).toFixed(2)}`)
  .join("\n")}

Top Ledgers by Amount:
${topLedgers.join("\n")}

Provide:
1. A concise summary (2-3 sentences)
2. Key trends (3-5 bullet points)
3. Actionable insights (3-5 points)
4. Strategic recommendations (3-5 items)

Respond in JSON format:
{
  "summary": "Brief summary text",
  "trends": ["trend 1", "trend 2"],
  "insights": ["insight 1", "insight 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert CFO analyzing accounting voucher data. Provide clear, actionable insights. Always respond in valid JSON format.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const response = JSON.parse(completion.choices[0].message.content || "{}");

    return {
      summary: response.summary || "Analysis completed",
      trends: response.trends || [],
      insights: response.insights || [],
      recommendations: response.recommendations || [],
    };
  } catch (error) {
    console.error("Error generating voucher insights:", error);
    return {
      summary: "Error generating insights",
      trends: [],
      insights: [],
      recommendations: [],
    };
  }
}
