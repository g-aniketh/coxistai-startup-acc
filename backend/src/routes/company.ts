import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getCompanyProfile, upsertCompanyProfile } from '../services/companyProfile';
import { getCompanyFiscal, upsertCompanyFiscal } from '../services/companyFiscal';
import { getCompanySecurity, upsertCompanySecurity } from '../services/companySecurity';
import { getCompanyCurrency, upsertCompanyCurrency } from '../services/companyCurrency';

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

router.get('/fiscal', authenticateToken, async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;

    if (!startupId) {
      return res.status(400).json({
        success: false,
        message: 'Startup context is required',
      });
    }

    const fiscalConfig = await getCompanyFiscal(startupId);

    return res.json({
      success: true,
      data: fiscalConfig,
    });
  } catch (error) {
    console.error('Get fiscal configuration error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch fiscal configuration',
    });
  }
});

router.put('/fiscal', authenticateToken, async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;

    if (!startupId) {
      return res.status(400).json({
        success: false,
        message: 'Startup context is required',
      });
    }

    const fiscalConfig = await upsertCompanyFiscal(startupId, req.body);

    return res.json({
      success: true,
      data: fiscalConfig,
      message: 'Fiscal configuration updated successfully',
    });
  } catch (error) {
    console.error('Update fiscal configuration error:', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update fiscal configuration',
    });
  }
});

router.get('/security', authenticateToken, async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;

    if (!startupId) {
      return res.status(400).json({
        success: false,
        message: 'Startup context is required',
      });
    }

    const securityConfig = await getCompanySecurity(startupId);

    return res.json({
      success: true,
      data: securityConfig ? {
        id: securityConfig.id,
        tallyVaultEnabled: securityConfig.tallyVaultEnabled,
        userAccessControlEnabled: securityConfig.userAccessControlEnabled,
        multiFactorRequired: securityConfig.multiFactorRequired,
        tallyVaultPasswordHint: securityConfig.tallyVaultPasswordHint,
        createdAt: securityConfig.createdAt,
        updatedAt: securityConfig.updatedAt,
      } : null,
    });
  } catch (error) {
    console.error('Get security configuration error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch security configuration',
    });
  }
});

router.put('/security', authenticateToken, async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;

    if (!startupId) {
      return res.status(400).json({
        success: false,
        message: 'Startup context is required',
      });
    }

    const securityConfig = await upsertCompanySecurity(startupId, req.body);

    return res.json({
      success: true,
      data: {
        id: securityConfig.id,
        tallyVaultEnabled: securityConfig.tallyVaultEnabled,
        userAccessControlEnabled: securityConfig.userAccessControlEnabled,
        multiFactorRequired: securityConfig.multiFactorRequired,
        tallyVaultPasswordHint: securityConfig.tallyVaultPasswordHint,
        createdAt: securityConfig.createdAt,
        updatedAt: securityConfig.updatedAt,
      },
      message: 'Security configuration updated successfully',
    });
  } catch (error) {
    console.error('Update security configuration error:', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update security configuration',
    });
  }
});

router.get('/currency', authenticateToken, async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;

    if (!startupId) {
      return res.status(400).json({
        success: false,
        message: 'Startup context is required',
      });
    }

    const currencyConfig = await getCompanyCurrency(startupId);

    return res.json({
      success: true,
      data: currencyConfig,
    });
  } catch (error) {
    console.error('Get currency configuration error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch currency configuration',
    });
  }
});

router.put('/currency', authenticateToken, async (req: Request, res: Response) => {
  try {
    const startupId = req.user?.startupId;

    if (!startupId) {
      return res.status(400).json({
        success: false,
        message: 'Startup context is required',
      });
    }

    const currencyConfig = await upsertCompanyCurrency(startupId, req.body);

    return res.json({
      success: true,
      data: currencyConfig,
      message: 'Currency configuration updated successfully',
    });
  } catch (error) {
    console.error('Update currency configuration error:', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update currency configuration',
    });
  }
});

export default router;
