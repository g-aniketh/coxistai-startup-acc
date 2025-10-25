import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { tenantMiddleware, optionalTenantMiddleware } from './middleware/tenant';
import { authenticateToken, optionalAuth } from './middleware/auth';
import authRoutes from './auth/auth.routes';
import transactionsRoutes from './transactions/transactions.routes';
import dashboardRoutes from './dashboard/dashboard.routes';
import inventoryRoutes from './inventory/inventory.routes';
import accountsRoutes from './accounts/accounts.routes';
import teamRoutes from './team/team.routes';
import aiRoutes from './ai/ai.routes';
import plaidRoutes from './routes/plaid';
import cfoRoutes from './routes/cfo';
import stripeRoutes from './routes/stripe';
import analyticsRoutes from './routes/analytics';
import aiCFORoutes from './routes/aiCFO';
import alertsRoutes from './routes/alerts';
import importRoutes from './routes/import';
import { TransactionSyncService } from './services/transactionSync';
import { startJobs } from './jobs';

// Load environment variables
dotenv.config();

const app: express.Application = express();
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
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Tenant-ID',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
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

// Mock Feature Routes (protected by authentication + permissions)
v1Router.use('/transactions', transactionsRoutes);
v1Router.use('/dashboard', dashboardRoutes);
v1Router.use('/inventory', inventoryRoutes);
v1Router.use('/accounts', accountsRoutes);
v1Router.use('/team', teamRoutes);
v1Router.use('/ai', aiRoutes);

// CFO Plaid routes (protected by authentication)
v1Router.use('/cfo/plaid', authenticateToken, plaidRoutes);

// CFO Assistant routes (protected by authentication)
v1Router.use('/cfo', authenticateToken, cfoRoutes);

// Stripe integration routes (protected by authentication)
v1Router.use('/stripe', authenticateToken, stripeRoutes);

// Analytics routes (protected by authentication)
v1Router.use('/analytics', authenticateToken, analyticsRoutes);

// AI CFO routes (protected by authentication)
v1Router.use('/ai-cfo', authenticateToken, aiCFORoutes);

// Alerts routes (protected by authentication)
v1Router.use('/alerts', authenticateToken, alertsRoutes);

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
      cfo: {
        plaid: {
          createLinkToken: {
            method: 'POST',
            path: '/cfo/plaid/create-link-token',
            description: 'Create Plaid link token for frontend integration (requires authentication)'
          },
          exchangePublicToken: {
            method: 'POST',
            path: '/cfo/plaid/exchange-public-token',
            description: 'Exchange public token for access token and store Plaid item (requires authentication)',
            body: {
              publicToken: 'string (required)'
            }
          },
          getItems: {
            method: 'GET',
            path: '/cfo/plaid/items',
            description: 'Get all Plaid items for the tenant (requires authentication)'
          },
          syncTransactions: {
            method: 'POST',
            path: '/cfo/plaid/sync-transactions/:plaidItemId',
            description: 'Sync transactions for a specific Plaid item (requires authentication)',
            body: {
              startDate: 'string (optional, ISO date)',
              endDate: 'string (optional, ISO date)'
            }
          },
          deleteItem: {
            method: 'DELETE',
            path: '/cfo/plaid/items/:plaidItemId',
            description: 'Delete a Plaid item and revoke access (requires authentication)'
          },
          webhook: {
            method: 'POST',
            path: '/cfo/plaid/webhook',
            description: 'Plaid webhook endpoint for transaction updates (no authentication required)'
          }
        },
        accounts: {
          method: 'GET',
          path: '/cfo/accounts',
          description: 'Get all financial accounts for the tenant (requires authentication)'
        },
        transactions: {
          method: 'GET',
          path: '/cfo/transactions',
          description: 'Get paginated transactions with filters (requires authentication)',
          query: {
            page: 'number (optional, default: 1)',
            limit: 'number (optional, default: 50, max: 100)',
            startDate: 'string (optional, ISO date)',
            endDate: 'string (optional, ISO date)',
            categoryId: 'number (optional)',
            accountId: 'string (optional)',
            search: 'string (optional, search in description)',
            sortBy: 'string (optional, default: date)',
            sortOrder: 'string (optional, asc|desc, default: desc)'
          }
        },
        dashboard: {
          method: 'GET',
          path: '/cfo/dashboard/summary',
          description: 'Get dashboard summary with key financial metrics (requires authentication)',
          query: {
            period: 'number (optional, days, default: 30)'
          }
        },
        categories: {
          method: 'GET',
          path: '/cfo/categories',
          description: 'Get all transaction categories (requires authentication)'
        },
        healthScore: {
          method: 'GET',
          path: '/cfo/health-score',
          description: 'Get financial health score and recommendations (requires authentication)',
          query: {
            period: 'number (optional, days, default: 30)'
          }
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
v1Router.use('/startups', authenticateToken);
v1Router.use('/users', authenticateToken);

// Startup routes
v1Router.get('/startups', async (req, res) => {
  try {
    const startups = await prisma.startup.findMany({
      include: {
        users: true
      }
    });
    
    res.json({
      success: true,
      data: startups,
      context: req.startup ? { currentStartup: req.startup } : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

v1Router.post('/startups', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Startup name is required'
      });
    }

    const startup = await prisma.startup.create({
      data: { name },
      include: {
        users: true
      }
    });

    return res.status(201).json({
      success: true,
      data: startup
    });
  } catch (error) {
    return res.status(500).json({
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
        startup: true
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

// Mount protected routes
v1Router.use('/transactions', authenticateToken, transactionsRoutes);
v1Router.use('/dashboard', authenticateToken, dashboardRoutes);
v1Router.use('/inventory', authenticateToken, inventoryRoutes);
v1Router.use('/accounts', authenticateToken, accountsRoutes);
v1Router.use('/team', authenticateToken, teamRoutes);
v1Router.use('/ai', authenticateToken, aiRoutes);
v1Router.use('/plaid', authenticateToken, plaidRoutes);
v1Router.use('/cfo', authenticateToken, cfoRoutes);
v1Router.use('/stripe', authenticateToken, stripeRoutes);
v1Router.use('/analytics', authenticateToken, analyticsRoutes);
v1Router.use('/ai-cfo', authenticateToken, aiCFORoutes);
v1Router.use('/alerts', authenticateToken, alertsRoutes);
v1Router.use('/import', authenticateToken, importRoutes);

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
  
  // Start transaction sync service
  TransactionSyncService.start();
  console.log(`🔄 Transaction sync service started`);
  // Start background jobs
  startJobs();
  console.log(`🔄 Background jobs started`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  TransactionSyncService.stop();
  server.close(() => {
    console.log('Process terminated');
  });
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  TransactionSyncService.stop();
  server.close(() => {
    console.log('Process terminated');
  });
  await prisma.$disconnect();
});

export default app;
