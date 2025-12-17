import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  analyzeVoucherAnomalies,
  detectVoucherVariances,
  generateVoucherInsights,
} from "../services/voucherAI";

const router = Router();

router.use(authenticateToken);

// GET /api/v1/voucher-ai/anomalies
router.get("/anomalies", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const fromDate = req.query.fromDate
      ? new Date(req.query.fromDate as string)
      : undefined;
    const toDate = req.query.toDate
      ? new Date(req.query.toDate as string)
      : undefined;

    const alerts = await analyzeVoucherAnomalies(startupId, fromDate, toDate);

    return res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error("Analyze voucher anomalies error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to analyze voucher anomalies",
    });
  }
});

// GET /api/v1/voucher-ai/variances
router.get("/variances", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const period =
      (req.query.period as "monthly" | "quarterly" | "yearly") || "monthly";

    const variances = await detectVoucherVariances(startupId, period);

    return res.json({
      success: true,
      data: variances,
    });
  } catch (error) {
    console.error("Detect voucher variances error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to detect voucher variances",
    });
  }
});

// GET /api/v1/voucher-ai/insights
router.get("/insights", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const fromDate = req.query.fromDate
      ? new Date(req.query.fromDate as string)
      : undefined;
    const toDate = req.query.toDate
      ? new Date(req.query.toDate as string)
      : undefined;

    const insights = await generateVoucherInsights(startupId, fromDate, toDate);

    return res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error("Generate voucher insights error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate voucher insights",
    });
  }
});

export default router;
