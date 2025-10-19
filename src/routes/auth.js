/**
 * Authentication Routes (Customer, Staff, Admin)
 * ---------------------------------------------------------
 * Handles registration and login for all user roles.
 * Uses centralized Joi validation + bcrypt + JWT.
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

// ✅ bring in centralized validator + schemas
const { validate, schemas } = require('../validation/validation');

const router = express.Router();
const { Customer, Staff, Admin } = db.sequelize.models;

// ---------- JWT CONFIG ----------
const JWT_SECRET     = process.env.JWT_SECRET     || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_ISSUER     = process.env.JWT_ISSUER     || 'photostore-api';
const JWT_AUDIENCE   = process.env.JWT_AUDIENCE   || 'photostore-users';

// ---------- Helper: signToken ----------
function signToken(payload, { subject } = {}) {
  return jwt.sign({ ...payload }, JWT_SECRET, {
    algorithm: 'HS512',
    expiresIn: JWT_EXPIRES_IN,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    jwtid: uuidv4(),
    subject: subject ? String(subject) : undefined,
  });
}

// ---------- Helper: Error format ----------
const serverError = (res, label, err) => {
  console.error(`${label} error:`, err);
  return res.status(500).json({ errors: [{ msg: 'Server Error' }] });
};

// ======================================================
// ===================  CUSTOMER  =======================
// ======================================================
router.post(
  '/customer/register',
  validate(schemas.authCustomerRegister),
  async (req, res) => {
    try {
      const { name, email, address, phone, password } = req.body;

      const existing = await Customer.findOne({ where: { email } });
      if (existing)
        return res.status(409).json({ errors: [{ msg: 'User already registered' }] });

      const hashed = await bcrypt.hash(password, 10);
      const cust = await Customer.create({
        name,
        email,
        address: address ?? null,
        phone: phone ?? null,
        password: hashed,
        role: 'customer',
      });

      const user = {
        custId: cust.custId,
        staffId: null,
        adminId: null,
        name: cust.name,
        email: cust.email,
        role: 'customer',
      };
      const token = signToken({ user }, { subject: String(cust.custId) });
      return res.status(201).json({ token, user });
    } catch (err) {
      return serverError(res, 'customer/register', err);
    }
  }
);

router.post(
  '/customer/login',
  validate(schemas.authCustomerLogin),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const customer = await Customer.scope(null).findOne({ where: { email } });
      if (!customer)
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });

      const ok = await bcrypt.compare(password, customer.password);
      if (!ok)
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });

      const user = {
        custId: customer.custId,
        staffId: null,
        adminId: null,
        name: customer.name,
        email: customer.email,
        role: customer.role || 'customer',
      };
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
router.post(
  '/staff/register',
  validate(schemas.authStaffRegister),
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existing = await Staff.findOne({ where: { email } });
      if (existing)
        return res.status(409).json({ errors: [{ msg: 'User already registered' }] });

      const hashed = await bcrypt.hash(password, 10);
      const staff = await Staff.create({
        name,
        email,
        password: hashed,
        role: 'staff',
      });

      const user = {
        custId: null,
        staffId: staff.staffId,
        adminId: null,
        name: staff.name,
        email: staff.email,
        role: 'staff',
      };
      const token = signToken({ user }, { subject: String(staff.staffId) });
      return res.status(201).json({ token, user });
    } catch (err) {
      return serverError(res, 'staff/register', err);
    }
  }
);

router.post(
  '/staff/login',
  validate(schemas.authStaffLogin),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const staff = await Staff.scope(null).findOne({ where: { email } });
      if (!staff)
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });

      const ok = await bcrypt.compare(password, staff.password);
      if (!ok)
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });

      const user = {
        custId: null,
        staffId: staff.staffId,
        adminId: null,
        name: staff.name,
        email: staff.email,
        role: 'staff',
      };
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
router.post(
  '/admin/register',
  validate(schemas.authAdminRegister),
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existing = await Admin.findOne({ where: { email } });
      if (existing)
        return res.status(409).json({ errors: [{ msg: 'Admin already registered' }] });

      const hashed = await bcrypt.hash(password, 10);
      const admin = await Admin.create({
        name,
        email,
        password: hashed,
        role: 'admin',
      });

      const user = {
        custId: null,
        staffId: null,
        adminId: admin.adminId,
        name: admin.name,
        email: admin.email,
        role: 'admin',
      };
      const token = signToken({ user }, { subject: String(admin.adminId) });
      return res.status(201).json({ token, user });
    } catch (err) {
      return serverError(res, 'admin/register', err);
    }
  }
);

router.post(
  '/admin/login',
  validate(schemas.authAdminLogin),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const admin = await Admin.scope(null).findOne({ where: { email } });
      if (!admin)
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });

      const ok = await bcrypt.compare(password, admin.password);
      if (!ok)
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });

      const user = {
        custId: null,
        staffId: null,
        adminId: admin.adminId,
        name: admin.name,
        email: admin.email,
        role: admin.role || 'admin',
      };
      const token = signToken({ user }, { subject: String(admin.adminId) });
      return res.status(200).json({ token, user });
    } catch (err) {
      return serverError(res, 'admin/login', err);
    }
  }
);

module.exports = router;
