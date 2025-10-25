import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../lib/jwt';
import { prisma } from '../lib/prisma';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        startupId: string;
        roles: string[];
        permissions: string[];
        email: string;
      };
      startup?: {
        id: string;
        name: string;
      };
      // Legacy support for old tenant references
      tenantId?: string;
      tenant?: {
        id: string;
        name: string;
      };
    }
  }
}

// Type alias for authenticated requests
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    startupId: string;
    roles: string[];
    permissions: string[];
    email: string;
  };
  startup?: {
    id: string;
    name: string;
  };
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user information to request
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    // Verify and decode the token
    const payload: JWTPayload = verifyToken(token);

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        startupId: true,
        startup: {
          select: {
            id: true,
            name: true,
            subscriptionStatus: true
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
        error: 'User not found or account has been deleted'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is inactive. Please contact your administrator.'
      });
    }

    // Verify startup still exists
    if (!user.startup) {
      return res.status(401).json({
        success: false,
        error: 'Startup not found or has been deleted'
      });
    }

    // Verify token startup matches user's current startup
    if (payload.startupId !== user.startupId) {
      return res.status(401).json({
        success: false,
        error: 'Token startup does not match user\'s current startup'
      });
    }

    // Extract roles and permissions
    const roleNames = user.roles.map(ur => ur.role.name);
    const permissions = user.roles.flatMap(ur => 
      ur.role.permissions.map(p => `${p.action}_${p.subject}`)
    );

    // Attach user information to request
    req.user = {
      userId: user.id,
      startupId: user.startupId,
      roles: roleNames,
      permissions: permissions,
      email: user.email
    };

    // Attach startup information to request
    req.startup = {
      id: user.startup.id,
      name: user.startup.name
    };

    // Legacy support - also set tenant fields
    req.tenantId = user.startupId;
    req.tenant = {
      id: user.startup.id,
      name: user.startup.name
    };

    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    
    return res.status(401).json({
      success: false,
      error: errorMessage
    });
  }
};

/**
 * Optional Authentication Middleware
 * Similar to authenticateToken but doesn't require authentication
 * Useful for routes that can work with or without authentication
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // Continue without authentication
    }

    const token = extractTokenFromHeader(authHeader);
    const payload: JWTPayload = verifyToken(token);

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        startupId: true,
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

    if (user && user.isActive && user.startup && payload.startupId === user.startupId) {
      const roleNames = user.roles.map(ur => ur.role.name);
      const permissions = user.roles.flatMap(ur => 
        ur.role.permissions.map(p => `${p.action}_${p.subject}`)
      );

      req.user = {
        userId: user.id,
        startupId: user.startupId,
        roles: roleNames,
        permissions: permissions,
        email: user.email
      };
      req.startup = {
        id: user.startup.id,
        name: user.startup.name
      };
      req.tenantId = user.startupId;
      req.tenant = {
        id: user.startup.id,
        name: user.startup.name
      };
    }

    return next();
  } catch (error) {
    // Continue without authentication if token is invalid
    return next();
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.roles
      });
    }

    return next();
  };
};

/**
 * Permission-based Authorization Middleware
 * Checks if user has required permission
 */
export const requirePermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: requiredPermission,
        available: req.user.permissions
      });
    }

    return next();
  };
};

/**
 * Admin-only Middleware
 * Shortcut for admin role requirement
 */
export const requireAdmin = requireRole(['Admin']);

/**
 * Startup Admin Middleware
 * Ensures user is admin of their current startup
 */
export const requireStartupAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.startup) {
    return res.status(401).json({
      success: false,
      error: 'Authentication and startup context required'
    });
  }

  if (!req.user.roles.includes('Admin')) {
    return res.status(403).json({
      success: false,
      error: 'Admin role required'
    });
  }

  return next();
};

// Legacy alias for backward compatibility
export const requireTenantAdmin = requireStartupAdmin;

/**
 * Permission-based Authorization Middleware (Object Format)
 * Checks if user has required permission using action and subject
 * Admins always have access
 */
export const checkPermission = (requiredPermission: { action: string; subject: string }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user is Admin (Admins can do anything)
    const isAdmin = req.user.roles.includes('Admin');
    if (isAdmin) {
      return next();
    }

    // Check if user has the specific permission
    const permissionString = `${requiredPermission.action}_${requiredPermission.subject}`;
    const hasPermission = req.user.permissions.includes(permissionString);

    if (hasPermission) {
      return next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
        required: requiredPermission,
        available: req.user.permissions
      });
    }
  };
};
