import { prisma } from "../lib/prisma";
import {
  LedgerCategory,
  LedgerSubtype,
  LedgerBalanceType,
  AuditAction,
  AuditEntityType,
} from "@prisma/client";
import { createAuditLog } from "./auditLog";

export interface CreateCustomerInput {
  customerName: string;
  customerType: "BUSINESS" | "INDIVIDUAL";
  phone?: string;
  email?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gstApplicable?: boolean;
  gstin?: string;
  placeOfSupplyState?: string;
  creditLimitAmount?: number;
  creditPeriodDays?: number;
  openingBalanceAmount?: number;
  openingBalanceType?: "DR" | "CR";
}

export interface UpdateCustomerInput {
  customerName?: string;
  customerType?: "BUSINESS" | "INDIVIDUAL";
  phone?: string;
  email?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gstApplicable?: boolean;
  gstin?: string;
  placeOfSupplyState?: string;
  creditLimitAmount?: number;
  creditPeriodDays?: number;
  isActive?: boolean;
}

/**
 * Find or create the "Sundry Debtors" ledger group
 */
async function getSundryDebtorsGroup(startupId: string): Promise<string> {
  // First, try to find "Sundry Debtors" group
  let group = await prisma.ledgerGroup.findFirst({
    where: {
      startupId,
      name: "Sundry Debtors",
      category: LedgerCategory.SUNDRY_DEBTOR,
    },
  });

  if (!group) {
    // If not found, try to find "Current Assets" parent first
    const currentAssets = await prisma.ledgerGroup.findFirst({
      where: {
        startupId,
        name: "Current Assets",
        category: LedgerCategory.CURRENT_ASSET,
      },
    });

    // Create "Sundry Debtors" group
    group = await prisma.ledgerGroup.create({
      data: {
        startupId,
        name: "Sundry Debtors",
        category: LedgerCategory.SUNDRY_DEBTOR,
        parentId: currentAssets?.id,
      },
    });
  }

  return group.id;
}

/**
 * Create a customer and automatically create its ledger
 */
export const createCustomer = async (
  startupId: string,
  input: CreateCustomerInput,
  userId?: string
) => {
  // Validate required fields
  if (!input.customerName?.trim()) {
    throw new Error("Customer name is required");
  }

  if (!input.customerType) {
    throw new Error("Customer type is required");
  }

  // At least one of phone or email is required
  if (!input.phone?.trim() && !input.email?.trim()) {
    throw new Error("Either phone number or email is required");
  }

  // If GST is applicable, GSTIN is required
  if (input.gstApplicable && !input.gstin?.trim()) {
    throw new Error("GSTIN is required when GST is applicable");
  }

  // Check for duplicate customer name
  const existing = await prisma.customer.findFirst({
    where: {
      startupId,
      customerName: input.customerName.trim(),
    },
  });

  if (existing) {
    throw new Error(
      "A customer with this name already exists. Please use a different name."
    );
  }

  // Get or create Sundry Debtors group
  const sundryDebtorsGroupId = await getSundryDebtorsGroup(startupId);

  // Create customer and ledger in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the ledger first
    const ledger = await tx.ledger.create({
      data: {
        startupId,
        groupId: sundryDebtorsGroupId,
        name: input.customerName.trim(),
        ledgerSubtype: LedgerSubtype.CUSTOMER,
        maintainBillByBill: true, // Important for customer tracking
        defaultCreditPeriodDays: input.creditPeriodDays ?? null,
        creditLimit: input.creditLimitAmount ? input.creditLimitAmount : null,
        gstNumber: input.gstin?.trim() || null,
        openingBalance: input.openingBalanceAmount
          ? input.openingBalanceAmount
          : 0,
        openingBalanceType:
          input.openingBalanceType === "CR"
            ? LedgerBalanceType.CREDIT
            : LedgerBalanceType.DEBIT,
        mailingAddress:
          input.billingAddressLine1 ||
          input.billingAddressLine2 ||
          input.city ||
          input.state ||
          input.country ||
          input.pincode
            ? ({
                line1: input.billingAddressLine1 || null,
                line2: input.billingAddressLine2 || null,
                city: input.city || null,
                state: input.state || null,
                country: input.country || null,
                pincode: input.pincode || null,
              } as any)
            : undefined,
      },
    });

    // Create the customer
    const customer = await tx.customer.create({
      data: {
        startupId,
        customerName: input.customerName.trim(),
        customerType: input.customerType,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        billingAddressLine1: input.billingAddressLine1?.trim() || null,
        billingAddressLine2: input.billingAddressLine2?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        country: input.country?.trim() || null,
        pincode: input.pincode?.trim() || null,
        gstApplicable: input.gstApplicable ?? false,
        gstin: input.gstin?.trim() || null,
        placeOfSupplyState: input.placeOfSupplyState?.trim() || null,
        creditLimitAmount: input.creditLimitAmount || null,
        creditPeriodDays: input.creditPeriodDays || null,
        openingBalanceAmount: input.openingBalanceAmount || 0,
        openingBalanceType:
          input.openingBalanceType === "CR"
            ? LedgerBalanceType.CREDIT
            : LedgerBalanceType.DEBIT,
        ledgerId: ledger.id,
        isActive: true,
      },
      include: {
        ledger: {
          include: {
            group: true,
          },
        },
      },
    });

    return customer;
  });

  // Create audit log
  createAuditLog({
    startupId,
    userId,
    entityType: AuditEntityType.PARTY_MASTER, // Using PARTY_MASTER as closest match
    entityId: result.id,
    action: AuditAction.CREATE,
    description: `Customer "${input.customerName}" created with ledger`,
    newValues: {
      customerName: result.customerName,
      customerType: result.customerType,
      ledgerId: result.ledgerId,
    },
  }).catch((err) => {
    console.warn("Failed to write audit log for customer creation", err);
  });

  return result;
};

