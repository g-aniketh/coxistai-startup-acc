import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as accountsService from "./accounts.service";

export const createAccountController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { startupId } = req.user!;
    const { accountName, balance } = req.body;

    if (!accountName) {
      res.status(400).json({
        success: false,
        message: "Account name is required",
      });
      return;
    }

    if (balance !== undefined && (typeof balance !== "number" || balance < 0)) {
      res.status(400).json({
        success: false,
        message: "Balance must be a non-negative number",
      });
      return;
    }

    const account = await accountsService.createAccount(startupId, {
      accountName,
      balance,
    });

    res.status(201).json({
      success: true,
      data: account,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Create account error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const getAccountsController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { startupId } = req.user!;

    const accounts = await accountsService.getAccounts(startupId);

    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error("Get accounts error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const getAccountByIdController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { startupId } = req.user!;
    const { accountId } = req.params;

    const account = await accountsService.getAccountById(startupId, accountId);

    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error("Get account error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    res.status(404).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const updateAccountController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { startupId } = req.user!;
    const { accountId } = req.params;
    const { accountName, balance } = req.body;

    const updateData: any = {};
    if (accountName !== undefined) updateData.accountName = accountName;
    if (balance !== undefined) {
      if (typeof balance !== "number" || balance < 0) {
        res.status(400).json({
          success: false,
          message: "Balance must be a non-negative number",
        });
        return;
      }
      updateData.balance = balance;
    }

    const account = await accountsService.updateAccount(
      startupId,
      accountId,
      updateData
    );

    res.json({
      success: true,
      data: account,
      message: "Account updated successfully",
    });
  } catch (error) {
    console.error("Update account error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const deleteAccountController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { startupId } = req.user!;
    const { accountId } = req.params;

    await accountsService.deleteAccount(startupId, accountId);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }
};
