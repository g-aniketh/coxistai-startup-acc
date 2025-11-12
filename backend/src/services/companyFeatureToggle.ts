import { prisma } from '../lib/prisma';

export interface CompanyFeatureToggleInput {
  enableAccounting?: boolean;
  enableInventory?: boolean;
  enableTaxation?: boolean;
  enablePayroll?: boolean;
  enableAIInsights?: boolean;
  enableScenarioPlanning?: boolean;
  enableAutomations?: boolean;
  enableVendorManagement?: boolean;
  enableBillingAndInvoicing?: boolean;
}

const DEFAULT_TOGGLES: Required<CompanyFeatureToggleInput> = {
  enableAccounting: true,
  enableInventory: true,
  enableTaxation: true,
  enablePayroll: false,
  enableAIInsights: true,
  enableScenarioPlanning: true,
  enableAutomations: false,
  enableVendorManagement: false,
  enableBillingAndInvoicing: true,
};

export const getCompanyFeatureToggle = async (startupId: string) => {
  return prisma.companyFeatureToggle.findUnique({
    where: { startupId },
  });
};

export const upsertCompanyFeatureToggle = async (
  startupId: string,
  input: CompanyFeatureToggleInput
) => {
  const existing = await prisma.companyFeatureToggle.findUnique({
    where: { startupId },
  });

  const payload: Required<CompanyFeatureToggleInput> = {
    enableAccounting: input.enableAccounting ?? existing?.enableAccounting ?? DEFAULT_TOGGLES.enableAccounting,
    enableInventory: input.enableInventory ?? existing?.enableInventory ?? DEFAULT_TOGGLES.enableInventory,
    enableTaxation: input.enableTaxation ?? existing?.enableTaxation ?? DEFAULT_TOGGLES.enableTaxation,
    enablePayroll: input.enablePayroll ?? existing?.enablePayroll ?? DEFAULT_TOGGLES.enablePayroll,
    enableAIInsights: input.enableAIInsights ?? existing?.enableAIInsights ?? DEFAULT_TOGGLES.enableAIInsights,
    enableScenarioPlanning: input.enableScenarioPlanning ?? existing?.enableScenarioPlanning ?? DEFAULT_TOGGLES.enableScenarioPlanning,
    enableAutomations: input.enableAutomations ?? existing?.enableAutomations ?? DEFAULT_TOGGLES.enableAutomations,
    enableVendorManagement: input.enableVendorManagement ?? existing?.enableVendorManagement ?? DEFAULT_TOGGLES.enableVendorManagement,
    enableBillingAndInvoicing: input.enableBillingAndInvoicing ?? existing?.enableBillingAndInvoicing ?? DEFAULT_TOGGLES.enableBillingAndInvoicing,
  };

  if (!existing) {
    return prisma.companyFeatureToggle.create({
      data: {
        startupId,
        ...payload,
      },
    });
  }

  return prisma.companyFeatureToggle.update({
    where: { id: existing.id },
    data: payload,
  });
};
