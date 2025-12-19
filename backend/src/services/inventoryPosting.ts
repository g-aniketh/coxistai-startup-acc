import { VoucherCategory, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface StockMovement {
  itemId: string;
  warehouseId: string;
  quantity: number;
  type: "IN" | "OUT" | "TRANSFER";
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
}

/**
 * Get current stock balance for an item in a warehouse
 */
export async function getStockBalance(
  startupId: string,
  itemId: string,
  warehouseId: string
): Promise<number> {
  // Get all inventory lines for this item and warehouse
  const inventoryLines = await prisma.voucherInventoryLine.findMany({
    where: {
      itemId,
      warehouseId,
      voucher: {
        startupId,
        status: "POSTED",
      },
    },
    include: {
      voucher: {
        include: {
          voucherType: true,
        },
      },
    },
  });

  let balance = 0;

  for (const line of inventoryLines) {
    const category = line.voucher.voucherType.category;
    const quantity = Number(line.quantity);

    // Increase stock for purchases, receipt notes
    if (
      category === VoucherCategory.PURCHASE ||
      category === VoucherCategory.RECEIPT_NOTE ||
      category === VoucherCategory.CREDIT_NOTE // Sales return increases stock
    ) {
      balance += quantity;
    }
    // Decrease stock for sales, delivery notes
    else if (
      category === VoucherCategory.SALES ||
      category === VoucherCategory.DELIVERY_NOTE
    ) {
      balance -= quantity;
    }
    // Decrease stock for purchase returns (debit note)
    else if (category === VoucherCategory.DEBIT_NOTE) {
      balance -= quantity;
    }
    // Stock journal - handled separately
  }

  return Math.max(0, balance);
}

/**
 * Validate stock availability before sale
 */
export async function validateStockAvailability(
  startupId: string,
  itemId: string,
  warehouseId: string,
  quantity: number
): Promise<{ available: boolean; currentStock: number; required: number }> {
  const currentStock = await getStockBalance(startupId, itemId, warehouseId);
  const required = quantity;

  return {
    available: currentStock >= required,
    currentStock,
    required,
  };
}

/**
 * Update stock for a voucher
 * Note: This function calculates stock movements but doesn't actually update a stock table.
 * Stock is calculated on-the-fly from voucher inventory lines.
 * For actual stock tracking, you might want to create a StockBalance table.
 */
export async function updateStockForVoucher(
  startupId: string,
  voucherId: string,
  voucherType: VoucherCategory,
  inventoryLines: Array<{
    itemId: string;
    warehouseId: string;
    quantity: number;
  }>
): Promise<StockMovement[]> {
  const movements: StockMovement[] = [];

  for (const line of inventoryLines) {
    let movementType: "IN" | "OUT" | "TRANSFER" = "IN";

    // Determine movement type based on voucher category
    if (
      voucherType === VoucherCategory.SALES ||
      voucherType === VoucherCategory.DELIVERY_NOTE ||
      voucherType === VoucherCategory.DEBIT_NOTE
    ) {
      movementType = "OUT";
    } else if (voucherType === VoucherCategory.STOCK_JOURNAL) {
      movementType = "TRANSFER";
    }

    // For sales, validate stock availability
    if (movementType === "OUT") {
      const validation = await validateStockAvailability(
        startupId,
        line.itemId,
        line.warehouseId,
        line.quantity
      );

      if (!validation.available) {
        throw new Error(
          `Insufficient stock for item ${line.itemId} in warehouse ${line.warehouseId}. ` +
            `Available: ${validation.currentStock}, Required: ${validation.required}`
        );
      }
    }

    movements.push({
      itemId: line.itemId,
      warehouseId: line.warehouseId,
      quantity: line.quantity,
      type: movementType,
    });
  }

  return movements;
}

/**
 * Get stock summary for an item across all warehouses
 */
export async function getItemStockSummary(
  startupId: string,
  itemId: string
): Promise<
  Array<{ warehouseId: string; warehouseName: string; quantity: number }>
> {
  const warehouses = await prisma.warehouseMaster.findMany({
    where: { startupId, isActive: true },
  });

  const summary: Array<{
    warehouseId: string;
    warehouseName: string;
    quantity: number;
  }> = [];

  for (const warehouse of warehouses) {
    const quantity = await getStockBalance(startupId, itemId, warehouse.id);
    summary.push({
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      quantity,
    });
  }

  return summary;
}

/**
 * Get stock summary for all items in a warehouse
 */
export async function getWarehouseStockSummary(
  startupId: string,
  warehouseId: string
): Promise<Array<{ itemId: string; itemName: string; quantity: number }>> {
  const items = await prisma.itemMaster.findMany({
    where: { startupId, isActive: true },
  });

  const summary: Array<{ itemId: string; itemName: string; quantity: number }> =
    [];

  for (const item of items) {
    const quantity = await getStockBalance(startupId, item.id, warehouseId);
    if (quantity > 0) {
      summary.push({
        itemId: item.id,
        itemName: item.itemName,
        quantity,
      });
    }
  }

  return summary;
}
