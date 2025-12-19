import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createBill,
  settleBill,
  listBills,
  getBillAgingReport,
  getOutstandingByLedger,
  getBillReminders,
  getBillCashFlowProjections,
  getBillsAnalytics,
} from "../services/bills";
import { BillType, BillStatus } from "@prisma/client";

const router = Router();

router.use(authenticateToken);

// Create a new bill
router.post("/", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const {
      billType,
      billNumber,
      ledgerName,
      ledgerCode,
      billDate,
      dueDate,
      originalAmount,
      reference,
      narration,
      voucherId,
      voucherEntryId,
    } = req.body;

    if (!billType || !billNumber || !ledgerName || !originalAmount) {
      return res.status(400).json({
        success: false,
        message:
          "billType, billNumber, ledgerName, and originalAmount are required",
      });
    }

    if (!(billType in BillType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid bill type" });
    }

    const bill = await createBill(startupId, {
      billType,
      billNumber,
      ledgerName,
      ledgerCode,
      billDate,
      dueDate,
      originalAmount: Number(originalAmount),
      reference,
      narration,
      voucherId,
      voucherEntryId,
    });

    return res.status(201).json({
      success: true,
      data: bill,
      message: "Bill created successfully",
    });
  } catch (error) {
    console.error("Create bill error:", error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create bill",
    });
  }
});

// List bills with filters
router.get("/", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const {
      billType,
      status,
      ledgerName,
      fromDate,
      toDate,
      dueDateFrom,
      dueDateTo,
      limit,
      offset,
    } = req.query;

    interface BillFilters {
      billType?: BillType;
      status?: BillStatus;
      ledgerName?: string;
      fromDate?: string;
      toDate?: string;
      dueDateFrom?: string;
      dueDateTo?: string;
      limit?: number;
      offset?: number;
    }

    const filters: BillFilters = {};
    if (billType && typeof billType === "string" && billType in BillType) {
      filters.billType = billType as BillType;
    }
    if (status && typeof status === "string" && status in BillStatus) {
      filters.status = status as BillStatus;
    }
    if (ledgerName) {
      filters.ledgerName = ledgerName as string;
    }
    if (fromDate) {
      filters.fromDate = fromDate as string;
    }
    if (toDate) {
      filters.toDate = toDate as string;
    }
    if (dueDateFrom) {
      filters.dueDateFrom = dueDateFrom as string;
    }
    if (dueDateTo) {
      filters.dueDateTo = dueDateTo as string;
    }
    if (limit) {
      filters.limit = parseInt(limit as string, 10);
    }
    if (offset) {
      filters.offset = parseInt(offset as string, 10);
    }

    const result = await listBills(startupId, filters);

    return res.json({
      success: true,
      data: result.bills,
      total: result.total,
    });
  } catch (error) {
    console.error("List bills error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch bills",
    });
  }
});

// Settle a bill
router.post("/:billId/settle", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { billId } = req.params;
    const { voucherId, voucherEntryId, settlementAmount, reference, remarks } =
      req.body;

    if (!voucherId || !voucherEntryId || !settlementAmount) {
      return res.status(400).json({
        success: false,
        message: "voucherId, voucherEntryId, and settlementAmount are required",
      });
    }

    const result = await settleBill(startupId, {
      billId,
      voucherId,
      voucherEntryId,
      settlementAmount: Number(settlementAmount),
      reference,
      remarks,
    });

    return res.json({
      success: true,
      data: result,
      message: "Bill settled successfully",
    });
  } catch (error) {
    console.error("Settle bill error:", error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to settle bill",
    });
  }
});

// Get aging report
router.get("/aging", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { billType } = req.query;
    const report = await getBillAgingReport(
      startupId,
      billType && typeof billType === "string" && billType in BillType
        ? (billType as BillType)
        : undefined
    );

    return res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Get aging report error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate aging report",
    });
  }
});

// Get outstanding by ledger
router.get("/outstanding-by-ledger", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { billType } = req.query;
    const result = await getOutstandingByLedger(
      startupId,
      billType && typeof billType === "string" && billType in BillType
        ? (billType as BillType)
        : undefined
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get outstanding by ledger error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch outstanding by ledger",
    });
  }
});

// Get bill reminders
router.get("/reminders", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { billType, daysBeforeReminder } = req.query;
    const reminders = await getBillReminders(
      startupId,
      billType && typeof billType === "string" && billType in BillType
        ? (billType as BillType)
        : undefined,
      daysBeforeReminder ? parseInt(daysBeforeReminder as string, 10) : 7
    );

    return res.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error("Get bill reminders error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch bill reminders",
    });
  }
});

// Get cash flow projections
router.get("/cash-flow-projections", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { months } = req.query;
    const projections = await getBillCashFlowProjections(
      startupId,
      months ? parseInt(months as string, 10) : 6
    );

    return res.json({
      success: true,
      data: projections,
    });
  } catch (error) {
    console.error("Get cash flow projections error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch cash flow projections",
    });
  }
});

// Get bills analytics
router.get("/analytics", async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { fromDate, toDate } = req.query;
    const analytics = await getBillsAnalytics(
      startupId,
      fromDate as string | undefined,
      toDate as string | undefined
    );

    return res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Get bills analytics error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch bills analytics",
    });
  }
});

export default router;
