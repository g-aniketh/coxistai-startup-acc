import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface SignupData {
  email: string;
  password: string;
  startupName: string;
  firstName?: string;
  lastName?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const signup = async (data: SignupData) => {
  const { email, password, startupName, firstName, lastName } = data;
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Find Admin role
  const adminRole = await prisma.role.findUnique({ 
    where: { name: 'Admin' },
    include: { permissions: true }
  });
  
  if (!adminRole) {
    throw new Error('Admin role not found. Please seed the database.');
  }

  // Create startup with admin user
  const startup = await prisma.startup.create({
    data: {
      name: startupName,
      subscriptionPlan: 'pro_trial',
      subscriptionStatus: 'active',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      users: {
        create: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          isActive: true,
          roles: {
            create: {
              roleId: adminRole.id,
            },
          },
        },
      },
      companyProfile: {
        create: {
          displayName: startupName,
          legalName: startupName,
          mailingName: startupName,
          baseCurrency: 'INR',
        },
      },
    },
    include: { 
      users: {
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: true
                }
              }
            }
          }
        }
      },
      companyProfile: {
        include: {
          addresses: true
        }
      }
    },
  });

  const user = startup.users[0];
  const roleNames = user.roles.map(userRole => userRole.role.name);
  const permissions = user.roles.flatMap(userRole => 
    userRole.role.permissions.map(p => `${p.action}_${p.subject}`)
  );

  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: user.id, 
      startupId: user.startupId, 
      roles: roleNames,
      permissions: permissions,
      email: user.email
    },
    process.env.JWT_SECRET!,
    { 
      expiresIn: '7d',
      issuer: 'coxist-ai-accelerator',
      audience: 'coxist-ai-users'
    }
  );

  return { 
    token, 
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      startupId: user.startupId,
      startup: {
        id: startup.id,
        name: startup.name,
        subscriptionPlan: startup.subscriptionPlan,
        subscriptionStatus: startup.subscriptionStatus,
        trialEndsAt: startup.trialEndsAt,
        companyProfile: startup.companyProfile ? {
          id: startup.companyProfile.id,
          displayName: startup.companyProfile.displayName,
          legalName: startup.companyProfile.legalName,
          mailingName: startup.companyProfile.mailingName,
          baseCurrency: startup.companyProfile.baseCurrency,
          country: startup.companyProfile.country,
          state: startup.companyProfile.state,
          city: startup.companyProfile.city,
          postalCode: startup.companyProfile.postalCode,
          phone: startup.companyProfile.phone,
          mobile: startup.companyProfile.mobile,
          email: startup.companyProfile.email,
          website: startup.companyProfile.website,
          addresses: startup.companyProfile.addresses
        } : null
      },
      roles: roleNames,
      permissions: permissions,
      isActive: true
    }
  };
};

export const login = async (data: LoginData) => {
  const { email, password } = data;

  // Find user with roles and permissions
  const user = await prisma.user.findUnique({
    where: { email },
    include: { 
      startup: {
        include: {
          companyProfile: {
            include: {
              addresses: true
            }
          }
        }
      },
      roles: { 
        include: { 
          role: {
            include: {
              permissions: true
            }
          } 
        } 
      } 
    },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account is inactive. Please contact your administrator.');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Extract role names and permissions
  const roleNames = user.roles.map(userRole => userRole.role.name);
  const permissions = user.roles.flatMap(userRole => 
    userRole.role.permissions.map(p => `${p.action}_${p.subject}`)
  );

  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: user.id, 
      startupId: user.startupId, 
      roles: roleNames,
      permissions: permissions,
      email: user.email
    },
    process.env.JWT_SECRET!,
    { 
      expiresIn: '7d',
      issuer: 'coxist-ai-accelerator',
      audience: 'coxist-ai-users'
    }
  );

  return { 
    token, 
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      startupId: user.startupId,
      startup: {
        id: user.startup.id,
        name: user.startup.name,
        subscriptionPlan: user.startup.subscriptionPlan,
        subscriptionStatus: user.startup.subscriptionStatus,
        trialEndsAt: user.startup.trialEndsAt,
        companyProfile: user.startup.companyProfile ? {
          id: user.startup.companyProfile.id,
          displayName: user.startup.companyProfile.displayName,
          legalName: user.startup.companyProfile.legalName,
          mailingName: user.startup.companyProfile.mailingName,
          baseCurrency: user.startup.companyProfile.baseCurrency,
          country: user.startup.companyProfile.country,
          state: user.startup.companyProfile.state,
          city: user.startup.companyProfile.city,
          postalCode: user.startup.companyProfile.postalCode,
          phone: user.startup.companyProfile.phone,
          mobile: user.startup.companyProfile.mobile,
          email: user.startup.companyProfile.email,
          website: user.startup.companyProfile.website,
          addresses: user.startup.companyProfile.addresses
        } : null
      },
      roles: roleNames,
      permissions: permissions,
      isActive: user.isActive
    }
  };
};

export const createTeamMember = async (
  adminUserId: string,
  startupId: string,
  memberData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    roleName: string;
  }
) => {
  // Verify admin has permission
  const adminUser = await prisma.user.findUnique({
    where: { id: adminUserId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      }
    }
  });

  if (!adminUser || adminUser.startupId !== startupId) {
    throw new Error('Unauthorized');
  }

  // Check if admin has manage_team permission
  const hasPermission = adminUser.roles.some(userRole =>
    userRole.role.permissions.some(p => p.action === 'manage' && p.subject === 'team')
  );

  if (!hasPermission) {
    throw new Error('You do not have permission to manage team members');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: memberData.email }
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Find the role
  const role = await prisma.role.findUnique({
    where: { name: memberData.roleName }
  });

  if (!role) {
    throw new Error('Role not found');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(memberData.password, 10);

  // Create team member
  const newUser = await prisma.user.create({
    data: {
      email: memberData.email,
      password: hashedPassword,
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      startupId: startupId,
      isActive: true,
      roles: {
        create: {
          roleId: role.id
        }
      }
    },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      }
    }
  });

  return {
    id: newUser.id,
    email: newUser.email,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    roles: newUser.roles.map(ur => ur.role.name),
    isActive: newUser.isActive
  };
};

