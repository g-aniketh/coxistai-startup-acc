import { prisma } from '../lib/prisma';

export interface CompanyFiscalInput {
  financialYearStart: string;
  booksStart: string;
  allowBackdatedEntries?: boolean;
  backdatedFrom?: string | null;
  enableEditLog?: boolean;
}

const parseDate = (value: string, field: string): Date => {
  if (!value) {
    throw new Error(`${field} is required`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date provided for ${field}`);
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

export const getCompanyFiscal = async (startupId: string) => {
  return prisma.companyFiscalConfig.findUnique({
    where: { startupId },
  });
};

export const upsertCompanyFiscal = async (startupId: string, input: CompanyFiscalInput) => {
  const financialYearStart = parseDate(input.financialYearStart, 'Financial year beginning');
  const booksStart = parseDate(input.booksStart, 'Books beginning from');

  if (booksStart < financialYearStart) {
    throw new Error('Books start date cannot be earlier than the financial year start');
  }

  const allowBackdatedEntries = input.allowBackdatedEntries ?? true;
  let backdatedFromDate: Date | null = null;

  if (allowBackdatedEntries) {
    const backdatedSource = input.backdatedFrom ?? input.financialYearStart;
    backdatedFromDate = parseDate(backdatedSource, 'Back-dated entries start');

    if (backdatedFromDate < financialYearStart) {
      throw new Error('Back-dated entries start cannot be earlier than the financial year start');
    }

    if (backdatedFromDate > booksStart) {
      throw new Error('Back-dated entries start cannot be later than the books start date');
    }
  }

  const enableEditLog = input.enableEditLog ?? false;

  const existing = await prisma.companyFiscalConfig.findUnique({
    where: { startupId },
  });

  if (!existing) {
    return prisma.companyFiscalConfig.create({
      data: {
        startupId,
        financialYearStart,
        booksStart,
        allowBackdatedEntries,
        backdatedFrom: backdatedFromDate,
        enableEditLog,
      },
    });
  }

  return prisma.companyFiscalConfig.update({
    where: { id: existing.id },
    data: {
      financialYearStart,
      booksStart,
      allowBackdatedEntries,
      backdatedFrom: allowBackdatedEntries ? backdatedFromDate : null,
      enableEditLog,
    },
  });
};
