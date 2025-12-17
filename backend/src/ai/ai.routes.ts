import { Router } from "express";
import { authenticateToken, checkPermission } from "../middleware/auth";
import {
  getFinancialInsightsController,
  runWhatIfScenarioController,
  generateInvestorUpdateController,
} from "./ai.controller";

const router = Router();

// Get AI-powered financial insights
router.post(
  "/insights",
  authenticateToken,
  checkPermission({ action: "read", subject: "analytics" }),
  getFinancialInsightsController
);

// Run what-if scenario analysis
router.post(
  "/scenarios",
  authenticateToken,
  checkPermission({ action: "use", subject: "what_if_scenarios" }),
  runWhatIfScenarioController
);

// Generate investor update with AI
router.post(
  "/investor-update",
  authenticateToken,
  checkPermission({ action: "manage", subject: "investor_updates" }),
  generateInvestorUpdateController
);

export default router;
