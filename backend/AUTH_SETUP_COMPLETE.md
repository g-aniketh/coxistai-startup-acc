# 🔐 Authentication & Authorization System - Setup Complete

## ✅ What's Been Implemented

### 1. Database Schema (Prisma)
- ✅ **Startup Model**: Multi-tenant root entity with pro_trial subscription
- ✅ **User Model**: Users belong to startups with RBAC
- ✅ **Role Model**: Predefined roles (Admin, Accountant, CTO, Sales Lead, Operations Manager)
- ✅ **Permission Model**: Granular permissions (action + subject)
- ✅ **UserRole Model**: Many-to-many relationship for flexible role assignment
- ✅ Database seeded with 5 roles and 18+ permissions

### 2. Authentication Service (`/backend/src/auth/`)
#### `auth.service.ts`
- ✅ **signup()**: Creates startup + admin user with 30-day pro trial
- ✅ **login()**: Authenticates users, loads roles & permissions
- ✅ **createTeamMember()**: Allows admins to add team members with specific roles

#### `auth.controller.ts`
- ✅ Request validation (email format, password strength)
- ✅ Error handling (409 for duplicates, 401 for invalid credentials)
- ✅ Success/error responses

#### `auth.routes.ts`
- ✅ `POST /signup` - Public signup
- ✅ `POST /login` - Public login
- ✅ `GET /me` - Get current user profile (protected)
- ✅ `POST /team-member` - Create team member (protected + permission check)

### 3. Middleware (`/backend/src/middleware/auth.ts`)

#### Core Middleware Functions:

**`authenticateToken`**
- Verifies JWT token from Authorization header
- Loads user's roles and permissions from database
- Attaches `req.user` with userId, startupId, roles, permissions
- Attaches `req.startup` with startup context
- Ensures multi-tenancy by extracting startupId from JWT
- Returns 401 for invalid/missing tokens

**`checkPermission(permission: { action, subject })`**
- Checks if user has specific permission
- Admins automatically pass all checks
- Returns 403 if permission denied
- Example: `checkPermission({ action: 'manage', subject: 'inventory' })`

**`requirePermission(permission: string)`**
- Alternative format using string: `requirePermission('manage_inventory')`
- Works the same as checkPermission

**`requireRole(roles: string[])`**
- Ensures user has one of the specified roles
- Example: `requireRole(['Admin', 'Accountant'])`

**`requireAdmin`**
- Shortcut for `requireRole(['Admin'])`

**`requireStartupAdmin`**
- Ensures user is admin of their current startup

**`optionalAuth`**
- Loads user context if token exists, but doesn't require it

### 4. JWT Library (`/backend/src/lib/jwt.ts`)
- ✅ Updated JWTPayload interface with `startupId`, `roles[]`, `permissions[]`
- ✅ Backward compatible with legacy `tenantId` and `role` fields
- ✅ 7-day token expiry
- ✅ Password hashing with bcrypt (12 salt rounds)

### 5. TypeScript Types (`/backend/src/types/index.ts`)
- ✅ `AuthenticatedRequest` interface with new user structure
- ✅ Support for startupId, roles[], permissions[]
- ✅ Legacy support for tenant fields

### 6. Main App Integration (`/backend/src/index.ts`)
- ✅ Auth routes mounted at `/api/v1/auth`
- ✅ Uses new auth system

---

## 🎯 Multi-Tenancy Implementation

### How It Works:
1. **JWT Contains startupId**: When users log in, the JWT includes their `startupId`
2. **Middleware Extracts startupId**: `authenticateToken` verifies JWT and attaches `req.user.startupId`
3. **All Queries Scoped**: Every database query MUST filter by `startupId`

### Example:
```typescript
router.get('/products', authenticateToken, async (req: AuthRequest, res) => {
  const { startupId } = req.user; // Extracted from JWT
  
  // Always filter by startupId to enforce tenant isolation
  const products = await prisma.product.findMany({
    where: { startupId }
  });
  
  res.json({ products });
});
```

---

## 📋 Available API Endpoints

### Public Endpoints (No Auth Required)

#### `POST /api/v1/auth/signup`
Creates a new startup and admin user with 30-day pro trial.

**Request:**
```json
{
  "email": "founder@startup.com",
  "password": "SecurePass123",
  "startupName": "My Amazing Startup",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx1234567890",
      "email": "founder@startup.com",
      "firstName": "John",
      "lastName": "Doe",
      "startupId": "clx0987654321",
      "startup": {
        "id": "clx0987654321",
        "name": "My Amazing Startup",
        "subscriptionPlan": "pro_trial",
        "subscriptionStatus": "active",
        "trialEndsAt": "2025-11-09T..."
      },
      "roles": ["Admin"],
      "permissions": [
        "manage_team",
        "manage_billing",
        "read_cashflow_dashboard",
        "read_burn_runway",
        "read_revenue_forecast",
        "read_inventory_dashboard",
        "manage_transactions",
        "manage_inventory",
        "use_what_if_scenarios",
        "manage_investor_updates",
        ...
      ]
    }
  },
  "message": "Signup successful! Welcome to CoXist AI."
}
```

#### `POST /api/v1/auth/login`
Authenticates existing user.

