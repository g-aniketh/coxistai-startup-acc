export type SubscriptionPlanCode =
  | "starter_earlybird"
  | "starter"
  | "pro"
  | "enterprise";

export interface SubscriptionPlanDefinition {
  code: SubscriptionPlanCode;
  label: string;
  monthlyPriceUsd: number;
  description: string;
  includedSeats: {
    admins: number;
    members: number;
  };
  includedFeatures: string[];
  isEarlyBird?: boolean;
}

export const SUBSCRIPTION_PLAN_CATALOG: Record<
  SubscriptionPlanCode,
  SubscriptionPlanDefinition
> = {
  starter_earlybird: {
    code: "starter_earlybird",
    label: "Startup (Free Earlybird)",
    monthlyPriceUsd: 50,
    description:
      "Locked-in access to the Startup plan for early customers during the showcase period. Same limits and features as the paid Starter pack.",
    includedSeats: {
      admins: 1,
      members: 5,
    },
    includedFeatures: [
      "Multi-ledger accounting",
      "Inventory & cost centers",
      "GST & statutory workflows",
      "AI insights & anomaly alerts",
      "Import/export (Tally, Excel)",
    ],
    isEarlyBird: true,
  },
  starter: {
    code: "starter",
    label: "Startup",
    monthlyPriceUsd: 50,
    description: "Core Coxistai capabilities for growing finance teams.",
    includedSeats: {
      admins: 1,
      members: 5,
    },
    includedFeatures: [
      "Multi-ledger accounting",
      "Inventory & cost centers",
      "GST & statutory workflows",
      "AI insights & anomaly alerts",
      "Import/export (Tally, Excel)",
    ],
  },
  pro: {
    code: "pro",
    label: "Scale",
    monthlyPriceUsd: 129,
    description: "Advanced automations, higher limits, and audit controls.",
    includedSeats: {
      admins: 2,
      members: 15,
    },
    includedFeatures: [
      "Everything in Startup",
      "Advanced approvals",
      "Bank automations",
      "Dedicated success manager",
    ],
  },
  enterprise: {
    code: "enterprise",
    label: "Enterprise",
    monthlyPriceUsd: 249,
    description: "Custom controls, SSO, and enterprise support.",
    includedSeats: {
      admins: 3,
      members: 30,
    },
    includedFeatures: [
      "Everything in Scale",
      "Custom AI workflows",
      "SSO & advanced security",
      "Dedicated pods with SLAs",
    ],
  },
};

export const DEFAULT_SUBSCRIPTION_PLAN: SubscriptionPlanCode =
  "starter_earlybird";

export const getSubscriptionPlan = (
  code: string
): SubscriptionPlanDefinition => {
  if (code in SUBSCRIPTION_PLAN_CATALOG) {
    return SUBSCRIPTION_PLAN_CATALOG[code as SubscriptionPlanCode];
  }
  return SUBSCRIPTION_PLAN_CATALOG.starter;
};
