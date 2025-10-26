import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

interface ImportedLedger {
  ledgerName: string;
  accountGroup: string;
  openingBalance: number;
  openingType: 'Debit' | 'Credit';
  transactions: ImportedTransaction[];
}

interface ImportedTransaction {
  voucherNo: string;
  voucherType: 'Sales' | 'Purchase' | 'Journal' | 'Receipt' | 'Payment' | 'Contra';
  date: string;
  narration: string;
  particulars: string;
  amount: number;
  debit: number;
  credit: number;
  reference?: string;
}

interface ImportedParty {
  name: string;
  type: 'Customer' | 'Supplier' | 'Employee' | 'Other';
  partyType: string;
  mobileNumber?: string;
  email?: string;
  openingBalance: number;
  balanceType: 'Debit' | 'Credit';
}

interface TallyImportPayload {
  ledgers: ImportedLedger[];
  parties: ImportedParty[];
  summary: {
    totalLedgers: number;
    totalParties: number;
    totalTransactions: number;
    dateRange: { from: string; to: string };
    totalDebit: number;
    totalCredit: number;
  };
  errors: string[];
  warnings: string[];
}

// POST /api/v1/import/tally
router.post('/tally', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const importData: TallyImportPayload = req.body;

    console.log(`📊 Starting Tally import - User: ${userId}, Ledgers: ${importData.ledgers?.length || 0}, Parties: ${importData.parties?.length || 0}, Transactions: ${importData.summary?.totalTransactions || 0}`);

    // Validate required fields
    if (!importData.ledgers || !Array.isArray(importData.ledgers)) {
      return res.status(400).json({ success: false, message: 'Invalid import data: ledgers array required' });
    }

    if (importData.errors && importData.errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot import data with errors', errors: importData.errors });
    }

    // Get user's startup
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { startup: true },
    });

    if (!user || !user.startup) {
      return res.status(404).json({ success: false, message: 'User startup not found' });
    }

    const startupId = user.startup.id;

    // Track import statistics
    const importStats = {
      ledgersCreated: 0,
      partiesCreated: 0,
      transactionsCreated: 0,
      totalAmountImported: 0,
    };

    console.log('📝 Starting ledger import...');
    // Import Ledgers
    for (const ledger of importData.ledgers) {
      try {
        // Check if ledger already exists
        const existingLedger = await prisma.mockBankAccount.findFirst({
          where: {
            accountName: ledger.ledgerName,
            startupId: startupId,
          },
        });

        if (!existingLedger) {
          // Create new ledger/account
          await prisma.mockBankAccount.create({
            data: {
              accountName: ledger.ledgerName,
              balance: ledger.openingBalance,
              startupId: startupId,
            },
          });

          importStats.ledgersCreated++;
        }
      } catch (error) {
        console.error(`Error creating ledger ${ledger.ledgerName}:`, error);
      }
    }
    console.log(`✅ Ledgers imported: ${importStats.ledgersCreated}`);

    console.log('📝 Starting party import...');
    // Import Parties
    for (const party of importData.parties) {
      try {
        // Check if party already exists
        const existingParty = await prisma.partyMaster.findFirst({
          where: {
            name: party.name,
            startupId: startupId,
          },
        });

        if (!existingParty) {
          // Create new party
          await prisma.partyMaster.create({
            data: {
              name: party.name,
              type: party.type,
              email: party.email,
              phone: party.mobileNumber,
              openingBalance: party.openingBalance,
              balanceType: party.balanceType,
              startupId: startupId,
            },
          });

          importStats.partiesCreated++;
        }
      } catch (error) {
        console.error(`Error creating party ${party.name}:`, error);
      }
    }
    console.log(`✅ Parties imported: ${importStats.partiesCreated}`);

    console.log('📝 Starting transaction import...');
    // Import Transactions
    let transactionCount = 0;
    for (const ledger of importData.ledgers) {
      // Find or create the account/ledger
      let account = await prisma.mockBankAccount.findFirst({
        where: {
          accountName: ledger.ledgerName,
          startupId: startupId,
        },
      });

      if (!account) {
        // Create the account if it doesn't exist
        account = await prisma.mockBankAccount.create({
          data: {
            accountName: ledger.ledgerName,
            balance: ledger.openingBalance,
            startupId: startupId,
          },
        });
      }

      for (const transaction of ledger.transactions) {
        try {
          const transactionDate = new Date(transaction.date);
          const transactionAmount = transaction.debit > transaction.credit ? transaction.debit : -transaction.credit;

          // Create imported transaction record
          await prisma.importedTransaction.create({
            data: {
              voucherNo: transaction.voucherNo,
              voucherType: transaction.voucherType,
              date: transactionDate,
              narration: transaction.narration,
              particulars: transaction.particulars,
              amount: transaction.amount,
              debit: transaction.debit,
              credit: transaction.credit,
              reference: transaction.reference,
              ledgerName: ledger.ledgerName,
              startupId: startupId,
            },
          });

          // Create actual Transaction record for dashboard
          await prisma.transaction.create({
            data: {
              amount: transactionAmount,
              type: transactionAmount > 0 ? 'CREDIT' : 'DEBIT',
              description: `${transaction.voucherType} - ${transaction.narration}`,
              date: transactionDate,
              accountId: account.id,
              startupId: startupId,
            },
          });

          // Update account balance
          await prisma.mockBankAccount.update({
            where: { id: account.id },
            data: { balance: { increment: transactionAmount } },
          });

          importStats.transactionsCreated++;
          importStats.totalAmountImported += transaction.amount || Math.max(transaction.debit, transaction.credit);
          transactionCount++;
          
          if (transactionCount % 10 === 0) {
            console.log(`   Processed ${transactionCount} transactions...`);
          }
        } catch (error) {
          console.error(`Error creating transaction for ledger ${ledger.ledgerName}:`, error);
        }
      }
    }

    console.log('📝 Creating import history...');
    // Create import history record
    await prisma.importHistory.create({
      data: {
        fileName: 'Tally Export',
        importType: 'TALLY',
        totalRecords: importData.summary.totalTransactions,
        successCount: importStats.transactionsCreated,
        failureCount: importData.summary.totalTransactions - importStats.transactionsCreated,
        summary: JSON.stringify(importStats),
        startupId: startupId,
      },
    });

    console.log('✅ Import completed successfully!');
    return res.status(200).json({
      success: true,
      message: 'Data imported successfully',
      data: {
        ...importStats,
        warnings: importData.warnings,
      },
    });
  } catch (error) {
    console.error('❌ Import error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Helper function to map Tally account groups to our account types
function mapLedgerTypeToAccountType(accountGroup: string): string {
  const mapping: { [key: string]: string } = {
    'Cash & Bank': 'Cash',
    'Cash': 'Cash',
    'Bank': 'Bank',
    'Receivables': 'Receivables',
    'Payables': 'Payables',
    'Inventory': 'Inventory',
    'Fixed Assets': 'Assets',
    'Current Assets': 'Assets',
    'Current Liabilities': 'Liabilities',
    'Long-term Liabilities': 'Liabilities',
    'Capital': 'Capital',
    'Reserves': 'Capital',
    'Revenue': 'Revenue',
    'Expenses': 'Expense',
  };

  return mapping[accountGroup] || 'General';
}

export default router;
