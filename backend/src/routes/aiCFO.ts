import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import { AICFOService } from '../services/aiCFO';
import { authenticateToken } from '../middleware/auth';

const router: IRouter = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/v1/ai-cfo/forecast
 * @desc    Generate AI-powered forecast
 * @access  Private
 */
router.post('/forecast', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { months = 12 } = req.body;

    const forecast = await AICFOService.generateForecast(tenantId, months);

    res.json({
      success: true,
      data: forecast,
      message: 'Forecast generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating forecast:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate forecast',
    });
  }
});

/**
 * @route   POST /api/v1/ai-cfo/scenario
 * @desc    Run "What If" scenario analysis
 * @access  Private
 */
router.post('/scenario', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { name, inputs } = req.body;

    if (!name || !inputs) {
      return res.status(400).json({
        success: false,
        message: 'Scenario name and inputs are required',
      });
    }

    const result = await AICFOService.runScenario(tenantId, name, inputs);

    res.json({
      success: true,
      data: result,
      message: 'Scenario analysis completed',
    });
  } catch (error: any) {
    console.error('Error running scenario:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to run scenario',
    });
  }
});

/**
 * @route   GET /api/v1/ai-cfo/scenarios
 * @desc    Get all scenarios
 * @access  Private
 */
router.get('/scenarios', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const scenarios = await AICFOService.getScenarios(tenantId);

    res.json({
      success: true,
      data: scenarios,
    });
  } catch (error: any) {
    console.error('Error fetching scenarios:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch scenarios',
    });
  }
});

/**
 * @route   GET /api/v1/ai-cfo/insights
 * @desc    Get AI-powered insights for current financial state
 * @access  Private
 */
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const insights = await AICFOService.getInsights(tenantId);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    console.error('Error getting insights:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get insights',
    });
  }
});

/**
 * @route   POST /api/v1/ai-cfo/investor-update
 * @desc    Generate investor update
 * @access  Private
 */
router.post('/investor-update', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const { periodStart, periodEnd } = req.body;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({
        success: false,
        message: 'Period start and end dates are required',
      });
    }

    const update = await AICFOService.generateInvestorUpdate(
      tenantId,
      new Date(periodStart),
      new Date(periodEnd)
    );

    res.json({
      success: true,
      data: update,
      message: 'Investor update generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating investor update:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate investor update',
    });
  }
});

/**
 * @route   GET /api/v1/ai-cfo/investor-updates
 * @desc    Get all investor updates
 * @access  Private
 */
router.get('/investor-updates', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const updates = await AICFOService.getInvestorUpdates(tenantId);

    res.json({
      success: true,
      data: updates,
    });
  } catch (error: any) {
    console.error('Error fetching investor updates:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch investor updates',
    });
  }
});

/**
 * @route   PUT /api/v1/ai-cfo/investor-update/:id/publish
 * @desc    Publish investor update
 * @access  Private
 */
router.put('/investor-update/:id/publish', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const update = await AICFOService.publishInvestorUpdate(id);

    res.json({
      success: true,
      data: update,
      message: 'Investor update published successfully',
    });
  } catch (error: any) {
    console.error('Error publishing investor update:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to publish investor update',
    });
  }
});

export default router;

