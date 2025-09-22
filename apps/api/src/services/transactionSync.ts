import * as cron from 'node-cron';
import { PlaidService } from './plaid';
import { prisma } from '../lib/prisma';

export class TransactionSyncService {
  private static isRunning = false;
  private static cronJob: cron.ScheduledTask | null = null;

  /**
   * Start the transaction sync service
   */
  static start() {
    if (this.isRunning) {
      console.log('Transaction sync service is already running');
      return;
    }

    const cronExpression = process.env.TRANSACTION_SYNC_INTERVAL || '0 */6 * * *'; // Every 6 hours by default

    this.cronJob = cron.schedule(cronExpression, async () => {
      console.log('Starting scheduled transaction sync...');
      await this.syncAllTransactions();
    }, {
      timezone: 'UTC',
    });

    this.cronJob.start();
    this.isRunning = true;

    console.log(`Transaction sync service started with schedule: ${cronExpression}`);
  }

  /**
   * Stop the transaction sync service
   */
  static stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('Transaction sync service stopped');
  }

  /**
   * Sync transactions for all active Plaid items
   */
  static async syncAllTransactions() {
    try {
      console.log('Starting transaction sync for all Plaid items...');

      // Get all Plaid items
      const plaidItems = await prisma.plaidItem.findMany({
        include: {
          tenant: true,
          user: true,
        },
      });

      console.log(`Found ${plaidItems.length} Plaid items to sync`);

      let successCount = 0;
      let errorCount = 0;

      for (const plaidItem of plaidItems) {
        try {
          console.log(`Syncing transactions for Plaid item: ${plaidItem.id} (${plaidItem.institutionName})`);

          // Sync transactions for the last 7 days to catch any missed transactions
          const endDate = new Date();
          const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

          const result = await PlaidService.syncTransactions(
            plaidItem.id,
            startDate,
            endDate
          );

          if (result.success) {
            console.log(`✅ Synced ${result.data.syncedCount} transactions for ${plaidItem.institutionName}`);
            successCount++;
          } else {
            console.error(`❌ Failed to sync transactions for ${plaidItem.institutionName}`);
            errorCount++;
          }
        } catch (error) {
          console.error(`❌ Error syncing transactions for Plaid item ${plaidItem.id}:`, error);
          errorCount++;
        }
      }

      console.log(`Transaction sync completed. Success: ${successCount}, Errors: ${errorCount}`);
    } catch (error) {
      console.error('Error in transaction sync service:', error);
    }
  }

  /**
   * Sync transactions for a specific Plaid item
   */
  static async syncPlaidItem(plaidItemId: string) {
    try {
      console.log(`Manually syncing transactions for Plaid item: ${plaidItemId}`);

      const plaidItem = await prisma.plaidItem.findUnique({
        where: { id: plaidItemId },
        include: {
          tenant: true,
          user: true,
        },
      });

      if (!plaidItem) {
        throw new Error('Plaid item not found');
      }

      const result = await PlaidService.syncTransactions(plaidItemId);
      
      if (result.success) {
        console.log(`✅ Manually synced ${result.data.syncedCount} transactions for ${plaidItem.institutionName}`);
      }

      return result;
    } catch (error) {
      console.error(`Error manually syncing Plaid item ${plaidItemId}:`, error);
      throw error;
    }
  }

  /**
   * Get sync status and statistics
   */
  static async getSyncStatus() {
    try {
      const plaidItems = await prisma.plaidItem.findMany({
        include: {
          accounts: {
            include: {
              transactions: {
                orderBy: { date: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      const totalItems = plaidItems.length;
      const totalAccounts = plaidItems.reduce((sum, item) => sum + item.accounts.length, 0);
      const totalTransactions = await prisma.transaction.count();

      const lastSyncTimes = plaidItems.map(item => {
        const lastTransaction = item.accounts
          .flatMap(acc => acc.transactions)
          .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

        return {
          plaidItemId: item.id,
          institutionName: item.institutionName,
          lastTransactionDate: lastTransaction?.date || null,
          accountCount: item.accounts.length,
        };
      });

      return {
        isRunning: this.isRunning,
        totalItems,
        totalAccounts,
        totalTransactions,
        lastSyncTimes,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  }

  /**
   * Force sync all transactions (useful for testing or manual triggers)
   */
  static async forceSyncAll() {
    console.log('Force syncing all transactions...');
    await this.syncAllTransactions();
  }
}
