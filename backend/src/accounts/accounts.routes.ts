import { Router } from "express";
import { authenticateToken, checkPermission } from "../middleware/auth";
import {
  createAccountController,
  getAccountsController,
  getAccountByIdController,
  updateAccountController,
  deleteAccountController,
} from "./accounts.controller";

const router = Router();

// Create a new mock bank account
router.post(
  "/",
  authenticateToken,
  checkPermission({ action: "manage", subject: "billing" }),
  createAccountController
);

// Get all accounts for the startup
router.get(
  "/",
  authenticateToken,
  checkPermission({ action: "read", subject: "cashflow_dashboard" }),
  getAccountsController
);

// Get a specific account by ID
router.get(
  "/:accountId",
  authenticateToken,
  checkPermission({ action: "read", subject: "cashflow_dashboard" }),
  getAccountByIdController
);

// Update an account
router.put(
  "/:accountId",
  authenticateToken,
  checkPermission({ action: "manage", subject: "billing" }),
  updateAccountController
);

// Delete an account
router.delete(
  "/:accountId",
  authenticateToken,
  checkPermission({ action: "manage", subject: "billing" }),
  deleteAccountController
);

export default router;
