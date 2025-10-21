import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { 
  generateTokenPair, 
  hashPassword, 
  comparePassword, 
  verifyToken,
  JWTPayload 
} from '../lib/jwt';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse } from '../types';

const router: Router = Router();

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      } as ApiResponse);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        startup: {
          select: {
            id: true,
            name: true
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
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      } as ApiResponse);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      } as ApiResponse);
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      startupId: user.startupId,
      roles: user.roles.map(ur => ur.role.name),
      permissions: user.roles.flatMap(ur => ur.role.permissions.map(p => `${p.action}:${p.subject}`)),
      email: user.email
    });

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          startup: user.startup,
          roles: user.roles.map(ur => ur.role.name),
          permissions: user.roles.flatMap(ur => ur.role.permissions.map(p => `${p.action}:${p.subject}`))
        },
        tokens
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during login'
    } as ApiResponse);
  }
});

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, startupId } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      } as ApiResponse);
    }

    if (!startupId) {
      return res.status(400).json({
        success: false,
        error: 'Startup ID is required for registration'
      } as ApiResponse);
    }

    // Verify startup exists
    const startup = await prisma.startup.findUnique({
      where: { id: startupId }
    });

    if (!startup) {
      return res.status(404).json({
        success: false,
        error: 'Startup not found'
      } as ApiResponse);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      } as ApiResponse);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        startupId
      },
      include: {
        startup: {
          select: {
            id: true,
            name: true
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
      }
    });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      startupId: user.startupId,
      roles: user.roles.map(ur => ur.role.name),
      permissions: user.roles.flatMap(ur => ur.role.permissions.map(p => `${p.action}:${p.subject}`)),
      email: user.email
    });

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          startup: user.startup,
          roles: user.roles.map(ur => ur.role.name),
          permissions: user.roles.flatMap(ur => ur.role.permissions.map(p => `${p.action}:${p.subject}`))
        },
        tokens
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during registration'
    } as ApiResponse);
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      } as ApiResponse);
    }

    // Verify refresh token
    const payload: JWTPayload = verifyToken(refreshToken);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        startup: {
          select: {
            id: true,
            name: true
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
      }
    });

    if (!user || !user.startup) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      } as ApiResponse);
    }

    // Generate new tokens
    const tokens = generateTokenPair({
      userId: user.id,
      startupId: user.startupId,
      roles: user.roles.map(ur => ur.role.name),
      permissions: user.roles.flatMap(ur => ur.role.permissions.map(p => `${p.action}:${p.subject}`)),
      email: user.email
    });

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          startup: user.startup,
          roles: user.roles.map(ur => ur.role.name),
          permissions: user.roles.flatMap(ur => ur.role.permissions.map(p => `${p.action}:${p.subject}`))
        },
        tokens
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    } as ApiResponse);
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        startup: {
          select: {
            id: true,
            name: true
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
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          startup: user.startup,
          roles: user.roles.map(ur => ur.role.name),
          permissions: user.roles.flatMap(ur => ur.role.permissions.map(p => `${p.action}:${p.subject}`)),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  } as ApiResponse);
});

export default router;
