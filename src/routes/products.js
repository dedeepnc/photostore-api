/**
 * Products Routes
 * Manages product CRUD operations with centralized validation
 * 
 * Routes:
 * - GET /                      : List all products (staff/admin)
 * - GET /:id                   : Get single product (public)
 * - POST /                     : Create product (admin only)
 * - PUT /:id                   : Update product (admin only)
 * - DELETE /:id                : Delete product (admin only)
 * - GET /o/:field/:dir         : Sort products by field and direction (public)
 * - GET /sort/two/:first/:second : Sort by two fields (public)
 */

const express = require('express');
const db = require('../models');
const auth = require('../middleware/auth');
const staff = require('../middleware/staff');
const admin = require('../middleware/admin');

// Import centralized validator and validation schemas
const { validate, schemas } = require('../validation/validation');

const router = express.Router();
const { Product } = db.sequelize.models;

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

// ---------- Routes ----------

/**
 * GET /api/v1/products
 * List all products (staff/admin only)
 * Note: Remove [auth, staff] middleware to make this route public
 */
router.get('/', [auth, staff], async (_req, res) => {
  try {
    console.log('[GET] /api/v1/products');
    
    // Fetch all products ordered by ID
    const products = await Product.findAll({ order: [['prodId', 'ASC']] });
    return res.status(200).json(products);
  } catch (err) {
    console.error('getAllProducts error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * GET /api/v1/products/:id
 * Get single product by ID (public route)
 */
router.get('/:id', async (req, res) => {
  try {
    console.log('[GET] /api/v1/products/:id');
    
    // Validate and convert ID
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ msg: 'Invalid id' });

    // Find product by primary key
    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    return res.status(200).json(product);
  } catch (err) {
    console.error('getProductById error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * POST /api/v1/products
 * Create new product (admin only)
 */
router.post('/', [auth, admin], validate(schemas.productCreate), async (req, res) => {
  try {
    console.log('[POST] /api/v1/products');
    
    // Create product (body already validated by middleware)
    const created = await Product.create(req.body);
    return res.status(201).json(created);
  } catch (err) {
    console.error('addProduct error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * PUT /api/v1/products/:id
 * Update existing product (admin only)
 */
router.put(
  '/:id',
  [auth, admin],
  validate(schemas.productUpdate),
  async (req, res) => {
    try {
      console.log('[PUT] /api/v1/products/:id');
      
      // Validate and convert ID
      const id = toId(req.params.id);
      if (!id) return res.status(400).json({ msg: 'Invalid id' });

      // Update product
      const [updated] = await Product.update(req.body, { where: { prodId: id } });
      if (!updated) return res.status(404).json({ msg: 'Product not found' });

      // Fetch and return updated product
      const fresh = await Product.findByPk(id);
      return res.status(200).json(fresh);
    } catch (err) {
      console.error('updateProduct error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

/**
 * DELETE /api/v1/products/:id
 * Delete product (admin only)
 */
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    console.log('[DELETE] /api/v1/products/:id');
    
    // Validate and convert ID
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ msg: 'Invalid id' });

    // Delete product
    const deleted = await Product.destroy({ where: { prodId: id } });
    if (!deleted) return res.status(404).json({ msg: 'Product not found' });

    return res.status(204).send();
  } catch (err) {
    console.error('deleteProduct error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * GET /api/v1/products/o/:field/:dir
 * Sort products by field and direction (public route)
 * @param {string} field - Field name to sort by (e.g., 'name', 'price')
 * @param {string} dir - Sort direction ('asc' or 'desc')
 */
router.get('/o/:field/:dir', validate(schemas.orderSortParams, { source: 'params' }), async (req, res) => {
  console.log('/api/v1/products/o/:field/:dir - GET');
  const { field, dir } = req.params;
  
  try {
    // Normalize direction to uppercase (ASC or DESC)
    const direction = dir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    // Fetch products with sorting
    const list = await Product.findAll({ order: [[field, direction]] });
    return res.status(200).json(list);
  } catch (err) {
    console.error('products:order error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * GET /api/v1/products/sort/two/:first/:second
 * Sort products by two fields (public route)
 * Both fields sorted in ascending order
 * @param {string} first - First field to sort by
 * @param {string} second - Second field to sort by
 */
router.get(
  '/sort/two/:first/:second',
  validate(schemas.orderTwoSortParams, { source: 'params' }),
  async (req, res) => {
    try {
      const { first, second } = req.params;
      
      // Fetch products with two-level sorting (both ASC)
      const rows = await Product.findAll({ order: [[first, 'ASC'], [second, 'ASC']] });
      return res.status(200).json(rows);
    } catch (err) {
      console.error('products:two-field sort error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

module.exports = router;