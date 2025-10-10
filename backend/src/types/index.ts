import { Request } from 'express';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Health check response
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  database: 'connected' | 'disconnected';
  version: string;
  error?: string;
}

// Tenant types
export interface Tenant {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  users?: User[];
}

export interface CreateTenantRequest {
  name: string;
}

// User types
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  tenant?: Tenant;
}

// Request with tenant context
export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    name: string;
  };
}

// Authenticated request with user context
export interface AuthenticatedRequest extends Request {
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

// Combined authenticated and tenant request
export interface AuthenticatedTenantRequest extends Request {
  user: {
    userId: string;
    startupId: string;
    roles: string[];
    permissions: string[];
    email: string;
  };
  startup: {
    id: string;
    name: string;
  };
  // Legacy support
  tenant?: {
    id: string;
    name: string;
  };
}

// Error types
export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}
