import { Router, Response } from "express";
import {
  authenticateToken,
  requireAdmin,
  AuthRequest,
} from "../middleware/auth";
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  listPermissions,
  getPermission,
  createPermission,
  updatePermission,
  deletePermission,
  getUsersWithRoles,
  assignRoleToUser,
  removeRoleFromUser,
  setUserRoles,
} from "../services/roleManagement";

const router = Router();

// All routes require admin access
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================================================
// ROLE ROUTES
// ============================================================================

// List all roles
router.get("/roles", async (req: AuthRequest, res: Response) => {
  try {
    const startupId = req.user?.startupId;
    const roles = await listRoles(startupId);
    res.json({ success: true, data: roles });
  } catch (error) {
    console.error("List roles error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch roles",
    });
  }
});

// Get a single role
router.get("/roles/:roleId", async (req: AuthRequest, res: Response) => {
  try {
    const { roleId } = req.params;
    const role = await getRole(roleId);
    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }
    return res.json({ success: true, data: role });
  } catch (error) {
    console.error("Get role error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch role",
    });
  }
});

// Create a new role
router.post("/roles", async (req: AuthRequest, res: Response) => {
  try {
    const role = await createRole(req.body);
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    console.error("Create role error:", error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create role",
    });
  }
});

// Update a role
router.put("/roles/:roleId", async (req: AuthRequest, res: Response) => {
  try {
    const { roleId } = req.params;
    const role = await updateRole(roleId, req.body);
    res.json({ success: true, data: role });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update role",
    });
  }
});

// Delete a role
router.delete("/roles/:roleId", async (req: AuthRequest, res: Response) => {
  try {
    const { roleId } = req.params;
    await deleteRole(roleId);
    res.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    console.error("Delete role error:", error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete role",
    });
  }
});

// ============================================================================
// PERMISSION ROUTES
// ============================================================================

// List all permissions
router.get("/permissions", async (req: AuthRequest, res: Response) => {
  try {
    const permissions = await listPermissions();
    res.json({ success: true, data: permissions });
  } catch (error) {
    console.error("List permissions error:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch permissions",
    });
  }
});

// Get a single permission
router.get(
  "/permissions/:permissionId",
  async (req: AuthRequest, res: Response) => {
    try {
      const { permissionId } = req.params;
      const permission = await getPermission(permissionId);
      if (!permission) {
        return res
          .status(404)
          .json({ success: false, message: "Permission not found" });
      }
      return res.json({ success: true, data: permission });
    } catch (error) {
      console.error("Get permission error:", error);
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch permission",
      });
    }
  }
);

// Create a new permission
router.post("/permissions", async (req: AuthRequest, res: Response) => {
  try {
    const permission = await createPermission(req.body);
    res.status(201).json({ success: true, data: permission });
  } catch (error) {
    console.error("Create permission error:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create permission",
    });
  }
});

// Update a permission
router.put(
  "/permissions/:permissionId",
  async (req: AuthRequest, res: Response) => {
    try {
      const { permissionId } = req.params;
      const permission = await updatePermission(permissionId, req.body);
      res.json({ success: true, data: permission });
    } catch (error) {
      console.error("Update permission error:", error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update permission",
      });
    }
  }
);

// Delete a permission
router.delete(
  "/permissions/:permissionId",
  async (req: AuthRequest, res: Response) => {
    try {
      const { permissionId } = req.params;
      await deletePermission(permissionId);
      res.json({ success: true, message: "Permission deleted successfully" });
    } catch (error) {
      console.error("Delete permission error:", error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete permission",
      });
    }
  }
);

// ============================================================================
// USER ROLE ASSIGNMENT ROUTES
// ============================================================================

// Get all users with their roles (for the current startup)
router.get("/users", async (req: AuthRequest, res: Response) => {
  try {
    const { startupId } = req.user!;
    const users = await getUsersWithRoles(startupId);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Get users with roles error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch users",
    });
  }
});

// Assign role to user
router.post("/users/:userId/roles", async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      return res
        .status(400)
        .json({ success: false, message: "roleId is required" });
    }

    const userRole = await assignRoleToUser(userId, roleId);
    return res.status(201).json({ success: true, data: userRole });
  } catch (error) {
    console.error("Assign role to user error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to assign role to user",
    });
  }
});

// Remove role from user
router.delete(
  "/users/:userId/roles/:roleId",
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId, roleId } = req.params;
      await removeRoleFromUser(userId, roleId);
      res.json({
        success: true,
        message: "Role removed from user successfully",
      });
    } catch (error) {
      console.error("Remove role from user error:", error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to remove role from user",
      });
    }
  }
);

// Set all roles for a user (replace existing)
router.put("/users/:userId/roles", async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { roleIds } = req.body;

    if (!Array.isArray(roleIds)) {
      return res
        .status(400)
        .json({ success: false, message: "roleIds must be an array" });
    }

    const user = await setUserRoles(userId, roleIds);
    return res.json({ success: true, data: user });
  } catch (error) {
    console.error("Set user roles error:", error);
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to set user roles",
    });
  }
});

export default router;
