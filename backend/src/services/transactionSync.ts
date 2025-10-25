// STUB: Transaction sync service - not implemented yet
// This is a placeholder to prevent build errors

export class TransactionSyncService {
  private static isRunning = false;
  private static syncInterval: NodeJS.Timeout | null = null;

  static start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔄 Transaction sync service started (stub mode)');
    
    // Stub: No actual syncing, just log periodically
    this.syncInterval = setInterval(() => {
      console.log('📊 Transaction sync check (stub mode)');
    }, 300000); // 5 minutes
  }

  static stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('⏹️ Transaction sync service stopped');
  }

  static async syncAllItems() {
    // Stub implementation
    console.log('🔄 Syncing all items (stub mode)');
    return {
      itemsSynced: 0,
      transactionsAdded: 0,
      transactionsModified: 0,
      errors: []
    };
  }

  static async syncItem(itemId: string) {
    // Stub implementation
    console.log(`🔄 Syncing item ${itemId} (stub mode)`);
    return {
      added: [],
      modified: [],
      removed: []
    };
  }

  static async getStats() {
    // Stub implementation
    return {
      totalItems: 0,
      totalAccounts: 0,
      lastSyncTime: new Date(),
      isHealthy: true
    };
  }
}