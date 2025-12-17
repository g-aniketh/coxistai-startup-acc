import { Prisma, AuditAction, AuditEntityType } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface CreateAuditLogInput {
  startupId: string;
  userId?: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  description?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export const createAuditLog = async (input: CreateAuditLogInput) => {
  const {
    startupId,
    userId,
    entityType,
    entityId,
    action,
    description,
    oldValues,
    newValues,
    metadata,
    ipAddress,
    userAgent,
  } = input;

  // Check if edit log is enabled for this startup
  const fiscalConfig = await prisma.companyFiscalConfig.findUnique({
    where: { startupId },
    select: { enableEditLog: true },
  });

  // If explicit config disables edit log, skip (except for critical actions)
  const criticalActions: AuditAction[] = [
    AuditAction.DELETE,
    AuditAction.APPROVE,
    AuditAction.REJECT,
  ];
  const editLogExplicitlyDisabled =
    fiscalConfig !== null && fiscalConfig.enableEditLog === false;

  if (editLogExplicitlyDisabled && !criticalActions.includes(action)) {
    return null;
  }

  return prisma.auditLog.create({
    data: {
      startupId,
      userId: userId || null,
      entityType,
      entityId,
      action,
      description: description || null,
      oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
      newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

/**
 * List audit logs with filtering
 */
export const listAuditLogs = async (
  startupId: string,
  filters?: {
    entityType?: AuditEntityType;
    entityId?: string;
    action?: AuditAction;
    userId?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }
) => {
  const where: Prisma.AuditLogWhereInput = {
    startupId,
  };

  if (filters?.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters?.entityId) {
    where.entityId = filters.entityId;
  }

  if (filters?.action) {
    where.action = filters.action;
  }

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.fromDate || filters?.toDate) {
    where.createdAt = {};
    if (filters.fromDate) {
      where.createdAt.gte = new Date(filters.fromDate);
    }
    if (filters.toDate) {
      where.createdAt.lte = new Date(filters.toDate);
    }
  }

  const limit = Math.min(filters?.limit ?? 50, 200);
  const offset = filters?.offset ?? 0;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
};

/**
 * Get audit log for a specific entity
 */
export const getEntityAuditLog = async (
  startupId: string,
  entityType: AuditEntityType,
  entityId: string
) => {
  return prisma.auditLog.findMany({
    where: {
      startupId,
      entityType,
      entityId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Get audit log summary (counts by action, entity type, etc.)
 */
export const getAuditLogSummary = async (
  startupId: string,
  fromDate?: string,
  toDate?: string
) => {
  const where: Prisma.AuditLogWhereInput = {
    startupId,
  };

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) {
      where.createdAt.gte = new Date(fromDate);
    }
    if (toDate) {
      where.createdAt.lte = new Date(toDate);
    }
  }

  const [totalLogs, byAction, byEntityType, recentActivity] = await Promise.all(
    [
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ["action"],
        where,
        _count: { action: true },
      }),
      prisma.auditLog.groupBy({
        by: ["entityType"],
        where,
        _count: { entityType: true },
      }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]
  );

  return {
    totalLogs,
    byAction: byAction.map((item) => ({
      action: item.action,
      count: item._count.action,
    })),
    byEntityType: byEntityType.map((item) => ({
      entityType: item.entityType,
      count: item._count.entityType,
    })),
    recentActivity,
  };
};

/**
 * Helper function to extract changed fields between old and new objects
 */
export const getChangedFields = (
  oldValues: any,
  newValues: any
): Record<string, { old: any; new: any }> => {
  const changes: Record<string, { old: any; new: any }> = {};
  const allKeys = new Set([
    ...Object.keys(oldValues || {}),
    ...Object.keys(newValues || {}),
  ]);

  for (const key of allKeys) {
    const oldVal = oldValues?.[key];
    const newVal = newValues?.[key];

    // Deep comparison (simplified - for production, use a proper deep equality check)
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { old: oldVal, new: newVal };
    }
  }

  return changes;
};
