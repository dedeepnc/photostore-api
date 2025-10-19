const jwt = require('jsonwebtoken');
const logger = require('../logger');
const config = require('../config/config');

module.exports = function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, bearerToken] = authHeader.split(' ');
  const headerToken = req.header('x-auth-token');
  const token = (scheme === 'Bearer' && bearerToken) ? bearerToken : headerToken;

  if (!token) {
    logger?.http?.('Auth failed: no token provided');
    return res.status(401).json({ msg: 'No token supplied, authorization denied' });
  }

  try {
    const decoded = jwt.verify(
      token,
      config.auth?.jwtSecret || process.env.JWT_SECRET || 'dev_secret_change_me',
      {
        issuer: process.env.JWT_ISSUER || undefined,
        audience: process.env.JWT_AUDIENCE || undefined,
        algorithms: ['HS512'],
      }
    );
    req.user = decoded.user || decoded;
    req.token = token;
    return next();
  } catch (err) {
    logger?.http?.('Auth failed: invalid token', { reason: err.message });
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
