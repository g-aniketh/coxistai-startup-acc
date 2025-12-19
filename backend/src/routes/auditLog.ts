import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  listAuditLogs,
  getEntityAuditLog,
  getAuditLogSummary,
} from "../services/auditLog";
import { AuditAction, AuditEntityType } from "@prisma/client";

const router = Router();

router.use(authenticateToken);

// List audit logs with filters
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const {
      entityType,
      entityId,
      action,
      userId,
      fromDate,
      toDate,
      limit,
      offset,
    } = req.query;

    interface AuditLogFilters {
      entityType?: AuditEntityType;
      entityId?: string;
      action?: AuditAction;
      userId?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
      offset?: number;
    }

    const filters: AuditLogFilters = {};
    if (
      entityType &&
      typeof entityType === "string" &&
      entityType in AuditEntityType
    ) {
      filters.entityType = entityType as AuditEntityType;
    }
    if (entityId) {
      filters.entityId = entityId as string;
    }
    if (action && typeof action === "string" && action in AuditAction) {
      filters.action = action as AuditAction;
    }
    if (userId) {
      filters.userId = userId as string;
    }
    if (fromDate) {
      filters.fromDate = fromDate as string;
    }
    if (toDate) {
      filters.toDate = toDate as string;
    }
    if (limit) {
      filters.limit = parseInt(limit as string, 10);
    }
    if (offset) {
      filters.offset = parseInt(offset as string, 10);
    }

    const result = await listAuditLogs(startupId, filters);

    return res.json({
      success: true,
      data: result.logs,
      total: result.total,
    });
  } catch (error) {
    console.error("List audit logs error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch audit logs",
    });
  }
});

// Get audit log for a specific entity
router.get(
  "/entity/:entityType/:entityId",
  async (req: AuthRequest, res: Response) => {
    try {
      const startupId = req.user?.startupId;
      if (!startupId) {
        return res
          .status(400)
          .json({ success: false, message: "Startup context is required" });
      }

      const { entityType, entityId } = req.params;

      if (!(entityType in AuditEntityType)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid entity type" });
      }

      const logs = await getEntityAuditLog(
        startupId,
        entityType as AuditEntityType,
        entityId
      );

      return res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      console.error("Get entity audit log error:", error);
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch entity audit log",
      });
    }
  }
);

// Get audit log summary
router.get("/summary", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { fromDate, toDate } = req.query;

    const summary = await getAuditLogSummary(
      startupId,
      fromDate as string | undefined,
      toDate as string | undefined
    );

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Get audit log summary error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch audit log summary",
    });
  }
});

export default router;
