import { Prisma, PrismaClient, VoucherCategory, VoucherNumberingBehavior, VoucherNumberingMethod } from '@prisma/client';
import { prisma } from '../lib/prisma';

const DEFAULT_VOUCHER_TYPES: Array<{
  name: string;
  abbreviation?: string;
  category: VoucherCategory;
  numberingMethod?: VoucherNumberingMethod;
  numberingBehavior?: VoucherNumberingBehavior;
  prefix?: string;
  suffix?: string;
  allowManualOverride?: boolean;
  allowDuplicateNumbers?: boolean;
}> = [
  { name: 'Payment', abbreviation: 'PMT', category: 'PAYMENT', prefix: 'PMT/' },
  { name: 'Receipt', abbreviation: 'RCT', category: 'RECEIPT', prefix: 'RCT/' },
  { name: 'Contra', abbreviation: 'CTR', category: 'CONTRA', prefix: 'CTR/' },
  { name: 'Journal', abbreviation: 'JRN', category: 'JOURNAL', prefix: 'JRN/' },
  { name: 'Sales', abbreviation: 'SAL', category: 'SALES', prefix: 'SAL/' },
  { name: 'Purchase', abbreviation: 'PUR', category: 'PURCHASE', prefix: 'PUR/' },
  { name: 'Debit Note', abbreviation: 'DN', category: 'DEBIT_NOTE', prefix: 'DN/' },
  { name: 'Credit Note', abbreviation: 'CN', category: 'CREDIT_NOTE', prefix: 'CN/' },
];

const composeVoucherNumber = (prefix: string | null | undefined, sequence: number, suffix?: string | null) => {
  const base = sequence.toString();
  return `${prefix ?? ''}${base}${suffix ?? ''}`;
};

export const ensureDefaultVoucherTypes = async (client: PrismaClient, startupId: string) => {
  const existingCount = await client.voucherType.count({
    where: { startupId },
  });

  if (existingCount > 0) {
    return;
  }

  for (const definition of DEFAULT_VOUCHER_TYPES) {
    const voucherType = await client.voucherType.create({
      data: {
        startupId,
        name: definition.name,
        abbreviation: definition.abbreviation,
        category: definition.category,
        prefix: definition.prefix,
        suffix: definition.suffix,
        numberingMethod: definition.numberingMethod ?? 'AUTOMATIC',
        numberingBehavior: definition.numberingBehavior ?? 'RENUMBER',
        allowManualOverride: definition.allowManualOverride ?? false,
        allowDuplicateNumbers: definition.allowDuplicateNumbers ?? false,
        isDefault: true,
      },
    });

    await client.voucherNumberingSeries.create({
      data: {
        startupId,
        voucherTypeId: voucherType.id,
        name: 'Default',
        prefix: definition.prefix,
        suffix: definition.suffix,
        numberingMethod: voucherType.numberingMethod,
        numberingBehavior: voucherType.numberingBehavior,
        allowManualOverride: voucherType.allowManualOverride,
        allowDuplicateNumbers: voucherType.allowDuplicateNumbers,
        isDefault: true,
      },
    });
  }
};

export const listVoucherTypes = async (startupId: string) => {
  await ensureDefaultVoucherTypes(prisma, startupId);

  return prisma.voucherType.findMany({
    where: { startupId },
    orderBy: { name: 'asc' },
    include: {
      numberingSeries: {
        orderBy: { name: 'asc' },
      },
    },
  });
};

export const createVoucherType = async (
  startupId: string,
  data: {
    name: string;
    abbreviation?: string;
    category: VoucherCategory;
    numberingMethod?: VoucherNumberingMethod;
    numberingBehavior?: VoucherNumberingBehavior;
    prefix?: string;
    suffix?: string;
    allowManualOverride?: boolean;
    allowDuplicateNumbers?: boolean;
  }
) => {
  return prisma.$transaction(async (tx: any) => {
    const existing = await tx.voucherType.findFirst({
      where: { startupId, name: data.name },
    });

    if (existing) {
      throw new Error('Voucher type with this name already exists');
    }

    const voucherType = await tx.voucherType.create({
      data: {
        startupId,
        name: data.name,
        abbreviation: data.abbreviation,
        category: data.category,
        numberingMethod: data.numberingMethod ?? 'AUTOMATIC',
        numberingBehavior: data.numberingBehavior ?? 'RENUMBER',
        prefix: data.prefix,
        suffix: data.suffix,
        allowManualOverride: data.allowManualOverride ?? false,
        allowDuplicateNumbers: data.allowDuplicateNumbers ?? false,
      },
    });

    await tx.voucherNumberingSeries.create({
      data: {
        startupId,
        voucherTypeId: voucherType.id,
        name: 'Default',
        isDefault: true,
        prefix: data.prefix,
        suffix: data.suffix,
        numberingMethod: voucherType.numberingMethod,
        numberingBehavior: voucherType.numberingBehavior,
        allowManualOverride: voucherType.allowManualOverride,
        allowDuplicateNumbers: voucherType.allowDuplicateNumbers,
      },
    });

    return voucherType;
  });
};

