import {
  Prisma,
  LedgerCategory,
  InterestComputation,
  LedgerBalanceType,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../lib/prisma";

type ChartGroupDefinition = {
  name: string;
  category: LedgerCategory;
  parent?: string;
};

export const CHART_OF_ACCOUNTS: ChartGroupDefinition[] = [
  { name: "Capital Accounts", category: LedgerCategory.CAPITAL },
  { name: "Loans (Secured/Unsecured)", category: LedgerCategory.LOAN },
  { name: "Current Liabilities", category: LedgerCategory.CURRENT_LIABILITY },
  {
    name: "Sundry Creditors",
    category: LedgerCategory.SUNDRY_CREDITOR,
    parent: "Current Liabilities",
  },
  {
    name: "Duties & Taxes",
    category: LedgerCategory.CURRENT_LIABILITY,
    parent: "Current Liabilities",
  },
  {
    name: "Provisions",
    category: LedgerCategory.CURRENT_LIABILITY,
    parent: "Current Liabilities",
  },
  { name: "Bank Accounts", category: LedgerCategory.BANK_ACCOUNT },
  { name: "Cash-in-hand", category: LedgerCategory.CASH },
  { name: "Current Assets", category: LedgerCategory.CURRENT_ASSET },
  {
    name: "Sundry Debtors",
    category: LedgerCategory.SUNDRY_DEBTOR,
    parent: "Current Assets",
  },
  {
    name: "Investments",
    category: LedgerCategory.INVESTMENT,
    parent: "Current Assets",
  },
  {
    name: "Stock-in-hand",
    category: LedgerCategory.STOCK,
    parent: "Current Assets",
  },
  { name: "Purchase Accounts", category: LedgerCategory.PURCHASE },
  { name: "Sales Accounts", category: LedgerCategory.SALES },
  { name: "Direct Expenses", category: LedgerCategory.DIRECT_EXPENSE },
  { name: "Indirect Expenses", category: LedgerCategory.INDIRECT_EXPENSE },
  { name: "Direct Incomes", category: LedgerCategory.DIRECT_INCOME },
  { name: "Indirect Incomes", category: LedgerCategory.INDIRECT_INCOME },
  { name: "Profit & Loss Account", category: LedgerCategory.OTHER },
];

export const DEFAULT_LEDGERS = [
  { name: "Cash", group: "Cash-in-hand" },
  { name: "Petty Cash", group: "Cash-in-hand" },
  { name: "Primary Bank", group: "Bank Accounts" },
  { name: "Sales", group: "Sales Accounts" },
  { name: "Purchases", group: "Purchase Accounts" },
  { name: "Capital Account", group: "Capital Accounts" },
  { name: "Opening Stock", group: "Stock-in-hand" },
];

export const bootstrapLedgerStructure = async (startupId: string) => {
  const existing = await prisma.ledgerGroup.count({
    where: { startupId },
  });

  if (existing > 0) {
    return;
  }

  const createdGroups = new Map<string, string>();

  for (const group of CHART_OF_ACCOUNTS) {
    const parentId = group.parent
      ? (createdGroups.get(group.parent) ?? null)
      : null;
    const created = await prisma.ledgerGroup.create({
      data: {
        startupId,
        name: group.name,
        category: group.category as LedgerCategory,
        parentId: parentId ?? undefined,
      },
    });

    createdGroups.set(group.name, created.id);
  }

  for (const ledger of DEFAULT_LEDGERS) {
    const groupId = createdGroups.get(ledger.group);
    if (!groupId) continue;

    await prisma.ledger.create({
      data: {
        startupId,
        groupId,
        name: ledger.name,
        inventoryAffectsStock: ledger.group === "Stock-in-hand",
        maintainBillByBill:
          ledger.group === "Sundry Debtors" ||
          ledger.group === "Sundry Creditors",
      },
    });
  }
};

export const listLedgerGroups = async (startupId: string) => {
  return prisma.ledgerGroup.findMany({
    where: { startupId },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });
};

export const createLedgerGroup = async (
  startupId: string,
  data: {
    name: string;
    category: string;
    code?: string | null;
    description?: string | null;
    parentId?: string | null;
  }
) => {
  const normalizedName = data.name?.trim();
  if (!normalizedName) {
    throw new Error("Group name is required.");
  }

  const duplicate = await prisma.ledgerGroup.findFirst({
    where: {
      startupId,
      name: normalizedName,
    },
  });

  if (duplicate) {
    throw new Error(
      "A ledger group with this name already exists. Choose a different name or edit the existing group."
    );
  }

  let parentId: string | undefined;
  if (data.parentId) {
    const parent = await prisma.ledgerGroup.findFirst({
      where: { id: data.parentId, startupId },
    });
    if (!parent) {
      throw new Error("Parent group not found for your startup.");
    }
    parentId = parent.id;
  }

  return prisma.ledgerGroup.create({
    data: {
      startupId,
      name: normalizedName,
      code: data.code,
      description: data.description,
      category: data.category as LedgerCategory,
      parentId,
    },
  });
};

export const updateLedgerGroup = async (
  startupId: string,
  groupId: string,
  data: Partial<{
    name: string;
    category: string;
    code: string | null;
    description: string | null;
    parentId: string | null;
  }>
) => {
  const group = await prisma.ledgerGroup.findFirst({
    where: { id: groupId, startupId },
  });

  if (!group) {
    throw new Error("Ledger group not found.");
  }

  let parentId: string | null | undefined = undefined;
  if (data.parentId !== undefined) {
    if (data.parentId === null || data.parentId === "") {
      parentId = null;
    } else {
      const parent = await prisma.ledgerGroup.findFirst({
        where: { id: data.parentId, startupId },
      });
      if (!parent) {
        throw new Error("Parent group not found for your startup.");
      }
      if (parent.id === groupId) {
        throw new Error("A group cannot be its own parent.");
      }
      parentId = parent.id;
    }
  }

  return prisma.ledgerGroup.update({
    where: { id: groupId },
    data: {
      name: data.name,
      code: data.code,
      description: data.description,
      category: data.category as LedgerCategory | undefined,
      parentId,
    },
  });
};

export const deleteLedgerGroup = async (startupId: string, groupId: string) => {
  const children = await prisma.ledgerGroup.count({
    where: { startupId, parentId: groupId },
  });
  const ledgerCount = await prisma.ledger.count({
    where: { startupId, groupId },
  });

  if (children > 0 || ledgerCount > 0) {
    throw new Error(
      "Remove child groups and ledgers before deleting this group."
    );
  }

  await prisma.ledgerGroup.delete({
    where: { id: groupId },
  });
};

export const listLedgers = async (startupId: string) => {
  return prisma.ledger.findMany({
    where: { startupId },
    include: {
      group: true,
    },
    orderBy: [{ name: "asc" }],
  });
};

type LedgerInput = {
  name: string;
  alias?: string | null;
  description?: string | null;
  groupId: string;
  inventoryAffectsStock?: boolean;
  maintainBillByBill?: boolean;
  defaultCreditPeriodDays?: number | null;
  creditLimit?: number | null;
  interestComputation?: string;
  interestRate?: number | null;
  penalRate?: number | null;
  interestGraceDays?: number | null;
  panNumber?: string | null;
  gstNumber?: string | null;
  mailingAddress?: Record<string, unknown> | null;
  bankDetails?: Record<string, unknown> | null;
  costCenterApplicable?: boolean;
  openingBalance?: number | null;
  openingBalanceType?: string;
  metadata?: Record<string, unknown> | null;
};

const ensureGroupOwnership = async (startupId: string, groupId: string) => {
  const group = await prisma.ledgerGroup.findFirst({
    where: { id: groupId, startupId },
  });
  if (!group) {
    throw new Error("Ledger group not found for your startup.");
  }
};

export const createLedger = async (startupId: string, input: LedgerInput) => {
  await ensureGroupOwnership(startupId, input.groupId);

  return prisma.ledger.create({
    data: {
      startupId,
      groupId: input.groupId,
      name: input.name,
      alias: input.alias,
      description: input.description,
      inventoryAffectsStock: Boolean(input.inventoryAffectsStock),
      maintainBillByBill: Boolean(input.maintainBillByBill),
      defaultCreditPeriodDays: input.defaultCreditPeriodDays ?? null,
      creditLimit:
        input.creditLimit !== undefined && input.creditLimit !== null
          ? new Decimal(input.creditLimit)
          : undefined,
      interestComputation: (input.interestComputation ??
        "NONE") as InterestComputation,
      interestRate:
        input.interestRate !== undefined && input.interestRate !== null
          ? new Decimal(input.interestRate)
          : undefined,
      penalRate:
        input.penalRate !== undefined && input.penalRate !== null
          ? new Decimal(input.penalRate)
          : undefined,
      interestGraceDays: input.interestGraceDays ?? null,
      panNumber: input.panNumber,
      gstNumber: input.gstNumber,
      mailingAddress: input.mailingAddress
        ? (input.mailingAddress as Prisma.InputJsonValue)
        : undefined,
      bankDetails: input.bankDetails
        ? (input.bankDetails as Prisma.InputJsonValue)
        : undefined,
      costCenterApplicable: Boolean(input.costCenterApplicable),
      openingBalance:
        input.openingBalance !== undefined && input.openingBalance !== null
          ? new Decimal(input.openingBalance)
          : undefined,
      openingBalanceType: (input.openingBalanceType ??
        "DEBIT") as LedgerBalanceType,
      metadata: input.metadata
        ? (input.metadata as Prisma.InputJsonValue)
        : undefined,
    },
  });
};

export const updateLedger = async (
  startupId: string,
  ledgerId: string,
  input: Partial<LedgerInput>
) => {
  const ledger = await prisma.ledger.findFirst({
    where: { id: ledgerId, startupId },
  });
  if (!ledger) {
    throw new Error("Ledger not found.");
  }

  if (input.groupId) {
    await ensureGroupOwnership(startupId, input.groupId);
  }

  return prisma.ledger.update({
    where: { id: ledgerId },
    data: {
      groupId: input.groupId ?? undefined,
      name: input.name ?? undefined,
      alias: input.alias ?? undefined,
      description: input.description ?? undefined,
      inventoryAffectsStock: input.inventoryAffectsStock ?? undefined,
      maintainBillByBill: input.maintainBillByBill ?? undefined,
      defaultCreditPeriodDays: input.defaultCreditPeriodDays ?? undefined,
      creditLimit:
        input.creditLimit !== undefined && input.creditLimit !== null
          ? new Decimal(input.creditLimit)
          : undefined,
      interestComputation: input.interestComputation
        ? (input.interestComputation as InterestComputation)
        : undefined,
      interestRate:
        input.interestRate !== undefined && input.interestRate !== null
          ? new Decimal(input.interestRate)
          : undefined,
      penalRate:
        input.penalRate !== undefined && input.penalRate !== null
          ? new Decimal(input.penalRate)
          : undefined,
      interestGraceDays: input.interestGraceDays ?? undefined,
      panNumber: input.panNumber ?? undefined,
      gstNumber: input.gstNumber ?? undefined,
      mailingAddress: input.mailingAddress
        ? (input.mailingAddress as Prisma.InputJsonValue)
        : undefined,
      bankDetails: input.bankDetails
        ? (input.bankDetails as Prisma.InputJsonValue)
        : undefined,
      costCenterApplicable: input.costCenterApplicable ?? undefined,
      openingBalance:
        input.openingBalance !== undefined && input.openingBalance !== null
          ? new Decimal(input.openingBalance)
          : undefined,
      openingBalanceType: input.openingBalanceType
        ? (input.openingBalanceType as LedgerBalanceType)
        : undefined,
      metadata: input.metadata
        ? (input.metadata as Prisma.InputJsonValue)
        : undefined,
    },
  });
};

export const deleteLedger = async (startupId: string, ledgerId: string) => {
  const ledger = await prisma.ledger.findFirst({
    where: { id: ledgerId, startupId },
  });
  if (!ledger) {
    throw new Error("Ledger not found.");
  }

  await prisma.ledger.delete({
    where: { id: ledgerId },
  });
};
