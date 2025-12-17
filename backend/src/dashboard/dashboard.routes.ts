import { Router } from "express";
import { authenticateToken, checkPermission } from "../middleware/auth";
import {
  getDashboardSummaryController,
  getCashflowChartController,
  getRecentActivityController,
} from "./dashboard.controller";

const router = Router();

// Get dashboard summary with key metrics
router.get(
  "/summary",
  authenticateToken,
  checkPermission({ action: "read", subject: "cashflow_dashboard" }),
  getDashboardSummaryController
);

// Get cashflow chart data
router.get(
  "/cashflow-chart",
  authenticateToken,
  checkPermission({ action: "read", subject: "cashflow_dashboard" }),
  getCashflowChartController
);

// Get recent activity feed
router.get(
  "/recent-activity",
  authenticateToken,
  checkPermission({ action: "read", subject: "cashflow_dashboard" }),
  getRecentActivityController
);

export default router;
