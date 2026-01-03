import { Router } from "express";
import { authenticateToken, checkPermission } from "../middleware/auth";
import {
  inviteTeamMemberController,
  getTeamMembersController,
  updateUserRoleController,
  deactivateUserController,
  reactivateUserController,
} from "./team.controller";

const router = Router();

// Invite a new team member (sends email with credentials)
router.post(
  "/invite",
  authenticateToken,
  checkPermission({ action: "manage", subject: "team" }),
  inviteTeamMemberController
);

// Get all team members for the startup
router.get(
  "/",
  authenticateToken,
  checkPermission({ action: "read", subject: "team" }),
  getTeamMembersController
);

// Update a user's role
router.put(
  "/:userId/role",
  authenticateToken,
  checkPermission({ action: "manage", subject: "team" }),
  updateUserRoleController
);

// Deactivate a user
router.post(
  "/:userId/deactivate",
  authenticateToken,
  checkPermission({ action: "manage", subject: "team" }),
  deactivateUserController
);

// Reactivate a user
router.post(
  "/:userId/reactivate",
  authenticateToken,
  checkPermission({ action: "manage", subject: "team" }),
  reactivateUserController
);

export default router;