export const updateVoucherType = async (
  startupId: string,
  voucherTypeId: string,
  data: Partial<{
    abbreviation: string | null;
    numberingMethod: VoucherNumberingMethod;
    numberingBehavior: VoucherNumberingBehavior;
    prefix: string | null;
    suffix: string | null;
    allowManualOverride: boolean;
    allowDuplicateNumbers: boolean;
    nextNumber: number;
  }>
) => {
  const voucherType = await prisma.voucherType.findFirst({
    where: { id: voucherTypeId, startupId },
  });

  if (!voucherType) {
    throw new Error('Voucher type not found');
  }

  const updateData: any = {
    abbreviation: data.abbreviation ?? voucherType.abbreviation,
    numberingMethod: data.numberingMethod ?? voucherType.numberingMethod,
    numberingBehavior: data.numberingBehavior ?? voucherType.numberingBehavior,
    prefix: data.prefix ?? voucherType.prefix,
    suffix: data.suffix ?? voucherType.suffix,
    allowManualOverride: data.allowManualOverride ?? voucherType.allowManualOverride,
    allowDuplicateNumbers: data.allowDuplicateNumbers ?? voucherType.allowDuplicateNumbers,
  };

  if (typeof data.nextNumber === 'number' && data.nextNumber >= 1) {
    updateData.nextNumber = data.nextNumber;
  }

  return prisma.voucherType.update({
    where: { id: voucherTypeId },
    data: updateData,
  });
};

export const createVoucherNumberingSeries = async (
  startupId: string,
  voucherTypeId: string,
  payload: {
    name: string;
    prefix?: string;
    suffix?: string;
    numberingMethod?: VoucherNumberingMethod;
    numberingBehavior?: VoucherNumberingBehavior;
    startNumber?: number;
    allowManualOverride?: boolean;
    allowDuplicateNumbers?: boolean;
    isDefault?: boolean;
  }
) => {
  const voucherType = await prisma.voucherType.findFirst({
    where: { id: voucherTypeId, startupId },
  });

  if (!voucherType) {
    throw new Error('Voucher type not found');
  }

  if (payload.isDefault) {
    await prisma.voucherNumberingSeries.updateMany({
      where: { voucherTypeId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.voucherNumberingSeries.create({
    data: {
      startupId,
      voucherTypeId,
      name: payload.name,
      prefix: payload.prefix,
      suffix: payload.suffix,
      numberingMethod: payload.numberingMethod ?? voucherType.numberingMethod,
      numberingBehavior: payload.numberingBehavior ?? voucherType.numberingBehavior,
      startNumber: payload.startNumber ?? 1,
      nextNumber: payload.startNumber ?? 1,
      allowManualOverride: payload.allowManualOverride ?? voucherType.allowManualOverride,
      allowDuplicateNumbers: payload.allowDuplicateNumbers ?? voucherType.allowDuplicateNumbers,
      isDefault: payload.isDefault ?? false,
    },
  });
};

export const getNextVoucherNumber = async (
  startupId: string,
  voucherTypeId: string,
  numberingSeriesId?: string | null
) => {
  return prisma.$transaction(async (tx: any) => {
    if (numberingSeriesId) {
      const series = await tx.voucherNumberingSeries.findFirst({
        where: { id: numberingSeriesId, startupId, voucherTypeId },
      });

      if (!series) {
        throw new Error('Numbering series not found');
      }

      const nextNumber = series.nextNumber;
      await tx.voucherNumberingSeries.update({
        where: { id: series.id },
        data: { nextNumber: { increment: 1 } },
      });

      return composeVoucherNumber(series.prefix, nextNumber, series.suffix);
    }

    const voucherType = await tx.voucherType.findFirst({
      where: { id: voucherTypeId, startupId },
    });

    if (!voucherType) {
      throw new Error('Voucher type not found');
    }

    const nextNumber = voucherType.nextNumber;
    await tx.voucherType.update({
      where: { id: voucherType.id },
      data: { nextNumber: { increment: 1 } },
    });

    return composeVoucherNumber(voucherType.prefix, nextNumber, voucherType.suffix);
  });
};

export { DEFAULT_VOUCHER_TYPES };
