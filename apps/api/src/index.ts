import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { tenantMiddleware, optionalTenantMiddleware } from './middleware/tenant';
import { authenticateToken, optionalAuth } from './middleware/auth';
import authRoutes from './routes/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CoXist AI Startup Accelerator API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/v1/docs',
    health: '/api/v1/health'
  });
});

// API v1 routes
const v1Router = express.Router();

// Authentication routes (no auth required)
v1Router.use('/auth', authRoutes);

// Health check endpoint
v1Router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown database error',
      version: '1.0.0'
    });
  }
});

// API Documentation endpoint
v1Router.get('/docs', (req, res) => {
  res.json({
    title: 'CoXist AI Startup Accelerator API',
    version: '1.0.0',
    description: 'RESTful API for the CoXist AI Startup Accelerator platform',
    baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
    endpoints: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint with database connectivity test'
      },
      auth: {
        login: {
          method: 'POST',
          path: '/auth/login',
          description: 'User login with email and password',
          body: {
            email: 'string (required)',
            password: 'string (required)'
          }
        },
        register: {
          method: 'POST',
          path: '/auth/register',
          description: 'User registration',
          body: {
            email: 'string (required)',
            password: 'string (required)',
            role: 'string (optional, default: member)',
            tenantId: 'string (required)'
          }
        },
        refresh: {
          method: 'POST',
          path: '/auth/refresh',
          description: 'Refresh access token using refresh token',
          body: {
            refreshToken: 'string (required)'
          }
        },
        me: {
          method: 'GET',
          path: '/auth/me',
          description: 'Get current user profile (requires authentication)'
        },
        logout: {
          method: 'POST',
          path: '/auth/logout',
          description: 'User logout (requires authentication)'
        }
      },
      tenants: {
        list: {
          method: 'GET',
          path: '/tenants',
          description: 'Get all tenants with their associated users (requires authentication)'
        },
        create: {
          method: 'POST',
          path: '/tenants',
          description: 'Create a new tenant (requires authentication)',
          body: {
            name: 'string (required)'
          }
        }
      },
      users: {
        list: {
          method: 'GET',
          path: '/users',
          description: 'Get all users with their tenant information (requires authentication)'
        }
      }
    },
    authentication: 'JWT-based authentication with Bearer tokens',
    multiTenancy: 'Supported via X-Tenant-ID header and JWT payload'
  });
});

// Protected routes (require authentication)
v1Router.use('/tenants', authenticateToken);
v1Router.use('/users', authenticateToken);

// Tenant routes
v1Router.get('/tenants', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        users: true
      }
    });
    
    res.json({
      success: true,
      data: tenants,
      context: req.tenant ? { currentTenant: req.tenant } : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

v1Router.post('/tenants', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Tenant name is required'
      });
    }

    const tenant = await prisma.tenant.create({
      data: { name },
      include: {
        users: true
      }
    });

    res.status(201).json({
      success: true,
      data: tenant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// User routes
v1Router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        tenant: true
      }
    });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Apply tenant middleware to v1 routes (except health and docs)
v1Router.use((req, res, next) => {
  const skipTenantRoutes = ['/health', '/docs'];
  if (skipTenantRoutes.includes(req.path)) {
    return next();
  }
  return optionalTenantMiddleware(req, res, next);
});

// Mount v1 routes
app.use('/api/v1', v1Router);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 CoXist AI Startup Accelerator API Server`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`📍 API Documentation: http://localhost:${PORT}/api/v1/docs`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`🗄️  Database: Connected to PostgreSQL via Prisma`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
  await prisma.$disconnect();
});

export default app;
