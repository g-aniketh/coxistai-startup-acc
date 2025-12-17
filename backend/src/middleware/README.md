# Authentication & Authorization Middleware

This directory contains middleware for authentication and authorization in the CoXist AI platform.

## Available Middleware

### 1. `authenticateToken`

Verifies JWT token and loads user's roles and permissions. Attaches user and startup context to the request.

```typescript
import { authenticateToken } from "./middleware/auth";

router.get("/protected", authenticateToken, (req, res) => {
  // req.user is now available with userId, startupId, roles, permissions
  // req.startup contains startup id and name
});
```

### 2. `requireRole(roles: string[])`

Ensures user has one of the specified roles.

```typescript
import { authenticateToken, requireRole } from "./middleware/auth";

// Only Admin can access
router.post(
  "/users",
  authenticateToken,
  requireRole(["Admin"]),
  createUserHandler
);

// Admin or Accountant can access
router.get(
  "/reports",
  authenticateToken,
  requireRole(["Admin", "Accountant"]),
  getReportsHandler
);
```

### 3. `requirePermission(permission: string)`

Ensures user has a specific permission (format: "action_subject").

```typescript
import { authenticateToken, requirePermission } from "./middleware/auth";

// Requires "manage_team" permission
router.post(
  "/team-members",
  authenticateToken,
  requirePermission("manage_team"),
  createTeamMemberHandler
);

// Requires "read_analytics" permission
router.get(
  "/analytics",
  authenticateToken,
  requirePermission("read_analytics"),
  getAnalyticsHandler
);
```

### 4. `checkPermission(permission: { action: string, subject: string })`

Similar to `requirePermission` but uses object format. Admins always pass.

```typescript
import { authenticateToken, checkPermission } from "./middleware/auth";

router.post(
  "/inventory",
  authenticateToken,
  checkPermission({ action: "manage", subject: "inventory" }),
  createInventoryHandler
);
```

### 5. `requireAdmin`

Shortcut for requiring Admin role.

```typescript
import { authenticateToken, requireAdmin } from "./middleware/auth";

router.delete(
  "/startup",
  authenticateToken,
  requireAdmin,
  deleteStartupHandler
);
```

### 6. `requireStartupAdmin`

Ensures user is admin of their current startup.

```typescript
import { authenticateToken, requireStartupAdmin } from "./middleware/auth";

router.post(
  "/billing",
  authenticateToken,
  requireStartupAdmin,
  updateBillingHandler
);
```

## Complete Example

```typescript
import { Router } from "express";
import {
  authenticateToken,
  checkPermission,
  requireRole,
  AuthRequest,
} from "../middleware/auth";

const router = Router();

// Public route - no auth required
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Protected route - requires authentication only
router.get("/profile", authenticateToken, (req: AuthRequest, res) => {
  res.json({
    user: req.user,
    startup: req.startup,
  });
});

// Protected with role check
router.get(
  "/admin-dashboard",
  authenticateToken,
  requireRole(["Admin"]),
  (req: AuthRequest, res) => {
    res.json({ message: "Admin dashboard data" });
  }
);

// Protected with permission check
router.post(
  "/transactions",
  authenticateToken,
  checkPermission({ action: "manage", subject: "transactions" }),
  (req: AuthRequest, res) => {
    const { startupId } = req.user;
    // All database operations automatically scoped to startupId
    // This ensures multi-tenancy is enforced
    res.json({ message: "Transaction created" });
  }
);

export default router;
```

## Multi-Tenancy Enforcement

The `authenticateToken` middleware automatically extracts the `startupId` from the JWT and attaches it to `req.user.startupId`. This ensures:

1. **Automatic Tenant Isolation**: All database queries can use `req.user.startupId` to filter data
2. **Security**: Users can only access data from their own startup
3. **No Cross-Tenant Data Leaks**: The startupId is cryptographically verified via JWT

Example of tenant-scoped database query:

```typescript
router.get("/products", authenticateToken, async (req: AuthRequest, res) => {
  const { startupId } = req.user;

  const products = await prisma.product.findMany({
    where: { startupId }, // Always filter by startup
  });

  res.json({ products });
});
```

## Available Roles

- **Admin**: Full access to everything (18 permissions)
- **Accountant**: Financial management (13 permissions)
- **CTO**: Technical insights (10 permissions)
- **Sales Lead**: Revenue tracking (7 permissions)
- **Operations Manager**: Inventory management (8 permissions)

## Permission Format

Permissions are stored as strings in the format: `action_subject`

Examples:

- `manage_team`
- `read_cashflow_dashboard`
- `manage_inventory`
- `use_what_if_scenarios`
- `manage_investor_updates`

See `prisma/seed.ts` for the complete list of permissions.
