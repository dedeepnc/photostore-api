/**
 * JWT Authentication Middleware
 * Validates JWT tokens from Authorization header or x-auth-token header.
 * Attaches decoded user to req.user if valid.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() if token is valid, otherwise sends 401 error
 */

const jwt = require('jsonwebtoken');
const logger = require('../logger');
const config = require('../config/config');

module.exports = function auth(req, res, next) {
  // Extract token from Authorization header (Bearer token format)
  const authHeader = req.headers.authorization || '';
  const [scheme, bearerToken] = authHeader.split(' ');
  
  // Also check x-auth-token header as fallback
  const headerToken = req.header('x-auth-token');
  
  // Use Bearer token if available, otherwise use x-auth-token
  const token = (scheme === 'Bearer' && bearerToken) ? bearerToken : headerToken;

  // Return 401 if no token provided
  if (!token) {
    logger?.http?.('Auth failed: no token provided');
    return res.status(401).json({ msg: 'No token supplied, authorization denied' });
  }

  try {
    // Verify and decode the JWT token
    const decoded = jwt.verify(
      token,
      config.auth?.jwtSecret || process.env.JWT_SECRET || 'dev_secret_change_me',
      {
        issuer: process.env.JWT_ISSUER || undefined,
        audience: process.env.JWT_AUDIENCE || undefined,
        algorithms: ['HS512'], // Only allow HS512 algorithm
      }
    );
    
    // Attach user data to request (supports both decoded.user and decoded directly)
    req.user = decoded.user || decoded;
    
    // Attach token to request for potential later use
    req.token = token;
    
    // Proceed to next middleware
    return next();
  } catch (err) {
    // Token is invalid or expired
    logger?.http?.('Auth failed: invalid token', { reason: err.message });
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};