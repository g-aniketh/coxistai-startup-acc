import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { getWarehouseStockSummary } from "../services/inventoryPosting";
import { createAuditLog } from "../services/auditLog";
import { AuditAction, AuditEntityType } from "@prisma/client";

const router = Router();

router.use(authenticateToken);

// List all warehouses
router.get("/", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const warehouses = await prisma.warehouseMaster.findMany({
      where: { startupId },
      orderBy: { name: "asc" },
    });

    return res.json({ success: true, data: warehouses });
  } catch (error) {
    console.error("List warehouses error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch warehouses",
    });
  }
});

// Get warehouse by ID
router.get("/:warehouseId", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { warehouseId } = req.params;

    const warehouse = await prisma.warehouseMaster.findFirst({
      where: {
        id: warehouseId,
        startupId,
      },
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    return res.json({ success: true, data: warehouse });
  } catch (error) {
    console.error("Get warehouse error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch warehouse",
    });
  }
});

// Create warehouse
router.post("/", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { name, alias, address, isActive } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Warehouse name is required" });
    }

    const warehouse = await prisma.warehouseMaster.create({
      data: {
        startupId,
        name: name.trim(),
        alias: alias?.trim() || null,
        address: address?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    // Create audit log
    createAuditLog({
      startupId,
      userId: req.user?.userId,
      entityType: AuditEntityType.PRODUCT, // Using PRODUCT as closest match
      entityId: warehouse.id,
      action: AuditAction.CREATE,
      description: `Warehouse "${warehouse.name}" created`,
      newValues: {
        name: warehouse.name,
        alias: warehouse.alias,
        address: warehouse.address,
        isActive: warehouse.isActive,
      },
    }).catch((err) => {
      console.warn("Failed to write audit log for warehouse create", err);
    });

    return res.status(201).json({
      success: true,
      data: warehouse,
      message: "Warehouse created successfully",
    });
  } catch (error) {
    console.error("Create warehouse error:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return res.status(400).json({
        success: false,
        message: "Warehouse with this name already exists",
      });
    }
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create warehouse",
    });
  }
});

// Update warehouse
router.put("/:warehouseId", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { warehouseId } = req.params;
    const { name, alias, address, isActive } = req.body;

    const warehouse = await prisma.warehouseMaster.findFirst({
      where: {
        id: warehouseId,
        startupId,
      },
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    const oldValues = {
      name: warehouse.name,
      alias: warehouse.alias,
      address: warehouse.address,
      isActive: warehouse.isActive,
    };

    const updatedWarehouse = await prisma.warehouseMaster.update({
      where: { id: warehouseId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        alias: alias !== undefined ? alias?.trim() || null : undefined,
        address: address !== undefined ? address?.trim() || null : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    // Create audit log
    createAuditLog({
      startupId,
      userId: req.user?.userId,
      entityType: AuditEntityType.PRODUCT, // Using PRODUCT as closest match
      entityId: warehouse.id,
      action: AuditAction.UPDATE,
      description: `Warehouse "${warehouse.name}" updated`,
      oldValues,
      newValues: {
        name: updatedWarehouse.name,
        alias: updatedWarehouse.alias,
        address: updatedWarehouse.address,
        isActive: updatedWarehouse.isActive,
      },
    }).catch((err) => {
      console.warn("Failed to write audit log for warehouse update", err);
    });

    return res.json({
      success: true,
      data: updatedWarehouse,
      message: "Warehouse updated successfully",
    });
  } catch (error) {
    console.error("Update warehouse error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update warehouse",
    });
  }
});

// Delete warehouse
router.delete("/:warehouseId", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { warehouseId } = req.params;

    const warehouse = await prisma.warehouseMaster.findFirst({
      where: {
        id: warehouseId,
        startupId,
      },
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    await prisma.warehouseMaster.delete({
      where: { id: warehouseId },
    });

    // Create audit log
    createAuditLog({
      startupId,
      userId: req.user?.userId,
      entityType: AuditEntityType.PRODUCT, // Using PRODUCT as closest match
      entityId: warehouse.id,
      action: AuditAction.DELETE,
      description: `Warehouse "${warehouse.name}" deleted`,
      oldValues: {
        name: warehouse.name,
        alias: warehouse.alias,
        address: warehouse.address,
        isActive: warehouse.isActive,
      },
    }).catch((err) => {
      console.warn("Failed to write audit log for warehouse delete", err);
    });

    return res.json({
      success: true,
      message: "Warehouse deleted successfully",
    });
  } catch (error) {
    console.error("Delete warehouse error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete warehouse",
    });
  }
});

// Get stock summary for a warehouse
router.get("/:warehouseId/stock", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { warehouseId } = req.params;

    const warehouse = await prisma.warehouseMaster.findFirst({
      where: {
        id: warehouseId,
        startupId,
      },
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    const stockSummary = await getWarehouseStockSummary(startupId, warehouseId);

    return res.json({
      success: true,
      data: {
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        stockSummary,
      },
    });
  } catch (error) {
    console.error("Get warehouse stock error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch stock",
    });
  }
});

export default router;
