import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../lib/prisma";

// ------------------------------
// Cost Category / Cost Center
// ------------------------------

export interface CostCategoryInput {
  name: string;
  description?: string;
  parentId?: string | null;
  isPrimary?: boolean;
}

export interface CostCenterInput {
  categoryId: string;
  name: string;
  code?: string;
  description?: string;
  parentId?: string | null;
  isBillable?: boolean;
  status?: "active" | "inactive";
}

interface CostCenterNode {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  parentId: string | null;
  isBillable: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  parent: { id: string; name: string } | null;
}

interface CostCategoryNode {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  costCenters: CostCenterNode[];
  children: CostCategoryNode[];
}

type CostCategoryWithCenters = Prisma.CostCategoryGetPayload<{
  include: {
    costCenters: {
      include: {
        parent: { select: { id: true; name: true } };
      };
    };
  };
}>;

const buildCategoryTree = (categories: CostCategoryWithCenters[]): CostCategoryNode[] => {
  const map = new Map<string, CostCategoryNode>();
  const roots: CostCategoryNode[] = [];

  categories.forEach((category) => {
    map.set(category.id, {
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      isPrimary: category.isPrimary,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      costCenters: category.costCenters.map((center) => ({
        id: center.id,
        name: center.name,
        code: center.code,
        description: center.description,
        parentId: center.parentId,
        isBillable: center.isBillable,
        status: center.status,
        createdAt: center.createdAt,
        updatedAt: center.updatedAt,
        parent: center.parent
          ? { id: center.parent.id, name: center.parent.name }
          : null,
      })),
      children: [],
    });
  });

  categories.forEach((category) => {
    const node = map.get(category.id);
    if (!node) {
      return;
    }

    if (category.parentId) {
      const parent = map.get(category.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
};

export const getCostCategoryTree = async (startupId: string) => {
  const categories = await prisma.costCategory.findMany({
    where: { startupId },
    include: {
      costCenters: {
        where: { startupId },
        include: {
          parent: { select: { id: true, name: true } },
        },
        orderBy: [{ name: "asc" }],
      },
    },
    orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
  });

  return buildCategoryTree(categories);
};

export const createCostCategory = async (
  startupId: string,
  input: CostCategoryInput
) => {
  const { name, description, parentId, isPrimary } = input;

  if (!name?.trim()) {
    throw new Error("Category name is required");
  }

  if (parentId) {
    const parent = await prisma.costCategory.findFirst({
      where: { id: parentId, startupId },
    });
    if (!parent) {
      throw new Error("Parent category not found");
    }
  }

  if (isPrimary) {
    const existingPrimary = await prisma.costCategory.findFirst({
      where: { startupId, isPrimary: true },
    });

    if (existingPrimary) {
      throw new Error("Primary cost category already exists");
    }
  }

  return prisma.costCategory.create({
    data: {
      startupId,
      name: name.trim(),
      description: description?.trim() || null,
      parentId: parentId || null,
      isPrimary: Boolean(isPrimary),
    },
  });
};

export const updateCostCategory = async (
  startupId: string,
  categoryId: string,
  input: Partial<CostCategoryInput>
) => {
  const category = await prisma.costCategory.findFirst({
    where: { id: categoryId, startupId },
  });

  if (!category) {
    throw new Error("Cost category not found");
  }

  if (input.parentId) {
    const parent = await prisma.costCategory.findFirst({
      where: { id: input.parentId, startupId },
    });
    if (!parent) {
      throw new Error("Parent category not found");
    }

    if (input.parentId === categoryId) {
      throw new Error("Category cannot be its own parent");
    }
  }

  if (input.isPrimary) {
    const existingPrimary = await prisma.costCategory.findFirst({
      where: { startupId, isPrimary: true, NOT: { id: categoryId } },
    });

    if (existingPrimary) {
      throw new Error("Primary cost category already exists");
    }
  }

  return prisma.costCategory.update({
    where: { id: categoryId },
    data: {
      name: input.name?.trim() ?? category.name,
      description:
        input.description !== undefined
          ? input.description?.trim() || null
          : category.description,
      parentId:
        input.parentId !== undefined
          ? input.parentId || null
          : category.parentId,
      isPrimary:
        input.isPrimary !== undefined
          ? Boolean(input.isPrimary)
          : category.isPrimary,
    },
  });
};

export const deleteCostCategory = async (
  startupId: string,
  categoryId: string
) => {
  const category = await prisma.costCategory.findFirst({
    where: { id: categoryId, startupId },
    include: { children: true, costCenters: true },
  });

  if (!category) {
    throw new Error("Cost category not found");
  }

  if (category.children.length > 0) {
    throw new Error("Cannot delete category with child categories");
  }

  if (category.costCenters.length > 0) {
    throw new Error("Cannot delete category with cost centres");
  }

  const usageCount = await prisma.voucherEntry.count({
    where: {
      costCategoryId: categoryId,
      voucher: { startupId },
    },
  });

  if (usageCount > 0) {
    throw new Error("Cannot delete category that is linked to vouchers");
  }

  if (category.isPrimary) {
    throw new Error("Primary category cannot be deleted");
  }

  await prisma.costCategory.delete({ where: { id: categoryId } });

  return true;
};

export const listCostCenters = async (
  startupId: string,
  filters?: { categoryId?: string; status?: string }
) => {
  return prisma.costCenter.findMany({
    where: {
      startupId,
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      category: { select: { id: true, name: true } },
      parent: { select: { id: true, name: true } },
    },
    orderBy: [{ name: "asc" }],
  });
};

export const createCostCenter = async (
  startupId: string,
  input: CostCenterInput
) => {
  const { categoryId, name, code, description, parentId, isBillable, status } =
    input;

  if (!name?.trim()) {
    throw new Error("Cost center name is required");
  }

  const category = await prisma.costCategory.findFirst({
    where: { id: categoryId, startupId },
  });

  if (!category) {
    throw new Error("Cost category not found");
  }

  if (parentId) {
    const parent = await prisma.costCenter.findFirst({
      where: { id: parentId, startupId },
    });
    if (!parent) {
      throw new Error("Parent cost center not found");
    }
  }

  return prisma.costCenter.create({
    data: {
      startupId,
      categoryId,
      name: name.trim(),
      code: code?.trim() || null,
      description: description?.trim() || null,
      parentId: parentId || null,
      isBillable: Boolean(isBillable),
      status: status ?? "active",
    },
  });
};

export const updateCostCenter = async (
  startupId: string,
  centerId: string,
  input: Partial<CostCenterInput>
) => {
  const costCenter = await prisma.costCenter.findFirst({
    where: { id: centerId, startupId },
  });

  if (!costCenter) {
    throw new Error("Cost center not found");
  }

  if (input.categoryId) {
    const category = await prisma.costCategory.findFirst({
      where: { id: input.categoryId, startupId },
    });
    if (!category) {
      throw new Error("Cost category not found");
    }
  }

  if (input.parentId) {
    if (input.parentId === centerId) {
      throw new Error("Cost center cannot be its own parent");
    }

    const parent = await prisma.costCenter.findFirst({
      where: { id: input.parentId, startupId },
    });
    if (!parent) {
      throw new Error("Parent cost center not found");
    }
  }

  return prisma.costCenter.update({
    where: { id: centerId },
    data: {
      categoryId: input.categoryId ?? costCenter.categoryId,
      name: input.name?.trim() ?? costCenter.name,
      code:
        input.code !== undefined ? input.code?.trim() || null : costCenter.code,
      description:
        input.description !== undefined
          ? input.description?.trim() || null
          : costCenter.description,
      parentId:
        input.parentId !== undefined
          ? input.parentId || null
          : costCenter.parentId,
      isBillable:
        input.isBillable !== undefined
          ? Boolean(input.isBillable)
          : costCenter.isBillable,
      status: input.status ?? costCenter.status,
    },
    include: {
      category: { select: { id: true, name: true } },
      parent: { select: { id: true, name: true } },
    },
  });
};

export const deleteCostCenter = async (startupId: string, centerId: string) => {
  const costCenter = await prisma.costCenter.findFirst({
    where: { id: centerId, startupId },
  });

  if (!costCenter) {
    throw new Error("Cost center not found");
  }

  const usageCount = await prisma.voucherEntry.count({
    where: {
      costCenterId: centerId,
      voucher: { startupId },
    },
  });

  if (usageCount > 0) {
    throw new Error("Cannot delete cost center that is linked to vouchers");
  }

  const hasChildren = await prisma.costCenter.count({
    where: { parentId: centerId, startupId },
  });

  if (hasChildren > 0) {
    throw new Error("Cannot delete cost center with child cost centers");
  }

  await prisma.costCenter.delete({ where: { id: centerId } });

  return true;
};

// ------------------------------
// Interest Profiles / Settings
// ------------------------------

export interface InterestProfileInput {
  name: string;
  description?: string;
  calculationMode?: "SIMPLE" | "COMPOUND";
  rate: number;
  compoundingFrequency?:
    | "NONE"
    | "DAILY"
    | "WEEKLY"
    | "MONTHLY"
    | "QUARTERLY"
    | "YEARLY";
  gracePeriodDays?: number | null;
  calculateFromDueDate?: boolean;
  penalRate?: number | null;
  penalGraceDays?: number | null;
}

export interface PartyInterestInput {
  partyId: string;
  interestProfileId: string;
  overrideRate?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  applyOnReceivables?: boolean;
  applyOnPayables?: boolean;
}

export const listInterestProfiles = async (startupId: string) => {
  return prisma.interestProfile.findMany({
    where: { startupId },
    include: {
      partySettings: {
        include: {
          party: { select: { id: true, name: true, type: true } },
        },
      },
    },
    orderBy: [{ name: "asc" }],
  });
};

export const createInterestProfile = async (
  startupId: string,
  input: InterestProfileInput
) => {
  const {
    name,
    description,
    calculationMode,
    rate,
    compoundingFrequency,
    gracePeriodDays,
    calculateFromDueDate,
    penalRate,
    penalGraceDays,
  } = input;

  if (!name?.trim()) {
    throw new Error("Interest profile name is required");
  }

  const numericRate = new Decimal(rate ?? 0);
  if (numericRate.lt(0)) {
    throw new Error("Interest rate cannot be negative");
  }

  return prisma.interestProfile.create({
    data: {
      startupId,
      name: name.trim(),
      description: description?.trim() || null,
      calculationMode: calculationMode ?? "SIMPLE",
      rate: numericRate,
      compoundingFrequency: compoundingFrequency ?? "NONE",
      gracePeriodDays: gracePeriodDays ?? 0,
      calculateFromDueDate: calculateFromDueDate ?? true,
      penalRate: penalRate ? new Decimal(penalRate) : new Decimal(0),
      penalGraceDays: penalGraceDays ?? 0,
    },
  });
};

export const updateInterestProfile = async (
  startupId: string,
  profileId: string,
  input: Partial<InterestProfileInput>
) => {
  const profile = await prisma.interestProfile.findFirst({
    where: { id: profileId, startupId },
  });

  if (!profile) {
    throw new Error("Interest profile not found");
  }

  const data: Prisma.InterestProfileUpdateInput = {};

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      throw new Error("Interest profile name cannot be empty");
    }
    data.name = input.name.trim();
  }

  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }

  if (input.calculationMode) {
    data.calculationMode = input.calculationMode;
  }

  if (input.rate !== undefined) {
    const numericRate = new Decimal(input.rate);
    if (numericRate.lt(0)) {
      throw new Error("Interest rate cannot be negative");
    }
    data.rate = numericRate;
  }

  if (input.compoundingFrequency) {
    data.compoundingFrequency = input.compoundingFrequency;
  }

  if (input.gracePeriodDays !== undefined) {
    if (input.gracePeriodDays !== null && input.gracePeriodDays < 0) {
      throw new Error("Grace period cannot be negative");
    }
    data.gracePeriodDays = input.gracePeriodDays ?? 0;
  }

  if (input.calculateFromDueDate !== undefined) {
    data.calculateFromDueDate = input.calculateFromDueDate;
  }

  if (input.penalRate !== undefined) {
    if (input.penalRate !== null && input.penalRate < 0) {
      throw new Error("Penal rate cannot be negative");
    }
    data.penalRate =
      input.penalRate !== null ? new Decimal(input.penalRate) : new Decimal(0);
  }

  if (input.penalGraceDays !== undefined) {
    if (input.penalGraceDays !== null && input.penalGraceDays < 0) {
      throw new Error("Penal grace days cannot be negative");
    }
    data.penalGraceDays = input.penalGraceDays ?? 0;
  }

  return prisma.interestProfile.update({
    where: { id: profileId },
    data,
  });
};

export const deleteInterestProfile = async (
  startupId: string,
  profileId: string
) => {
  const profile = await prisma.interestProfile.findFirst({
    where: { id: profileId, startupId },
    include: { partySettings: true },
  });

  if (!profile) {
    throw new Error("Interest profile not found");
  }

  if (profile.partySettings.length > 0) {
    throw new Error("Cannot delete profile while it is assigned to parties");
  }

  await prisma.interestProfile.delete({ where: { id: profileId } });

  return true;
};

export const listPartyInterestSettings = async (startupId: string) => {
  return prisma.partyInterestSetting.findMany({
    where: { startupId },
    include: {
      party: { select: { id: true, name: true, type: true } },
      interestProfile: { select: { id: true, name: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });
};

export const assignInterestProfileToParty = async (
  startupId: string,
  input: PartyInterestInput
) => {
  const {
    partyId,
    interestProfileId,
    overrideRate,
    effectiveFrom,
    effectiveTo,
    applyOnReceivables,
    applyOnPayables,
  } = input;

  const party = await prisma.partyMaster.findFirst({
    where: { id: partyId, startupId },
  });

  if (!party) {
    throw new Error("Party not found");
  }

  const profile = await prisma.interestProfile.findFirst({
    where: { id: interestProfileId, startupId },
  });

  if (!profile) {
    throw new Error("Interest profile not found");
  }

  return prisma.partyInterestSetting.upsert({
    where: {
      partyId,
    },
    create: {
      startupId,
      partyId,
      interestProfileId,
      overrideRate:
        overrideRate !== undefined && overrideRate !== null
          ? new Decimal(overrideRate)
          : null,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      applyOnReceivables: applyOnReceivables ?? true,
      applyOnPayables: applyOnPayables ?? false,
    },
    update: {
      interestProfileId,
      overrideRate:
        overrideRate !== undefined && overrideRate !== null
          ? new Decimal(overrideRate)
          : null,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      applyOnReceivables: applyOnReceivables ?? true,
      applyOnPayables: applyOnPayables ?? false,
    },
    include: {
      party: { select: { id: true, name: true, type: true } },
      interestProfile: { select: { id: true, name: true } },
    },
  });
};

export const removeInterestSettingForParty = async (
  startupId: string,
  partyId: string
) => {
  const existing = await prisma.partyInterestSetting.findFirst({
    where: {
      startupId,
      partyId,
    },
  });

  if (!existing) {
    throw new Error("Interest setting not found for the specified party");
  }

  await prisma.partyInterestSetting.delete({
    where: { id: existing.id },
  });

  return true;
};
