
function staff(req, res, next) {
  const role = req.user?.role ?? req.user?.user?.role;
  if (!role) return res.status(401).json({ msg: 'Unauthenticated: user missing' });
  if (role === 'staff' || role === 'admin') return next();
  return res.status(403).json({ msg: 'Staff or admin only' });
}
module.exports = staff;

