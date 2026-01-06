import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  listLedgerGroups,
  createLedgerGroup,
  updateLedgerGroup,
  deleteLedgerGroup,
  listLedgers,
  createLedger,
  updateLedger,
  deleteLedger,
} from "../services/bookkeeping";
import {
  getTrialBalance,
  getProfitAndLoss,
  getBalanceSheet,
  getCashFlow,
  getFinancialRatios,
  getCashBook,
  getBankBook,
  getDayBook,
  getLedgerBook,
  getJournals,
} from "../services/financialStatements";
import { getExceptionReports } from "../services/exceptionReports";
import { getCostCentrePL } from "../services/costCentreReporting";
import {
  createBudget,
  listBudgets,
  getBudgetVarianceAnalytics,
  checkBudgetBreaches,
} from "../services/budgeting";
import {
  generateClosingEntries,
  runDepreciation,
  carryForwardBalances,
} from "../services/yearEnd";

const router = Router();

router.use(authenticateToken);

router.get("/ledger-groups", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const groups = await listLedgerGroups(startupId);

    return res.json({ success: true, data: groups });
  } catch (error) {
    console.error("List ledger groups error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch ledger groups",
    });
  }
});

router.post("/ledger-groups", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const created = await createLedgerGroup(startupId, req.body);
    return res.status(201).json({
      success: true,
      data: created,
      message: "Ledger group created successfully",
    });
  } catch (error) {
    console.error("Create ledger group error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create ledger group",
    });
  }
});

router.put("/ledger-groups/:groupId", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const updated = await updateLedgerGroup(
      startupId,
      req.params.groupId,
      req.body
    );
    return res.json({
      success: true,
      data: updated,
      message: "Ledger group updated successfully",
    });
  } catch (error) {
    console.error("Update ledger group error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update ledger group",
    });
  }
});

router.delete("/ledger-groups/:groupId", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    await deleteLedgerGroup(startupId, req.params.groupId);
    return res.json({
      success: true,
      message: "Ledger group deleted successfully",
    });
  } catch (error) {
    console.error("Delete ledger group error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete ledger group",
    });
  }
});

router.get("/ledgers", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const ledgers = await listLedgers(startupId);
    return res.json({ success: true, data: ledgers });
  } catch (error) {
    console.error("List ledgers error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch ledgers",
    });
  }
});

router.post("/ledgers", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const created = await createLedger(startupId, req.body, req.user?.userId);
    return res.status(201).json({
      success: true,
      data: created,
      message: "Ledger created successfully",
    });
  } catch (error) {
    console.error("Create ledger error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create ledger",
    });
  }
});

router.put("/ledgers/:ledgerId", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const updated = await updateLedger(
      startupId,
      req.params.ledgerId,
      req.body,
      req.user?.userId
    );
    return res.json({
      success: true,
      data: updated,
      message: "Ledger updated successfully",
    });
  } catch (error) {
    console.error("Update ledger error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update ledger",
    });
  }
});

router.delete("/ledgers/:ledgerId", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    await deleteLedger(startupId, req.params.ledgerId);
    return res.json({
      success: true,
      message: "Ledger deleted successfully",
    });
  } catch (error) {
    console.error("Delete ledger error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete ledger",
    });
  }
});

// Financial Statements Routes
router.get("/trial-balance", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const asOnDate = req.query.asOnDate as string | undefined;
    const trialBalance = await getTrialBalance(startupId, asOnDate);
    return res.json({ success: true, data: trialBalance });
  } catch (error) {
    console.error("Trial balance error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate trial balance",
    });
  }
});

router.get("/profit-loss", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const pl = await getProfitAndLoss(startupId, fromDate, toDate);
    return res.json({ success: true, data: pl });
  } catch (error) {
    console.error("Profit & Loss error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate profit & loss",
    });
  }
});

router.get("/balance-sheet", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const asOnDate = req.query.asOnDate as string | undefined;
    const balanceSheet = await getBalanceSheet(startupId, asOnDate);
    return res.json({ success: true, data: balanceSheet });
  } catch (error) {
    console.error("Balance sheet error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate balance sheet",
    });
  }
});

router.get("/cash-flow", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const cashFlow = await getCashFlow(startupId, fromDate, toDate);
    return res.json({ success: true, data: cashFlow });
  } catch (error) {
    console.error("Cash flow error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to generate cash flow",
    });
  }
});

router.get("/financial-ratios", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const asOnDate = req.query.asOnDate as string | undefined;
    const ratios = await getFinancialRatios(startupId, asOnDate);
    return res.json({ success: true, data: ratios });
  } catch (error) {
    console.error("Financial ratios error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate financial ratios",
    });
  }
});

// Advanced Books & Registers Routes
router.get("/cash-book", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const cashBook = await getCashBook(startupId, fromDate, toDate);
    return res.json({ success: true, data: cashBook });
  } catch (error) {
    console.error("Cash book error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to generate cash book",
    });
  }
});

