const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Middleware to verify JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    logger.info(`=== Auth Middleware ===`);
    logger.info(`Path: ${req.path}`);
    logger.info(`Method: ${req.method}`);
    logger.info(`Authorization header: ${req.headers.authorization ? 'Present' : 'Missing'}`);
    logger.info(`Query token: ${req.query.token ? 'Present' : 'Missing'}`);
    
    let token;
    
    // Check for token in query parameter first (for FileSystem downloads)
    if (req.query.token) {
      token = req.query.token;
      logger.info('Using token from query parameter');
    }
    // Then check Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
      logger.info('Using token from Authorization header');
    }
    
    if (!token) {
      logger.error(`Auth failed: No token provided`);
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // Attach user to request
    req.user = {
      userId: user._id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

/**
 * Optional authentication - adds user to request if token is valid
 * but doesn't reject if token is missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = {
          userId: user._id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin
        };
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  optionalAuth
};
