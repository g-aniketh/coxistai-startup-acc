import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getCompanyProfile, upsertCompanyProfile } from '../services/companyProfile';

const router = Router();

router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;

    if (!startupId) {
      return res.status(400).json({
        success: false,
        message: 'Startup context is required',
      });
    }

    const profile = await getCompanyProfile(startupId);

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Get company profile error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch company profile',
    });
  }
});

router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;

    if (!startupId) {
      return res.status(400).json({
        success: false,
        message: 'Startup context is required',
      });
    }

    const profile = await upsertCompanyProfile(startupId, req.body);

    return res.json({
      success: true,
      data: profile,
      message: 'Company profile updated successfully',
    });
  } catch (error) {
    console.error('Update company profile error:', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update company profile',
    });
  }
});

export default router;
