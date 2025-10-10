import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as transactionService from './transactions.service';
import { TransactionType } from '@prisma/client';

export const createTransactionController = async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user;
    const { amount, type, description, accountId } = req.body;

    // Validation
    if (!amount || !type || !description || !accountId) {
      return res.status(400).json({
        success: false,
        message: 'Amount, type, description, and accountId are required'
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    if (!['CREDIT', 'DEBIT'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either CREDIT or DEBIT'
      });
    }

    const transaction = await transactionService.createTransaction(startupId, {
      amount,
      type: type as TransactionType,
      description,
      accountId
    });

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
};

export const getTransactionsController = async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user;
    const { 
      accountId, 
      type, 
      startDate, 
      endDate, 
      limit, 
      offset 
    } = req.query;

    const filters: any = {};

    if (accountId) {
      filters.accountId = accountId as string;
    }

    if (type) {
      filters.type = type as TransactionType;
    }

    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }

    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    if (limit) {
      filters.limit = parseInt(limit as string, 10);
    }

    if (offset) {
      filters.offset = parseInt(offset as string, 10);
    }

    const result = await transactionService.getTransactions(startupId, filters);

    res.json({
      success: true,
      data: result.transactions,
      pagination: {
        total: result.total,
        limit: filters.limit || 50,
        offset: filters.offset || 0
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

export const getTransactionByIdController = async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user;
    const { transactionId } = req.params;

    const transaction = await transactionService.getTransactionById(startupId, transactionId);

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(404).json({
      success: false,
      message: errorMessage
    });
  }
};

export const deleteTransactionController = async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user;
    const { transactionId } = req.params;

    await transactionService.deleteTransaction(startupId, transactionId);

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
};

