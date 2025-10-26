/**
 * Admin Authorization Middleware
 * Restricts access to admin users only. Must be used after auth middleware.
 * 
 * @param {Object} req - Express request object with req.user from auth middleware
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void} Calls next() if admin, otherwise sends error response
 */
function admin(req, res, next) {
  console.log('Admin middleware');
  
  // Get user from request
  const user = req.user;
  
  // Support both req.user.role and req.user.user.role structures
  const role = user?.role ?? user?.user?.role;
  
  console.log('req.user:', user);
  console.log('role:', role);

  // Check if user exists
  if (!role) {
    return res.status(401).json({ msg: 'Unauthenticated: user missing' });
  }
  
  // Check if user is admin
  if (role !== 'admin') {
    console.log('Access denied (role is not admin)');
    return res.status(403).json({ msg: 'Access denied' });
  }
  
  // User is admin, proceed
  return next();
}

module.exports = admin;