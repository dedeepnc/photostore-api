/**
 * Authentication Routes (Customer, Staff, Admin)
 * Handles registration and login for all user roles.
 * Uses centralized Joi validation + bcrypt + JWT.
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

// Import centralized validator and validation schemas
const { validate, schemas } = require('../validation/validation');

const router = express.Router();
const { Customer, Staff, Admin } = db.sequelize.models;

// ---------- JWT Configuration ----------
const JWT_SECRET     = process.env.JWT_SECRET     || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_ISSUER     = process.env.JWT_ISSUER     || 'photostore-api';
const JWT_AUDIENCE   = process.env.JWT_AUDIENCE   || 'photostore-users';

/**
 * Generate JWT token with standard claims
 * @param {Object} payload - Data to include in token
 * @param {Object} options - Additional options
 * @param {string} [options.subject] - Subject claim (user ID)
 * @returns {string} Signed JWT token
 */
function signToken(payload, { subject } = {}) {
  return jwt.sign({ ...payload }, JWT_SECRET, {
    algorithm: 'HS512',
    expiresIn: JWT_EXPIRES_IN,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    jwtid: uuidv4(), // Unique token ID
    subject: subject ? String(subject) : undefined,
  });
}

/**
 * Send standardized server error response
 * @param {Object} res - Express response object
 * @param {string} label - Error context label for logging
 * @param {Error} err - Error object
 * @returns {Object} Express response with 500 status
 */
const serverError = (res, label, err) => {
  console.error(`${label} error:`, err);
  return res.status(500).json({ errors: [{ msg: 'Server Error' }] });
};

// ======================================================
// ===================  CUSTOMER  =======================
// ======================================================

/**
 * POST /customer/register
 * Register a new customer account
 */
router.post(
  '/customer/register',
  validate(schemas.authCustomerRegister), // Validate request body
  async (req, res) => {
    try {
      const { name, email, address, phone, password } = req.body;

      // Check if customer already exists
      const existing = await Customer.findOne({ where: { email } });
      if (existing)
        return res.status(409).json({ errors: [{ msg: 'User already registered' }] });

      // Hash password before storing
      const hashed = await bcrypt.hash(password, 10);
      
      // Create new customer
      const cust = await Customer.create({
        name,
        email,
        address: address ?? null,
        phone: phone ?? null,
        password: hashed,
        role: 'customer',
      });

      // Build user object for token
      const user = {
        custId: cust.custId,
        staffId: null,
        adminId: null,
        name: cust.name,
        email: cust.email,
        role: 'customer',
      };
      
      // Generate JWT token
      const token = signToken({ user }, { subject: String(cust.custId) });
      return res.status(201).json({ token, user });
    } catch (err) {
      return serverError(res, 'customer/register', err);
    }
  }
);

/**
 * POST /customer/login
 * Authenticate customer and return JWT token
 */
router.post(
  '/customer/login',
  validate(schemas.authCustomerLogin), // Validate request body
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find customer (bypass default scope to get password field)
      const customer = await Customer.scope(null).findOne({ where: { email } });
      if (!customer)
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });

      // Verify password
      const ok = await bcrypt.compare(password, customer.password);
      if (!ok)
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });

      // Build user object for token
      const user = {
        custId: customer.custId,
        staffId: null,
        adminId: null,
        name: customer.name,
        email: customer.email,
        role: customer.role || 'customer',
      };
      
      // Generate JWT token
      const token = signToken({ user }, { subject: String(customer.custId) });
      return res.status(200).json({ token, user });
    } catch (err) {
      return serverError(res, 'customer/login', err);
    }
  }
);

// ======================================================
// ====================  STAFF  =========================
// ======================================================

/**
 * POST /staff/register
 * Register a new staff account
 */
router.post(
  '/staff/register',
  validate(schemas.authStaffRegister), // Validate request body
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Check if staff already exists
      const existing = await Staff.findOne({ where: { email } });
      if (existing)
        return res.status(409).json({ errors: [{ msg: 'User already registered' }] });

      // Hash password before storing
      const hashed = await bcrypt.hash(password, 10);
      
      // Create new staff member
      const staff = await Staff.create({
        name,
        email,
        password: hashed,
        role: 'staff',
      });

      // Build user object for token
      const user = {
        custId: null,
        staffId: staff.staffId,
        adminId: null,
        name: staff.name,
        email: staff.email,
        role: 'staff',
      };
      
      // Generate JWT token
      const token = signToken({ user }, { subject: String(staff.staffId) });
      return res.status(201).json({ token, user });
    } catch (err) {
      return serverError(res, 'staff/register', err);
    }
  }
);

/**
 * POST /staff/login
 * Authenticate staff and return JWT token
 */
router.post(
  '/staff/login',
  validate(schemas.authStaffLogin), // Validate request body
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find staff (bypass default scope to get password field)
      const staff = await Staff.scope(null).findOne({ where: { email } });
      if (!staff)
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });

      // Verify password
      const ok = await bcrypt.compare(password, staff.password);
      if (!ok)
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });

      // Build user object for token
      const user = {
        custId: null,
        staffId: staff.staffId,
        adminId: null,
        name: staff.name,
        email: staff.email,
        role: 'staff',
      };
      
      // Generate JWT token
      const token = signToken({ user }, { subject: String(staff.staffId) });
      return res.status(200).json({ token, user });
    } catch (err) {
      return serverError(res, 'staff/login', err);
    }
  }
);

// ======================================================
// =====================  ADMIN  ========================
// ======================================================

/**
 * POST /admin/register
 * Register a new admin account
 */
router.post(
  '/admin/register',
  validate(schemas.authAdminRegister), // Validate request body
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Check if admin already exists
      const existing = await Admin.findOne({ where: { email } });
      if (existing)
        return res.status(409).json({ errors: [{ msg: 'Admin already registered' }] });

      // Hash password before storing
      const hashed = await bcrypt.hash(password, 10);
      
      // Create new admin
      const admin = await Admin.create({
        name,
        email,
        password: hashed,
        role: 'admin',
      });

      // Build user object for token
      const user = {
        custId: null,
        staffId: null,
        adminId: admin.adminId,
        name: admin.name,
        email: admin.email,
        role: 'admin',
      };
      
      // Generate JWT token
      const token = signToken({ user }, { subject: String(admin.adminId) });
      return res.status(201).json({ token, user });
    } catch (err) {
      return serverError(res, 'admin/register', err);
    }
  }
);

/**
 * POST /admin/login
 * Authenticate admin and return JWT token
 */
router.post(
  '/admin/login',
  validate(schemas.authAdminLogin), // Validate request body
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find admin (bypass default scope to get password field)
      const admin = await Admin.scope(null).findOne({ where: { email } });
      if (!admin)
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });

      // Verify password
      const ok = await bcrypt.compare(password, admin.password);
      if (!ok)
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });

      // Build user object for token
      const user = {
        custId: null,
        staffId: null,
        adminId: admin.adminId,
        name: admin.name,
        email: admin.email,
        role: admin.role || 'admin',
      };
      
      // Generate JWT token
      const token = signToken({ user }, { subject: String(admin.adminId) });
      return res.status(200).json({ token, user });
    } catch (err) {
      return serverError(res, 'admin/login', err);
    }
  }
);

module.exports = router;