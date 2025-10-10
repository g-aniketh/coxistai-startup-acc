import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateAccountData {
  accountName: string;
  balance?: number;
}

export const createAccount = async (startupId: string, data: CreateAccountData) => {
  const { accountName, balance = 0 } = data;

  const account = await prisma.mockBankAccount.create({
    data: {
      accountName,
      balance,
      startupId
    }
  });

  return account;
};

export const getAccounts = async (startupId: string) => {
  const accounts = await prisma.mockBankAccount.findMany({
    where: { startupId },
    include: {
      transactions: {
        take: 10,
        orderBy: { date: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return accounts;
};

export const getAccountById = async (startupId: string, accountId: string) => {
  const account = await prisma.mockBankAccount.findFirst({
    where: {
      id: accountId,
      startupId
    },
    include: {
      transactions: {
        orderBy: { date: 'desc' }
      }
    }
  });

  if (!account) {
    throw new Error('Account not found');
  }

  return account;
};

export const updateAccount = async (
  startupId: string,
  accountId: string,
  data: { accountName?: string; balance?: number }
) => {
  const existingAccount = await prisma.mockBankAccount.findFirst({
    where: {
      id: accountId,
      startupId
    }
  });

  if (!existingAccount) {
    throw new Error('Account not found');
  }

  const account = await prisma.mockBankAccount.update({
    where: { id: accountId },
    data
  });

  return account;
};

export const deleteAccount = async (startupId: string, accountId: string) => {
  const account = await prisma.mockBankAccount.findFirst({
    where: {
      id: accountId,
      startupId
    }
  });

  if (!account) {
    throw new Error('Account not found');
  }

  // Check if there are transactions linked
  const transactionCount = await prisma.transaction.count({
    where: { accountId }
  });

  if (transactionCount > 0) {
    throw new Error('Cannot delete account with existing transactions');
  }

  await prisma.mockBankAccount.delete({
    where: { id: accountId }
  });

  return { success: true };
};

