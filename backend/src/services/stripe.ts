// STUB: Stripe service - not implemented yet
// This is a placeholder to prevent build errors

interface CustomerData {
  email: string;
  name?: string;
  [key: string]: string | undefined;
}

interface AccountUpdates {
  [key: string]: string | number | boolean | null | undefined;
}

export class StripeService {
  static async createAccount(
    tenantId: string,
    email: string,
    businessName: string
  ) {
    // Stub implementation
    return {
      id: `acct_stub_${Date.now()}`,
      email,
      businessName,
      status: "pending",
    };
  }

  static async getAccount(accountId: string) {
    // Stub implementation
    return {
      id: accountId,
      status: "pending",
      charges_enabled: false,
      payouts_enabled: false,
    };
  }

  static async createCustomer(accountId: string, customerData: CustomerData) {
    // Stub implementation
    return {
      id: `cus_stub_${Date.now()}`,
      email: customerData.email,
    };
  }

  static async createSubscription(
    accountId: string,
    customerId: string,
    priceId: string
  ) {
    // Stub implementation
    return {
      id: `sub_stub_${Date.now()}`,
      status: "active",
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
    };
  }

  static async createInvoice(
    accountId: string,
    customerId: string,
    amount: number
  ) {
    // Stub implementation
    return {
      id: `in_stub_${Date.now()}`,
      amount_due: amount,
      status: "paid",
    };
  }

  static async createPaymentIntent(
    accountId: string,
    amount: number,
    currency: string = "usd"
  ) {
    // Stub implementation
    return {
      id: `pi_stub_${Date.now()}`,
      amount,
      currency,
      status: "succeeded",
    };
  }

  static async getAccountBalance(accountId: string) {
    // Stub implementation
    return {
      available: [{ amount: 0, currency: "usd" }],
      pending: [{ amount: 0, currency: "usd" }],
    };
  }

  static async updateAccount(accountId: string, updates: AccountUpdates) {
    // Stub implementation
    return {
      id: accountId,
      ...updates,
    };
  }

  static async connectAccount(tenantId: string, apiKey: string) {
    // Stub implementation
    return {
      id: `acct_stub_${Date.now()}`,
      tenantId,
      status: "connected",
    };
  }

  static async getAccountForTenant(tenantId: string) {
    // Stub implementation
    return {
      id: `acct_stub_${Date.now()}`,
      tenantId,
      status: "active",
    };
  }

  static async fullSync(accountId: string) {
    // Stub implementation
    return Promise.resolve();
  }

  static async disconnectAccount(accountId: string) {
    // Stub implementation
    return { disconnected: true };
  }
}
