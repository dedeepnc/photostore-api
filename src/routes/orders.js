/**
 * Orders Routes
 * Manages order operations with parameter and sorting validation
 * 
 * Routes:
 * - GET /                    : List all orders (staff/admin)
 * - GET /:id                 : Get single order (staff/admin)
 * - DELETE /:id              : Delete order (admin only)
 * - GET /o/:field/:dir       : Sort orders by field and direction (staff/admin)
 * - GET /sort/two/:first/:second : Sort by two fields (staff/admin)
 */

const express = require('express');
const db = require('../models');
const auth = require('../middleware/auth');
const staff = require('../middleware/staff');
const admin = require('../middleware/admin');

// Import centralized validator and validation schemas
const { validate, schemas } = require('../validation/validation');

const router = express.Router();
const { Order } = db.sequelize.models;

// ---------- Routes ----------

/**
 * GET /api/v1/orders
 * Get all orders (staff/admin only)
 */
router.get('/', [auth, staff], async (_req, res) => {
  try {
    console.log('[GET] /api/v1/orders');
    
    // Fetch all orders
    const orders = await Order.findAll();
    return res.status(200).json(orders);
  } catch (err) {
    console.error('Error getting orders:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * GET /api/v1/orders/:id
 * Get single order by ID (staff/admin only)
 */
router.get(
  '/:id',
  [auth, staff],
  validate(schemas.orderIdParam, { source: 'params' }), // Validate ID param
  async (req, res) => {
    try {
      console.log('[GET] /api/v1/orders/:id');
      const id = Number(req.params.id);

      // Find order by primary key
      const order = await Order.findByPk(id);
      if (!order) return res.status(404).json({ msg: 'Order not found' });

      return res.status(200).json(order);
    } catch (err) {
      console.error('Error getting order by id:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

/**
 * DELETE /api/v1/orders/:id
 * Delete order by ID (admin only)
 */
router.delete(
  '/:id',
  [auth, admin],
  validate(schemas.orderIdParam, { source: 'params' }), // Validate ID param
  async (req, res) => {
    try {
      console.log('[DELETE] /api/v1/orders/:id');
      const id = Number(req.params.id);

      // Delete order
      const deleted = await Order.destroy({ where: { orderId: id } });
      if (!deleted) return res.status(404).json({ msg: 'Order not found' });

      return res.status(204).send();
    } catch (err) {
      console.error('Error deleting order:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

/**
 * GET /api/v1/orders/o/:field/:dir
 * Sort orders by a single field and direction (staff/admin only)
 * @param {string} field - Field name to sort by (e.g., 'status', 'total')
 * @param {string} dir - Sort direction ('asc' or 'desc')
 */
router.get(
  '/o/:field/:dir',
  [auth, staff],
  validate(schemas.orderSortParams, { source: 'params' }), // Validate sort params
  async (req, res) => {
    try {
      console.log('[GET] /api/v1/orders/o/:field/:dir');
      const { field, dir } = req.params;
      
      // Normalize direction to uppercase (ASC or DESC)
      const direction = dir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      // Fetch orders with sorting
      const orders = await Order.findAll({ order: [[field, direction]] });
      return res.status(200).json(orders);
    } catch (err) {
      console.error('Error sorting orders:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

/**
 * GET /api/v1/orders/sort/two/:first/:second
 * Sort orders by two fields (staff/admin only)
 * Both fields sorted in ascending order
 * @param {string} first - First field to sort by
 * @param {string} second - Second field to sort by
 */
router.get(
  '/sort/two/:first/:second',
  [auth, staff],
  validate(schemas.orderTwoSortParams, { source: 'params' }), // Validate sort params
  async (req, res) => {
    try {
      const { first, second } = req.params;
      console.log(`[GET] /api/v1/orders/sort/two/${first}/${second}`);

      // Fetch orders with two-level sorting (both ASC)
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