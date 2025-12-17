// STUB: Plaid service - not implemented yet
// This is a placeholder to prevent build errors

export class PlaidService {
  static async createLinkToken(userId: string, tenantId: string) {
    // Stub implementation
    return {
      link_token: `link_stub_${Date.now()}`,
      expiration: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    };
  }

  static async exchangePublicToken(
    publicToken: string,
    userId: string,
    tenantId: string
  ) {
    // Stub implementation
    return {
      access_token: `access_stub_${Date.now()}`,
      item_id: `item_stub_${Date.now()}`,
    };
  }

  static async getAccounts(accessToken: string) {
    // Stub implementation
    return {
      accounts: [
        {
          account_id: `acc_stub_${Date.now()}`,
          name: "Checking Account",
          type: "depository",
          subtype: "checking",
          balances: {
            available: 1000,
            current: 1000,
            iso_currency_code: "USD",
          },
        },
      ],
    };
  }

  static async getTransactions(
    accessToken: string,
    startDate?: string,
    endDate?: string
  ) {
    // Stub implementation
    return {
      transactions: [
        {
          transaction_id: `txn_stub_${Date.now()}`,
          account_id: `acc_stub_${Date.now()}`,
          amount: 100,
          date: new Date().toISOString().split("T")[0],
          name: "Sample Transaction",
          category: ["Transfer", "Deposit"],
          pending: false,
        },
      ],
    };
  }

  static async getPlaidItems(tenantId: string) {
    // Stub implementation
    return [];
  }

  static async removeItem(accessToken: string) {
    // Stub implementation
    return { removed: true };
  }

  static async deletePlaidItem(
    accessToken: string,
    userId: string,
    tenantId: string
  ) {
    // Stub implementation
    return { removed: true };
  }

  static async syncTransactions(itemId: string) {
    // Stub implementation
    return {
      added: [],
      modified: [],
      removed: [],
    };
  }
}
