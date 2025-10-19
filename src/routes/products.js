// File: src/routes/products.js
// Product routes with centralized validation
// ------------------------------------------

const express = require('express');
const db = require('../models');
const auth = require('../middleware/auth');
const staff = require('../middleware/staff');
const admin = require('../middleware/admin');

// ✅ bring in centralized validator + schemas
const { validate, schemas } = require('../validation/validation');

const router = express.Router();
const { Product } = db.sequelize.models;

// ---------- helpers ----------
const toId = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// ---------------- ROUTES ----------------

// GET /api/v1/products — list products
// (make PUBLIC by removing [auth, staff])
router.get('/', [auth, staff], async (_req, res) => {
  try {
    console.log('[GET] /api/v1/products');
    const products = await Product.findAll({ order: [['prodId', 'ASC']] });
    return res.status(200).json(products);
  } catch (err) {
    console.error('getAllProducts error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/v1/products/:id — get product by id
router.get('/:id', async (req, res) => {
  try {
    console.log('[GET] /api/v1/products/:id');
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ msg: 'Invalid id' });

    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    return res.status(200).json(product);
  } catch (err) {
    console.error('getProductById error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/v1/products — create product (admin only)
router.post('/', [auth, admin], validate(schemas.productCreate), async (req, res) => {
  try {
    console.log('[POST] /api/v1/products');
    const created = await Product.create(req.body); // body already validated
    return res.status(201).json(created);
  } catch (err) {
    console.error('addProduct error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/v1/products/:id — update product (admin only)
router.put(
  '/:id',
  [auth, admin],
  validate(schemas.productUpdate),
  async (req, res) => {
    try {
      console.log('[PUT] /api/v1/products/:id');
      const id = toId(req.params.id);
      if (!id) return res.status(400).json({ msg: 'Invalid id' });

      const [updated] = await Product.update(req.body, { where: { prodId: id } });
      if (!updated) return res.status(404).json({ msg: 'Product not found' });

      const fresh = await Product.findByPk(id);
      return res.status(200).json(fresh);
    } catch (err) {
      console.error('updateProduct error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

// DELETE /api/v1/products/:id — delete product (admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    console.log('[DELETE] /api/v1/products/:id');
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ msg: 'Invalid id' });

    const deleted = await Product.destroy({ where: { prodId: id } });
    if (!deleted) return res.status(404).json({ msg: 'Product not found' });

    return res.status(204).send();
  } catch (err) {
    console.error('deleteProduct error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// ORDERED LIST — GET /api/v1/products/o/:field/:dir
router.get('/o/:field/:dir', validate(schemas.orderSortParams, { source: 'params' }), async (req, res) => {
  console.log('/api/v1/products/o/:field/:dir - GET');
  const { field, dir } = req.params;
  try {
    const direction = dir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const list = await Product.findAll({ order: [[field, direction]] });
    return res.status(200).json(list);
  } catch (err) {
    console.error('products:order error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// TWO-FIELD SORT — GET /api/v1/products/sort/two/:first/:second
router.get(
  '/sort/two/:first/:second',
  validate(schemas.orderTwoSortParams, { source: 'params' }),
  async (req, res) => {
    try {
      const { first, second } = req.params;
      const rows = await Product.findAll({ order: [[first, 'ASC'], [second, 'ASC']] });
      return res.status(200).json(rows);
    } catch (err) {
      console.error('products:two-field sort error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  }
);

module.exports = router;
