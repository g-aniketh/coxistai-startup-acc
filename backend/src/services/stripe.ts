import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const ENCRYPTION_KEY = process.env.PLAID_ENCRYPTION_KEY!;

// Encrypt sensitive data
function encrypt(text: string): Buffer {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return Buffer.from(iv.toString('hex') + ':' + encrypted, 'utf8');
}

// Decrypt sensitive data
function decrypt(buffer: Buffer): string {
  const text = buffer.toString('utf8');
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class StripeService {
  /**
   * Connect a Stripe account for a tenant
   */
  static async connectAccount(tenantId: string, apiKey?: string): Promise<any> {
    try {
      // If custom API key is provided, use it to fetch account details
      const stripe = apiKey ? new Stripe(apiKey, { apiVersion: '2025-09-30.clover' }) : stripeClient;
      
      const account = await stripe.accounts.retrieve();
      
      // Store the account
      const stripeAccount = await prisma.stripeAccount.upsert({
        where: { stripeAccountId: account.id },
        update: {
          email: account.email || undefined,
          businessName: account.business_profile?.name || undefined,
          country: account.country || undefined,
          currency: account.default_currency || undefined,
          isActive: true,
          accessTokenEncrypted: apiKey ? encrypt(apiKey) : undefined,
        },
        create: {
          tenantId,
          stripeAccountId: account.id,
          email: account.email || undefined,
          businessName: account.business_profile?.name || undefined,
          country: account.country || undefined,
          currency: account.default_currency || undefined,
          accountType: account.type || 'standard',
          accessTokenEncrypted: apiKey ? encrypt(apiKey) : undefined,
        },
      });

      return stripeAccount;
    } catch (error: any) {
      console.error('Error connecting Stripe account:', error);
      throw new Error(`Failed to connect Stripe account: ${error.message}`);
    }
  }

  /**
   * Sync customers from Stripe
   */
  static async syncCustomers(stripeAccountId: string): Promise<void> {
    try {
      const account = await prisma.stripeAccount.findUnique({
        where: { id: stripeAccountId },
      });

      if (!account) {
        throw new Error('Stripe account not found');
      }

      const stripe = account.accessTokenEncrypted 
        ? new Stripe(decrypt(account.accessTokenEncrypted as any), { apiVersion: '2025-09-30.clover' })
        : stripeClient;

      // Fetch all customers
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const customers = await stripe.customers.list({
          limit: 100,
          starting_after: startingAfter,
        });

        for (const customer of customers.data) {
          await prisma.stripeCustomer.upsert({
            where: { stripeCustomerId: customer.id },
            update: {
              email: customer.email || undefined,
              name: customer.name || undefined,
              description: customer.description || undefined,
              metadata: customer.metadata,
            },
            create: {
              stripeAccountId: account.id,
              stripeCustomerId: customer.id,
              email: customer.email || undefined,
              name: customer.name || undefined,
              description: customer.description || undefined,
              metadata: customer.metadata,
            },
          });
        }

        hasMore = customers.has_more;
        if (hasMore && customers.data.length > 0) {
          startingAfter = customers.data[customers.data.length - 1].id;
        }
      }

      console.log(`Synced customers for Stripe account ${account.stripeAccountId}`);
    } catch (error: any) {
      console.error('Error syncing customers:', error);
      throw new Error(`Failed to sync customers: ${error.message}`);
    }
  }

  /**
   * Sync subscriptions from Stripe
   */
  static async syncSubscriptions(stripeAccountId: string): Promise<void> {
    try {
      const account = await prisma.stripeAccount.findUnique({
        where: { id: stripeAccountId },
      });

      if (!account) {
        throw new Error('Stripe account not found');
      }

      const stripe = account.accessTokenEncrypted 
        ? new Stripe(decrypt(account.accessTokenEncrypted as any), { apiVersion: '2025-09-30.clover' })
        : stripeClient;

      // Fetch all subscriptions
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const subscriptions = await stripe.subscriptions.list({
          limit: 100,
          starting_after: startingAfter,
        });

        for (const subscription of subscriptions.data) {
          // Ensure customer exists
          const customer = await prisma.stripeCustomer.findUnique({
            where: { stripeCustomerId: subscription.customer as string },
          });

          if (!customer) continue;

          await prisma.stripeSubscription.upsert({
            where: { stripeSubscriptionId: subscription.id },
            update: {
              status: subscription.status,
              currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
              canceledAt: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000) : null,
              planName: subscription.items.data[0]?.price.nickname || 'Unknown Plan',
              planAmount: subscription.items.data[0]?.price.unit_amount || 0,
              planInterval: subscription.items.data[0]?.price.recurring?.interval || 'month',
              quantity: subscription.items.data[0]?.quantity || 1,
              metadata: subscription.metadata as any,
            },
            create: {
              stripeAccountId: account.id,
              stripeCustomerId: customer.id,
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
              canceledAt: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000) : null,
              planName: subscription.items.data[0]?.price.nickname || 'Unknown Plan',
              planAmount: subscription.items.data[0]?.price.unit_amount || 0,
              planInterval: subscription.items.data[0]?.price.recurring?.interval || 'month',
              quantity: subscription.items.data[0]?.quantity || 1,
              metadata: subscription.metadata as any,
            },
          });
        }

        hasMore = subscriptions.has_more;
        if (hasMore && subscriptions.data.length > 0) {
          startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
        }
      }

      console.log(`Synced subscriptions for Stripe account ${account.stripeAccountId}`);
    } catch (error: any) {
      console.error('Error syncing subscriptions:', error);
      throw new Error(`Failed to sync subscriptions: ${error.message}`);
    }
  }

  /**
   * Sync invoices from Stripe
   */
  static async syncInvoices(stripeAccountId: string): Promise<void> {
    try {
      const account = await prisma.stripeAccount.findUnique({
        where: { id: stripeAccountId },
      });

      if (!account) {
        throw new Error('Stripe account not found');
      }

      const stripe = account.accessTokenEncrypted 
        ? new Stripe(decrypt(account.accessTokenEncrypted as any), { apiVersion: '2025-09-30.clover' })
        : stripeClient;

      // Fetch invoices from the last 12 months
      const twelveMonthsAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const invoices = await stripe.invoices.list({
          limit: 100,
          created: { gte: twelveMonthsAgo },
          starting_after: startingAfter,
        });

        for (const invoice of invoices.data) {
          if (!invoice.customer) continue;

          const customer = await prisma.stripeCustomer.findUnique({
            where: { stripeCustomerId: invoice.customer as string },
          });

          if (!customer) continue;

          await prisma.stripeInvoice.upsert({
            where: { stripeInvoiceId: invoice.id },
            update: {
              status: invoice.status || 'draft',
              amountDue: invoice.amount_due || 0,
              amountPaid: invoice.amount_paid || 0,
              amountRemaining: invoice.amount_remaining || 0,
              currency: invoice.currency,
              dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
              paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
              periodStart: new Date(invoice.period_start * 1000),
              periodEnd: new Date(invoice.period_end * 1000),
              metadata: invoice.metadata ? (invoice.metadata as any) : {},
            },
            create: {
              stripeAccountId: account.id,
              stripeCustomerId: customer.id,
              stripeInvoiceId: invoice.id,
              status: invoice.status || 'draft',
              amountDue: invoice.amount_due || 0,
              amountPaid: invoice.amount_paid || 0,
              amountRemaining: invoice.amount_remaining || 0,
              currency: invoice.currency,
              dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
              paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
              periodStart: new Date(invoice.period_start * 1000),
              periodEnd: new Date(invoice.period_end * 1000),
              metadata: invoice.metadata ? (invoice.metadata as any) : {},
            },
          });
        }

        hasMore = invoices.has_more;
        if (hasMore && invoices.data.length > 0) {
          startingAfter = invoices.data[invoices.data.length - 1].id;
        }
      }

      console.log(`Synced invoices for Stripe account ${account.stripeAccountId}`);
    } catch (error: any) {
      console.error('Error syncing invoices:', error);
      throw new Error(`Failed to sync invoices: ${error.message}`);
    }
  }

  /**
   * Sync payments (charges) from Stripe
   */
  static async syncPayments(stripeAccountId: string): Promise<void> {
    try {
      const account = await prisma.stripeAccount.findUnique({
        where: { id: stripeAccountId },
      });

      if (!account) {
        throw new Error('Stripe account not found');
      }

      const stripe = account.accessTokenEncrypted 
        ? new Stripe(decrypt(account.accessTokenEncrypted as any), { apiVersion: '2025-09-30.clover' })
        : stripeClient;

      // Fetch charges from the last 12 months
      const twelveMonthsAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const charges = await stripe.charges.list({
          limit: 100,
          created: { gte: twelveMonthsAgo },
          starting_after: startingAfter,
        });

        for (const charge of charges.data) {
          let customerId: string | undefined;

          if (charge.customer) {
            const customer = await prisma.stripeCustomer.findUnique({
              where: { stripeCustomerId: charge.customer as string },
            });
            customerId = customer?.id;
          }

          await prisma.stripePayment.upsert({
            where: { stripePaymentId: charge.id },
            update: {
              amount: charge.amount,
              currency: charge.currency,
              status: charge.status || 'failed',
              paymentMethod: charge.payment_method_details?.type || undefined,
              description: charge.description || undefined,
              receiptUrl: charge.receipt_url || undefined,
              paidAt: new Date(charge.created * 1000),
              metadata: charge.metadata,
            },
            create: {
              stripeAccountId: account.id,
              stripeCustomerId: customerId,
              stripePaymentId: charge.id,
              amount: charge.amount,
              currency: charge.currency,
              status: charge.status || 'failed',
              paymentMethod: charge.payment_method_details?.type || undefined,
              description: charge.description || undefined,
              receiptUrl: charge.receipt_url || undefined,
              paidAt: new Date(charge.created * 1000),
              metadata: charge.metadata,
            },
          });
        }

        hasMore = charges.has_more;
        if (hasMore && charges.data.length > 0) {
          startingAfter = charges.data[charges.data.length - 1].id;
        }
      }

      console.log(`Synced payments for Stripe account ${account.stripeAccountId}`);
    } catch (error: any) {
      console.error('Error syncing payments:', error);
      throw new Error(`Failed to sync payments: ${error.message}`);
    }
  }

  /**
   * Full sync of all Stripe data
   */
  static async fullSync(stripeAccountId: string): Promise<void> {
    console.log(`Starting full sync for Stripe account ${stripeAccountId}`);
    
    await this.syncCustomers(stripeAccountId);
    await this.syncSubscriptions(stripeAccountId);
    await this.syncInvoices(stripeAccountId);
    await this.syncPayments(stripeAccountId);
    
    console.log(`Completed full sync for Stripe account ${stripeAccountId}`);
  }

  /**
   * Get Stripe account for a tenant
   */
  static async getAccountForTenant(tenantId: string) {
    return await prisma.stripeAccount.findFirst({
      where: { tenantId, isActive: true },
    });
  }

  /**
   * Disconnect Stripe account
   */
  static async disconnectAccount(stripeAccountId: string): Promise<void> {
    await prisma.stripeAccount.update({
      where: { id: stripeAccountId },
      data: { isActive: false },
    });
  }
}

