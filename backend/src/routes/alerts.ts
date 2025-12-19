import { Router, Response } from "express";
import type { Router as IRouter } from "express";
import { AlertsService } from "../services/alerts";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/v1/alerts
 * @desc    Get all alerts
 * @access  Private
 */
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.startupId;
    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }
    const includeRead = req.query.includeRead === "true";

    const alerts = await AlertsService.getAlerts(tenantId, includeRead);

    res.json({
      success: true,
      data: alerts,
    });
    return;
  } catch (error) {
    console.error("Error fetching alerts:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch alerts";
    res.status(400).json({
      success: false,
      message,
    });
  }
});

/**
 * @route   GET /api/v1/alerts/counts
 * @desc    Get alert counts by severity
 * @access  Private
 */
router.get("/counts", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.startupId;
    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const counts = await AlertsService.getAlertCounts(tenantId);

    res.json({
      success: true,
      data: counts,
    });
    return;
  } catch (error) {
    console.error("Error fetching alert counts:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch alert counts";
    res.status(400).json({
      success: false,
      message,
    });
    return;
  }
});

/**
 * @route   POST /api/v1/alerts/generate
 * @desc    Generate alerts based on current metrics
 * @access  Private
 */
router.post("/generate", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.startupId;
    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    await AlertsService.generateAlerts(tenantId);

    const alerts = await AlertsService.getAlerts(tenantId);

    res.json({
      success: true,
      data: alerts,
      message: "Alerts generated successfully",
    });
    return;
  } catch (error) {
    console.error("Error generating alerts:", error);
    const message = error instanceof Error ? error.message : "Failed to generate alerts";
    res.status(400).json({
      success: false,
      message,
    });
    return;
  }
});

/**
 * @route   PUT /api/v1/alerts/:id/read
 * @desc    Mark alert as read
 * @access  Private
 */
router.put("/:id/read", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const alert = await AlertsService.markAsRead(id);

    res.json({
      success: true,
      data: alert,
      message: "Alert marked as read",
    });
  } catch (error) {
    console.error("Error marking alert as read:", error);
    const message = error instanceof Error ? error.message : "Failed to mark alert as read";
    res.status(400).json({
      success: false,
      message,
    });
    return;
  }
});

/**
 * @route   PUT /api/v1/alerts/:id/dismiss
 * @desc    Dismiss alert
 * @access  Private
 */
router.put("/:id/dismiss", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const alert = await AlertsService.dismissAlert(id);

    res.json({
      success: true,
      data: alert,
      message: "Alert dismissed",
    });
  } catch (error) {
    console.error("Error dismissing alert:", error);
    const message = error instanceof Error ? error.message : "Failed to dismiss alert";
    res.status(400).json({
      success: false,
      message,
    });
    return;
  }
});

export default router;
