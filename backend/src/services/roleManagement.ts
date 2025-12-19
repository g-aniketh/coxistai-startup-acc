import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

/**
 * List all roles with their permissions
 */
export const listRoles = async (startupId?: string) => {
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        select: {
          id: true,
          action: true,
          subject: true,
          description: true,
        },
      },
      users: {
        ...(startupId ? { where: { user: { startupId } } } : {}),
        select: { userId: true },
      },
    },
    orderBy: { name: "asc" },
  });

  type RoleWithRelations = Prisma.RoleGetPayload<{
    include: {
      permissions: {
        select: {
          id: true;
          action: true;
          subject: true;
          description: true;
        };
      };
      users: {
        select: {
          userId: true;
        };
      };
    };
  }>;

  return roles.map(({ users, ...rest }: RoleWithRelations) => ({
    ...rest,
    _count: {
      users: users.length,
    },
  }));
};

/**
 * Get a single role by ID with permissions
 */
export const getRole = async (roleId: string) => {
  return prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        select: {
          id: true,
          action: true,
          subject: true,
          description: true,
        },
      },
      users: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Create a new role
 */
export const createRole = async (data: {
  name: string;
  description?: string;
  permissionIds?: string[];
}) => {
  const { name, description, permissionIds = [] } = data;

  // Check if role already exists
  const existing = await prisma.role.findUnique({
    where: { name },
  });

  if (existing) {
    throw new Error("Role with this name already exists");
  }

  return prisma.role.create({
    data: {
      name,
      description: description || null,
      permissions: {
        connect: permissionIds.map((id) => ({ id })),
      },
    },
    include: {
      permissions: {
        select: {
          id: true,
          action: true,
          subject: true,
          description: true,
        },
      },
    },
  });
};

/**
 * Update a role
 */
export const updateRole = async (
  roleId: string,
  data: { name?: string; description?: string; permissionIds?: string[] }
) => {
  const { name, description, permissionIds } = data;

  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  // If name is being changed, check if new name already exists
  if (name && name !== role.name) {
    const existing = await prisma.role.findUnique({
      where: { name },
    });

    if (existing) {
      throw new Error("Role with this name already exists");
    }
  }

  const updateData: Prisma.RoleUpdateInput = {};

  if (name !== undefined) {
    updateData.name = name;
  }

  if (description !== undefined) {
    updateData.description = description || null;
  }

  if (permissionIds !== undefined) {
    // Replace all permissions
    updateData.permissions = {
      set: permissionIds.map((id) => ({ id })),
    };
  }

  return prisma.role.update({
    where: { id: roleId },
    data: updateData,
    include: {
      permissions: {
        select: {
          id: true,
          action: true,
          subject: true,
          description: true,
        },
      },
    },
  });
};

/**
 * Delete a role (only if no users have it)
 */
export const deleteRole = async (roleId: string) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  if (role._count.users > 0) {
    throw new Error("Cannot delete role that is assigned to users");
  }

  await prisma.role.delete({
    where: { id: roleId },
  });

  return { success: true, message: "Role deleted successfully" };
};

/**
 * List all permissions
 */
export const listPermissions = async () => {
  return prisma.permission.findMany({
    include: {
      _count: {
        select: {
          roles: true,
        },
      },
    },
    orderBy: [{ subject: "asc" }, { action: "asc" }],
  });
};

/**
 * Get a single permission by ID
 */
export const getPermission = async (permissionId: string) => {
  return prisma.permission.findUnique({
    where: { id: permissionId },
    include: {
      roles: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });
};

/**
 * Create a new permission
 */
export const createPermission = async (data: {
  action: string;
  subject: string;
  description?: string;
}) => {
  const { action, subject, description } = data;

  // Check if permission already exists
  const existing = await prisma.permission.findUnique({
    where: {
      action_subject: {
        action,
        subject,
      },
    },
  });

  if (existing) {
    throw new Error("Permission with this action and subject already exists");
  }

  return prisma.permission.create({
    data: {
      action,
      subject,
      description: description || null,
    },
  });
};

/**
 * Update a permission
 */
export const updatePermission = async (
  permissionId: string,
  data: { action?: string; subject?: string; description?: string }
) => {
  const { action, subject, description } = data;

  const permission = await prisma.permission.findUnique({
    where: { id: permissionId },
  });

  if (!permission) {
    throw new Error("Permission not found");
  }

  // If action or subject is being changed, check if new combination already exists
  const newAction = action || permission.action;
  const newSubject = subject || permission.subject;

  if (newAction !== permission.action || newSubject !== permission.subject) {
    const existing = await prisma.permission.findUnique({
      where: {
        action_subject: {
          action: newAction,
          subject: newSubject,
        },
      },
    });

    if (existing && existing.id !== permissionId) {
      throw new Error("Permission with this action and subject already exists");
    }
  }

  return prisma.permission.update({
    where: { id: permissionId },
    data: {
      action: newAction,
      subject: newSubject,
      description: description !== undefined ? description || null : undefined,
    },
  });
};

/**
 * Delete a permission
 */
export const deletePermission = async (permissionId: string) => {
  const permission = await prisma.permission.findUnique({
    where: { id: permissionId },
    include: {
      _count: {
        select: {
          roles: true,
        },
      },
    },
  });

  if (!permission) {
    throw new Error("Permission not found");
  }

  if (permission._count.roles > 0) {
    throw new Error("Cannot delete permission that is assigned to roles");
  }

  await prisma.permission.delete({
    where: { id: permissionId },
  });

  return { success: true, message: "Permission deleted successfully" };
};

/**
 * Get all users in a startup with their roles
 */
export const getUsersWithRoles = async (startupId: string) => {
  return prisma.user.findMany({
    where: { startupId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                select: {
                  id: true,
                  action: true,
                  subject: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Assign role to user
 */
export const assignRoleToUser = async (userId: string, roleId: string) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if role exists
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  // Check if already assigned
  const existing = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  });

  if (existing) {
    throw new Error("Role is already assigned to this user");
  }

  return prisma.userRole.create({
    data: {
      userId,
      roleId,
    },
    include: {
      role: {
        include: {
          permissions: {
            select: {
              id: true,
              action: true,
              subject: true,
            },
          },
        },
      },
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
 * Remove role from user
 */
export const removeRoleFromUser = async (userId: string, roleId: string) => {
  const userRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  });

  if (!userRole) {
    throw new Error("Role is not assigned to this user");
  }

  await prisma.userRole.delete({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  });

  return { success: true, message: "Role removed from user successfully" };
};

/**
 * Replace all roles for a user
 */
export const setUserRoles = async (userId: string, roleIds: string[]) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Verify all roles exist
  const roles = await prisma.role.findMany({
    where: {
      id: {
        in: roleIds,
      },
    },
  });

  if (roles.length !== roleIds.length) {
    throw new Error("One or more roles not found");
  }

  // Remove all existing roles and assign new ones
  await prisma.userRole.deleteMany({
    where: { userId },
  });

  if (roleIds.length > 0) {
    await prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId,
        roleId,
      })),
    });
  }

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                select: {
                  id: true,
                  action: true,
                  subject: true,
                },
              },
            },
          },
        },
      },
    },
  });
};
