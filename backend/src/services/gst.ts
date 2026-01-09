import {
  Prisma,
  GstLedgerMappingType,
  GstRegistrationType,
  GstTaxSupplyType,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../lib/prisma";

// ---------------------------------------------------------------------------
// GST REGISTRATIONS
// ---------------------------------------------------------------------------

export interface GstRegistrationInput {
  gstin: string;
  legalName?: string;
  tradeName?: string;
  registrationType?: GstRegistrationType;
  stateCode: string;
  stateName?: string;
  startDate: string;
  endDate?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
}

export const listGstRegistrations = async (startupId: string) => {
  return prisma.gstRegistration.findMany({
    where: { startupId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
};

export const createGstRegistration = async (
  startupId: string,
  input: GstRegistrationInput
) => {
  const {
    gstin,
    legalName,
    tradeName,
    registrationType = "REGULAR",
    stateCode,
    stateName,
    startDate,
    endDate,
    isDefault,
    isActive = true,
  } = input;

  if (!gstin?.trim()) {
    throw new Error("GSTIN is required");
  }

  const existing = await prisma.gstRegistration.findFirst({
    where: { startupId, gstin: gstin.trim() },
  });

  if (existing) {
    throw new Error("GSTIN already exists for this startup");
  }

  const parsedStart = new Date(startDate);
  if (Number.isNaN(parsedStart.getTime())) {
    throw new Error("Invalid start date");
  }

  const parsedEnd = endDate ? new Date(endDate) : null;
  if (parsedEnd && Number.isNaN(parsedEnd.getTime())) {
    throw new Error("Invalid end date");
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (isDefault) {
      await tx.gstRegistration.updateMany({
        where: { startupId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const registration = await tx.gstRegistration.create({
      data: {
        startupId,
        gstin: gstin.trim().toUpperCase(),
        legalName: legalName?.trim() || null,
        tradeName: tradeName?.trim() || null,
        registrationType,
        stateCode: stateCode.trim(),
        stateName: stateName?.trim() || null,
        startDate: parsedStart,
        endDate: parsedEnd,
        isDefault: Boolean(isDefault),
        isActive,
      },
    });

    return registration;
  });
};

export const updateGstRegistration = async (
  startupId: string,
  registrationId: string,
  input: Partial<GstRegistrationInput>
) => {
  const registration = await prisma.gstRegistration.findFirst({
    where: { id: registrationId, startupId },
  });

  if (!registration) {
    throw new Error("GST registration not found");
  }

  if (input.gstin && input.gstin.trim() !== registration.gstin) {
    const exists = await prisma.gstRegistration.findFirst({
      where: { startupId, gstin: input.gstin.trim() },
    });

    if (exists) {
      throw new Error("GSTIN already exists for this startup");
    }
  }

  const parsedStart =
    input.startDate !== undefined
      ? new Date(input.startDate)
      : registration.startDate;
  if (input.startDate && Number.isNaN(parsedStart.getTime())) {
    throw new Error("Invalid start date");
  }

  const parsedEnd =
    input.endDate !== undefined
      ? input.endDate
        ? new Date(input.endDate)
        : null
      : registration.endDate;

  if (parsedEnd && Number.isNaN(parsedEnd.getTime())) {
    throw new Error("Invalid end date");
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (input.isDefault) {
      await tx.gstRegistration.updateMany({
        where: { startupId, isDefault: true, NOT: { id: registrationId } },
        data: { isDefault: false },
      });
    }

    const updated = await tx.gstRegistration.update({
      where: { id: registrationId },
      data: {
        gstin:
          input.gstin !== undefined
            ? input.gstin.trim().toUpperCase()
            : registration.gstin,
        legalName:
          input.legalName !== undefined
            ? input.legalName?.trim() || null
            : registration.legalName,
        tradeName:
          input.tradeName !== undefined
            ? input.tradeName?.trim() || null
            : registration.tradeName,
        registrationType:
          input.registrationType ?? registration.registrationType,
        stateCode: input.stateCode?.trim() ?? registration.stateCode,
        stateName:
          input.stateName !== undefined
            ? input.stateName?.trim() || null
            : registration.stateName,
        startDate: parsedStart,
        endDate: parsedEnd ?? null,
        isDefault:
          input.isDefault !== undefined
            ? Boolean(input.isDefault)
            : registration.isDefault,
        isActive: input.isActive ?? registration.isActive,
      },
    });

    return updated;
  });
};

export const deleteGstRegistration = async (
  startupId: string,
  registrationId: string
) => {
  const registration = await prisma.gstRegistration.findFirst({
    where: { id: registrationId, startupId },
    include: {
      taxRates: true,
      ledgerMappings: true,
    },
  });

  if (!registration) {
    throw new Error("GST registration not found");
  }

  if (registration.isDefault) {
    throw new Error("Default registration cannot be deleted");
  }

  if (
    registration.taxRates.length > 0 ||
    registration.ledgerMappings.length > 0
  ) {
    throw new Error(
      "Remove associated tax rates and ledger mappings before deleting"
    );
  }

  await prisma.gstRegistration.delete({ where: { id: registrationId } });
  return true;
};

// ---------------------------------------------------------------------------
// GST TAX RATES
// ---------------------------------------------------------------------------

export interface GstTaxRateInput {
  registrationId?: string | null;
  taxName?: string;
  supplyType?: GstTaxSupplyType;
  hsnOrSac?: string;
  description?: string;
  // Total GST percentage for the slab
  gstRate?: number;
  // Component rates (optional overrides, mainly for reference / export)
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  cessRate?: number;
  taxType?: "REGULAR" | "EXEMPT" | "NIL" | "ZERO_RATED";
  reverseCharge?: boolean;
  applicableOn?: "SALES" | "PURCHASE" | "BOTH";
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isActive?: boolean;
}

export const listGstTaxRates = async (
  startupId: string,
  filters?: {
    registrationId?: string;
    supplyType?: GstTaxSupplyType;
    hsnOrSac?: string;
  }
) => {
  const { registrationId, supplyType, hsnOrSac } = filters || {};

  return prisma.gstTaxRate.findMany({
    where: {
      startupId,
      ...(registrationId && { registrationId }),
      ...(supplyType && { supplyType }),
      ...(hsnOrSac && {
        hsnOrSac: { contains: hsnOrSac, mode: "insensitive" },
      }),
    },
    orderBy: [{ createdAt: "desc" }],
  });
};

export const createGstTaxRate = async (
  startupId: string,
  input: GstTaxRateInput
) => {
  if (input.registrationId) {
    const registration = await prisma.gstRegistration.findFirst({
      where: { id: input.registrationId, startupId },
    });
    if (!registration) {
      throw new Error("Associated GST registration not found");
    }
  }

  const effectiveFrom =
    input.effectiveFrom !== undefined && input.effectiveFrom !== null
      ? new Date(input.effectiveFrom)
      : null;
  if (effectiveFrom && Number.isNaN(effectiveFrom.getTime())) {
    throw new Error("Invalid effective from date");
  }

  const effectiveTo =
    input.effectiveTo !== undefined && input.effectiveTo !== null
      ? new Date(input.effectiveTo)
      : null;
  if (effectiveTo && Number.isNaN(effectiveTo.getTime())) {
    throw new Error("Invalid effective to date");
  }

  // Derive component splits if only total gstRate is provided
  const gstRate = input.gstRate ?? 0;
  const hasComponentOverride =
    input.cgstRate !== undefined ||
    input.sgstRate !== undefined ||
    input.igstRate !== undefined;

  let cgstRate = input.cgstRate ?? 0;
  let sgstRate = input.sgstRate ?? 0;
  let igstRate = input.igstRate ?? 0;

  if (!hasComponentOverride && gstRate > 0) {
    // Default assumption: intra-state split (half CGST + half SGST)
    const half = gstRate / 2;
    cgstRate = half;
    sgstRate = half;
    igstRate = 0;
  }

  const createData = {
    startupId,
    registrationId: input.registrationId || null,
    taxName: input.taxName?.trim() || null,
    supplyType: input.supplyType ?? "GOODS",
    hsnOrSac: input.hsnOrSac?.trim() || null,
    description: input.description?.trim() || null,
    gstRate: new Decimal(gstRate),
    cgstRate: new Decimal(cgstRate),
    sgstRate: new Decimal(sgstRate),
    igstRate: new Decimal(igstRate),
    cessRate: new Decimal(input.cessRate ?? 0),
    taxType: (input.taxType ?? "REGULAR") as
      | "REGULAR"
      | "EXEMPT"
      | "NIL"
      | "ZERO_RATED",
    reverseCharge: input.reverseCharge ?? false,
    applicableOn: (input.applicableOn ?? "BOTH") as
      | "SALES"
      | "PURCHASE"
      | "BOTH",
    effectiveFrom,
    effectiveTo,
    isActive: input.isActive ?? true,
  };

  return prisma.gstTaxRate.create({
    data: createData as unknown as Prisma.GstTaxRateUncheckedCreateInput,
  });
};

export const updateGstTaxRate = async (
  startupId: string,
  taxRateId: string,
  input: GstTaxRateInput
) => {
  const taxRate = await prisma.gstTaxRate.findFirst({
    where: { id: taxRateId, startupId },
  });

  if (!taxRate) {
    throw new Error("GST tax rate not found");
  }

  if (input.registrationId) {
    const registration = await prisma.gstRegistration.findFirst({
      where: { id: input.registrationId, startupId },
    });
    if (!registration) {
      throw new Error("Associated GST registration not found");
    }
  }

  const effectiveFrom =
    input.effectiveFrom !== undefined
      ? input.effectiveFrom
        ? new Date(input.effectiveFrom)
        : null
      : taxRate.effectiveFrom;
  if (effectiveFrom && Number.isNaN(effectiveFrom.getTime())) {
    throw new Error("Invalid effective from date");
  }

  const effectiveTo =
    input.effectiveTo !== undefined
      ? input.effectiveTo
        ? new Date(input.effectiveTo)
        : null
      : taxRate.effectiveTo;
  if (effectiveTo && Number.isNaN(effectiveTo.getTime())) {
    throw new Error("Invalid effective to date");
  }

  const gstRate = input.gstRate ?? undefined;
  const hasComponentOverride =
    input.cgstRate !== undefined ||
    input.sgstRate !== undefined ||
    input.igstRate !== undefined;

  let cgstRate =
    input.cgstRate !== undefined ? input.cgstRate : taxRate.cgstRate.toNumber();
  let sgstRate =
    input.sgstRate !== undefined ? input.sgstRate : taxRate.sgstRate.toNumber();
  let igstRate =
    input.igstRate !== undefined ? input.igstRate : taxRate.igstRate.toNumber();

  if (gstRate !== undefined && !hasComponentOverride) {
    const half = gstRate / 2;
    cgstRate = half;
    sgstRate = half;
    igstRate = 0;
  }

  const updateData = {
    registrationId:
      input.registrationId !== undefined
        ? input.registrationId || null
        : taxRate.registrationId,
    supplyType: input.supplyType ?? taxRate.supplyType,
    taxName:
      input.taxName !== undefined
        ? input.taxName?.trim() || null
        : ((taxRate as { taxName?: string | null }).taxName ?? null),
    hsnOrSac:
      input.hsnOrSac !== undefined
        ? input.hsnOrSac?.trim() || null
        : taxRate.hsnOrSac,
    description:
      input.description !== undefined
        ? input.description?.trim() || null
        : taxRate.description,
    gstRate:
      gstRate !== undefined
        ? new Decimal(gstRate)
        : ((taxRate as { gstRate?: Decimal }).gstRate ?? new Decimal(0)),
    cgstRate: new Decimal(cgstRate),
    sgstRate: new Decimal(sgstRate),
    igstRate: new Decimal(igstRate),
    cessRate:
      input.cessRate !== undefined
        ? new Decimal(input.cessRate)
        : taxRate.cessRate,
    effectiveFrom,
    effectiveTo,
    taxType:
      input.taxType !== undefined
        ? (input.taxType as "REGULAR" | "EXEMPT" | "NIL" | "ZERO_RATED")
        : ((
            taxRate as { taxType?: "REGULAR" | "EXEMPT" | "NIL" | "ZERO_RATED" }
          ).taxType ?? "REGULAR"),
    reverseCharge:
      input.reverseCharge !== undefined
        ? input.reverseCharge
        : ((taxRate as { reverseCharge?: boolean }).reverseCharge ?? false),
    applicableOn:
      input.applicableOn !== undefined
        ? (input.applicableOn as "SALES" | "PURCHASE" | "BOTH")
        : ((taxRate as { applicableOn?: "SALES" | "PURCHASE" | "BOTH" })
            .applicableOn ?? "BOTH"),
    isActive: input.isActive ?? taxRate.isActive,
  };

  return prisma.gstTaxRate.update({
    where: { id: taxRateId },
    data: updateData as unknown as Prisma.GstTaxRateUncheckedUpdateInput,
  });
};

export const deleteGstTaxRate = async (
  startupId: string,
  taxRateId: string
) => {
  const taxRate = await prisma.gstTaxRate.findFirst({
    where: { id: taxRateId, startupId },
  });

  if (!taxRate) {
    throw new Error("GST tax rate not found");
  }

  await prisma.gstTaxRate.delete({ where: { id: taxRateId } });
  return true;
};

// ---------------------------------------------------------------------------
// GST LEDGER MAPPINGS
// ---------------------------------------------------------------------------

export interface GstLedgerMappingInput {
  registrationId?: string | null;
  mappingType: GstLedgerMappingType;
  ledgerName: string;
  ledgerCode?: string;
  description?: string;
}

export const listGstLedgerMappings = async (
  startupId: string,
  filters?: { registrationId?: string; mappingType?: GstLedgerMappingType }
) => {
  const { registrationId, mappingType } = filters || {};

  return prisma.gstLedgerMapping.findMany({
    where: {
      startupId,
      ...(registrationId && { registrationId }),
      ...(mappingType && { mappingType }),
    },
    orderBy: [{ createdAt: "desc" }],
  });
};

export const createGstLedgerMapping = async (
  startupId: string,
  input: GstLedgerMappingInput
) => {
  if (!input.ledgerName?.trim()) {
    throw new Error("Ledger name is required");
  }

  if (input.registrationId) {
    const registration = await prisma.gstRegistration.findFirst({
      where: { id: input.registrationId, startupId },
    });

    if (!registration) {
      throw new Error("Associated GST registration not found");
    }
  }

  return prisma.gstLedgerMapping.create({
    data: {
      startupId,
      registrationId: input.registrationId || null,
      mappingType: input.mappingType,
      ledgerName: input.ledgerName.trim(),
      ledgerCode: input.ledgerCode?.trim() || null,
      description: input.description?.trim() || null,
    },
  });
};

export const updateGstLedgerMapping = async (
  startupId: string,
  mappingId: string,
  input: Partial<GstLedgerMappingInput>
) => {
  const mapping = await prisma.gstLedgerMapping.findFirst({
    where: { id: mappingId, startupId },
  });

  if (!mapping) {
    throw new Error("GST ledger mapping not found");
  }

  if (input.registrationId) {
    const registration = await prisma.gstRegistration.findFirst({
      where: { id: input.registrationId, startupId },
    });

    if (!registration) {
      throw new Error("Associated GST registration not found");
    }
  }

  return prisma.gstLedgerMapping.update({
    where: { id: mappingId },
    data: {
      registrationId:
        input.registrationId !== undefined
          ? input.registrationId || null
          : mapping.registrationId,
      mappingType: input.mappingType ?? mapping.mappingType,
      ledgerName:
        input.ledgerName !== undefined
          ? input.ledgerName.trim()
          : mapping.ledgerName,
      ledgerCode:
        input.ledgerCode !== undefined
          ? input.ledgerCode?.trim() || null
          : mapping.ledgerCode,
      description:
        input.description !== undefined
          ? input.description?.trim() || null
          : mapping.description,
    },
  });
};

export const deleteGstLedgerMapping = async (
  startupId: string,
  mappingId: string
) => {
  const mapping = await prisma.gstLedgerMapping.findFirst({
    where: { id: mappingId, startupId },
  });

  if (!mapping) {
    throw new Error("GST ledger mapping not found");
  }

  await prisma.gstLedgerMapping.delete({ where: { id: mappingId } });
  return true;
};
