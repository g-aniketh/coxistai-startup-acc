import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as aiService from './ai.service';

export const getFinancialInsightsController = async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user;

    const insights = await aiService.getFinancialInsights(startupId);

    res.json({
      success: true,
      data: insights,
      message: 'AI insights generated successfully'
    });
  } catch (error) {
    console.error('Get financial insights error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

export const runWhatIfScenarioController = async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user;
    const { scenario } = req.body;

    if (!scenario || typeof scenario !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Scenario description is required'
      });
    }

    if (scenario.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Scenario description must be at least 10 characters'
      });
    }

    const result = await aiService.runWhatIfScenario(startupId, scenario);

    res.json({
      success: true,
      data: result,
      message: 'Scenario analysis completed'
    });
  } catch (error) {
    console.error('Run what-if scenario error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

export const generateInvestorUpdateController = async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user;
    const { periodStart, periodEnd } = req.body;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({
        success: false,
        message: 'periodStart and periodEnd are required'
      });
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'periodStart must be before periodEnd'
      });
    }

    const update = await aiService.generateInvestorUpdate(startupId, startDate, endDate);

    res.json({
      success: true,
      data: update,
      message: 'Investor update generated successfully'
    });
  } catch (error) {
    console.error('Generate investor update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

