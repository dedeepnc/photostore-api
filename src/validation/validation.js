/**
 * Centralized validation (Joi) for all routes in the API
 * ------------------------------------------------------
 *  - Reusable schemas for auth, customers, products, orders
 *  - Middleware: validate(schema, { source })
 *  - Automatically formats errors as { msg, details: [...] }
 */

const Joi = require('joi');

// ---------- internal helpers ----------
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
 * validate(schema, options)
 * ---------------------------------
 * Validates req[source] (default: body)
 *  - source: 'body' | 'params' | 'query'
 *  - assigns sanitized value back to req[source]
 *  - saves all validated data under req.validated[source]
 */
function validate(schema, { source = 'body', stripUnknown = true } = {}) {
  return (req, res, next) => {
    const data = req[source] ?? {};
    const { value, error } = schema.validate(data, {
      abortEarly: false,
      stripUnknown,
      convert: true,
    });

    if (error) return as400(res, error);

    // normalize common fields
    if (value.email) value.email = String(value.email).trim().toLowerCase();

    req[source] = value;
    req.validated = req.validated || {};
    req.validated[source] = value;
    next();
  };
}

// ---------- reusable building blocks ----------
const name = Joi.string().trim().min(2).max(60).messages({
  'string.empty': 'Name cannot be empty',
  'string.min': 'Name must be at least 2 characters long',
});

const email = Joi.string().trim().email().max(254).messages({
  'string.email': 'Must be a valid email address',
});

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

const id = Joi.number().integer().positive().messages({
  'number.base': 'ID must be a number',
  'number.positive': 'ID must be positive',
});

const phone = Joi.string().trim().max(40);
const address = Joi.string().trim().max(120);
const sortDir = Joi.string().insensitive().valid('ASC', 'DESC');

// ---------- AUTH ----------
const authCustomerRegister = Joi.object({
  name: name.required(),
  email: email.required(),
  password: strongPassword.required(),
  address: address.allow('', null),
  phone: phone.allow('', null),
});

const authCustomerLogin = Joi.object({
  email: email.required(),
  password: Joi.string().required(),
});

const authStaffRegister = Joi.object({
  name: name.required(),
  email: email.required(),
  password: strongPassword.required(),
});

const authStaffLogin = authCustomerLogin;
const authAdminRegister = authStaffRegister;
const authAdminLogin = authCustomerLogin;

// ---------- CUSTOMERS ----------
const customerCreate = Joi.object({
  name: name.required(),
  email: email.required(),
  address: address.allow('', null),
  phone: phone.allow('', null),
  password: strongPassword.required(),
}).required();

const customerUpdate = Joi.object({
  name,
  email,
  address: address.allow('', null),
  phone: phone.allow('', null),
  password: strongPassword,
}).min(1);

// ---------- PRODUCTS ----------
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

const productUpdate = Joi.object({
  name: Joi.string()
    .trim()
    .pattern(/^[A-Za-z\s]+$/, 'letters and spaces only')
    .min(3)
    .max(30),
  price: Joi.number().positive().precision(2),
  stock: Joi.number().integer().min(0),
}).min(1);

// ---------- ORDERS ----------
const orderIdParam = Joi.object({ id: id.required() });

const orderSortParams = Joi.object({
  field: Joi.string()
    .valid('orderId', 'total', 'status', 'createdAt')
    .required(),
  dir: sortDir.required(),
});

const orderTwoSortParams = Joi.object({
  first: Joi.string()
    .valid('orderId', 'total', 'status', 'createdAt')
    .required(),
  second: Joi.string()
    .valid('orderId', 'total', 'status', 'createdAt')
    .required(),
});

// ---------- EXPORT ----------
module.exports = {
  Joi,
  validate,
  schemas: {
    // Auth
    authCustomerRegister,
    authCustomerLogin,
    authStaffRegister,
    authStaffLogin,
    authAdminRegister,
    authAdminLogin,
    // Customers
    customerCreate,
    customerUpdate,
    // Products
    productCreate,
    productUpdate,
    // Orders
    orderIdParam,
    orderSortParams,
    orderTwoSortParams,
  },
};
