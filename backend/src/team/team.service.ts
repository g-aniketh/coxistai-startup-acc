import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const prisma = new PrismaClient();

// Initialize Resend only if API key is provided
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  try {
    resend = new Resend(process.env.RESEND_API_KEY);
  } catch (error) {
    console.warn("Failed to initialize Resend email service:", error);
    resend = null;
  }
} else {
  console.warn(
    "RESEND_API_KEY not provided. Email functionality will be disabled."
  );
}

interface InviteTeamMemberData {
  email: string;
  roleName: string;
  firstName?: string;
  lastName?: string;
}

interface UpdateUserRoleData {
  roleName: string;
}

export const inviteTeamMember = async (
  adminUserId: string,
  startupId: string,
  data: InviteTeamMemberData
) => {
  const { email, roleName, firstName, lastName } = data;

  // Verify admin belongs to startup and has permission
  const adminUser = await prisma.user.findUnique({
    where: { id: adminUserId },
    include: {
      startup: true,
      roles: {
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      },
    },
  });

  if (!adminUser || adminUser.startupId !== startupId) {
    throw new Error("Unauthorized");
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Verify role exists
  const role = await prisma.role.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  // Don't allow creating another Admin via invite
  if (roleName === "Admin") {
    throw new Error(
      "Cannot invite another Admin. Use team member creation instead."
    );
  }

  // Generate temporary password
  const tempPassword =
    Math.random().toString(36).slice(-10) +
    Math.random().toString(36).slice(-10);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      startupId,
      isActive: true,
      roles: {
        create: {
          roleId: role.id,
        },
      },
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  // Send invitation email via Resend (if available)
  try {
    if (resend) {
      await resend.emails.send({
        from: "CoXist AI <noreply@coxistai.com>",
        to: [email],
        subject: `You've been invited to join ${adminUser.startup.name} on CoXist AI`,
        html: `
          <h1>Welcome to CoXist AI!</h1>
          <p>You've been invited by ${
            adminUser.firstName || adminUser.email
          } to join <strong>${
            adminUser.startup.name
          }</strong> as a ${roleName}.</p>
          <p><strong>Your temporary login credentials:</strong></p>
          <p>Email: ${email}</p>
          <p>Temporary Password: <code>${tempPassword}</code></p>
          <p><strong>Please change your password after your first login.</strong></p>
          <p>Login at: <a href="${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login">${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login</a></p>
          <p>Best regards,<br/>The CoXist AI Team</p>
        `,
      });
      console.log(`Invitation email sent to ${email}`);
    } else {
      console.log(
        `Email service not available. User ${email} created with temp password: ${tempPassword}`
      );
    }
  } catch (emailError) {
    console.error("Failed to send invitation email:", emailError);
    // Don't fail the user creation if email fails
  }

  return {
    id: newUser.id,
    email: newUser.email,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    roles: newUser.roles.map((ur) => ur.role.name),
    isActive: newUser.isActive,
    tempPassword, // Return temp password in case email fails
  };
};

export const getTeamMembers = async (startupId: string) => {
  const users = await prisma.user.findMany({
    where: { startupId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  type UserWithRoles = Prisma.UserGetPayload<{
    include: {
      roles: {
        include: {
          role: true;
        };
      };
    };
  }>;

  return users.map((user: UserWithRoles) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles.map((ur) => ur.role.name),
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
};

export const updateUserRole = async (
  adminUserId: string,
  startupId: string,
  userId: string,
  data: UpdateUserRoleData
) => {
  const { roleName } = data;

  // Verify admin belongs to startup
  const adminUser = await prisma.user.findUnique({
    where: { id: adminUserId },
  });

  if (!adminUser || adminUser.startupId !== startupId) {
    throw new Error("Unauthorized");
  }

  // Verify target user belongs to same startup
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
    },
  });

  if (!targetUser || targetUser.startupId !== startupId) {
    throw new Error("User not found or does not belong to your startup");
  }

  // Don't allow changing own role
  if (adminUserId === userId) {
    throw new Error("Cannot change your own role");
  }

  // Verify new role exists
  const newRole = await prisma.role.findUnique({
    where: { name: roleName },
  });

  if (!newRole) {
    throw new Error("Role not found");
  }

  // Remove existing roles and add new one
  await prisma.userRole.deleteMany({
    where: { userId },
  });

  await prisma.userRole.create({
    data: {
      userId,
      roleId: newRole.id,
    },
  });

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  return {
    id: updatedUser!.id,
    email: updatedUser!.email,
    firstName: updatedUser!.firstName,
    lastName: updatedUser!.lastName,
    roles: updatedUser!.roles.map((ur) => ur.role.name),
    isActive: updatedUser!.isActive,
  };
};

export const deactivateUser = async (
  adminUserId: string,
  startupId: string,
  userId: string
) => {
  // Verify admin belongs to startup
  const adminUser = await prisma.user.findUnique({
    where: { id: adminUserId },
  });

  if (!adminUser || adminUser.startupId !== startupId) {
    throw new Error("Unauthorized");
  }

  // Verify target user belongs to same startup
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser || targetUser.startupId !== startupId) {
    throw new Error("User not found or does not belong to your startup");
  }

  // Don't allow deactivating yourself
  if (adminUserId === userId) {
    throw new Error("Cannot deactivate yourself");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  return { success: true };
};

export const reactivateUser = async (
  adminUserId: string,
  startupId: string,
  userId: string
) => {
  // Verify admin belongs to startup
  const adminUser = await prisma.user.findUnique({
    where: { id: adminUserId },
  });

  if (!adminUser || adminUser.startupId !== startupId) {
    throw new Error("Unauthorized");
  }

  // Verify target user belongs to same startup
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser || targetUser.startupId !== startupId) {
    throw new Error("User not found or does not belong to your startup");
  }

  // Don't allow reactivating yourself (shouldn't be needed, but safety check)
  if (adminUserId === userId) {
    throw new Error("Cannot reactivate yourself");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  });

  return { success: true };
};
