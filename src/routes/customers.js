/**
 * Customer CRUD Routes
 * Manages customer accounts with role-based access control
 * 
 * Routes:
 * - GET /            : List all customers (staff/admin only)
 * - GET /:id         : Get single customer (self OR staff/admin)
 * - POST /           : Create customer (staff/admin only)
 * - PUT /:id         : Update customer (self OR staff/admin)
 * - DELETE /:id      : Delete customer (admin only)
 */

const express = require('express');
const bcrypt = require('bcrypt');

const db = require('../models');
const auth = require('../middleware/auth');
const staff = require('../middleware/staff');
const admin = require('../middleware/admin');

// Import centralized validator and validation schemas
const { validate, schemas } = require('../validation/validation');

const router = express.Router();
const { Customer } = db.sequelize.models;

// ---------- Helper Functions ----------

/**
 * Convert value to positive integer ID or null
 * @param {*} v - Value to convert
 * @returns {number|null} Valid ID or null
 */
const toId = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/**
 * Authorization middleware: allow user to access own data OR specific roles
 * @param {...string} roles - Allowed roles (e.g., 'staff', 'admin')
 * @returns {Function} Express middleware function
 */
const allowSelfOrRole = (...roles) => {
  return (req, res, next) => {
    const reqId = toId(req.params.id);
    const user = req.user; // Set by auth middleware
    
    // Extract role and custId (supports different JWT payload shapes)
    const role = user?.role || user?.user?.role;
    const custId = user?.custId ?? user?.user?.custId;

    // Allow if user is accessing their own data
    if (reqId && custId && reqId === Number(custId)) return next();
    
    // Allow if user has one of the specified roles
    if (role && roles.includes(role)) return next();
    
    // Deny access otherwise
    return res.status(403).json({ msg: 'Forbidden' });
  };
};

// ---------- Routes ----------

/**
 * GET /api/v1/customers
 * List all customers (staff/admin only)
 */
router.get('/', [auth, staff], async (_req, res) => {
  try {
    // Get all customers, exclude password field
    const rows = await Customer.findAll({
      attributes: { exclude: ['password'] },
      order: [['custId', 'ASC']],
    });
    return res.status(200).json(rows);
  } catch (err) {
    console.error('customers:list error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * GET /api/v1/customers/:id
 * Get single customer by ID (self OR staff/admin)
 */
router.get('/:id', auth, allowSelfOrRole('staff', 'admin'), async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ msg: 'Invalid id' });

    // Find customer by ID, exclude password
    const row = await Customer.findByPk(id, { attributes: { exclude: ['password'] } });
    if (!row) return res.status(404).json({ msg: 'Customer not found' });

    return res.status(200).json(row);
  } catch (err) {
    console.error('customers:get error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * POST /api/v1/customers
 * Create new customer (staff/admin only)
 * Note: Regular users should use /auth/customer/register
 */
router.post('/', [auth, staff], validate(schemas.customerCreate), async (req, res) => {
  try {
    const value = req.body; // Already validated by middleware
    
    // Check if email already exists
    const exists = await Customer.findOne({ where: { email: value.email } });
    if (exists) return res.status(409).json({ msg: 'Email already registered' });

    // Hash password before storing
    const hashed = await bcrypt.hash(value.password, 10);
    
    // Create customer
    const created = await Customer.create({ ...value, password: hashed });
    
    // Remove password from response
    const out = created.toJSON();
    delete out.password;

    return res.status(201).json(out);
  } catch (err) {
    console.error('customers:create error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * PUT /api/v1/customers/:id
 * Update customer (self OR staff/admin)
 */
router.put(
  '/:id',
  auth,
  allowSelfOrRole('staff', 'admin'),
  validate(schemas.customerUpdate),
  async (req, res) => {
    try {
      const id = toId(req.params.id);
      if (!id) return res.status(400).json({ msg: 'Invalid id' });

      const value = { ...req.body }; // Already validated
      
      // Hash password if it's being updated
      if (value.password) {
        value.password = await bcrypt.hash(value.password, 10);
      }

      // Update customer
      const [updated] = await Customer.update(value, { where: { custId: id } });
      if (!updated) return res.status(404).json({ msg: 'Customer not found' });

      // Fetch and return updated customer (without password)
      const fresh = await Customer.findByPk(id, { attributes: { exclude: ['password'] } });
      return res.status(200).json(fresh);
    } catch (err) {
      console.error('customers:update error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

/**
 * DELETE /api/v1/customers/:id
 * Delete customer (admin only)
 */
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ msg: 'Invalid id' });

    // Delete customer
    const deleted = await Customer.destroy({ where: { custId: id } });
    if (!deleted) return res.status(404).json({ msg: 'Customer not found' });

    return res.status(204).send();
  } catch (err) {
    console.error('customers:delete error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;