router.get("/bank-book", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const bankLedgerName = req.query.bankLedgerName as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const bankBook = await getBankBook(
      startupId,
      bankLedgerName,
      fromDate,
      toDate
    );
    return res.json({ success: true, data: bankBook });
  } catch (error) {
    console.error("Bank book error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to generate bank book",
    });
  }
});

router.get("/day-book", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const date = req.query.date as string | undefined;
    if (!date) {
      return res
        .status(400)
        .json({ success: false, message: "Date is required" });
    }

    const dayBook = await getDayBook(startupId, date);
    return res.json({ success: true, data: dayBook });
  } catch (error) {
    console.error("Day book error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to generate day book",
    });
  }
});

router.get("/ledger-book", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const ledgerName = req.query.ledgerName as string | undefined;
    if (!ledgerName) {
      return res
        .status(400)
        .json({ success: false, message: "Ledger name is required" });
    }

    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const ledgerBook = await getLedgerBook(
      startupId,
      ledgerName,
      fromDate,
      toDate
    );
    return res.json({ success: true, data: ledgerBook });
  } catch (error) {
    console.error("Ledger book error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate ledger book",
    });
  }
});

router.get("/journals", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const journalType = req.query.journalType as
      | "SALES"
      | "PURCHASE"
      | "PAYMENT"
      | "RECEIPT"
      | "CONTRA"
      | "JOURNAL"
      | undefined;

    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const journals = await getJournals(
      startupId,
      journalType,
      fromDate,
      toDate
    );
    return res.json({ success: true, data: journals });
  } catch (error) {
    console.error("Journals error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to generate journals",
    });
  }
});

// Exception Reports
router.get("/exception-reports", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const asOnDate = req.query.asOnDate as string | undefined;
    const reports = await getExceptionReports(startupId, asOnDate);
    return res.json({ success: true, data: reports });
  } catch (error) {
    console.error("Exception reports error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate exception reports",
    });
  }
});

// Cost Centre Reporting
router.get("/cost-centre-pl", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const costCentreId = req.query.costCentreId as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const report = await getCostCentrePL(
      startupId,
      costCentreId,
      fromDate,
      toDate
    );
    return res.json({ success: true, data: report });
  } catch (error) {
    console.error("Cost centre P&L error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate cost centre P&L",
    });
  }
});

// Budgeting
router.post("/budgets", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const budget = await createBudget(startupId, req.body);
    return res.json({ success: true, data: budget });
  } catch (error) {
    console.error("Create budget error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create budget",
    });
  }
});

router.get("/budgets", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const filters = {
      budgetType: req.query.budgetType as
        | "LEDGER"
        | "GROUP"
        | "COST_CENTRE"
        | undefined,
      periodStart: req.query.periodStart as string | undefined,
      periodEnd: req.query.periodEnd as string | undefined,
    };
    const budgets = await listBudgets(startupId, filters);
    return res.json({ success: true, data: budgets });
  } catch (error) {
    console.error("List budgets error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch budgets",
    });
  }
});

router.get("/budgets/variance", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const filters = {
      budgetType: req.query.budgetType as
        | "LEDGER"
        | "GROUP"
        | "COST_CENTRE"
        | undefined,
      periodStart: req.query.periodStart as string | undefined,
      periodEnd: req.query.periodEnd as string | undefined,
      includeBreaches: req.query.includeBreaches === "true",
    };
    const analytics = await getBudgetVarianceAnalytics(startupId, filters);
    return res.json({ success: true, data: analytics });
  } catch (error) {
    console.error("Budget variance analytics error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate variance analytics",
    });
  }
});

router.get("/budgets/breaches", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const asOnDate = req.query.asOnDate as string | undefined;
    const breaches = await checkBudgetBreaches(startupId, asOnDate);
    return res.json({ success: true, data: breaches });
  } catch (error) {
    console.error("Budget breaches check error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to check budget breaches",
    });
  }
});

// Year-End Operations
router.post("/year-end/closing-entries", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const result = await generateClosingEntries(startupId, {
      ...req.body,
      createdById: req.user?.userId,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Generate closing entries error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate closing entries",
    });
  }
});

router.post("/year-end/depreciation", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const result = await runDepreciation(startupId, req.body);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Run depreciation error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to run depreciation",
    });
  }
});

router.post("/year-end/carry-forward", async (req: AuthRequest, res) => {
  try {
    const startupId = req.user?.startupId;
    if (!startupId) {
      return res
        .status(400)
        .json({ success: false, message: "Startup context is required" });
    }

    const { fromFinancialYearEnd, toFinancialYearStart } = req.body;
    if (!fromFinancialYearEnd || !toFinancialYearStart) {
      return res.status(400).json({
        success: false,
        message: "fromFinancialYearEnd and toFinancialYearStart are required",
      });
    }

    const result = await carryForwardBalances(
      startupId,
      fromFinancialYearEnd,
      toFinancialYearStart
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Carry forward balances error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to carry forward balances",
    });
  }
});

export default router;
