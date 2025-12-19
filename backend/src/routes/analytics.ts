import { Router, Response } from "express";
import type { Router as IRouter } from "express";
import { AnalyticsService } from "../services/analytics";
import { AlertsService } from "../services/alerts";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/v1/analytics/calculate
 * @desc    Calculate metrics for current month
 * @access  Private
 */
router.post(
  "/calculate",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user?.startupId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const metrics =
        await AnalyticsService.calculateCurrentMonthMetrics(tenantId);

      // Generate alerts based on new metrics
      await AlertsService.generateAlerts(tenantId);

      res.json({
        success: true,
        data: metrics,
        message: "Metrics calculated successfully",
      });
      return;
    } catch (error) {
      console.error("Error calculating metrics:", error);
      const message =
        error instanceof Error ? error.message : "Failed to calculate metrics";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }
);

/**
 * @route   GET /api/v1/analytics/latest
 * @desc    Get latest metrics
 * @access  Private
 */
router.get(
  "/latest",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user?.startupId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const metrics = await AnalyticsService.getLatestMetrics(tenantId);

      if (!metrics) {
        res.status(404).json({
          success: false,
          message: "No metrics available. Please calculate metrics first.",
        });
        return;
      }

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      const message =
        error instanceof Error ? error.message : "Failed to fetch metrics";
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }
  }
);

/**
 * @route   GET /api/v1/analytics/history
 * @desc    Get metrics history
 * @access  Private
 */
router.get(
  "/history",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user?.startupId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }
      const months = parseInt(req.query.months as string) || 12;

      const history = await AnalyticsService.getMetricsHistory(
        tenantId,
        months
      );

      res.json({
        success: true,
        data: history,
      });
      return;
    } catch (error) {
      console.error("Error fetching history:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch metrics history";
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }
  }
);

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get dashboard summary with metrics, trends, and recent activity
 * @access  Private
 */
router.get(
  "/dashboard",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user?.startupId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const summary = await AnalyticsService.getDashboardSummary(tenantId);

      res.json({
        success: true,
        data: summary,
      });
      return;
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard data";
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }
  }
);

/**
 * @route   GET /api/v1/analytics/revenue-breakdown
 * @desc    Get revenue breakdown by source
 * @access  Private
 */
router.get(
  "/revenue-breakdown",
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user?.startupId;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      // Default to current month
      const now = new Date();
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const breakdown = await AnalyticsService.getRevenueBreakdown(
        tenantId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: breakdown,
      });
      return;
    } catch (error) {
      console.error("Error fetching revenue breakdown:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch revenue breakdown";
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }
  }
);

export default router;
