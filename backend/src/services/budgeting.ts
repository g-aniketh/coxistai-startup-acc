import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface BudgetInput {
  name: string;
  description?: string;
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
  budgetType: "LEDGER" | "GROUP" | "COST_CENTRE";
  ledgerId?: string;
  ledgerGroupId?: string;
  costCentreId?: string;
  amount: number;
  currency?: string;
}

export interface BudgetVariance {
  budgetId: string;
  budgetName: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
  status: "WITHIN_BUDGET" | "WARNING" | "BREACH";
  breachThreshold?: number;
}

/**
 * Create a budget definition
 */
export async function createBudget(
  startupId: string,
  input: BudgetInput
): Promise<any> {
  // Validate budget type and related entity
  if (input.budgetType === "LEDGER" && !input.ledgerId) {
    throw new Error("Ledger ID is required for ledger-level budgets");
  }
  if (input.budgetType === "GROUP" && !input.ledgerGroupId) {
    throw new Error("Ledger Group ID is required for group-level budgets");
  }
  if (input.budgetType === "COST_CENTRE" && !input.costCentreId) {
    throw new Error("Cost Centre ID is required for cost centre-level budgets");
  }

  const periodStart = new Date(input.periodStart);
  const periodEnd = new Date(input.periodEnd);

  if (periodStart >= periodEnd) {
    throw new Error("Period start must be before period end");
  }

  // Store budget in metadata for now (schema extension pending)
  // In production, this would be a proper Budget model
  const budgetData = {
    id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startupId,
    ...input,
    periodStart,
    periodEnd,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // For now, store in a simple JSON file or use metadata approach
  // In production: await prisma.budget.create({ data: budgetData });

  return budgetData;
}

/**
 * Calculate budget vs actual variance
 */
export async function calculateBudgetVariance(
  startupId: string,
  budgetId: string,
  asOnDate?: string
): Promise<BudgetVariance | null> {
  // Get budget (from metadata/storage)
  // In production: const budget = await prisma.budget.findFirst({ where: { id: budgetId, startupId } });

  // For now, return null as placeholder
  // Actual implementation would:
  // 1. Get budget details
  // 2. Calculate actual spending based on budget type
  // 3. Compare and calculate variance

  return null;
}

/**
 * Get all budgets for a startup
 */
export async function listBudgets(
  startupId: string,
  filters?: {
    budgetType?: "LEDGER" | "GROUP" | "COST_CENTRE";
    periodStart?: string;
    periodEnd?: string;
  }
): Promise<any[]> {
  // In production: return prisma.budget.findMany({ where: { startupId, ...filters } });
  return [];
}

/**
 * Get budget variance analytics
 */
export async function getBudgetVarianceAnalytics(
  startupId: string,
  filters?: {
    budgetType?: "LEDGER" | "GROUP" | "COST_CENTRE";
    periodStart?: string;
    periodEnd?: string;
    includeBreaches?: boolean;
  }
): Promise<{
  totalBudgets: number;
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  breaches: BudgetVariance[];
  warnings: BudgetVariance[];
  withinBudget: BudgetVariance[];
}> {
  const budgets = await listBudgets(startupId, filters);
  const variances: BudgetVariance[] = [];

  for (const budget of budgets) {
    const variance = await calculateBudgetVariance(
      startupId,
      budget.id,
      filters?.periodEnd
    );
    if (variance) {
      variances.push(variance);
    }
  }

  const totalBudgeted = variances.reduce((sum, v) => sum + v.budgetAmount, 0);
  const totalActual = variances.reduce((sum, v) => sum + v.actualAmount, 0);
  const totalVariance = totalActual - totalBudgeted;

  const breaches = variances.filter((v) => v.status === "BREACH");
  const warnings = variances.filter((v) => v.status === "WARNING");
  const withinBudget = variances.filter((v) => v.status === "WITHIN_BUDGET");

  return {
    totalBudgets: budgets.length,
    totalBudgeted,
    totalActual,
    totalVariance,
    breaches,
    warnings,
    withinBudget,
  };
}

/**
 * Check for budget breaches and generate alerts
 */
export async function checkBudgetBreaches(
  startupId: string,
  asOnDate?: string
): Promise<BudgetVariance[]> {
  const analytics = await getBudgetVarianceAnalytics(startupId, {
    includeBreaches: true,
  });

  return analytics.breaches;
}
