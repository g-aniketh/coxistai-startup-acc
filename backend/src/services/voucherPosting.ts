import {
  VoucherStatus,
  VoucherCategory,
  Prisma,
  VoucherEntryType,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { applyPostingRules, type VoucherPostingData } from "./voucherRules";
import {
  calculateGSTForItems,
  postGSTEntries,
  getCompanyState,
  type GSTAmounts,
} from "./gstCalculation";
import {
  updateStockForVoucher,
  validateStockAvailability,
} from "./inventoryPosting";
import { createAuditLog } from "./auditLog";
import { AuditAction, AuditEntityType } from "@prisma/client";

export interface PostVoucherResult {
  voucherId: string;
  entriesCreated: number;
  inventoryUpdated: boolean;
  gstPosted: boolean;
}

/**
 * Validate voucher before posting
 */
export async function validateVoucher(
  startupId: string,
  voucherId: string
): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  const voucher = await prisma.voucher.findFirst({
    where: {
      id: voucherId,
      startupId,
    },
    include: {
      voucherType: true,
      inventoryLines: {
        include: {
          item: true,
          warehouse: true,
        },
      },
      entries: true,
    },
  });

  if (!voucher) {
    return {
      valid: false,
      errors: ["Voucher not found"],
    };
  }

  if (voucher.status === VoucherStatus.POSTED) {
    return {
      valid: false,
      errors: ["Voucher is already posted"],
    };
  }

  if (voucher.status === VoucherStatus.CANCELLED) {
    return {
      valid: false,
      errors: ["Cannot post a cancelled voucher"],
    };
  }

  const category = voucher.voucherType.category;

  // Validate inventory lines for sales/purchase vouchers
  if (
    category === VoucherCategory.SALES ||
    category === VoucherCategory.PURCHASE ||
    category === VoucherCategory.CREDIT_NOTE ||
    category === VoucherCategory.DEBIT_NOTE
  ) {
    if (!voucher.inventoryLines || voucher.inventoryLines.length === 0) {
      errors.push(
        `${voucher.voucherType.name} voucher requires at least one inventory line`
      );
    }

    // Validate stock availability for sales
    if (category === VoucherCategory.SALES) {
      for (const line of voucher.inventoryLines) {
        const validation = await validateStockAvailability(
          startupId,
          line.itemId,
          line.warehouseId,
          Number(line.quantity)
        );

        if (!validation.available) {
          errors.push(
            `Insufficient stock for item ${line.item.itemName} in warehouse ${line.warehouse.name}. ` +
              `Available: ${validation.currentStock}, Required: ${validation.required}`
          );
        }
      }
    }
  }

  // Validate journal vouchers have balanced entries
  if (category === VoucherCategory.JOURNAL) {
    if (voucher.entries.length < 2) {
      errors.push("Journal voucher requires at least two entries");
    } else {
      const totalDebit = voucher.entries
        .filter((e) => e.entryType === VoucherEntryType.DEBIT)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const totalCredit = voucher.entries
        .filter((e) => e.entryType === VoucherEntryType.CREDIT)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        errors.push(
          `Journal voucher is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Post a voucher - main posting function
 */
export async function postVoucher(
  startupId: string,
  voucherId: string,
  userId?: string
): Promise<PostVoucherResult> {
  // Validate voucher
  const validation = await validateVoucher(startupId, voucherId);
  if (!validation.valid) {
    throw new Error(
      `Voucher validation failed: ${validation.errors.join(", ")}`
    );
  }

  // Get voucher with all related data
  const voucher = await prisma.voucher.findFirst({
    where: {
      id: voucherId,
      startupId,
    },
    include: {
      voucherType: true,
      partyLedger: true,
      inventoryLines: {
        include: {
          item: true,
          warehouse: true,
        },
      },
      entries: true,
    },
  });

  if (!voucher) {
    throw new Error("Voucher not found");
  }

  if (voucher.status === VoucherStatus.POSTED) {
    throw new Error("Voucher is already posted");
  }

  const category = voucher.voucherType.category;

  // Prepare posting data
  const inventoryLines = voucher.inventoryLines?.map((line) => ({
    itemId: line.itemId,
    warehouseId: line.warehouseId,
    quantity: Number(line.quantity),
    rate: Number(line.rate),
    amount: Number(line.amount),
    discountAmount: line.discountAmount
      ? Number(line.discountAmount)
      : undefined,
    gstRatePercent: line.gstRatePercent
      ? Number(line.gstRatePercent)
      : undefined,
  }));

  // Calculate GST if applicable
  let gstAmounts: GSTAmounts | undefined;
  let companyState: string | undefined;
  let placeOfSupply: string | undefined;

  if (
    category === VoucherCategory.SALES ||
    category === VoucherCategory.PURCHASE ||
    category === VoucherCategory.CREDIT_NOTE ||
    category === VoucherCategory.DEBIT_NOTE
  ) {
    if (
      inventoryLines &&
      inventoryLines.length > 0 &&
      voucher.placeOfSupplyState
    ) {
      try {
        companyState = await getCompanyState(startupId);
        placeOfSupply = voucher.placeOfSupplyState;

        const gstResult = await calculateGSTForItems(
          inventoryLines,
          placeOfSupply,
          companyState
        );

        gstAmounts = {
          cgst: gstResult.cgstAmount,
          sgst: gstResult.sgstAmount,
          igst: gstResult.igstAmount,
          cess: gstResult.cessAmount,
          total: gstResult.totalTaxAmount,
        };
      } catch (error) {
        // GST calculation failed, but we can still post without GST
        console.warn("GST calculation failed:", error);
      }
    }
  }

  const postingData: VoucherPostingData = {
    voucher: voucher as VoucherPostingData["voucher"],
    inventoryLines,
    gstAmounts,
    companyState,
    placeOfSupply,
  };

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      // Check existing entries
      const existingEntries = await tx.voucherEntry.findMany({
        where: { voucherId },
      });

      // Apply posting rules to get ledger entries
      let ledgerEntries = await applyPostingRules(postingData);

      // For journal vouchers, entries are already created manually, so we skip creating them again
      if (category === VoucherCategory.JOURNAL) {
        // Journal vouchers use manual entries - already created, just validate
        if (existingEntries.length < 2) {
          throw new Error("Journal voucher requires at least two entries");
        }
        // Validate balance
        const totalDebit = existingEntries
          .filter((e) => e.entryType === VoucherEntryType.DEBIT)
          .reduce((sum, e) => sum + Number(e.amount), 0);

        const totalCredit = existingEntries
          .filter((e) => e.entryType === VoucherEntryType.CREDIT)
          .reduce((sum, e) => sum + Number(e.amount), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          throw new Error(
            `Journal voucher is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`
          );
        }
      } else {
        // For other voucher types:
        // - If entries already exist (from manual entry form), validate and use them
        // - If no entries exist, create them from posting rules
        if (existingEntries.length > 0) {
          // Entries already exist (manual entry) - validate they're balanced
          const totalDebit = existingEntries
            .filter((e) => e.entryType === VoucherEntryType.DEBIT)
            .reduce((sum, e) => sum + Number(e.amount), 0);

          const totalCredit = existingEntries
            .filter((e) => e.entryType === VoucherEntryType.CREDIT)
            .reduce((sum, e) => sum + Number(e.amount), 0);

          if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(
              `Voucher entries are not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`
            );
          }
          // Use existing entries - don't recreate
        } else if (ledgerEntries.length > 0) {
          // No existing entries - create from posting rules
          // Delete any existing draft entries first (shouldn't be any, but safety check)
          await tx.voucherEntry.deleteMany({
            where: { voucherId },
          });

          // Create ledger entries from posting rules
          for (const entry of ledgerEntries) {
            await tx.voucherEntry.create({
              data: {
                voucherId,
                ledgerId: entry.ledgerId || null,
                ledgerName: entry.ledgerName,
                ledgerCode: entry.ledgerCode || null,
                entryType: entry.entryType,
                amount: entry.amount,
                narration: entry.narration || null,
              },
            });
          }
        } else {
          throw new Error("No ledger entries found for voucher");
        }
      }

      // Add GST entries if applicable
      if (gstAmounts && gstAmounts.total > 0) {
        const isOutput =
          category === VoucherCategory.SALES ||
          category === VoucherCategory.CREDIT_NOTE;

        const gstEntries = await postGSTEntries(
          voucherId,
          startupId,
          gstAmounts,
          isOutput,
          undefined // registrationId - could be enhanced to get from voucher
        );

        for (const gstEntry of gstEntries) {
          // Find ledger by name
          const ledger = await tx.ledger.findFirst({
            where: {
              startupId,
              name: gstEntry.ledgerName,
            },
          });

          await tx.voucherEntry.create({
            data: {
              voucherId,
              ledgerId: ledger?.id || null,
              ledgerName: gstEntry.ledgerName,
              ledgerCode: null,
              entryType: gstEntry.entryType,
              amount: gstEntry.amount,
              narration: `GST for ${voucher.voucherNumber}`,
            },
          });
        }
      }

      // Update inventory if applicable
      let inventoryUpdated = false;
      if (
        inventoryLines &&
        (category === VoucherCategory.SALES ||
          category === VoucherCategory.PURCHASE ||
          category === VoucherCategory.DELIVERY_NOTE ||
          category === VoucherCategory.RECEIPT_NOTE ||
          category === VoucherCategory.CREDIT_NOTE ||
          category === VoucherCategory.DEBIT_NOTE ||
          category === VoucherCategory.STOCK_JOURNAL)
      ) {
        await updateStockForVoucher(
          startupId,
          voucherId,
          category,
          inventoryLines
        );
        inventoryUpdated = true;
      }

      // Recalculate total amount if GST was added during posting
      let finalTotalAmount = Number(voucher.totalAmount);
      if (gstAmounts && gstAmounts.total > 0 && inventoryLines) {
        // For sales/purchase, totalAmount should include GST
        const itemsSubtotal = inventoryLines.reduce(
          (sum, line) => sum + Number(line.amount),
          0
        );
        const expectedTotal = itemsSubtotal + gstAmounts.total;

        // Update totalAmount if it doesn't match (GST was calculated during posting)
        if (Math.abs(finalTotalAmount - expectedTotal) > 0.01) {
          finalTotalAmount = expectedTotal;
        }
      }

      // Update voucher status to POSTED and update total if needed
      await tx.voucher.update({
        where: { id: voucherId },
        data: {
          status: VoucherStatus.POSTED,
          totalAmount: finalTotalAmount,
        },
      });

      // Get final count of entries
      const finalEntries = await tx.voucherEntry.findMany({
        where: { voucherId },
      });

      return {
        entriesCreated: finalEntries.length,
        inventoryUpdated,
        gstPosted: gstAmounts !== undefined && gstAmounts.total > 0,
      };
    },
    {
      timeout: 30000,
      maxWait: 10000,
    }
  );

  // Create audit log
  createAuditLog({
    startupId,
    userId,
    entityType: AuditEntityType.VOUCHER,
    entityId: voucherId,
    action: AuditAction.APPROVE,
    description: `Voucher ${voucher.voucherNumber} posted`,
    newValues: {
      status: VoucherStatus.POSTED,
      entriesCreated: result.entriesCreated,
      inventoryUpdated: result.inventoryUpdated,
      gstPosted: result.gstPosted,
    },
  }).catch((err) => {
    console.warn("Failed to write audit log for voucher posting", err);
  });

  return {
    voucherId,
    ...result,
  };
}

/**
 * Cancel a posted voucher
 */
export async function cancelVoucher(
  startupId: string,
  voucherId: string,
  userId?: string
): Promise<void> {
  const voucher = await prisma.voucher.findFirst({
    where: {
      id: voucherId,
      startupId,
    },
  });

  if (!voucher) {
    throw new Error("Voucher not found");
  }

  if (voucher.status === VoucherStatus.CANCELLED) {
    throw new Error("Voucher is already cancelled");
  }

  // For now, we just mark it as cancelled
  // In a full implementation, you might want to create a reversing entry
  await prisma.voucher.update({
    where: { id: voucherId },
    data: {
      status: VoucherStatus.CANCELLED,
    },
  });

  // Create audit log
  createAuditLog({
    startupId,
    userId,
    entityType: AuditEntityType.VOUCHER,
    entityId: voucherId,
    action: AuditAction.CANCEL,
    description: `Voucher ${voucher.voucherNumber} cancelled`,
    oldValues: {
      status: voucher.status,
    },
    newValues: {
      status: VoucherStatus.CANCELLED,
    },
  }).catch((err) => {
    console.warn("Failed to write audit log for voucher cancellation", err);
  });
}
