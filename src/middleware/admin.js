// src/middleware/admin.js
function admin(req, res, next) {
  console.log('Admin middleware');
  // Be defensive: req.user may be missing if auth wasn't run
  const user = req.user;
  const role = user?.role ?? user?.user?.role; // support both shapes just in case
  console.log('req.user:', user);
  console.log('role:', role);

  if (!role) {
    return res.status(401).json({ msg: 'Unauthenticated: user missing' });
  }
  if (role !== 'admin') {
    console.log('Access denied (role is not admin)');
    return res.status(403).json({ msg: 'Access denied' });
  }
  return next();
}

module.exports = admin;