/**
 * List all customers for a startup
 */
export const listCustomers = async (
  startupId: string,
  options?: {
    isActive?: boolean;
    searchTerm?: string;
  }
) => {
  const where: any = {
    startupId,
  };

  if (options?.isActive !== undefined) {
    where.isActive = options.isActive;
  }

  if (options?.searchTerm) {
    where.OR = [
      { customerName: { contains: options.searchTerm, mode: "insensitive" } },
      { phone: { contains: options.searchTerm, mode: "insensitive" } },
      { email: { contains: options.searchTerm, mode: "insensitive" } },
      { gstin: { contains: options.searchTerm, mode: "insensitive" } },
    ];
  }

  return prisma.customer.findMany({
    where,
    include: {
      ledger: {
        include: {
          group: true,
        },
      },
    },
    orderBy: { customerName: "asc" },
  });
};

/**
 * Get a single customer by ID
 */
export const getCustomer = async (startupId: string, customerId: string) => {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      startupId,
    },
    include: {
      ledger: {
        include: {
          group: true,
        },
      },
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
};

/**
 * Update a customer
 */
export const updateCustomer = async (
  startupId: string,
  customerId: string,
  input: UpdateCustomerInput,
  userId?: string
) => {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      startupId,
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  // If customer name is being changed, check for duplicates
  if (
    input.customerName &&
    input.customerName.trim() !== customer.customerName
  ) {
    const existing = await prisma.customer.findFirst({
      where: {
        startupId,
        customerName: input.customerName.trim(),
        id: { not: customerId },
      },
    });

    if (existing) {
      throw new Error(
        "A customer with this name already exists. Please use a different name."
      );
    }
  }

  // If GST is applicable, GSTIN is required
  if (input.gstApplicable && !input.gstin?.trim() && !customer.gstin) {
    throw new Error("GSTIN is required when GST is applicable");
  }

  const oldValues = {
    customerName: customer.customerName,
    customerType: customer.customerType,
    phone: customer.phone,
    email: customer.email,
    gstApplicable: customer.gstApplicable,
    gstin: customer.gstin,
    isActive: customer.isActive,
  };

  // Update customer
  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: {
      ...(input.customerName && { customerName: input.customerName.trim() }),
      ...(input.customerType && { customerType: input.customerType }),
      ...(input.phone !== undefined && {
        phone: input.phone?.trim() || null,
      }),
      ...(input.email !== undefined && {
        email: input.email?.trim() || null,
      }),
      ...(input.billingAddressLine1 !== undefined && {
        billingAddressLine1: input.billingAddressLine1?.trim() || null,
      }),
      ...(input.billingAddressLine2 !== undefined && {
        billingAddressLine2: input.billingAddressLine2?.trim() || null,
      }),
      ...(input.city !== undefined && { city: input.city?.trim() || null }),
      ...(input.state !== undefined && { state: input.state?.trim() || null }),
      ...(input.country !== undefined && {
        country: input.country?.trim() || null,
      }),
      ...(input.pincode !== undefined && {
        pincode: input.pincode?.trim() || null,
      }),
      ...(input.gstApplicable !== undefined && {
        gstApplicable: input.gstApplicable,
      }),
      ...(input.gstin !== undefined && {
        gstin: input.gstin?.trim() || null,
      }),
      ...(input.placeOfSupplyState !== undefined && {
        placeOfSupplyState: input.placeOfSupplyState?.trim() || null,
      }),
      ...(input.creditLimitAmount !== undefined && {
        creditLimitAmount: input.creditLimitAmount || null,
      }),
      ...(input.creditPeriodDays !== undefined && {
        creditPeriodDays: input.creditPeriodDays || null,
      }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    include: {
      ledger: {
        include: {
          group: true,
        },
      },
    },
  });

  // Update linked ledger if customer name changed
  if (input.customerName && customer.ledgerId) {
    await prisma.ledger.update({
      where: { id: customer.ledgerId },
      data: {
        name: input.customerName.trim(),
        ...(input.creditPeriodDays !== undefined && {
          defaultCreditPeriodDays: input.creditPeriodDays || null,
        }),
        ...(input.creditLimitAmount !== undefined && {
          creditLimit: input.creditLimitAmount || null,
        }),
        ...(input.gstin !== undefined && {
          gstNumber: input.gstin?.trim() || null,
        }),
        ...((input.billingAddressLine1 !== undefined ||
          input.billingAddressLine2 !== undefined ||
          input.city !== undefined ||
          input.state !== undefined ||
          input.country !== undefined ||
          input.pincode !== undefined) && {
          mailingAddress: {
            line1: updated.billingAddressLine1 || null,
            line2: updated.billingAddressLine2 || null,
            city: updated.city || null,
            state: updated.state || null,
            country: updated.country || null,
            pincode: updated.pincode || null,
          },
        }),
      },
    });
  }

  // Create audit log
  createAuditLog({
    startupId,
    userId,
    entityType: AuditEntityType.PARTY_MASTER,
    entityId: updated.id,
    action: AuditAction.UPDATE,
    description: `Customer "${updated.customerName}" updated`,
    oldValues,
    newValues: {
      customerName: updated.customerName,
      customerType: updated.customerType,
      phone: updated.phone,
      email: updated.email,
      gstApplicable: updated.gstApplicable,
      gstin: updated.gstin,
      isActive: updated.isActive,
    },
  }).catch((err) => {
    console.warn("Failed to write audit log for customer update", err);
  });

  return updated;
};

/**
 * Delete a customer (soft delete by setting isActive to false)
 */
export const deleteCustomer = async (
  startupId: string,
  customerId: string,
  userId?: string
) => {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      startupId,
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  // Soft delete - set isActive to false
  const deleted = await prisma.customer.update({
    where: { id: customerId },
    data: { isActive: false },
  });

  // Create audit log
  createAuditLog({
    startupId,
    userId,
    entityType: AuditEntityType.PARTY_MASTER,
    entityId: deleted.id,
    action: AuditAction.DELETE,
    description: `Customer "${customer.customerName}" deactivated`,
    oldValues: {
      customerName: customer.customerName,
      isActive: customer.isActive,
    },
  }).catch((err) => {
    console.warn("Failed to write audit log for customer deletion", err);
  });

  return deleted;
};
