import { Router } from "express";
import { authenticateToken, checkPermission } from "../middleware/auth";
import {
  createTransactionController,
  getTransactionsController,
  getTransactionByIdController,
  deleteTransactionController,
} from "./transactions.controller";

const router = Router();

// Create a new transaction
router.post(
  "/",
  authenticateToken,
  checkPermission({ action: "manage", subject: "transactions" }),
  createTransactionController
);

// Get all transactions for the startup
router.get(
  "/",
  authenticateToken,
  checkPermission({ action: "read", subject: "cashflow_dashboard" }),
  getTransactionsController
);

// Get a specific transaction by ID
router.get(
  "/:transactionId",
  authenticateToken,
  checkPermission({ action: "read", subject: "transactions" }),
  getTransactionByIdController
);

// Delete a transaction
router.delete(
  "/:transactionId",
  authenticateToken,
  checkPermission({ action: "manage", subject: "transactions" }),
  deleteTransactionController
);

export default router;
