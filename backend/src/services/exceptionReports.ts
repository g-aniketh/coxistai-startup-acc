import { Prisma, LedgerBalanceType } from "@prisma/client";
import { prisma } from "../lib/prisma";

/**
 * Get exception reports for negative balances, mismatches, etc.
 */
export async function getExceptionReports(
  startupId: string,
  asOnDate?: string
) {
  const toDate = asOnDate ? new Date(asOnDate) : new Date();

  const exceptions: Array<{
    type: string;
    ledgerName: string;
    ledgerId: string;
    description: string;
    severity: "WARNING" | "ERROR";
    amount?: number;
    expected?: number;
    actual?: number;
  }> = [];

  // Get all ledgers with their groups
  const ledgers = await prisma.ledger.findMany({
    where: { startupId },
    include: { group: true },
  });

  // Check for negative balances
  for (const ledger of ledgers) {
    const openingBalance = Number(ledger.openingBalance || 0);
    const openingType = ledger.openingBalanceType || LedgerBalanceType.DEBIT;

    const entries = await prisma.voucherEntry.findMany({
      where: {
        voucher: {
          startupId,
          date: { lte: toDate },
        },
        ledgerName: ledger.name,
      },
      select: {
        entryType: true,
        amount: true,
      },
    });

    let debitTotal =
      openingType === LedgerBalanceType.DEBIT ? openingBalance : 0;
    let creditTotal =
      openingType === LedgerBalanceType.CREDIT ? openingBalance : 0;

    for (const entry of entries) {
      if (entry.entryType === "DEBIT") {
        debitTotal += Number(entry.amount);
      } else {
        creditTotal += Number(entry.amount);
      }
    }

    const balance = Math.abs(debitTotal - creditTotal);
    const balanceType = debitTotal >= creditTotal ? "DEBIT" : "CREDIT";

    // Check for negative balances (assets with credit balance, liabilities with debit balance)
    const category = ledger.group.category;
    const isAsset = [
      "CASH",
      "BANK_ACCOUNT",
      "CURRENT_ASSET",
      "SUNDRY_DEBTOR",
      "STOCK",
      "INVESTMENT",
    ].includes(category);
    const isLiability = [
      "CURRENT_LIABILITY",
      "SUNDRY_CREDITOR",
      "LOAN",
    ].includes(category);

    if (isAsset && balanceType === "CREDIT" && balance > 0) {
      exceptions.push({
        type: "NEGATIVE_BALANCE",
        ledgerName: ledger.name,
        ledgerId: ledger.id,
        description: `Asset ledger has negative (credit) balance of ${balance}`,
        severity: "ERROR",
        amount: balance,
      });
    }

    if (isLiability && balanceType === "DEBIT" && balance > 0) {
      exceptions.push({
        type: "NEGATIVE_BALANCE",
        ledgerName: ledger.name,
        ledgerId: ledger.id,
        description: `Liability ledger has negative (debit) balance of ${balance}`,
        severity: "ERROR",
        amount: balance,
      });
    }

    // Check credit limit violations
    if (ledger.creditLimit) {
      const creditLimit = Number(ledger.creditLimit);
      const creditBalance = balanceType === "CREDIT" ? balance : 0;

      if (creditBalance > creditLimit) {
        exceptions.push({
          type: "CREDIT_LIMIT_EXCEEDED",
          ledgerName: ledger.name,
          ledgerId: ledger.id,
          description: `Credit limit of ${creditLimit} exceeded. Current balance: ${creditBalance}`,
          severity: "ERROR",
          amount: creditBalance,
          expected: creditLimit,
          actual: creditBalance,
        });
      }
    }
  }

  // Check for unbalanced vouchers
  const vouchers = await prisma.voucher.findMany({
    where: {
      startupId,
      date: { lte: toDate },
    },
    include: {
      entries: true,
    },
  });

  for (const voucher of vouchers) {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of voucher.entries) {
      if (entry.entryType === "DEBIT") {
        totalDebit += Number(entry.amount);
      } else {
        totalCredit += Number(entry.amount);
      }
    }

    const difference = Math.abs(totalDebit - totalCredit);
    if (difference > 0.01) {
      // Allow small rounding differences
      exceptions.push({
        type: "UNBALANCED_VOUCHER",
        ledgerName: voucher.voucherNumber,
        ledgerId: voucher.id,
        description: `Voucher ${voucher.voucherNumber} is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}, Difference: ${difference}`,
        severity: "ERROR",
        expected: totalDebit,
        actual: totalCredit,
      });
    }
  }

  // Check for ledgers with entries but no opening balance (if expected)
  for (const ledger of ledgers) {
    const hasEntries = await prisma.voucherEntry.findFirst({
      where: {
        voucher: {
          startupId,
          date: { lte: toDate },
        },
        ledgerName: ledger.name,
      },
    });

    const hasOpeningBalance =
      ledger.openingBalance !== null && Number(ledger.openingBalance) !== 0;

    if (hasEntries && !hasOpeningBalance) {
      exceptions.push({
        type: "MISSING_OPENING_BALANCE",
        ledgerName: ledger.name,
        ledgerId: ledger.id,
        description: `Ledger has transactions but no opening balance set`,
        severity: "WARNING",
      });
    }
  }

  return {
    summary: {
      totalExceptions: exceptions.length,
      errors: exceptions.filter((e) => e.severity === "ERROR").length,
      warnings: exceptions.filter((e) => e.severity === "WARNING").length,
    },
    exceptions: exceptions.sort((a, b) => {
      // Sort by severity first (ERROR before WARNING), then by type
      if (a.severity !== b.severity) {
        return a.severity === "ERROR" ? -1 : 1;
      }
      return a.type.localeCompare(b.type);
    }),
  };
}
