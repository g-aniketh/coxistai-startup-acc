import { Prisma, LedgerCategory, LedgerBalanceType } from "@prisma/client";
import { prisma } from "../lib/prisma";

interface LedgerBalance {
  ledgerId: string;
  ledgerName: string;
  groupName: string;
  category: LedgerCategory;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

interface TrialBalanceEntry {
  ledgerName: string;
  groupName: string;
  category: string;
  debit: number;
  credit: number;
}

interface PLAccount {
  name: string;
  category: string;
  amount: number;
}

interface BalanceSheetItem {
  name: string;
  category: string;
  amount: number;
}

interface CashFlowItem {
  category: string;
  description: string;
  amount: number;
}

/**
 * Calculate ledger balances from opening balances and voucher entries
 */
async function calculateLedgerBalances(
  startupId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<Map<string, LedgerBalance>> {
  const balances = new Map<string, LedgerBalance>();

  // Get all ledgers with their groups
  const ledgers = await prisma.ledger.findMany({
    where: { startupId },
    include: { group: true },
  });

  // Initialize balances with opening balances
  for (const ledger of ledgers) {
    const openingBalance = ledger.openingBalance
      ? Number(ledger.openingBalance)
      : 0;
    const openingType = ledger.openingBalanceType || LedgerBalanceType.DEBIT;

    balances.set(ledger.id, {
      ledgerId: ledger.id,
      ledgerName: ledger.name,
      groupName: ledger.group.name,
      category: ledger.group.category,
      openingDebit:
        openingType === LedgerBalanceType.DEBIT ? openingBalance : 0,
      openingCredit:
        openingType === LedgerBalanceType.CREDIT ? openingBalance : 0,
      periodDebit: 0,
      periodCredit: 0,
      closingDebit: 0,
      closingCredit: 0,
    });
  }

  // Build date filter for voucher entries
  const voucherFilters: any = {
    startupId,
  };
  if (fromDate || toDate) {
    voucherFilters.date = {};
    if (fromDate) voucherFilters.date.gte = fromDate;
    if (toDate) voucherFilters.date.lte = toDate;
  }

  // Get all voucher entries
  const vouchers = await prisma.voucher.findMany({
    where: voucherFilters,
    include: {
      entries: true,
    },
  });

  // Process voucher entries
  for (const voucher of vouchers) {
    for (const entry of voucher.entries) {
      // Find ledger by name (since entries store ledgerName, not ledgerId)
      const ledger = ledgers.find((l: any) => l.name === entry.ledgerName);
      if (!ledger) continue;

      const balance = balances.get(ledger.id);
      if (!balance) continue;

      const amount = Number(entry.amount);
      if (entry.entryType === "DEBIT") {
        balance.periodDebit += amount;
      } else {
        balance.periodCredit += amount;
      }
    }
  }

  // Calculate closing balances
  for (const [_, balance] of balances) {
    const netDebit =
      balance.openingDebit + balance.periodDebit - balance.periodCredit;
    const netCredit =
      balance.openingCredit + balance.periodCredit - balance.periodDebit;

    if (netDebit > netCredit) {
      balance.closingDebit = netDebit - netCredit;
      balance.closingCredit = 0;
    } else {
      balance.closingCredit = netCredit - netDebit;
      balance.closingDebit = 0;
    }
  }

  return balances;
}

/**
 * Generate Trial Balance
 */
export async function getTrialBalance(
  startupId: string,
  asOnDate?: string
): Promise<TrialBalanceEntry[]> {
  const toDate = asOnDate ? new Date(asOnDate) : new Date();
  const balances = await calculateLedgerBalances(startupId, undefined, toDate);

  const trialBalance: TrialBalanceEntry[] = [];
  let totalDebit = 0;
  let totalCredit = 0;

  for (const [_, balance] of balances) {
    const debit = balance.closingDebit;
    const credit = balance.closingCredit;

    if (debit > 0 || credit > 0) {
      trialBalance.push({
        ledgerName: balance.ledgerName,
        groupName: balance.groupName,
        category: balance.category,
        debit,
        credit,
      });
      totalDebit += debit;
      totalCredit += credit;
    }
  }

  // Add totals row
  trialBalance.push({
    ledgerName: "TOTAL",
    groupName: "",
    category: "" as LedgerCategory,
    debit: totalDebit,
    credit: totalCredit,
  });

  return trialBalance.sort((a, b) => a.ledgerName.localeCompare(b.ledgerName));
}

/**
 * Generate Profit & Loss Statement
 */
export async function getProfitAndLoss(
  startupId: string,
  fromDate?: string,
  toDate?: string
): Promise<{
  trading: PLAccount[];
  grossProfit: number;
  indirectExpenses: PLAccount[];
  indirectIncomes: PLAccount[];
  netProfit: number;
  totalIncome: number;
  totalExpenses: number;
}> {
  const from = fromDate ? new Date(fromDate) : undefined;
  const to = toDate ? new Date(toDate) : new Date();
  const balances = await calculateLedgerBalances(startupId, from, to);

  const directExpenses: PLAccount[] = [];
  const directIncomes: PLAccount[] = [];
  const indirectExpenses: PLAccount[] = [];
  const indirectIncomes: PLAccount[] = [];

  let totalDirectExpenses = 0;
  let totalDirectIncomes = 0;
  let totalIndirectExpenses = 0;
  let totalIndirectIncomes = 0;

  for (const [_, balance] of balances) {
    const amount = Math.abs(balance.closingDebit - balance.closingCredit);
    if (amount === 0) continue;

    // Determine if debit balance (expense) or credit balance (income)
    const isDebitBalance = balance.closingDebit > balance.closingCredit;

    switch (balance.category) {
      case LedgerCategory.PURCHASE:
      case LedgerCategory.DIRECT_EXPENSE:
        if (isDebitBalance) {
          directExpenses.push({
            name: balance.ledgerName,
            category: balance.category,
            amount,
          });
          totalDirectExpenses += amount;
        }
        break;

      case LedgerCategory.SALES:
      case LedgerCategory.DIRECT_INCOME:
        if (!isDebitBalance) {
          directIncomes.push({
            name: balance.ledgerName,
            category: balance.category,
            amount,
          });
          totalDirectIncomes += amount;
        }
        break;

      case LedgerCategory.INDIRECT_EXPENSE:
        if (isDebitBalance) {
          indirectExpenses.push({
            name: balance.ledgerName,
            category: balance.category,
            amount,
          });
          totalIndirectExpenses += amount;
        }
        break;

      case LedgerCategory.INDIRECT_INCOME:
        if (!isDebitBalance) {
          indirectIncomes.push({
            name: balance.ledgerName,
            category: balance.category,
            amount,
          });
          totalIndirectIncomes += amount;
        }
        break;
    }
  }

  const grossProfit = totalDirectIncomes - totalDirectExpenses;
  const netProfit = grossProfit + totalIndirectIncomes - totalIndirectExpenses;

  return {
    trading: [...directIncomes, ...directExpenses],
    grossProfit,
    indirectExpenses,
    indirectIncomes,
    netProfit,
    totalIncome: totalDirectIncomes + totalIndirectIncomes,
    totalExpenses: totalDirectExpenses + totalIndirectExpenses,
  };
}

/**
 * Generate Balance Sheet
 */
export async function getBalanceSheet(
  startupId: string,
  asOnDate?: string
): Promise<{
  assets: BalanceSheetItem[];
  liabilities: BalanceSheetItem[];
  capital: BalanceSheetItem[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}> {
  const toDate = asOnDate ? new Date(asOnDate) : new Date();
  const balances = await calculateLedgerBalances(startupId, undefined, toDate);

  const assets: BalanceSheetItem[] = [];
  const liabilities: BalanceSheetItem[] = [];
  const capital: BalanceSheetItem[] = [];

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalCapital = 0;

  // Get P&L balance (net profit/loss)
  const plResult = await getProfitAndLoss(startupId, undefined, asOnDate);
  const netProfit = plResult.netProfit;

  for (const [_, balance] of balances) {
    const amount = Math.abs(balance.closingDebit - balance.closingCredit);
    if (amount === 0) continue;

    const isDebitBalance = balance.closingDebit > balance.closingCredit;

    switch (balance.category) {
      case LedgerCategory.CAPITAL:
        if (!isDebitBalance) {
          capital.push({
            name: balance.ledgerName,
            category: balance.category,
            amount,
          });
          totalCapital += amount;
        }
        break;

      case LedgerCategory.LOAN:
      case LedgerCategory.CURRENT_LIABILITY:
      case LedgerCategory.SUNDRY_CREDITOR:
        if (!isDebitBalance) {
          liabilities.push({
            name: balance.ledgerName,
            category: balance.category,
            amount,
          });
          totalLiabilities += amount;
        }
        break;

      case LedgerCategory.CURRENT_ASSET:
      case LedgerCategory.SUNDRY_DEBTOR:
      case LedgerCategory.BANK_ACCOUNT:
      case LedgerCategory.CASH:
      case LedgerCategory.INVESTMENT:
      case LedgerCategory.STOCK:
        if (isDebitBalance) {
          assets.push({
            name: balance.ledgerName,
            category: balance.category,
            amount,
          });
          totalAssets += amount;
        }
        break;
    }
  }

  // Add P&L balance to capital
  if (netProfit !== 0) {
    capital.push({
      name:
        netProfit > 0
          ? "Profit & Loss Account"
          : "Profit & Loss Account (Loss)",
      category: "OTHER" as LedgerCategory,
      amount: Math.abs(netProfit),
    });
    totalCapital += netProfit;
  }

  return {
    assets,
    liabilities,
    capital,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities - totalCapital,
  };
}

/**
 * Generate Cash Flow Statement
 */
export async function getCashFlow(
  startupId: string,
  fromDate?: string,
  toDate?: string
): Promise<{
  operating: CashFlowItem[];
  investing: CashFlowItem[];
  financing: CashFlowItem[];
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
}> {
  const from = fromDate ? new Date(fromDate) : undefined;
  const to = toDate ? new Date(toDate) : new Date();

  // Get cash and bank ledgers
  const cashLedgers = await prisma.ledger.findMany({
    where: {
      startupId,
      group: {
        category: {
          in: [LedgerCategory.CASH, LedgerCategory.BANK_ACCOUNT],
        },
      },
    },
    include: { group: true },
  });

  const operating: CashFlowItem[] = [];
  const investing: CashFlowItem[] = [];
  const financing: CashFlowItem[] = [];

  let openingBalance = 0;
  let closingBalance = 0;
  let netCashFlow = 0;

  // Get opening balances
  for (const ledger of cashLedgers) {
    const openingBal = ledger.openingBalance
      ? Number(ledger.openingBalance)
      : 0;
    const openingType = ledger.openingBalanceType || LedgerBalanceType.DEBIT;
    openingBalance +=
      openingType === LedgerBalanceType.DEBIT ? openingBal : -openingBal;
  }

  // Get vouchers affecting cash/bank
  const voucherFilters: any = {
    startupId,
    date: {},
  };
  if (from) voucherFilters.date!.gte = from;
  if (to) voucherFilters.date!.lte = to;

  const vouchers = await prisma.voucher.findMany({
    where: voucherFilters,
    include: {
      entries: true,
      voucherType: true,
    },
  });

  for (const voucher of vouchers) {
    for (const entry of voucher.entries) {
      const ledger = cashLedgers.find((l: any) => l.name === entry.ledgerName);
      if (!ledger) continue;

      const amount = Number(entry.amount);
      const isDebit = entry.entryType === "DEBIT";
      const cashFlowAmount = isDebit ? amount : -amount;
      netCashFlow += cashFlowAmount;

      // Categorize based on voucher type and other entry
      const otherEntry = voucher.entries.find(
        (e: any) => e.ledgerName !== entry.ledgerName
      );
      const category = categorizeCashFlow(
        voucher.voucherType.category,
        otherEntry
      );

      const item: CashFlowItem = {
        category: category as "Operating" | "Investing" | "Financing",
        description: `${voucher.voucherType.name} - ${
          otherEntry?.ledgerName || "N/A"
        }`,
        amount: cashFlowAmount,
      };

      if (category === "Operating") {
        operating.push(item);
      } else if (category === "Investing") {
        investing.push(item);
      } else {
        financing.push(item);
      }
    }
  }

  closingBalance = openingBalance + netCashFlow;

  return {
    operating,
    investing,
    financing,
    netCashFlow,
    openingBalance,
    closingBalance,
  };
}

function categorizeCashFlow(
  voucherCategory: string,
  otherEntry?: any
): "Operating" | "Investing" | "Financing" {
  // Simplified categorization - can be enhanced
  if (
    voucherCategory === "SALES" ||
    voucherCategory === "PURCHASE" ||
    voucherCategory === "PAYMENT" ||
    voucherCategory === "RECEIPT"
  ) {
    return "Operating";
  }
  if (voucherCategory === "JOURNAL") {
    // Check if it's related to investments or fixed assets
    if (
      otherEntry?.ledgerName?.toLowerCase().includes("investment") ||
      otherEntry?.ledgerName?.toLowerCase().includes("asset")
    ) {
      return "Investing";
    }
    if (
      otherEntry?.ledgerName?.toLowerCase().includes("loan") ||
      otherEntry?.ledgerName?.toLowerCase().includes("capital")
    ) {
      return "Financing";
    }
    return "Operating";
  }
  return "Operating";
}

/**
 * Generate Financial Ratios
 */
export async function getFinancialRatios(
  startupId: string,
  asOnDate?: string
): Promise<{
  liquidity: {
    currentRatio: number;
    quickRatio: number;
  };
  profitability: {
    grossProfitMargin: number;
    netProfitMargin: number;
    returnOnAssets: number;
  };
  efficiency: {
    assetTurnover: number;
    inventoryTurnover: number;
  };
  leverage: {
    debtToEquity: number;
    debtRatio: number;
  };
}> {
  const balanceSheet = await getBalanceSheet(startupId, asOnDate);
  const pl = await getProfitAndLoss(startupId, undefined, asOnDate);

  // Calculate current assets and current liabilities
  const currentAssets = balanceSheet.assets
    .filter((a) =>
      [
        "CURRENT_ASSET",
        "SUNDRY_DEBTOR",
        "BANK_ACCOUNT",
        "CASH",
        "STOCK",
      ].includes(a.category)
    )
    .reduce((sum, a) => sum + a.amount, 0);

  const currentLiabilities = balanceSheet.liabilities
    .filter(
      (l) =>
        l.category === "CURRENT_LIABILITY" || l.category === "SUNDRY_CREDITOR"
    )
    .reduce((sum, l) => sum + l.amount, 0);

  const inventory = balanceSheet.assets
    .filter((a) => a.category === "STOCK")
    .reduce((sum, a) => sum + a.amount, 0);

  const quickAssets = currentAssets - inventory;

  const totalEquity = balanceSheet.capital.reduce(
    (sum, c) => sum + c.amount,
    0
  );
  const totalDebt = balanceSheet.liabilities
    .filter((l) => l.category === "LOAN")
    .reduce((sum, l) => sum + l.amount, 0);
  const totalAssets = balanceSheet.totalAssets;

  return {
    liquidity: {
      currentRatio:
        currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
      quickRatio: currentLiabilities > 0 ? quickAssets / currentLiabilities : 0,
    },
    profitability: {
      grossProfitMargin:
        pl.totalIncome > 0 ? (pl.grossProfit / pl.totalIncome) * 100 : 0,
      netProfitMargin:
        pl.totalIncome > 0 ? (pl.netProfit / pl.totalIncome) * 100 : 0,
      returnOnAssets: totalAssets > 0 ? (pl.netProfit / totalAssets) * 100 : 0,
    },
    efficiency: {
      assetTurnover: totalAssets > 0 ? pl.totalIncome / totalAssets : 0,
      inventoryTurnover: inventory > 0 ? pl.totalIncome / inventory : 0,
    },
    leverage: {
      debtToEquity: totalEquity > 0 ? totalDebt / totalEquity : 0,
      debtRatio: totalAssets > 0 ? totalDebt / totalAssets : 0,
    },
  };
}

/**
 * Generate Cash Book (all cash transactions)
 */
export async function getCashBook(
  startupId: string,
  fromDate?: string,
  toDate?: string
): Promise<{
  entries: Array<{
    date: string;
    voucherNumber: string;
    voucherType: string;
    narration?: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
  openingBalance: number;
  closingBalance: number;
}> {
  const from = fromDate ? new Date(fromDate) : undefined;
  const to = toDate ? new Date(toDate) : new Date();

  // Get cash ledgers
  const cashLedgers = await prisma.ledger.findMany({
    where: {
      startupId,
      group: {
        category: LedgerCategory.CASH,
      },
    },
    include: { group: true },
  });

  let openingBalance = 0;
  const entries: Array<{
    date: string;
    voucherNumber: string;
    voucherType: string;
    narration?: string;
    debit: number;
    credit: number;
    balance: number;
  }> = [];

  // Get opening balances
  for (const ledger of cashLedgers) {
    const openingBal = ledger.openingBalance
      ? Number(ledger.openingBalance)
      : 0;
    const openingType = ledger.openingBalanceType || LedgerBalanceType.DEBIT;
    openingBalance +=
      openingType === LedgerBalanceType.DEBIT ? openingBal : -openingBal;
  }

  // Get vouchers affecting cash
  const voucherFilters: any = {
    startupId,
    date: {},
  };
  if (from) voucherFilters.date!.gte = from;
  if (to) voucherFilters.date!.lte = to;

  const vouchers = await prisma.voucher.findMany({
    where: voucherFilters,
    include: {
      entries: true,
      voucherType: true,
    },
    orderBy: { date: "asc" },
  });

  let runningBalance = openingBalance;

  for (const voucher of vouchers) {
    for (const entry of voucher.entries) {
      const ledger = cashLedgers.find((l: any) => l.name === entry.ledgerName);
      if (!ledger) continue;

      const amount = Number(entry.amount);
      const isDebit = entry.entryType === "DEBIT";
      const debit = isDebit ? amount : 0;
      const credit = !isDebit ? amount : 0;

      runningBalance += debit - credit;

      entries.push({
        date: voucher.date.toISOString().split("T")[0],
        voucherNumber: voucher.voucherNumber,
        voucherType: voucher.voucherType.name,
        narration: voucher.narration || entry.narration || undefined,
        debit,
        credit,
        balance: runningBalance,
      });
    }
  }

  return {
    entries,
    openingBalance,
    closingBalance: runningBalance,
  };
}

/**
 * Generate Bank Book (all bank transactions)
 */
export async function getBankBook(
  startupId: string,
  bankLedgerName?: string,
  fromDate?: string,
  toDate?: string
): Promise<{
  entries: Array<{
    date: string;
    voucherNumber: string;
    voucherType: string;
    narration?: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
  openingBalance: number;
  closingBalance: number;
  bankName: string;
}> {
  const from = fromDate ? new Date(fromDate) : undefined;
  const to = toDate ? new Date(toDate) : new Date();

  // Get bank ledgers
  let bankLedgers = await prisma.ledger.findMany({
    where: {
      startupId,
      group: {
        category: LedgerCategory.BANK_ACCOUNT,
      },
    },
    include: { group: true },
  });

  if (bankLedgerName) {
    bankLedgers = bankLedgers.filter((l: any) => l.name === bankLedgerName);
  }

  if (bankLedgers.length === 0) {
    throw new Error("No bank ledgers found");
  }

  const selectedBank = bankLedgers[0];
  let openingBalance = 0;

  // Get opening balance for selected bank
  const openingBal = selectedBank.openingBalance
    ? Number(selectedBank.openingBalance)
    : 0;
  const openingType =
    selectedBank.openingBalanceType || LedgerBalanceType.DEBIT;
  openingBalance =
    openingType === LedgerBalanceType.DEBIT ? openingBal : -openingBal;

  const entries: Array<{
    date: string;
    voucherNumber: string;
    voucherType: string;
    narration?: string;
    debit: number;
    credit: number;
    balance: number;
  }> = [];

  // Get vouchers affecting this bank
  const voucherFilters: any = {
    startupId,
    date: {},
  };
  if (from) voucherFilters.date!.gte = from;
  if (to) voucherFilters.date!.lte = to;

  const vouchers = await prisma.voucher.findMany({
    where: voucherFilters,
    include: {
      entries: true,
      voucherType: true,
    },
    orderBy: { date: "asc" },
  });

  let runningBalance = openingBalance;

  for (const voucher of vouchers) {
    for (const entry of voucher.entries) {
      if (entry.ledgerName !== selectedBank.name) continue;

      const amount = Number(entry.amount);
      const isDebit = entry.entryType === "DEBIT";
      const debit = isDebit ? amount : 0;
      const credit = !isDebit ? amount : 0;

      runningBalance += debit - credit;

      entries.push({
        date: voucher.date.toISOString().split("T")[0],
        voucherNumber: voucher.voucherNumber,
        voucherType: voucher.voucherType.name,
        narration: voucher.narration || entry.narration || undefined,
        debit,
        credit,
        balance: runningBalance,
      });
    }
  }

  return {
    entries,
    openingBalance,
    closingBalance: runningBalance,
    bankName: selectedBank.name,
  };
}

/**
 * Generate Day Book (all vouchers for a day)
 */
export async function getDayBook(
  startupId: string,
  date: string
): Promise<{
  date: string;
  vouchers: Array<{
    voucherNumber: string;
    voucherType: string;
    narration?: string;
    entries: Array<{
      ledgerName: string;
      entryType: string;
      amount: number;
    }>;
  }>;
}> {
  const dayDate = new Date(date);
  const nextDay = new Date(dayDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const vouchers = await prisma.voucher.findMany({
    where: {
      startupId,
      date: {
        gte: dayDate,
        lt: nextDay,
      },
    },
    include: {
      entries: true,
      voucherType: true,
    },
    orderBy: { date: "asc" },
  });

  return {
    date,
    vouchers: vouchers.map((v: any) => ({
      voucherNumber: v.voucherNumber,
      voucherType: v.voucherType.name,
      narration: v.narration,
      entries: v.entries.map((e: any) => ({
        ledgerName: e.ledgerName,
        entryType: e.entryType,
        amount: Number(e.amount),
      })),
    })),
  };
}

/**
 * Generate Ledger Book (all entries for a specific ledger)
 */
export async function getLedgerBook(
  startupId: string,
  ledgerName: string,
  fromDate?: string,
  toDate?: string
): Promise<{
  ledgerName: string;
  openingBalance: number;
  openingType: string;
  entries: Array<{
    date: string;
    voucherNumber: string;
    voucherType: string;
    narration?: string;
    entryType: string;
    amount: number;
    balance: number;
  }>;
  closingBalance: number;
}> {
  const from = fromDate ? new Date(fromDate) : undefined;
  const to = toDate ? new Date(toDate) : new Date();

  // Find ledger
  const ledger = await prisma.ledger.findFirst({
    where: {
      startupId,
      name: ledgerName,
    },
  });

  if (!ledger) {
    throw new Error("Ledger not found");
  }

  const openingBalance = ledger.openingBalance
    ? Number(ledger.openingBalance)
    : 0;
  const openingType = ledger.openingBalanceType || LedgerBalanceType.DEBIT;
  let runningBalance = openingBalance;

  // Get voucher entries for this ledger
  const voucherFilters: any = {
    startupId,
    date: {},
  };
  if (from) voucherFilters.date!.gte = from;
  if (to) voucherFilters.date!.lte = to;

  const vouchers = await prisma.voucher.findMany({
    where: voucherFilters,
    include: {
      entries: true,
      voucherType: true,
    },
    orderBy: { date: "asc" },
  });

  const entries: Array<{
    date: string;
    voucherNumber: string;
    voucherType: string;
    narration?: string;
    entryType: string;
    amount: number;
    balance: number;
  }> = [];

  for (const voucher of vouchers) {
    for (const entry of voucher.entries) {
      if (entry.ledgerName !== ledgerName) continue;

      const amount = Number(entry.amount);
      const isDebit = entry.entryType === "DEBIT";

      // Update running balance based on debit/credit
      if (openingType === LedgerBalanceType.DEBIT) {
        runningBalance += isDebit ? amount : -amount;
      } else {
        runningBalance += !isDebit ? amount : -amount;
      }

      entries.push({
        date: voucher.date.toISOString().split("T")[0],
        voucherNumber: voucher.voucherNumber,
        voucherType: voucher.voucherType.name,
        narration: voucher.narration || entry.narration || undefined,
        entryType: entry.entryType,
        amount,
        balance: runningBalance,
      });
    }
  }

  return {
    ledgerName,
    openingBalance,
    openingType,
    entries,
    closingBalance: runningBalance,
  };
}

/**
 * Generate Journals (Sales/Purchase/Credit/Debit/Contra)
 */
export async function getJournals(
  startupId: string,
  journalType:
    | "SALES"
    | "PURCHASE"
    | "PAYMENT"
    | "RECEIPT"
    | "CONTRA"
    | "JOURNAL",
  fromDate?: string,
  toDate?: string
): Promise<{
  journalType: string;
  vouchers: Array<{
    date: string;
    voucherNumber: string;
    narration?: string;
    entries: Array<{
      ledgerName: string;
      entryType: string;
      amount: number;
    }>;
  }>;
}> {
  const from = fromDate ? new Date(fromDate) : undefined;
  const to = toDate ? new Date(toDate) : new Date();

  const voucherFilters: any = {
    startupId,
    voucherType: {
      category: journalType as any,
    },
    date: {},
  };
  if (from) voucherFilters.date!.gte = from;
  if (to) voucherFilters.date!.lte = to;

  const vouchers = await prisma.voucher.findMany({
    where: voucherFilters,
    include: {
      entries: true,
      voucherType: true,
    },
    orderBy: { date: "asc" },
  });

  return {
    journalType,
    vouchers: vouchers.map((v: any) => ({
      date: v.date.toISOString().split("T")[0],
      voucherNumber: v.voucherNumber,
      narration: v.narration,
      entries: v.entries.map((e: any) => ({
        ledgerName: e.ledgerName,
        entryType: e.entryType,
        amount: Number(e.amount),
      })),
    })),
  };
}
