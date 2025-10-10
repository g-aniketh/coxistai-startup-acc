import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import { AnalyticsService } from '../services/analytics';
import { AlertsService } from '../services/alerts';
import { authenticateToken } from '../middleware/auth';

const router: IRouter = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/v1/analytics/calculate
 * @desc    Calculate metrics for current month
 * @access  Private
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const metrics = await AnalyticsService.calculateCurrentMonthMetrics(tenantId);

    // Generate alerts based on new metrics
    await AlertsService.generateAlerts(tenantId);

    res.json({
      success: true,
      data: metrics,
      message: 'Metrics calculated successfully',
    });
  } catch (error: any) {
    console.error('Error calculating metrics:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to calculate metrics',
    });
  }
});

/**
 * @route   GET /api/v1/analytics/latest
 * @desc    Get latest metrics
 * @access  Private
 */
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const metrics = await AnalyticsService.getLatestMetrics(tenantId);

    if (!metrics) {
      return res.status(404).json({
        success: false,
        message: 'No metrics available. Please calculate metrics first.',
      });
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch metrics',
    });
  }
});

/**
 * @route   GET /api/v1/analytics/history
 * @desc    Get metrics history
 * @access  Private
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const months = parseInt(req.query.months as string) || 12;

    const history = await AnalyticsService.getMetricsHistory(tenantId, months);

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Error fetching history:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch metrics history',
    });
  }
});

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get dashboard summary with metrics, trends, and recent activity
 * @access  Private
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const summary = await AnalyticsService.getDashboardSummary(tenantId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard data',
    });
  }
});

/**
 * @route   GET /api/v1/analytics/revenue-breakdown
 * @desc    Get revenue breakdown by source
 * @access  Private
 */
router.get('/revenue-breakdown', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    
    // Default to current month
    const now = new Date();
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate as string)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const breakdown = await AnalyticsService.getRevenueBreakdown(tenantId, startDate, endDate);

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error: any) {
    console.error('Error fetching revenue breakdown:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch revenue breakdown',
    });
  }
});

export default router;

