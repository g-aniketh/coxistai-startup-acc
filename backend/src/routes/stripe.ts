import { Router, Request, Response } from "express";
import type { Router as IRouter } from "express";
import { StripeService } from "../services/stripe";
import { authenticateToken } from "../middleware/auth";

const router: IRouter = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/v1/stripe/connect
 * @desc    Connect a Stripe account
 * @access  Private
 */
router.post("/connect", async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    const tenantId = (req as any).user.tenantId;

    const account = await StripeService.connectAccount(tenantId, apiKey);

    res.json({
      success: true,
      data: account,
      message: "Stripe account connected successfully",
    });
  } catch (error: any) {
    console.error("Error connecting Stripe:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to connect Stripe account",
    });
  }
});

/**
 * @route   POST /api/v1/stripe/sync
 * @desc    Sync all Stripe data
 * @access  Private
 */
router.post("/sync", async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).user.tenantId;

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
  } catch (error: any) {
    console.error("Error syncing Stripe:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to sync Stripe data",
    });
  }
});

/**
 * @route   GET /api/v1/stripe/account
 * @desc    Get connected Stripe account
 * @access  Private
 */
router.get("/account", async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).user.tenantId;

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
  } catch (error: any) {
    console.error("Error fetching Stripe account:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch Stripe account",
    });
  }
});

/**
 * @route   DELETE /api/v1/stripe/disconnect
 * @desc    Disconnect Stripe account
 * @access  Private
 */
router.delete(
  "/disconnect",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;

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
    } catch (error: any) {
      console.error("Error disconnecting Stripe:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to disconnect Stripe account",
      });
    }
  }
);

export default router;
