import { Router, Response } from "express";
import type { Router as IRouter } from "express";
import { StripeService } from "../services/stripe";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/v1/stripe/connect
 * @desc    Connect a Stripe account
 * @access  Private
 */
router.post("/connect", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { apiKey } = req.body;
    const tenantId = req.user?.startupId;
    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const account = await StripeService.connectAccount(tenantId, apiKey);

    res.json({
      success: true,
      data: account,
      message: "Stripe account connected successfully",
    });
    return;
  } catch (error) {
    console.error("Error connecting Stripe:", error);
    const message = error instanceof Error ? error.message : "Failed to connect Stripe account";
    res.status(400).json({
      success: false,
      message,
    });
  }
});

/**
 * @route   POST /api/v1/stripe/sync
 * @desc    Sync all Stripe data
 * @access  Private
 */
router.post("/sync", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.startupId;
    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const account = await StripeService.getAccountForTenant(tenantId);
    if (!account) {
      res.status(404).json({
        success: false,
        message: "No Stripe account connected",
      });
      return;
    }

    // Start sync in background
    StripeService.fullSync(account.id).catch((error) => {
      console.error("Background sync error:", error);
    });

    res.json({
      success: true,
      message: "Stripe sync started. This may take a few minutes.",
    });
  } catch (error) {
    console.error("Error syncing Stripe:", error);
    const message = error instanceof Error ? error.message : "Failed to sync Stripe data";
    res.status(400).json({
      success: false,
      message,
    });
    return;
  }
});

/**
 * @route   GET /api/v1/stripe/account
 * @desc    Get connected Stripe account
 * @access  Private
 */
router.get("/account", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.startupId;
    if (!tenantId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const account = await StripeService.getAccountForTenant(tenantId);

    if (!account) {
      res.status(404).json({
        success: false,
        message: "No Stripe account connected",
      });
      return;
    }

    // Remove sensitive data
    const safeAccount = {
      id: account.id,
      stripeAccountId: account.id,
      email: "stub@example.com",
      businessName: "Stub Business",
      country: "US",
      currency: "USD",
      accountType: "express",
      isActive: account.status === "active",
      createdAt: new Date(),
    };

    res.json({
      success: true,
      data: safeAccount,
    });
  } catch (error) {
    console.error("Error fetching Stripe account:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch Stripe account";
    res.status(400).json({
      success: false,
      message,
    });
    return;
  }
});

/**
 * @route   DELETE /api/v1/stripe/disconnect
 * @desc    Disconnect Stripe account
 * @access  Private
 */
router.delete(
  "/disconnect",
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

      const account = await StripeService.getAccountForTenant(tenantId);
      if (!account) {
        res.status(404).json({
          success: false,
          message: "No Stripe account connected",
        });
        return;
      }

      await StripeService.disconnectAccount(account.id);

      res.json({
        success: true,
        message: "Stripe account disconnected successfully",
      });
    } catch (error) {
      console.error("Error disconnecting Stripe:", error);
      const message = error instanceof Error ? error.message : "Failed to disconnect Stripe account";
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }
  }
);

export default router;
