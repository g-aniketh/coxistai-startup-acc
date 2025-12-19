import {
  Prisma,
  VoucherCategory,
  VoucherEntryType,
  GstRegistrationType,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createVoucher, CreateVoucherInput } from "./vouchers";

export interface EnhancedTallyTransaction {
  voucherNo: string;
  voucherType: string;
  numberingSeries?: string;
  date: string;
  narration: string;
  reference?: string;
  entries: Array<{
    ledgerName: string;
    ledgerCode?: string;
    entryType: "DEBIT" | "CREDIT";
    amount: number;
    narration?: string;
    // GST fields
    cgst?: number;
    sgst?: number;
    igst?: number;
    cess?: number;
    hsnOrSac?: string;
    taxableAmount?: number;
  }>;
}

export interface EnhancedTallyImportData {
  ledgers: Array<{
    ledgerName: string;
    accountGroup: string;
    openingBalance: number;
    openingType: "Debit" | "Credit";
  }>;
  parties: Array<{
    name: string;
    type: "Customer" | "Supplier" | "Employee" | "Other";
    email?: string;
    phone?: string;
    openingBalance: number;
    balanceType: "Debit" | "Credit";
  }>;
  vouchers: EnhancedTallyTransaction[];
  gstData?: {
    gstin?: string;
    registrations?: Array<{
      gstin: string;
      stateCode: string;
      stateName?: string;
      registrationType?: string;
    }>;
  };
}

/**
 * Map Tally voucher type to our VoucherCategory
 */
function mapTallyVoucherTypeToCategory(tallyType: string): VoucherCategory {
  const mapping: Record<string, VoucherCategory> = {
    Sales: VoucherCategory.SALES,
    Purchase: VoucherCategory.PURCHASE,
    Payment: VoucherCategory.PAYMENT,
    Receipt: VoucherCategory.RECEIPT,
    Contra: VoucherCategory.CONTRA,
    Journal: VoucherCategory.JOURNAL,
    "Credit Note": VoucherCategory.CREDIT_NOTE,
    "Debit Note": VoucherCategory.DEBIT_NOTE,
  };

  return mapping[tallyType] || VoucherCategory.JOURNAL;
}

/**
 * Get or create voucher type for a startup
 */
