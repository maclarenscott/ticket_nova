import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

/**
 * Middleware to protect routes (authentication)
 * Verifies JWT token and attaches user to req object
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check for token in cookies if not in headers
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, no token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, user not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated'
      });
    }

    // Set user in request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if ((error as Error).name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, invalid token'
      });
    }
    
    if ((error as Error).name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, token expired'
      });
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this resource'
    });
  }
};

/**
 * Middleware to authorize based on user roles
 * @param {string[]} roles - Array of allowed roles
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Not authorized, role (${req.user.role}) not allowed to access this resource`
      });
    }
    
    next();
  };
};

// Middleware to check if user is an admin
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided or invalid token',
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized, admin access required',
    });
  }
  
  next();
};

// Middleware to check if user is a manager or admin
export const managerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided or invalid token',
    });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized, manager access required',
    });
  }
  
  next();
};

// Middleware to check if user is staff, manager, or admin
export const staffMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided or invalid token',
    });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized, staff access required',
    });
  }
  
  next();
}; 