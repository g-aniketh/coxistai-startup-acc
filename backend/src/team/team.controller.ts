import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as teamService from './team.service';

export const inviteTeamMemberController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId: adminUserId, startupId } = req.user!;
    const { email, roleName, firstName, lastName } = req.body;

    // Validation
    if (!email || !roleName) {
      res.status(400).json({
        success: false,
        message: 'Email and roleName are required'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
      return;
    }

    // Valid roles (excluding Admin)
    const validRoles = ['Accountant', 'CTO', 'Sales Lead', 'Operations Manager'];
    if (!validRoles.includes(roleName)) {
      res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
      return;
    }

    const result = await teamService.inviteTeamMember(adminUserId, startupId, {
      email,
      roleName,
      firstName,
      lastName
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Team member invited successfully. Check email for login credentials.'
    });
  } catch (error) {
    console.error('Invite team member error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('Unauthorized')) {
      res.status(403).json({
        success: false,
        message: errorMessage
      });
      return;
    }

    if (errorMessage.includes('already exists')) {
      res.status(409).json({
        success: false,
        message: errorMessage
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
};

export const getTeamMembersController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startupId } = req.user!;

    const teamMembers = await teamService.getTeamMembers(startupId);

    res.json({
      success: true,
      data: teamMembers
    });
  } catch (error) {
    console.error('Get team members error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

export const updateUserRoleController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId: adminUserId, startupId } = req.user!;
    const { userId } = req.params;
    const { roleName } = req.body;

    if (!roleName) {
      res.status(400).json({
        success: false,
        message: 'RoleName is required'
      });
      return;
    }

    const validRoles = ['Accountant', 'CTO', 'Sales Lead', 'Operations Manager', 'Admin'];
    if (!validRoles.includes(roleName)) {
      res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
      return;
    }

    const updatedUser = await teamService.updateUserRole(adminUserId, startupId, userId, {
      roleName
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Update user role error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Cannot change')) {
      res.status(403).json({
        success: false,
        message: errorMessage
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
};

export const deactivateUserController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId: adminUserId, startupId } = req.user!;
    const { userId } = req.params;

    await teamService.deactivateUser(adminUserId, startupId, userId);

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Cannot deactivate')) {
      res.status(403).json({
        success: false,
        message: errorMessage
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
};