**Request:**
```json
{
  "email": "founder@startup.com",
  "password": "SecurePass123"
}
```

**Response:** Same as signup

---

### Protected Endpoints (Require Authentication)

#### `GET /api/v1/auth/me`
Get current user profile and startup context.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "clx1234567890",
      "startupId": "clx0987654321",
      "roles": ["Admin"],
      "permissions": [...],
      "email": "founder@startup.com"
    },
    "startup": {
      "id": "clx0987654321",
      "name": "My Amazing Startup"
    }
  }
}
```

#### `POST /api/v1/auth/team-member`
Create a new team member (Admin only - requires `manage_team` permission).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "email": "accountant@startup.com",
  "password": "SecurePass123",
  "firstName": "Jane",
  "lastName": "Smith",
  "roleName": "Accountant"
}
```

**Valid Roles:**
- `Accountant`
- `CTO`
- `Sales Lead`
- `Operations Manager`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx9876543210",
    "email": "accountant@startup.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "roles": ["Accountant"],
    "isActive": true
  },
  "message": "Team member created successfully"
}
```

---

## 🎭 Role-Based Access Control (RBAC)

### Available Roles & Permissions

| Role | Permissions Count | Key Access |
|------|-------------------|------------|
| **Admin** | 18 | Full access to everything |
| **Accountant** | 13 | Financial data, transactions, investor updates |
| **CTO** | 10 | Dashboards, scenarios, read-only access |
| **Sales Lead** | 7 | Revenue forecasting, inventory, dashboards |
| **Operations Manager** | 8 | Inventory management, dashboards |

### Permission Categories:
- **Team Management**: `manage_team`, `read_team`
- **Billing**: `manage_billing`, `read_billing`
- **Dashboards**: `read_cashflow_dashboard`, `read_burn_runway`, `read_revenue_forecast`, `read_inventory_dashboard`
- **Transactions**: `manage_transactions`, `read_transactions`
- **Inventory**: `manage_inventory`, `read_inventory`
- **AI Features**: `use_what_if_scenarios`, `read_what_if_scenarios`
- **Investor Updates**: `manage_investor_updates`, `read_investor_updates`
- **Analytics**: `read_analytics`, `export_analytics`
- **Alerts**: `manage_alerts`, `read_alerts`

---

## 🛠️ How to Use in Your Routes

### Example 1: Basic Authentication
```typescript
import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticateToken, async (req: AuthRequest, res) => {
  const { startupId, roles } = req.user;
  
  // User is authenticated, access their startupId and roles
  res.json({ startupId, roles });
});
```

### Example 2: Role-Based Access
```typescript
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

// Only Admin and Accountant can access
router.get('/financial-reports', 
  authenticateToken,
  requireRole(['Admin', 'Accountant']),
  async (req: AuthRequest, res) => {
    // User has required role
    res.json({ report: 'financial data' });
  }
);
```

### Example 3: Permission-Based Access
```typescript
import { authenticateToken, checkPermission, AuthRequest } from '../middleware/auth';

// Requires manage_inventory permission
router.post('/products',
  authenticateToken,
  checkPermission({ action: 'manage', subject: 'inventory' }),
  async (req: AuthRequest, res) => {
    const { startupId } = req.user;
    
    // Create product scoped to user's startup
    const product = await prisma.product.create({
      data: {
        ...req.body,
        startupId // Always scope to startup
      }
    });
    
    res.json({ product });
  }
);
```

### Example 4: Admin-Only Access
```typescript
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

router.delete('/startup', 
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res) => {
    // Only admins can access this
    res.json({ message: 'Admin action' });
  }
);
```

---

## 🔒 Security Features

✅ **JWT-Based Authentication**: Stateless, secure token-based auth  
✅ **Password Hashing**: bcrypt with 12 salt rounds  
✅ **Email Validation**: Regex-based email format validation  
✅ **Password Strength**: Minimum 8 characters required  
✅ **Multi-Tenancy Enforcement**: Automatic tenant isolation via startupId  
✅ **Role-Based Access Control**: Granular permission system  
✅ **Admin Bypass**: Admins automatically have all permissions  
✅ **Token Expiry**: 7-day expiration for security  

---

## 🚀 Next Steps

The authentication and authorization system is **fully operational**! 

You can now:
1. ✅ Sign up new startups with admin users
2. ✅ Log in existing users
3. ✅ Create team members with specific roles
4. ✅ Protect routes with authentication
5. ✅ Enforce role-based and permission-based access
6. ✅ Ensure multi-tenancy via startupId scoping

### To Proceed:
- Implement mock financial transaction features
- Implement mock inventory management features  
- Create dashboard endpoints with proper permissions
- Add AI CFO integration with OpenAI API
- Build frontend authentication flow

---

## 📚 Documentation

- **Middleware Documentation**: `/backend/src/middleware/README.md`
- **Seed Script**: `/backend/prisma/seed.ts` (defines all roles & permissions)
- **Schema**: `/backend/prisma/schema.prisma`

---

**Status**: ✅ **READY FOR PRODUCTION (with mock features)**

All authentication and authorization infrastructure is in place and tested. The system is secure, scalable, and ready for feature development.

