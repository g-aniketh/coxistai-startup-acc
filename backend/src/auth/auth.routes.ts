import { Router, Request, Response } from "express";
import {
  signupController,
  loginController,
  createTeamMemberController,
} from "./auth.controller";
import {
  authenticateToken,
  checkPermission,
  AuthRequest,
} from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

// Public routes - no authentication required
router.post("/signup", signupController);
router.post("/login", loginController);

// Protected routes - require authentication
router.get(
  "/me",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Fetch complete user data from database
      const user = await prisma.user.findUnique({
        where: { id: (req as any).user!.userId },
        include: {
          startup: {
            select: {
              id: true,
              name: true,
            },
          },
          roles: {
            include: {
              role: {
                include: {
                  permissions: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      // Return complete user data
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            startup: user.startup,
            roles: user.roles.map((ur) => ur.role.name),
            permissions: user.roles.flatMap((ur) =>
              ur.role.permissions.map((p) => `${p.action}:${p.subject}`)
            ),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
);

// Protected route - requires authentication + manage_team permission
router.post(
  "/team-member",
  authenticateToken,
  checkPermission({ action: "manage", subject: "team" }),
  createTeamMemberController
);

export default router;
