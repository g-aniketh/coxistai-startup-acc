import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

// Extend Express Request interface to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        name: string;
      };
    }
  }
}

/**
 * Multi-tenancy middleware
 * Extracts tenant information from X-Tenant-ID header
 * and validates tenant existence in database
 */
export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;

    // Skip tenant validation for certain routes
    const skipTenantRoutes = ["/api/v1/health", "/api/v1/docs"];
    if (skipTenantRoutes.includes(req.path)) {
      return next();
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: "X-Tenant-ID header is required for multi-tenant operations",
      });
    }

    // Validate tenant exists
    const tenant = await prisma.startup.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found",
      });
    }

    // Attach tenant to request
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error("Tenant middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during tenant validation",
    });
  }
};

/**
 * Optional tenant middleware
 * Similar to tenantMiddleware but doesn't require X-Tenant-ID header
 * Useful for routes that can work with or without tenant context
 */
export const optionalTenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;

    if (tenantId) {
      const tenant = await prisma.startup.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true },
      });

      if (tenant) {
        req.tenant = tenant;
      }
    }

    next();
  } catch (error) {
    console.error("Optional tenant middleware error:", error);
    // Continue without tenant context
    next();
  }
};
