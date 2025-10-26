/**
 * Staff Authorization Middleware
 * Restricts access to staff and admin users. Must be used after auth middleware.
 * 
 * @param {Object} req - Express request object with req.user from auth middleware
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() if staff or admin, otherwise sends error response
 */
function staff(req, res, next) {
  // Get user role (supports both req.user.role and req.user.user.role)
  const role = req.user?.role ?? req.user?.user?.role;
  
  // Check if user exists
  if (!role) return res.status(401).json({ msg: 'Unauthenticated: user missing' });
  
  // Allow both staff and admin roles
  if (role === 'staff' || role === 'admin') return next();
  
  // Deny access for other roles
  return res.status(403).json({ msg: 'Staff or admin only' });
}

module.exports = staff;