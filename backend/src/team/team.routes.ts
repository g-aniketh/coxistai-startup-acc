import { Router } from 'express';
import { authenticateToken, checkPermission } from '../middleware/auth';
import { 
  inviteTeamMemberController,
  getTeamMembersController,
  updateUserRoleController,
  deactivateUserController
} from './team.controller';

const router = Router();

// Invite a new team member (sends email with credentials)
router.post(
  '/invite',
  authenticateToken,
  checkPermission({ action: 'manage', subject: 'team' }),
  inviteTeamMemberController as any
);

// Get all team members for the startup
router.get(
  '/',
  authenticateToken,
  checkPermission({ action: 'read', subject: 'team' }),
  getTeamMembersController as any
);

// Update a user's role
router.put(
  '/:userId/role',
  authenticateToken,
  checkPermission({ action: 'manage', subject: 'team' }),
  updateUserRoleController as any
);

// Deactivate a user
router.post(
  '/:userId/deactivate',
  authenticateToken,
  checkPermission({ action: 'manage', subject: 'team' }),
  deactivateUserController as any
);

export default router;

