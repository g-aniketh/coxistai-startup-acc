import { prisma } from "../lib/prisma";

export interface PartyInput {
  name: string;
  type: string;
  email?: string;
  phone?: string;
  openingBalance?: number;
  balanceType?: string;
}

const ALLOWED_PARTY_TYPES = ["Customer", "Supplier", "Employee", "Other"];
const ALLOWED_BALANCE_TYPES = ["Debit", "Credit"];

export const listParties = async (startupId: string) => {
  return prisma.partyMaster.findMany({
    where: { startupId },
    orderBy: { createdAt: "desc" },
  });
};

export const createParty = async (startupId: string, data: PartyInput) => {
  if (!data.name?.trim()) {
    throw new Error("Party name is required");
  }

  const partyType =
    ALLOWED_PARTY_TYPES.find(
      (option) => option.toLowerCase() === (data.type || "").toLowerCase()
    ) || "Customer";

  const normalizedBalanceType =
    ALLOWED_BALANCE_TYPES.find(
      (option) =>
        option.toLowerCase() === (data.balanceType || "").toLowerCase()
    ) || "Debit";

  const existing = await prisma.partyMaster.findFirst({
    where: {
      startupId,
      name: data.name.trim(),
    },
  });

  if (existing) {
    throw new Error("A party with this name already exists");
  }

  return prisma.partyMaster.create({
    data: {
      startupId,
      name: data.name.trim(),
      type: partyType,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      openingBalance: data.openingBalance ?? 0,
      balanceType: normalizedBalanceType,
    },
  });
};
