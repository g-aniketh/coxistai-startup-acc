import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

export interface CompanySecurityInput {
  tallyVaultEnabled?: boolean;
  newTallyVaultPassword?: string;
  currentTallyVaultPassword?: string;
  tallyVaultPasswordHint?: string | null;
  userAccessControlEnabled?: boolean;
  multiFactorRequired?: boolean;
}

const SALT_ROUNDS = 10;

export const getCompanySecurity = async (startupId: string) => {
  return prisma.companySecuritySetting.findUnique({
    where: { startupId },
  });
};

export const upsertCompanySecurity = async (
  startupId: string,
  input: CompanySecurityInput
) => {
  const existing = await prisma.companySecuritySetting.findUnique({
    where: { startupId },
  });

  if (!existing) {
    const toCreate = {
      tallyVaultEnabled: input.tallyVaultEnabled ?? false,
      tallyVaultPasswordHash: input.newTallyVaultPassword
        ? await bcrypt.hash(input.newTallyVaultPassword, SALT_ROUNDS)
        : null,
      tallyVaultPasswordHint: input.tallyVaultPasswordHint || null,
      userAccessControlEnabled: input.userAccessControlEnabled ?? false,
      multiFactorRequired: input.multiFactorRequired ?? false,
    };

    if (toCreate.tallyVaultEnabled && !input.newTallyVaultPassword) {
      throw new Error('TallyVault password is required when enabling encryption');
    }

    return prisma.companySecuritySetting.create({
      data: {
        startupId,
        ...toCreate,
      },
    });
  }

  let tallyVaultPasswordHash = existing.tallyVaultPasswordHash;
  let tallyVaultEnabled = existing.tallyVaultEnabled;

  if (typeof input.tallyVaultEnabled === 'boolean' && input.tallyVaultEnabled !== existing.tallyVaultEnabled) {
    if (input.tallyVaultEnabled) {
      if (!input.newTallyVaultPassword) {
        throw new Error('New TallyVault password is required to enable encryption');
      }
      tallyVaultPasswordHash = await bcrypt.hash(input.newTallyVaultPassword, SALT_ROUNDS);
      tallyVaultEnabled = true;
    } else {
      if (existing.tallyVaultEnabled) {
        if (!input.currentTallyVaultPassword) {
          throw new Error('Current TallyVault password is required to disable encryption');
        }
        const valid = await bcrypt.compare(input.currentTallyVaultPassword, existing.tallyVaultPasswordHash || '');
        if (!valid) {
          throw new Error('Invalid current TallyVault password');
        }
      }
      tallyVaultPasswordHash = null;
      tallyVaultEnabled = false;
    }
  }

  if (input.newTallyVaultPassword && tallyVaultEnabled) {
    if (!input.currentTallyVaultPassword) {
      throw new Error('Current TallyVault password is required to rotate encryption password');
    }
    const valid = await bcrypt.compare(input.currentTallyVaultPassword, existing.tallyVaultPasswordHash || '');
    if (!valid) {
      throw new Error('Invalid current TallyVault password');
    }
    tallyVaultPasswordHash = await bcrypt.hash(input.newTallyVaultPassword, SALT_ROUNDS);
  }

  return prisma.companySecuritySetting.update({
    where: { id: existing.id },
    data: {
      tallyVaultEnabled,
      tallyVaultPasswordHash,
      tallyVaultPasswordHint: typeof input.tallyVaultPasswordHint === 'undefined'
        ? existing.tallyVaultPasswordHint
        : input.tallyVaultPasswordHint,
      userAccessControlEnabled: typeof input.userAccessControlEnabled === 'undefined'
        ? existing.userAccessControlEnabled
        : input.userAccessControlEnabled,
      multiFactorRequired: typeof input.multiFactorRequired === 'undefined'
        ? existing.multiFactorRequired
        : input.multiFactorRequired,
    },
  });
};
