import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { getItemStockSummary } from "../services/inventoryPosting";
import { createAuditLog } from "../services/auditLog";
import { AuditAction, AuditEntityType } from "@prisma/client";

const router = Router();

router.use(authenticateToken);

// List all items
router.get("/", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const items = await prisma.itemMaster.findMany({
      where: { startupId },
      orderBy: { itemName: "asc" },
    });

    return res.json({ success: true, data: items });
  } catch (error) {
    console.error("List items error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch items",
    });
  }
});

// Get item by ID
router.get("/:itemId", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { itemId } = req.params;

    const item = await prisma.itemMaster.findFirst({
      where: {
        id: itemId,
        startupId,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.json({ success: true, data: item });
  } catch (error) {
    console.error("Get item error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch item",
    });
  }
});

// Create item
router.post("/", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const {
      itemName,
      alias,
      hsnSac,
      unit,
      defaultSalesRate,
      defaultPurchaseRate,
      gstRatePercent,
      description,
      isActive,
    } = req.body;

    if (!itemName) {
      return res
        .status(400)
        .json({ success: false, message: "Item name is required" });
    }

    const item = await prisma.itemMaster.create({
      data: {
        startupId,
        itemName: itemName.trim(),
        alias: alias?.trim() || null,
        hsnSac: hsnSac?.trim() || null,
        unit: unit?.trim() || null,
        defaultSalesRate: defaultSalesRate ? Number(defaultSalesRate) : null,
        defaultPurchaseRate: defaultPurchaseRate
          ? Number(defaultPurchaseRate)
          : null,
        gstRatePercent: gstRatePercent ? Number(gstRatePercent) : null,
        description: description?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    // Create audit log
    createAuditLog({
      startupId,
      userId: req.user?.userId,
      entityType: AuditEntityType.PRODUCT, // Using PRODUCT as closest match
      entityId: item.id,
      action: AuditAction.CREATE,
      description: `Item "${item.itemName}" created`,
      newValues: {
        itemName: item.itemName,
        alias: item.alias,
        hsnSac: item.hsnSac,
        unit: item.unit,
        defaultSalesRate: item.defaultSalesRate,
        defaultPurchaseRate: item.defaultPurchaseRate,
        gstRatePercent: item.gstRatePercent,
        isActive: item.isActive,
      },
    }).catch((err) => {
      console.warn("Failed to write audit log for item create", err);
    });

    return res.status(201).json({
      success: true,
      data: item,
      message: "Item created successfully",
    });
  } catch (error) {
    console.error("Create item error:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return res.status(400).json({
        success: false,
        message: "Item with this name already exists",
      });
    }
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create item",
    });
  }
});

// Update item
router.put("/:itemId", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { itemId } = req.params;
    const {
      itemName,
      alias,
      hsnSac,
      unit,
      defaultSalesRate,
      defaultPurchaseRate,
      gstRatePercent,
      description,
      isActive,
    } = req.body;

    const item = await prisma.itemMaster.findFirst({
      where: {
        id: itemId,
        startupId,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const oldValues = {
      itemName: item.itemName,
      alias: item.alias,
      hsnSac: item.hsnSac,
      unit: item.unit,
      defaultSalesRate: item.defaultSalesRate,
      defaultPurchaseRate: item.defaultPurchaseRate,
      gstRatePercent: item.gstRatePercent,
      isActive: item.isActive,
    };

    const updatedItem = await prisma.itemMaster.update({
      where: { id: itemId },
      data: {
        itemName: itemName !== undefined ? itemName.trim() : undefined,
        alias: alias !== undefined ? alias?.trim() || null : undefined,
        hsnSac: hsnSac !== undefined ? hsnSac?.trim() || null : undefined,
        unit: unit !== undefined ? unit?.trim() || null : undefined,
        defaultSalesRate:
          defaultSalesRate !== undefined ? Number(defaultSalesRate) : undefined,
        defaultPurchaseRate:
          defaultPurchaseRate !== undefined
            ? Number(defaultPurchaseRate)
            : undefined,
        gstRatePercent:
          gstRatePercent !== undefined ? Number(gstRatePercent) : undefined,
        description:
          description !== undefined ? description?.trim() || null : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    // Create audit log
    createAuditLog({
      startupId,
      userId: req.user?.userId,
      entityType: AuditEntityType.PRODUCT, // Using PRODUCT as closest match
      entityId: item.id,
      action: AuditAction.UPDATE,
      description: `Item "${item.itemName}" updated`,
      oldValues,
      newValues: {
        itemName: updatedItem.itemName,
        alias: updatedItem.alias,
        hsnSac: updatedItem.hsnSac,
        unit: updatedItem.unit,
        defaultSalesRate: updatedItem.defaultSalesRate,
        defaultPurchaseRate: updatedItem.defaultPurchaseRate,
        gstRatePercent: updatedItem.gstRatePercent,
        isActive: updatedItem.isActive,
      },
    }).catch((err) => {
      console.warn("Failed to write audit log for item update", err);
    });

    return res.json({
      success: true,
      data: updatedItem,
      message: "Item updated successfully",
    });
  } catch (error) {
    console.error("Update item error:", error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update item",
    });
  }
});

// Delete item
router.delete("/:itemId", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { itemId } = req.params;

    const item = await prisma.itemMaster.findFirst({
      where: {
        id: itemId,
        startupId,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    await prisma.itemMaster.delete({
      where: { id: itemId },
    });

    // Create audit log
    createAuditLog({
      startupId,
      userId: req.user?.userId,
      entityType: AuditEntityType.PRODUCT, // Using PRODUCT as closest match
      entityId: item.id,
      action: AuditAction.DELETE,
      description: `Item "${item.itemName}" deleted`,
      oldValues: {
        itemName: item.itemName,
        alias: item.alias,
        hsnSac: item.hsnSac,
        unit: item.unit,
        defaultSalesRate: item.defaultSalesRate,
        defaultPurchaseRate: item.defaultPurchaseRate,
        gstRatePercent: item.gstRatePercent,
        isActive: item.isActive,
      },
    }).catch((err) => {
      console.warn("Failed to write audit log for item delete", err);
    });

    return res.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Delete item error:", error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete item",
    });
  }
});

// Get stock balance for an item across all warehouses
router.get("/:itemId/stock", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { itemId } = req.params;

    const item = await prisma.itemMaster.findFirst({
      where: {
        id: itemId,
        startupId,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const stockSummary = await getItemStockSummary(startupId, itemId);

    return res.json({
      success: true,
      data: {
        itemId: item.id,
        itemName: item.itemName,
        stockSummary,
      },
    });
  } catch (error) {
    console.error("Get item stock error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch stock",
    });
  }
});

export default router;
