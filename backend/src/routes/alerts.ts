import { Router, Request, Response } from "express";
import type { Router as IRouter } from "express";
import { AlertsService } from "../services/alerts";
import { authenticateToken } from "../middleware/auth";

const router: IRouter = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/v1/alerts
 * @desc    Get all alerts
 * @access  Private
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const includeRead = req.query.includeRead === "true";

    const alerts = await AlertsService.getAlerts(tenantId, includeRead);

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error: any) {
    console.error("Error fetching alerts:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch alerts",
    });
  }
});

/**
 * @route   GET /api/v1/alerts/counts
 * @desc    Get alert counts by severity
 * @access  Private
 */
router.get("/counts", async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const counts = await AlertsService.getAlertCounts(tenantId);

    res.json({
      success: true,
      data: counts,
    });
  } catch (error: any) {
    console.error("Error fetching alert counts:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch alert counts",
    });
  }
});

/**
 * @route   POST /api/v1/alerts/generate
 * @desc    Generate alerts based on current metrics
 * @access  Private
 */
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    await AlertsService.generateAlerts(tenantId);

    const alerts = await AlertsService.getAlerts(tenantId);

    res.json({
      success: true,
      data: alerts,
      message: "Alerts generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating alerts:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to generate alerts",
    });
  }
});

/**
 * @route   PUT /api/v1/alerts/:id/read
 * @desc    Mark alert as read
 * @access  Private
 */
router.put("/:id/read", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const alert = await AlertsService.markAsRead(id);

    res.json({
      success: true,
      data: alert,
      message: "Alert marked as read",
    });
  } catch (error: any) {
    console.error("Error marking alert as read:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to mark alert as read",
    });
  }
});

/**
 * @route   PUT /api/v1/alerts/:id/dismiss
 * @desc    Dismiss alert
 * @access  Private
 */
router.put("/:id/dismiss", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const alert = await AlertsService.dismissAlert(id);

    res.json({
      success: true,
      data: alert,
      message: "Alert dismissed",
    });
  } catch (error: any) {
    console.error("Error dismissing alert:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to dismiss alert",
    });
  }
});

export default router;