async function getOrCreateVoucherType(
  startupId: string,
  category: VoucherCategory,
  name: string
) {
  let voucherType = await prisma.voucherType.findFirst({
    where: {
      startupId,
      category,
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });

  if (!voucherType) {
    voucherType = await prisma.voucherType.create({
      data: {
        startupId,
        name,
        category,
        abbreviation: name.substring(0, 3).toUpperCase(),
        isDefault: false,
        numberingMethod: "AUTOMATIC",
        nextNumber: 1,
      },
    });
  }

  return voucherType;
}

/**
 * Find or create numbering series for a voucher type
 */
async function findOrCreateNumberingSeries(
  startupId: string,
  voucherTypeId: string,
  seriesName?: string
) {
  if (!seriesName) {
    return null;
  }

  let series = await prisma.voucherNumberingSeries.findFirst({
    where: {
      startupId,
      voucherTypeId,
      name: {
        equals: seriesName,
        mode: "insensitive",
      },
    },
  });

  if (!series) {
    // Try to extract prefix/suffix from series name
    const prefixMatch = seriesName.match(/^([A-Z]+)/);
    const suffixMatch = seriesName.match(/([A-Z]+)$/);
    const prefix = prefixMatch ? prefixMatch[1] : null;
    const suffix = suffixMatch && !prefixMatch ? suffixMatch[1] : null;

    series = await prisma.voucherNumberingSeries.create({
      data: {
        startupId,
        voucherTypeId,
        name: seriesName,
        prefix: prefix || null,
        suffix: suffix || null,
        startNumber: 1,
        nextNumber: 1,
        isDefault: false,
      },
    });
  }

  return series;
}

/**
 * Parse voucher number to extract series and number
 */
function parseVoucherNumber(voucherNo: string): {
  series?: string;
  number: string;
} {
  // Try to extract series prefix (e.g., "SALES-001" -> series: "SALES", number: "001")
  const match = voucherNo.match(/^([A-Z]+[-_]?)(\d+)$/i);
  if (match) {
    return {
      series: match[1].replace(/[-_]$/, ""),
      number: match[2],
    };
  }

  // Try to extract series suffix (e.g., "001-SALES" -> series: "SALES", number: "001")
  const suffixMatch = voucherNo.match(/^(\d+)[-_]([A-Z]+)$/i);
  if (suffixMatch) {
    return {
      series: suffixMatch[2],
      number: suffixMatch[1],
    };
  }

  return { number: voucherNo };
}

/**
 * Import enhanced Tally data with vouchers and GST support
 */
export async function importEnhancedTallyData(
  startupId: string,
  userId: string,
  data: EnhancedTallyImportData
) {
  const stats = {
    ledgersCreated: 0,
    partiesCreated: 0,
    vouchersCreated: 0,
    voucherEntriesCreated: 0,
    gstRegistrationsCreated: 0,
    errors: [] as string[],
    warnings: [] as string[],
  };

  // Import GST registrations if provided
  if (data.gstData?.registrations) {
    for (const reg of data.gstData.registrations) {
      try {
        const existing = await prisma.gstRegistration.findFirst({
          where: {
            startupId,
            gstin: reg.gstin,
          },
        });

        if (!existing) {
          await prisma.gstRegistration.create({
            data: {
              startupId,
              gstin: reg.gstin,
              stateCode: reg.stateCode,
              stateName: reg.stateName || null,
              registrationType:
                (reg.registrationType as GstRegistrationType) || "REGULAR",
              startDate: new Date(),
              isDefault: data.gstData.registrations.length === 1,
              isActive: true,
            },
          });
          stats.gstRegistrationsCreated++;
        }
      } catch (error) {
        stats.errors.push(
          `Failed to create GST registration ${reg.gstin}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  }

  // Import ledgers (parties will be handled separately)
  for (const ledger of data.ledgers) {
    try {
      const existing = await prisma.partyMaster.findFirst({
        where: {
          startupId,
          name: ledger.ledgerName,
        },
      });

      if (!existing) {
        await prisma.partyMaster.create({
          data: {
            startupId,
            name: ledger.ledgerName,
            type: "Other",
            openingBalance: ledger.openingBalance,
            balanceType: ledger.openingType,
          },
        });
        stats.ledgersCreated++;
      }
    } catch (error) {
      stats.errors.push(
        `Failed to create ledger ${ledger.ledgerName}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Import parties
  for (const party of data.parties) {
    try {
      const existing = await prisma.partyMaster.findFirst({
        where: {
          startupId,
          name: party.name,
        },
      });

      if (!existing) {
        await prisma.partyMaster.create({
          data: {
            startupId,
            name: party.name,
            type: party.type,
            email: party.email || null,
            phone: party.phone || null,
            openingBalance: party.openingBalance,
            balanceType: party.balanceType,
          },
        });
        stats.partiesCreated++;
      }
    } catch (error) {
      stats.errors.push(
        `Failed to create party ${party.name}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Import vouchers
  const voucherTypeCache = new Map<string, any>();
  const seriesCache = new Map<string, any>();

  for (const tallyVoucher of data.vouchers) {
    try {
      const category = mapTallyVoucherTypeToCategory(tallyVoucher.voucherType);
      const voucherTypeName = tallyVoucher.voucherType;

      // Get or create voucher type
      const cacheKey = `${category}-${voucherTypeName}`;
      let voucherType = voucherTypeCache.get(cacheKey);
      if (!voucherType) {
        voucherType = await getOrCreateVoucherType(
          startupId,
          category,
          voucherTypeName
        );
        voucherTypeCache.set(cacheKey, voucherType);
      }

      // Parse voucher number to find series
      const { series: parsedSeries, number: voucherNum } = parseVoucherNumber(
        tallyVoucher.voucherNo
      );
      const seriesName = tallyVoucher.numberingSeries || parsedSeries;

      // Get or create numbering series
      let numberingSeries = null;
      if (seriesName) {
        const seriesKey = `${voucherType.id}-${seriesName}`;
        numberingSeries = seriesCache.get(seriesKey);
        if (!numberingSeries) {
          numberingSeries = await findOrCreateNumberingSeries(
            startupId,
            voucherType.id,
            seriesName
          );
          if (numberingSeries) {
            seriesCache.set(seriesKey, numberingSeries);
          }
        }
      }

      // Convert entries to our format
      const entries = tallyVoucher.entries.map((entry) => ({
        ledgerName: entry.ledgerName,
        ledgerCode: entry.ledgerCode,
        entryType: entry.entryType as VoucherEntryType,
        amount: entry.amount,
        narration: entry.narration,
      }));

      // Create voucher
      const voucherInput: CreateVoucherInput = {
        voucherTypeId: voucherType.id,
        numberingSeriesId: numberingSeries?.id || null,
        date: tallyVoucher.date,
        reference: tallyVoucher.reference,
        narration: tallyVoucher.narration,
        entries,
        createdById: userId,
      };

      // If voucher number was provided and doesn't match auto-generated, we need to handle it
      // For now, we'll let the system generate the number, but store the original in reference
      const voucher = await createVoucher(startupId, voucherInput);

      // If GST data exists in entries, we could create GST ledger mappings here
      // For now, we'll just track that GST data was present
      const hasGstData = tallyVoucher.entries.some(
        (e) => e.cgst || e.sgst || e.igst || e.cess
      );

      if (hasGstData) {
        stats.warnings.push(
          `Voucher ${tallyVoucher.voucherNo} contains GST data. GST ledger mapping should be configured.`
        );
      }

      stats.vouchersCreated++;
      stats.voucherEntriesCreated += entries.length;
    } catch (error) {
      stats.errors.push(
        `Failed to import voucher ${tallyVoucher.voucherNo}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Create import history
  await prisma.importHistory.create({
    data: {
      startupId,
      fileName: "Enhanced Tally Import",
      importType: "TALLY",
      totalRecords:
        data.vouchers.length + data.ledgers.length + data.parties.length,
      successCount:
        stats.vouchersCreated + stats.ledgersCreated + stats.partiesCreated,
      failureCount: stats.errors.length,
      summary: JSON.stringify(stats),
    },
  });

  return stats;
}
