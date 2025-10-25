import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as dashboardService from './dashboard.service';

export const getDashboardSummaryController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startupId } = req.user!;

    const summary = await dashboardService.getDashboardSummary(startupId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

export const getCashflowChartController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startupId } = req.user!;
    const { months } = req.query;

    const monthsParam = months ? parseInt(months as string, 10) : 6;

    const chartData = await dashboardService.getCashflowChart(startupId, monthsParam);

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Get cashflow chart error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

export const getRecentActivityController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startupId } = req.user!;
    const { limit } = req.query;

    const limitParam = limit ? parseInt(limit as string, 10) : 10;

    const activities = await dashboardService.getRecentActivity(startupId, limitParam);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

