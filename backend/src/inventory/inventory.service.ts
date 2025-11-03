import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateProductData {
  name: string;
  quantity: number;
  price: number;
}

interface UpdateProductData {
  name?: string;
  quantity?: number;
  price?: number;
}

interface SimulateSaleData {
  productId: string;
  quantitySold: number;
  accountId: string;
}

export const createProduct = async (startupId: string, data: CreateProductData) => {
  const { name, quantity, price } = data;

  const product = await prisma.product.create({
    data: {
      name,
      quantity,
      price,
      startupId
    }
  });

  return product;
};

export const getProducts = async (startupId: string) => {
  const products = await prisma.product.findMany({
    where: { startupId },
    include: {
      sales: {
        take: 5,
        orderBy: { saleDate: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return products;
};

export const getProductById = async (startupId: string, productId: string) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      startupId
    },
    include: {
      sales: {
        orderBy: { saleDate: 'desc' }
      }
    }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  return product;
};

export const updateProduct = async (
  startupId: string, 
  productId: string, 
  data: UpdateProductData
) => {
  // Verify product belongs to startup
  const existingProduct = await prisma.product.findFirst({
    where: {
      id: productId,
      startupId
    }
  });

  if (!existingProduct) {
    throw new Error('Product not found');
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data
  });

  return product;
};

export const deleteProduct = async (startupId: string, productId: string) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      startupId
    }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  await prisma.product.delete({
    where: { id: productId }
  });

  return { success: true };
};

export const simulateSale = async (startupId: string, data: SimulateSaleData) => {
  const { productId, quantitySold, accountId } = data;

  // Verify product belongs to startup
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      startupId
    }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Check if enough quantity available
  if (product.quantity < quantitySold) {
    throw new Error(`Insufficient quantity. Available: ${product.quantity}, Requested: ${quantitySold}`);
  }

  // Verify account belongs to startup
  const account = await prisma.mockBankAccount.findFirst({
    where: {
      id: accountId,
      startupId
    }
  });

  if (!account) {
    throw new Error('Bank account not found');
  }

  const totalPrice = Number(product.price) * Number(quantitySold);

  // Use a transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Create transaction (CREDIT for income)
    const transaction = await tx.transaction.create({
      data: {
        amount: Number(totalPrice),
        type: 'CREDIT',
        description: `Sale of ${quantitySold}x ${product.name}`,
        startupId,
        accountId,
        date: new Date()
      }
    });

    // Create sale record
    const sale = await tx.sale.create({
      data: {
        quantitySold: Number(quantitySold),
        totalPrice: Number(totalPrice),
        startupId,
        productId,
        transactionId: transaction.id,
        saleDate: new Date()
      }
    });

    // Update product quantity
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        quantity: Number(product.quantity) - Number(quantitySold)
      }
    });

    // Update account balance atomically (sales are CREDIT/income)
    await tx.mockBankAccount.update({
      where: { id: accountId },
      data: {
        balance: { increment: Number(totalPrice) }
      }
    });

    return { sale, transaction, product: updatedProduct };
  });

  return result;
};

export const getSales = async (startupId: string, limit?: number) => {
  const sales = await prisma.sale.findMany({
    where: { startupId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true
        }
      },
      transaction: {
        select: {
          id: true,
          amount: true,
          date: true
        }
      }
    },
    orderBy: { saleDate: 'desc' },
    take: limit
  });

  return sales;
};

