// File: src/routes/customers.js
// Customer CRUD routes (list, get, update, delete)
// - GET /            : staff/admin only
// - GET /:id         : self OR staff/admin
// - POST /           : staff/admin (optional create by staff)
// - PUT /:id         : self OR staff/admin (hash password if provided)
// - DELETE /:id      : admin only

const express = require('express');
const bcrypt = require('bcrypt');

const db = require('../models');
const auth = require('../middleware/auth');
const staff = require('../middleware/staff');
const admin = require('../middleware/admin');

// ✅ bring in centralized validator + schemas
const { validate, schemas } = require('../validation/validation');

const router = express.Router();
const { Customer } = db.sequelize.models;

// ---------- helpers ----------
const toId = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// allow self OR role in roles[]
const allowSelfOrRole = (...roles) => {
  return (req, res, next) => {
    const reqId = toId(req.params.id);
    const user = req.user; // set by auth middleware (decoded JWT)
    const role = user?.role || user?.user?.role; // depending on your payload shape
    const custId = user?.custId ?? user?.user?.custId;

    if (reqId && custId && reqId === Number(custId)) return next(); // self
    if (role && roles.includes(role)) return next();                // role
    return res.status(403).json({ msg: 'Forbidden' });
  };
};

// ---------- routes ----------

// GET /api/v1/customers  (staff/admin only)
router.get('/', [auth, staff], async (_req, res) => {
  try {
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

// GET /api/v1/customers/:id  (self OR staff/admin)
router.get('/:id', auth, allowSelfOrRole('staff', 'admin'), async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ msg: 'Invalid id' });

    const row = await Customer.findByPk(id, { attributes: { exclude: ['password'] } });
    if (!row) return res.status(404).json({ msg: 'Customer not found' });

    return res.status(200).json(row);
  } catch (err) {
    console.error('customers:get error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/v1/customers  (staff/admin only)
// NOTE: regular end-users should use /auth/customer/register
router.post('/', [auth, staff], validate(schemas.customerCreate), async (req, res) => {
  try {
    const value = req.body; // already validated & sanitized by middleware
    const exists = await Customer.findOne({ where: { email: value.email } });
    if (exists) return res.status(409).json({ msg: 'Email already registered' });

    const hashed = await bcrypt.hash(value.password, 10);
    const created = await Customer.create({ ...value, password: hashed });
    const out = created.toJSON();
    delete out.password;

    return res.status(201).json(out);
  } catch (err) {
    console.error('customers:create error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/v1/customers/:id  (self OR staff/admin)
router.put(
  '/:id',
  auth,
  allowSelfOrRole('staff', 'admin'),
  validate(schemas.customerUpdate),
  async (req, res) => {
    try {
      const id = toId(req.params.id);
      if (!id) return res.status(400).json({ msg: 'Invalid id' });

      const value = { ...req.body }; // sanitized already
      if (value.password) {
        value.password = await bcrypt.hash(value.password, 10);
      }

      const [updated] = await Customer.update(value, { where: { custId: id } });
      if (!updated) return res.status(404).json({ msg: 'Customer not found' });

      const fresh = await Customer.findByPk(id, { attributes: { exclude: ['password'] } });
      return res.status(200).json(fresh);
    } catch (err) {
      console.error('customers:update error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

// DELETE /api/v1/customers/:id  (admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ msg: 'Invalid id' });

    const deleted = await Customer.destroy({ where: { custId: id } });
    if (!deleted) return res.status(404).json({ msg: 'Customer not found' });

    return res.status(204).send();
  } catch (err) {
    console.error('customers:delete error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
