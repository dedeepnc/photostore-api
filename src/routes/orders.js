// File: src/routes/orders.js
// Orders routes with param + sorting validation
// --------------------------------------------------
const express = require('express');
const db = require('../models');
const auth = require('../middleware/auth');
const staff = require('../middleware/staff');
const admin = require('../middleware/admin');

// ✅ import validator + schemas
const { validate, schemas } = require('../validation/validation');

const router = express.Router();
const { Order } = db.sequelize.models;

// ---------------- ROUTES ----------------

// GET all orders (staff/admin only)
router.get('/', [auth, staff], async (_req, res) => {
  try {
    console.log('[GET] /api/v1/orders');
    const orders = await Order.findAll();
    return res.status(200).json(orders);
  } catch (err) {
    console.error('Error getting orders:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// GET single order by ID (staff/admin)
router.get(
  '/:id',
  [auth, staff],
  validate(schemas.orderIdParam, { source: 'params' }),
  async (req, res) => {
    try {
      console.log('[GET] /api/v1/orders/:id');
      const id = Number(req.params.id);

      const order = await Order.findByPk(id);
      if (!order) return res.status(404).json({ msg: 'Order not found' });

      return res.status(200).json(order);
    } catch (err) {
      console.error('Error getting order by id:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

// DELETE order by ID (admin only)
router.delete(
  '/:id',
  [auth, admin],
  validate(schemas.orderIdParam, { source: 'params' }),
  async (req, res) => {
    try {
      console.log('[DELETE] /api/v1/orders/:id');
      const id = Number(req.params.id);

      const deleted = await Order.destroy({ where: { orderId: id } });
      if (!deleted) return res.status(404).json({ msg: 'Order not found' });

      return res.status(204).send();
    } catch (err) {
      console.error('Error deleting order:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

// SORT orders by field and direction
router.get(
  '/o/:field/:dir',
  [auth, staff],
  validate(schemas.orderSortParams, { source: 'params' }),
  async (req, res) => {
    try {
      console.log('[GET] /api/v1/orders/o/:field/:dir');
      const { field, dir } = req.params;
      const direction = dir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      const orders = await Order.findAll({ order: [[field, direction]] });
      return res.status(200).json(orders);
    } catch (err) {
      console.error('Error sorting orders:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

// two-field sorting (e.g., by status then total)
router.get(
  '/sort/two/:first/:second',
  [auth, staff],
  validate(schemas.orderTwoSortParams, { source: 'params' }),
  async (req, res) => {
    try {
      const { first, second } = req.params;
      console.log(`[GET] /api/v1/orders/sort/two/${first}/${second}`);

      const orders = await Order.findAll({
        order: [[first, 'ASC'], [second, 'ASC']],
      });

      return res.status(200).json(orders);
    } catch (err) {
      console.error('Error in two-field sorting:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

module.exports = router;
