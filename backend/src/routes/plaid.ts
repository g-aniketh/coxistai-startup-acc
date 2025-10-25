import { Router, Request, Response } from 'express';
import { PlaidService } from '../services/plaid';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../lib/prisma';

const plaidRoutes: Router = Router();

// Create link token
plaidRoutes.post('/create-link-token', async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const linkToken = await PlaidService.createLinkToken(req.user.userId, req.user.startupId);

    return res.json({
      success: true,
      data: {
        linkToken,
      },
    });
  } catch (error) {
    console.error('Error creating link token:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create link token',
    });
  }
});

// Exchange public token for access token
plaidRoutes.post('/exchange-public-token', async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { publicToken } = req.body;

    if (!publicToken) {
      return res.status(400).json({
        success: false,
        error: 'Public token is required',
      });
    }

    const result = await PlaidService.exchangePublicToken(
      publicToken,
      req.user.userId,
      req.user.startupId
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to exchange public token',
    });
  }
});

// Get all Plaid items for the tenant
plaidRoutes.get('/items', async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const plaidItems = await PlaidService.getPlaidItems(req.user.startupId);

    return res.json({
      success: true,
      data: plaidItems,
    });
  } catch (error) {
    console.error('Error fetching Plaid items:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Plaid items',
    });
  }
});

// Sync transactions for a specific Plaid item
plaidRoutes.post('/sync-transactions/:plaidItemId', async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { plaidItemId } = req.params;
    const { startDate, endDate } = req.body;

    // Verify the Plaid item belongs to the user's tenant
    // TODO: Implement plaidItem model
    const plaidItem = null;

    if (!plaidItem) {
      return res.status(404).json({
        success: false,
        error: 'Plaid item not found or access denied',
      });
    }

    const result = await PlaidService.syncTransactions(plaidItemId);

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync transactions',
    });
  }
});

// Delete a Plaid item
plaidRoutes.delete('/items/:plaidItemId', async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { plaidItemId } = req.params;

    const result = await PlaidService.deletePlaidItem(
      plaidItemId,
      req.user.userId,
      req.user.startupId
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error deleting Plaid item:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete Plaid item',
    });
  }
});

// Webhook endpoint for Plaid updates
plaidRoutes.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { webhook_type, item_id, error } = req.body;

    console.log('Plaid webhook received:', { webhook_type, item_id, error });

    if (error) {
      console.error('Plaid webhook error:', error);
      return res.status(400).json({ error: 'Webhook error' });
    }

    // Handle different webhook types
    switch (webhook_type) {
      case 'TRANSACTIONS':
        // Sync transactions for the item
        // TODO: Implement plaidItem model
        const plaidItem = null;

        if (plaidItem) {
          await PlaidService.syncTransactions(plaidItem.id);
          console.log(`Synced transactions for item: ${item_id}`);
        }
        break;

      case 'ITEM':
        // Handle item updates
        console.log(`Item update received for: ${item_id}`);
        break;

      default:
        console.log(`Unhandled webhook type: ${webhook_type}`);
    }

    return res.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default plaidRoutes;
