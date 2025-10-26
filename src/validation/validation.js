/**
 * Centralized Validation Module (Joi)
 * Provides reusable validation schemas and middleware for all API routes
 * Automatically formats validation errors in a consistent format
 */

const Joi = require('joi');

// ---------- Internal Helpers ----------

/**
 * Format and send 400 validation error response
 * @param {Object} res - Express response object
 * @param {Object} error - Joi validation error
 * @returns {Object} Express response with formatted error details
 */
function as400(res, error) {
  return res.status(400).json({
    msg: 'Validation failed',
    details: error.details.map((d) => ({
      message: d.message,
      path: d.path.join('.'),
      type: d.type,
    })),
  });
}

/**
 * Validation Middleware Factory
 * Creates middleware to validate request data (body, params, or query)
 * 
 * @param {Object} schema - Joi validation schema
 * @param {Object} options - Validation options
 * @param {string} [options.source='body'] - Request property to validate ('body', 'params', 'query')
 * @param {boolean} [options.stripUnknown=true] - Remove unknown properties
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.post('/users', validate(schemas.userCreate), handler);
 * router.get('/:id', validate(schemas.idParam, { source: 'params' }), handler);
 */
function validate(schema, { source = 'body', stripUnknown = true } = {}) {
  return (req, res, next) => {
    const data = req[source] ?? {};
    
    // Validate data with Joi
    const { value, error } = schema.validate(data, {
      abortEarly: false,  // Return all errors, not just the first
      stripUnknown,       // Remove extra fields not in schema
      convert: true,      // Type coercion (string to number, etc.)
    });

    // Return 400 if validation fails
    if (error) return as400(res, error);

    // Normalize email field (trim and lowercase)
    if (value.email) value.email = String(value.email).trim().toLowerCase();

    // Update request with validated/sanitized data
    req[source] = value;
    req.validated = req.validated || {};
    req.validated[source] = value;
    
    next();
  };
}

// ---------- Reusable Field Definitions ----------

// Name field (2-60 characters)
const name = Joi.string().trim().min(2).max(60).messages({
  'string.empty': 'Name cannot be empty',
  'string.min': 'Name must be at least 2 characters long',
});

// Email field (standard email validation)
const email = Joi.string().trim().email().max(254).messages({
  'string.email': 'Must be a valid email address',
});

// Strong password (min 8 chars, uppercase, lowercase, number, special char)
const strongPassword = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/, 'strong password')
  .messages({
    'string.pattern.name':
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters long',
  });

// Positive integer ID
const id = Joi.number().integer().positive().messages({
  'number.base': 'ID must be a number',
  'number.positive': 'ID must be positive',
});

// Optional fields
const phone = Joi.string().trim().max(40);
const address = Joi.string().trim().max(120);
const sortDir = Joi.string().insensitive().valid('ASC', 'DESC');

// ---------- Auth Schemas ----------

// Customer registration
const authCustomerRegister = Joi.object({
  name: name.required(),
  email: email.required(),
  password: strongPassword.required(),
  address: address.allow('', null),
  phone: phone.allow('', null),
});

// Customer login
const authCustomerLogin = Joi.object({
  email: email.required(),
  password: Joi.string().required(),
});

// Staff registration
const authStaffRegister = Joi.object({
  name: name.required(),
  email: email.required(),
  password: strongPassword.required(),
});

// Reuse login schema for staff and admin
const authStaffLogin = authCustomerLogin;
const authAdminRegister = authStaffRegister;
const authAdminLogin = authCustomerLogin;

// ---------- Customer Schemas ----------

// Create customer (similar to registration)
const customerCreate = Joi.object({
  name: name.required(),
  email: email.required(),
  address: address.allow('', null),
  phone: phone.allow('', null),
  password: strongPassword.required(),
}).required();

// Update customer (all fields optional, but at least one required)
const customerUpdate = Joi.object({
  name,
  email,
  address: address.allow('', null),
  phone: phone.allow('', null),
  password: strongPassword,
}).min(1);

// ---------- Product Schemas ----------

// Create product
const productCreate = Joi.object({
  name: Joi.string()
    .trim()
    .pattern(/^[A-Za-z\s]+$/, 'letters and spaces only')
    .min(3)
    .max(30)
    .required(),
  price: Joi.number().positive().precision(2).required(),
  stock: Joi.number().integer().min(0).required(),
});

// Update product (all fields optional, but at least one required)
const productUpdate = Joi.object({
  name: Joi.string()
    .trim()
    .pattern(/^[A-Za-z\s]+$/, 'letters and spaces only')
    .min(3)
    .max(30),
  price: Joi.number().positive().precision(2),
  stock: Joi.number().integer().min(0),
}).min(1);

// ---------- Order Schemas ----------

// Order ID parameter validation
const orderIdParam = Joi.object({ id: id.required() });

// Single field sort validation
const orderSortParams = Joi.object({
  field: Joi.string()
    .valid('orderId', 'total', 'status', 'createdAt')
    .required(),
  dir: sortDir.required(),
});

// Two-field sort validation
const orderTwoSortParams = Joi.object({
  first: Joi.string()
    .valid('orderId', 'total', 'status', 'createdAt')
    .required(),
  second: Joi.string()
    .valid('orderId', 'total', 'status', 'createdAt')
    .required(),
});

// ---------- Exports ----------

module.exports = {
  Joi,
  validate,
  schemas: {
    // Auth schemas
    authCustomerRegister,
    authCustomerLogin,
    authStaffRegister,
    authStaffLogin,
    authAdminRegister,
    authAdminLogin,
    // Customer schemas
    customerCreate,
    customerUpdate,
    // Product schemas
    productCreate,
    productUpdate,
    // Order schemas
    orderIdParam,
    orderSortParams,
    orderTwoSortParams,
  },
};