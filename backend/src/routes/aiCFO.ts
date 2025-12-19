import { Router, Response } from "express";
import type { Router as IRouter } from "express";
import { AICFOService } from "../services/aiCFO";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/v1/ai-cfo/forecast
 * @desc    Generate AI-powered forecast
 * @access  Private
 */
router.post("/forecast", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.startupId;
    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }
    const { months = 12 } = req.body;

    const forecast = await AICFOService.generateForecast(tenantId, months);

    res.json({
      success: true,
      data: forecast,
      message: "Forecast generated successfully",
    });
    return;
  } catch (error) {
    console.error("Error generating forecast:", error);
    const message = error instanceof Error ? error.message : "Failed to generate forecast";
    res.status(400).json({
      success: false,
      message,
    });
  }
});

/**
 * @route   POST /api/v1/ai-cfo/scenario
 * @desc    Run "What If" scenario analysis
 * @access  Private
 */
router.post("/scenario", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.startupId;
    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }
    const { name, inputs } = req.body;

    if (!name || !inputs) {
      res.status(400).json({
        success: false,
        message: "Scenario name and inputs are required",
      });
      return;
    }

    const result = await AICFOService.runScenario(tenantId, name, inputs);

    res.json({
      success: true,
      data: result,
      message: "Scenario analysis completed",
    });
  } catch (error) {
    console.error("Error running scenario:", error);
    const message = error instanceof Error ? error.message : "Failed to run scenario";
    res.status(400).json({
      success: false,
      message,
    });
    return;
  }
});

/**
 * @route   GET /api/v1/ai-cfo/scenarios
 * @desc    Get all scenarios
 * @access  Private
 */
router.get("/scenarios", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.startupId;
    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const scenarios = await AICFOService.getScenarios(tenantId);

    res.json({
      success: true,
      data: scenarios,
    });
    return;
  } catch (error) {
    console.error("Error fetching scenarios:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch scenarios";
    res.status(400).json({
      success: false,
      message,
    });
    return;
  }
});

/**
 * @route   GET /api/v1/ai-cfo/insights
 * @desc    Get AI-powered insights for current financial state
 * @access  Private
 */
router.get("/insights", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.startupId;
    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const insights = await AICFOService.getInsights(tenantId);

    res.json({
      success: true,
      data: insights,
    });
    return;
  } catch (error) {
    console.error("Error getting insights:", error);
    const message = error instanceof Error ? error.message : "Failed to get insights";
    res.status(400).json({
      success: false,
      message,
    });
    return;
  }
});

/**
 * @route   POST /api/v1/ai-cfo/investor-update
 * @desc    Generate investor update
 * @access  Private
 */
router.post(
  "/investor-update",
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
      const { periodStart, periodEnd } = req.body;

      if (!periodStart || !periodEnd) {
        res.status(400).json({
          success: false,
          message: "Period start and end dates are required",
        });
        return;
      }

      const update = await AICFOService.generateInvestorUpdate(
        tenantId,
        new Date(periodStart),
        new Date(periodEnd)
      );

      res.json({
        success: true,
        data: update,
        message: "Investor update generated successfully",
      });
    } catch (error) {
      console.error("Error generating investor update:", error);
      const message = error instanceof Error ? error.message : "Failed to generate investor update";
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }
  }
);

/**
 * @route   GET /api/v1/ai-cfo/investor-updates
 * @desc    Get all investor updates
 * @access  Private
 */
router.get("/investor-updates", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.startupId;
    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const updates = await AICFOService.getInvestorUpdates(tenantId);

    res.json({
      success: true,
      data: updates,
    });
    return;
  } catch (error) {
    console.error("Error fetching investor updates:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch investor updates";
    res.status(400).json({
      success: false,
      message,
    });
    return;
  }
});

/**
 * @route   PUT /api/v1/ai-cfo/investor-update/:id/publish
 * @desc    Publish investor update
 * @access  Private
 */
router.put(
  "/investor-update/:id/publish",
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const update = await AICFOService.publishInvestorUpdate(id);

      res.json({
        success: true,
        data: update,
        message: "Investor update published successfully",
      });
    } catch (error) {
      console.error("Error publishing investor update:", error);
      const message = error instanceof Error ? error.message : "Failed to publish investor update";
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }
  }
);

/**
 * @route   POST /api/v1/ai-cfo/chat
 * @desc    Chat with AI CFO using financial context
 * @access  Private
 */
router.post("/chat", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }
    const { message } = req.body;

    if (!message) {
      res.status(400).json({
        success: false,
        message: "Message is required",
      });
      return;
    }

    const response = await AICFOService.chat(startupId, message);

    res.json({
      success: true,
      data: { response },
      message: "Chat response generated successfully",
    });
  } catch (error) {
    console.error("Error in chat:", error);
    const message = error instanceof Error ? error.message : "Failed to generate chat response";
    res.status(400).json({
      success: false,
      message,
    });
    return;
  }
});

export default router;
