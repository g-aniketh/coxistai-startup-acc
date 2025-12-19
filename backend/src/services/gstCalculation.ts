import { GstLedgerMappingType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { ItemMaster } from "@prisma/client";

export interface GSTCalculationResult {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
  isInterState: boolean;
}

export interface GSTAmounts {
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total: number;
}

export interface ItemLine {
  itemId: string;
  quantity: number;
  rate: number;
  discountAmount?: number;
  gstRatePercent?: number;
  hsnSac?: string;
}

/**
 * Calculate GST for a single item line
 */
export async function calculateGSTForItem(
  item: ItemMaster,
  quantity: number,
  rate: number,
  placeOfSupply: string,
  companyState: string,
  discountAmount: number = 0,
  overrideGstRate?: number
): Promise<GSTCalculationResult> {
  const taxableAmount = Number(quantity) * Number(rate) - (discountAmount || 0);
  const gstRate = overrideGstRate ?? Number(item.gstRatePercent || 0);

  const isInterState = placeOfSupply !== companyState;

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let cessAmount = 0;

  if (gstRate > 0) {
    if (isInterState) {
      // IGST for inter-state supply
      igstAmount = (taxableAmount * gstRate) / 100;
    } else {
      // CGST + SGST for intra-state supply
      const halfRate = gstRate / 2;
      cgstAmount = (taxableAmount * halfRate) / 100;
      sgstAmount = (taxableAmount * halfRate) / 100;
    }
  }

  const totalTaxAmount = cgstAmount + sgstAmount + igstAmount + cessAmount;
  const grandTotal = taxableAmount + totalTaxAmount;

  return {
    taxableAmount,
    cgstAmount: Math.round(cgstAmount * 100) / 100,
    sgstAmount: Math.round(sgstAmount * 100) / 100,
    igstAmount: Math.round(igstAmount * 100) / 100,
    cessAmount: Math.round(cessAmount * 100) / 100,
    totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    isInterState,
  };
}

/**
 * Calculate GST for multiple item lines
 */
export async function calculateGSTForItems(
  itemLines: Array<{
    itemId: string;
    quantity: number;
    rate: number;
    discountAmount?: number;
    gstRatePercent?: number;
  }>,
  placeOfSupply: string,
  companyState: string
): Promise<GSTCalculationResult> {
  let totalTaxableAmount = 0;
  let totalCgstAmount = 0;
  let totalSgstAmount = 0;
  let totalIgstAmount = 0;
  let totalCessAmount = 0;

  const isInterState = placeOfSupply !== companyState;

  for (const line of itemLines) {
    const item = await prisma.itemMaster.findUnique({
      where: { id: line.itemId },
    });

    if (!item) {
      throw new Error(`Item not found: ${line.itemId}`);
    }

    const taxableAmount =
      Number(line.quantity) * Number(line.rate) - (line.discountAmount || 0);
    totalTaxableAmount += taxableAmount;

    const gstRate = line.gstRatePercent ?? Number(item.gstRatePercent || 0);

    if (gstRate > 0) {
      if (isInterState) {
        const igstAmount = (taxableAmount * gstRate) / 100;
        totalIgstAmount += igstAmount;
      } else {
        const halfRate = gstRate / 2;
        totalCgstAmount += (taxableAmount * halfRate) / 100;
        totalSgstAmount += (taxableAmount * halfRate) / 100;
      }
    }
  }

  const totalTaxAmount =
    totalCgstAmount + totalSgstAmount + totalIgstAmount + totalCessAmount;
  const grandTotal = totalTaxableAmount + totalTaxAmount;

  return {
    taxableAmount: Math.round(totalTaxableAmount * 100) / 100,
    cgstAmount: Math.round(totalCgstAmount * 100) / 100,
    sgstAmount: Math.round(totalSgstAmount * 100) / 100,
    igstAmount: Math.round(totalIgstAmount * 100) / 100,
    cessAmount: Math.round(totalCessAmount * 100) / 100,
    totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    isInterState,
  };
}

/**
 * Get GST ledger mappings for a startup
 */
export async function getGSTLedgerMappings(
  startupId: string,
  registrationId?: string
): Promise<Map<GstLedgerMappingType, string>> {
  const mappings = await prisma.gstLedgerMapping.findMany({
    where: {
      startupId,
      registrationId: registrationId || null,
    },
  });

  const map = new Map<GstLedgerMappingType, string>();

  for (const mapping of mappings) {
    map.set(mapping.mappingType, mapping.ledgerName);
  }

  return map;
}

/**
 * Post GST entries to voucher
 */
export async function postGSTEntries(
  voucherId: string,
  startupId: string,
  gstAmounts: GSTAmounts,
  isOutput: boolean,
  registrationId?: string
): Promise<
  Array<{ ledgerName: string; entryType: "DEBIT" | "CREDIT"; amount: number }>
> {
  const mappings = await getGSTLedgerMappings(startupId, registrationId);
  const entries: Array<{
    ledgerName: string;
    entryType: "DEBIT" | "CREDIT";
    amount: number;
  }> = [];

  if (isOutput) {
    // Output GST (Sales) - Credit to GST output ledgers
    if (gstAmounts.cgst > 0) {
      const ledgerName = mappings.get(GstLedgerMappingType.OUTPUT_CGST);
      if (ledgerName) {
        entries.push({
          ledgerName,
          entryType: "CREDIT",
          amount: gstAmounts.cgst,
        });
      }
    }

    if (gstAmounts.sgst > 0) {
      const ledgerName = mappings.get(GstLedgerMappingType.OUTPUT_SGST);
      if (ledgerName) {
        entries.push({
          ledgerName,
          entryType: "CREDIT",
          amount: gstAmounts.sgst,
        });
      }
    }

    if (gstAmounts.igst > 0) {
      const ledgerName = mappings.get(GstLedgerMappingType.OUTPUT_IGST);
      if (ledgerName) {
        entries.push({
          ledgerName,
          entryType: "CREDIT",
          amount: gstAmounts.igst,
        });
      }
    }

    if (gstAmounts.cess > 0) {
      const ledgerName = mappings.get(GstLedgerMappingType.OUTPUT_CESS);
      if (ledgerName) {
        entries.push({
          ledgerName,
          entryType: "CREDIT",
          amount: gstAmounts.cess,
        });
      }
    }
  } else {
    // Input GST (Purchase) - Debit to GST input ledgers
    if (gstAmounts.cgst > 0) {
      const ledgerName = mappings.get(GstLedgerMappingType.INPUT_CGST);
      if (ledgerName) {
        entries.push({
          ledgerName,
          entryType: "DEBIT",
          amount: gstAmounts.cgst,
        });
      }
    }

    if (gstAmounts.sgst > 0) {
      const ledgerName = mappings.get(GstLedgerMappingType.INPUT_SGST);
      if (ledgerName) {
        entries.push({
          ledgerName,
          entryType: "DEBIT",
          amount: gstAmounts.sgst,
        });
      }
    }

    if (gstAmounts.igst > 0) {
      const ledgerName = mappings.get(GstLedgerMappingType.INPUT_IGST);
      if (ledgerName) {
        entries.push({
          ledgerName,
          entryType: "DEBIT",
          amount: gstAmounts.igst,
        });
      }
    }

    if (gstAmounts.cess > 0) {
      const ledgerName = mappings.get(GstLedgerMappingType.INPUT_CESS);
      if (ledgerName) {
        entries.push({
          ledgerName,
          entryType: "DEBIT",
          amount: gstAmounts.cess,
        });
      }
    }
  }

  return entries;
}

/**
 * Get company state from company profile
 */
export async function getCompanyState(startupId: string): Promise<string> {
  const profile = await prisma.companyProfile.findUnique({
    where: { startupId },
  });

  if (!profile?.state) {
    throw new Error(
      "Company state not configured. Please set company state in company profile."
    );
  }

  return profile.state;
}
