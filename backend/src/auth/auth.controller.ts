import { Request, Response } from 'express';
import * as authService from './auth.service';

export const signupController = async (req: Request, res: Response) => {
  try {
    const { email, password, startupName, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password || !startupName) {
      return res.status(400).json({ 
        success: false,
        message: 'Email, password, and startup name are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 8 characters long' 
      });
    }

    const { token, user } = await authService.signup({
      email,
      password,
      startupName,
      firstName,
      lastName
    });

    res.status(201).json({ 
      success: true,
      data: {
        token,
        user
      },
      message: 'Signup successful! Welcome to CoXist AI.'
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('already exists')) {
      return res.status(409).json({ 
        success: false,
        message: errorMessage 
      });
    }

    res.status(400).json({ 
      success: false,
      message: errorMessage 
    });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    const { token, user } = await authService.login({ email, password });

    res.status(200).json({ 
      success: true,
      data: {
        token,
        user
      },
      message: 'Login successful!'
    });
  } catch (error) {
    console.error('Login error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(401).json({ 
      success: false,
      message: errorMessage 
    });
  }
};

export const createTeamMemberController = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - user is added by authenticateToken middleware
    const adminUserId = req.user?.userId;
    // @ts-ignore - user is added by authenticateToken middleware
    const startupId = req.user?.startupId;

    if (!adminUserId || !startupId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { email, password, firstName, lastName, roleName } = req.body;

    // Validate required fields
    if (!email || !password || !roleName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required'
      });
    }

    // Validate role
    const validRoles = ['Accountant', 'CTO', 'Sales Lead', 'Operations Manager'];
    if (!validRoles.includes(roleName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    const newUser = await authService.createTeamMember(
      adminUserId,
      startupId,
      { email, password, firstName, lastName, roleName }
    );

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'Team member created successfully'
    });
  } catch (error) {
    console.error('Create team member error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('permission')) {
      return res.status(403).json({
        success: false,
        message: errorMessage
      });
    }

    if (errorMessage.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: errorMessage
      });
    }

    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
};

