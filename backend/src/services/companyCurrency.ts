import { prisma } from "../lib/prisma";

export interface CompanyCurrencyInput {
  baseCurrencyCode?: string;
  baseCurrencySymbol?: string;
  baseCurrencyFormalName?: string | null;
  decimalPlaces?: number;
  decimalSeparator?: string;
  thousandSeparator?: string;
  symbolOnRight?: boolean;
  spaceBetweenAmountAndSymbol?: boolean;
  showAmountInMillions?: boolean;
}

const sanitizeSeparator = (value: string, fallback: string) => {
  if (!value || value.length === 0) return fallback;
  return value.slice(0, 1);
};

export const getCompanyCurrency = async (startupId: string) => {
  return prisma.companyCurrencySetting.findUnique({
    where: { startupId },
  });
};

export const upsertCompanyCurrency = async (
  startupId: string,
  input: CompanyCurrencyInput
) => {
  const existing = await prisma.companyCurrencySetting.findUnique({
    where: { startupId },
  });

  const payload = {
    baseCurrencyCode: (
      input.baseCurrencyCode ||
      existing?.baseCurrencyCode ||
      "INR"
    ).toUpperCase(),
    baseCurrencySymbol:
      input.baseCurrencySymbol?.trim() || existing?.baseCurrencySymbol || "₹",
    baseCurrencyFormalName:
      input.baseCurrencyFormalName?.trim() ||
      existing?.baseCurrencyFormalName ||
      "Indian Rupee",
    decimalPlaces:
      typeof input.decimalPlaces === "number"
        ? Math.max(0, Math.min(6, Math.floor(input.decimalPlaces)))
        : (existing?.decimalPlaces ?? 2),
    decimalSeparator: sanitizeSeparator(
      input.decimalSeparator ?? existing?.decimalSeparator ?? ".",
      "."
    ),
    thousandSeparator: sanitizeSeparator(
      input.thousandSeparator ?? existing?.thousandSeparator ?? ",",
      ","
    ),
    symbolOnRight: input.symbolOnRight ?? existing?.symbolOnRight ?? false,
    spaceBetweenAmountAndSymbol:
      input.spaceBetweenAmountAndSymbol ??
      existing?.spaceBetweenAmountAndSymbol ??
      false,
    showAmountInMillions:
      input.showAmountInMillions ?? existing?.showAmountInMillions ?? false,
  };

  if (!existing) {
    return prisma.companyCurrencySetting.create({
      data: {
        startupId,
        ...payload,
      },
    });
  }

  return prisma.companyCurrencySetting.update({
    where: { id: existing.id },
    data: payload,
  });
};
