import { Configuration, PlaidApi, PlaidEnvironments, LinkTokenCreateRequest, CountryCode, Products } from 'plaid';
import CryptoJS from 'crypto-js';
import { prisma } from '../lib/prisma';

// Plaid configuration
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// Encryption utilities
const ENCRYPTION_KEY = process.env.PLAID_ENCRYPTION_KEY || 'default-32-character-encryption-key';

export const encryptAccessToken = (accessToken: string): Buffer => {
  const encrypted = CryptoJS.AES.encrypt(accessToken, ENCRYPTION_KEY).toString();
  return Buffer.from(encrypted, 'utf8');
};

export const decryptAccessToken = (encryptedToken: Buffer): string => {
  const encrypted = encryptedToken.toString('utf8');
  const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return decrypted.toString(CryptoJS.enc.Utf8);
};

export class PlaidService {
  /**
   * Create a link token for Plaid Link initialization
   */
  static async createLinkToken(userId: string, tenantId: string): Promise<string> {
    try {
      const request: LinkTokenCreateRequest = {
        user: {
          client_user_id: userId,
        },
        client_name: 'CoXist AI CFO Assistant',
        products: (process.env.PLAID_PRODUCTS?.split(',') as Products[]) || [Products.Transactions, Products.Auth, Products.Identity],
        country_codes: (process.env.PLAID_COUNTRY_CODES?.split(',') as CountryCode[]) || [CountryCode.Us],
        language: 'en',
        webhook: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/v1/cfo/plaid/webhook`,
        redirect_uri: process.env.PLAID_REDIRECT_URI || 'http://localhost:3000/cfo/plaid/callback',
      };

      const response = await plaidClient.linkTokenCreate(request);
      return response.data.link_token;
    } catch (error) {
      console.error('Error creating link token:', error);
      throw new Error('Failed to create link token');
    }
  }

  /**
   * Exchange public token for access token and store in database
   */
  static async exchangePublicToken(publicToken: string, userId: string, tenantId: string) {
    try {
      // Exchange public token for access token
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });

      const { access_token, item_id } = response.data;

      // Get item information
      const itemResponse = await plaidClient.itemGet({
        access_token,
      });

      const institution = itemResponse.data.item.institution_id 
        ? await plaidClient.institutionsGetById({
            institution_id: itemResponse.data.item.institution_id,
            country_codes: [CountryCode.Us],
          })
        : null;

      // Encrypt and store access token
      const encryptedAccessToken = encryptAccessToken(access_token);

      // Store in database
      const plaidItem = await prisma.plaidItem.create({
        data: {
          tenantId,
          userId,
          plaidItemId: item_id,
          accessTokenEncrypted: encryptedAccessToken,
          institutionName: institution?.data.institution.name || 'Unknown Institution',
        },
      });

      // Fetch and store accounts
      await this.syncAccounts(plaidItem.id, access_token);

      return {
        success: true,
        data: {
          plaidItem: {
            id: plaidItem.id,
            plaidItemId: plaidItem.plaidItemId,
            institutionName: plaidItem.institutionName,
          },
        },
      };
    } catch (error) {
      console.error('Error exchanging public token:', error);
      throw new Error('Failed to exchange public token');
    }
  }

  /**
   * Sync accounts for a Plaid item
   */
  static async syncAccounts(plaidItemId: string, accessToken?: string) {
    try {
      const plaidItem = await prisma.plaidItem.findUnique({
        where: { id: plaidItemId },
      });

      if (!plaidItem) {
        throw new Error('Plaid item not found');
      }

      const token = accessToken || decryptAccessToken(Buffer.from(plaidItem.accessTokenEncrypted));

      // Get accounts from Plaid
      const response = await plaidClient.accountsGet({
        access_token: token,
      });

      const accounts = response.data.accounts;

      // Store or update accounts
      for (const account of accounts) {
        await prisma.account.upsert({
          where: { plaidAccountId: account.account_id },
          update: {
            name: account.name,
            mask: account.mask,
            type: account.type,
            subtype: account.subtype || 'unknown',
            currentBalance: account.balances.current || 0,
          },
          create: {
            plaidItemId: plaidItem.id,
            plaidAccountId: account.account_id,
            name: account.name,
            mask: account.mask,
            type: account.type,
            subtype: account.subtype || 'unknown',
            currentBalance: account.balances.current || 0,
          },
        });
      }

      return accounts;
    } catch (error) {
      console.error('Error syncing accounts:', error);
      throw error;
    }
  }

  /**
   * Sync transactions for a Plaid item
   */
  static async syncTransactions(plaidItemId: string, startDate?: Date, endDate?: Date) {
    try {
      const plaidItem = await prisma.plaidItem.findUnique({
        where: { id: plaidItemId },
        include: { accounts: true },
      });

      if (!plaidItem) {
        throw new Error('Plaid item not found');
      }

      const accessToken = decryptAccessToken(Buffer.from(plaidItem.accessTokenEncrypted));
      const accounts = plaidItem.accounts;

      // Default to last 30 days if no dates provided
      const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const defaultEndDate = endDate || new Date();

      const response = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: defaultStartDate.toISOString().split('T')[0],
        end_date: defaultEndDate.toISOString().split('T')[0],
        account_ids: accounts.map(acc => acc.plaidAccountId),
      } as any);

      const transactions = response.data.transactions;
      let syncedCount = 0;

      // Store or update transactions
      for (const transaction of transactions) {
        const account = accounts.find(acc => acc.plaidAccountId === transaction.account_id);
        
        if (!account) continue;

        // Find matching category
        let categoryId: number | undefined;
        if (transaction.category && transaction.category.length > 0) {
          const category = await prisma.transactionCategory.findFirst({
            where: {
              name: {
                contains: transaction.category[0],
                mode: 'insensitive',
              },
            },
          });
          categoryId = category?.id;
        }

        await prisma.transaction.upsert({
          where: { plaidTransactionId: transaction.transaction_id },
          update: {
            amount: transaction.amount,
            description: transaction.name,
            date: new Date(transaction.date),
            pending: transaction.pending,
            categoryId,
          },
          create: {
            accountId: account.id,
            plaidTransactionId: transaction.transaction_id,
            amount: transaction.amount,
            description: transaction.name,
            date: new Date(transaction.date),
            pending: transaction.pending,
            categoryId,
          },
        });

        syncedCount++;
      }

      return {
        success: true,
        data: {
          syncedCount,
          totalTransactions: transactions.length,
        },
      };
    } catch (error) {
      console.error('Error syncing transactions:', error);
      throw error;
    }
  }

  /**
   * Get all Plaid items for a tenant
   */
  static async getPlaidItems(tenantId: string) {
    try {
      const plaidItems = await prisma.plaidItem.findMany({
        where: { tenantId },
        include: {
          accounts: {
            include: {
              transactions: {
                take: 10,
                orderBy: { date: 'desc' },
                include: { category: true },
              },
            },
          },
        },
      });

      return plaidItems;
    } catch (error) {
      console.error('Error fetching Plaid items:', error);
      throw error;
    }
  }

  /**
   * Delete a Plaid item and revoke access
   */
  static async deletePlaidItem(plaidItemId: string, userId: string, tenantId: string) {
    try {
      const plaidItem = await prisma.plaidItem.findFirst({
        where: {
          id: plaidItemId,
          userId,
          tenantId,
        },
      });

      if (!plaidItem) {
        throw new Error('Plaid item not found or access denied');
      }

      // Revoke access token with Plaid
      try {
        const accessToken = decryptAccessToken(Buffer.from(plaidItem.accessTokenEncrypted));
        await plaidClient.itemRemove({
          access_token: accessToken,
        });
      } catch (error) {
        console.warn('Failed to revoke access token with Plaid:', error);
      }

      // Delete from database (cascade will handle related records)
      await prisma.plaidItem.delete({
        where: { id: plaidItemId },
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting Plaid item:', error);
      throw error;
    }
  }
}
