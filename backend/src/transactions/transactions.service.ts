import { PrismaClient, TransactionType, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

interface CreateTransactionData {
  amount: number;
  type: TransactionType;
  description: string;
  accountId: string;
}

export const createTransaction = async (
  startupId: string,
  data: CreateTransactionData
) => {
  const { amount, type, description, accountId } = data;

  // Verify account belongs to this startup
  const account = await prisma.mockBankAccount.findFirst({
    where: {
      id: accountId,
      startupId,
    },
  });

  if (!account) {
    throw new Error(
      "Bank account not found or does not belong to your startup"
    );
  }

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      amount: Number(amount),
      type,
      description,
      startupId,
      accountId,
      date: new Date(),
    },
  });

  // Update account balance atomically (CREDIT increases, DEBIT decreases)
  const balanceChange = type === "CREDIT" ? Number(amount) : -Number(amount);
  await prisma.mockBankAccount.update({
    where: { id: accountId },
    data: {
      balance: { increment: balanceChange },
    },
  });

  return transaction;
};

export const getTransactions = async (
  startupId: string,
  filters?: {
    accountId?: string;
    type?: TransactionType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) => {
  const where: Prisma.TransactionWhereInput = { startupId };

  if (filters?.accountId) {
    where.accountId = filters.accountId;
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.startDate || filters?.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate;
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            accountName: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total };
};

export const getTransactionById = async (
  startupId: string,
  transactionId: string
) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      startupId,
    },
    include: {
      account: true,
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};

export const deleteTransaction = async (
  startupId: string,
  transactionId: string
) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      startupId,
    },
    include: {
      account: true,
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  // Reverse the balance change atomically
  const balanceChange =
    transaction.type === "CREDIT"
      ? -Number(transaction.amount)
      : Number(transaction.amount);
  await prisma.mockBankAccount.update({
    where: { id: transaction.accountId },
    data: {
      balance: { increment: balanceChange },
    },
  });

  // Delete transaction
  await prisma.transaction.delete({
    where: { id: transactionId },
  });

  return { success: true };
};
