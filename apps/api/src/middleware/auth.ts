import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../lib/jwt';
import { prisma } from '../lib/prisma';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string;
        role: string;
        email: string;
      };
    }
  }
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
        role: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true
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

    // Verify tenant still exists
    if (!user.tenant) {
      return res.status(401).json({
        success: false,
        error: 'User tenant not found or has been deleted'
      });
    }

    // Verify token tenant matches user's current tenant
    if (payload.tenantId !== user.tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Token tenant does not match user\'s current tenant'
      });
    }

    // Attach user information to request
    req.user = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email
    };

    // Attach tenant information to request
    req.tenant = {
      id: user.tenant.id,
      name: user.tenant.name
    };

    next();
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
        role: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (user && user.tenant && payload.tenantId === user.tenantId) {
      req.user = {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        email: user.email
      };
      req.tenant = {
        id: user.tenant.id,
        name: user.tenant.name
      };
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
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

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Admin-only Middleware
 * Shortcut for admin role requirement
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Tenant Admin Middleware
 * Ensures user is admin of their current tenant
 */
export const requireTenantAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.tenant) {
    return res.status(401).json({
      success: false,
      error: 'Authentication and tenant context required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Tenant admin role required'
    });
  }

  next();
};
