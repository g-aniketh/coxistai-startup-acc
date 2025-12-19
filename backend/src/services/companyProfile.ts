import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface CompanyAddressInput {
  id?: string;
  label?: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isPrimary?: boolean;
  isBilling?: boolean;
  isShipping?: boolean;
}

export interface CompanyProfileInput {
  displayName: string;
  legalName?: string | null;
  mailingName?: string | null;
  baseCurrency?: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  website?: string | null;
  addresses?: CompanyAddressInput[];
}

export const getCompanyProfile = async (startupId: string) => {
  return prisma.companyProfile.findUnique({
    where: { startupId },
    include: { addresses: { orderBy: { createdAt: "asc" } } },
  });
};

export const upsertCompanyProfile = async (
  startupId: string,
  input: CompanyProfileInput
) => {
  const {
    displayName,
    legalName,
    mailingName,
    baseCurrency,
    country,
    state,
    city,
    postalCode,
    phone,
    mobile,
    email,
    website,
    addresses = [],
  } = input;

  if (!displayName?.trim()) {
    throw new Error("Display name is required");
  }

  const sanitizedAddresses = addresses
    .map((address) => ({
      ...address,
      line1: address.line1?.trim() ?? "",
      label: address.label?.trim() || undefined,
      line2: address.line2?.trim() || undefined,
      city: address.city?.trim() || undefined,
      state: address.state?.trim() || undefined,
      country: address.country?.trim() || undefined,
      postalCode: address.postalCode?.trim() || undefined,
      isPrimary: address.isPrimary ?? false,
      isBilling: address.isBilling ?? false,
      isShipping: address.isShipping ?? false,
    }))
    .filter((address) => address.line1.length > 0);

  if (
    sanitizedAddresses.length &&
    !sanitizedAddresses.some((addr) => addr.isPrimary)
  ) {
    sanitizedAddresses[0].isPrimary = true;
  }

  const addressIdsToKeep = sanitizedAddresses
    .map((address) => address.id)
    .filter((id): id is string => Boolean(id));

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existingProfile = await tx.companyProfile.findUnique({
      where: { startupId },
      include: { addresses: true },
    });

    if (!existingProfile) {
      const createdProfile = await tx.companyProfile.create({
        data: {
          startupId,
          displayName: displayName.trim(),
          legalName: legalName?.trim() || null,
          mailingName: mailingName?.trim() || null,
          baseCurrency: baseCurrency?.trim() || "INR",
          country: country?.trim() || null,
          state: state?.trim() || null,
          city: city?.trim() || null,
          postalCode: postalCode?.trim() || null,
          phone: phone?.trim() || null,
          mobile: mobile?.trim() || null,
          email: email?.trim() || null,
          website: website?.trim() || null,
          addresses: sanitizedAddresses.length
            ? {
                create: sanitizedAddresses.map(({ id: _id, ...data }) => ({
                  ...data,
                  isPrimary: data.isPrimary ?? false,
                })),
              }
            : undefined,
        },
        include: { addresses: { orderBy: { createdAt: "asc" } } },
      });

      return createdProfile;
    }

    await tx.companyProfile.update({
      where: { id: existingProfile.id },
      data: {
        displayName: displayName.trim(),
        legalName: legalName?.trim() || null,
        mailingName: mailingName?.trim() || null,
        baseCurrency: baseCurrency?.trim() || existingProfile.baseCurrency,
        country: country?.trim() || null,
        state: state?.trim() || null,
        city: city?.trim() || null,
        postalCode: postalCode?.trim() || null,
        phone: phone?.trim() || null,
        mobile: mobile?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
      },
    });

    // Delete removed addresses
    await tx.companyAddress.deleteMany({
      where: addressIdsToKeep.length
        ? {
            profileId: existingProfile.id,
            id: { notIn: addressIdsToKeep },
          }
        : { profileId: existingProfile.id },
    });

    // Upsert provided addresses
    for (const [index, address] of sanitizedAddresses.entries()) {
      const { id, ...addressData } = address;

      const createData: Prisma.CompanyAddressUncheckedCreateInput = {
        profileId: existingProfile.id,
        label: addressData.label ?? null,
        line1: addressData.line1,
        line2: addressData.line2 ?? null,
        city: addressData.city ?? null,
        state: addressData.state ?? null,
        country: addressData.country ?? null,
        postalCode: addressData.postalCode ?? null,
        isPrimary: index === 0 ? true : !!addressData.isPrimary,
        isBilling: !!addressData.isBilling,
        isShipping: !!addressData.isShipping,
      };

      if (id) {
        const { profileId: _profileId, ...updateData } = createData;
        await tx.companyAddress.update({
          where: { id },
          data: updateData,
        });
      } else {
        await tx.companyAddress.create({ data: createData });
      }
    }

    // Ensure there is always a primary address
    const addressCount = await tx.companyAddress.count({
      where: { profileId: existingProfile.id, isPrimary: true },
    });

    if (addressCount === 0) {
      const firstAddress = await tx.companyAddress.findFirst({
        where: { profileId: existingProfile.id },
        orderBy: { createdAt: "asc" },
      });

      if (firstAddress) {
        await tx.companyAddress.update({
          where: { id: firstAddress.id },
          data: { isPrimary: true },
        });
      }
    }

    return tx.companyProfile.findUnique({
      where: { id: existingProfile.id },
      include: { addresses: { orderBy: { createdAt: "asc" } } },
    });
  });
};
