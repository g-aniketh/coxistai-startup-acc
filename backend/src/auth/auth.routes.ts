import { Router } from 'express';
import { signupController, loginController, createTeamMemberController } from './auth.controller';
import { authenticateToken, checkPermission, AuthRequest } from '../middleware/auth';

const router = Router();

// Public routes - no authentication required
router.post('/signup', signupController);
router.post('/login', loginController);

// Protected routes - require authentication
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  // Return current user profile
  res.json({
    success: true,
    data: {
      user: req.user,
      startup: req.startup
    }
  });
});

// Protected route - requires authentication + manage_team permission
router.post('/team-member', 
  authenticateToken, 
  checkPermission({ action: 'manage', subject: 'team' }),
  createTeamMemberController
);

export default router;

