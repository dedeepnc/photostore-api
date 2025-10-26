/**
 * Database Configuration and Models
 * Defines all Sequelize models and their relationships for the photostore application.
 */

const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Initialize Sequelize with database configuration
const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    dialect: config.db.dialect,
    storage: config.db.storage,
    logging: false, // Disable SQL query logging
  }
);

// --- Models ---

/**
 * Product Model
 * Represents items available for purchase
 */
sequelize.define('Product', {
  prodId: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:   { type: DataTypes.STRING, allowNull: false },
  price:  { type: DataTypes.DECIMAL(10, 2) }, // Stores prices with 2 decimal places
  stock:  { type: DataTypes.INTEGER },
});

/**
 * Customer Model
 * Represents registered customers who can place orders
 */
sequelize.define('Customer', {
  custId:   { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:     { type: DataTypes.STRING, allowNull: false },
  email:    { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role:     { type: DataTypes.STRING, defaultValue: 'customer' },
}, {
  // Exclude password field from query results by default for security
  defaultScope: { attributes: { exclude: ['password'] } },
});

/**
 * Staff Model
 * Represents staff members with elevated permissions
 */
sequelize.define('Staff', {
  staffId:  { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:     { type: DataTypes.STRING, allowNull: false },
  email:    { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role:     { type: DataTypes.STRING, defaultValue: 'staff' },
}, {
  // Exclude password field from query results by default for security
  defaultScope: { attributes: { exclude: ['password'] } },
});

/**
 * Admin Model
 * Represents administrators with full system access
 */
sequelize.define('Admin', {
  adminId:  { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:     { type: DataTypes.STRING, allowNull: false },
  email:    { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role:     { type: DataTypes.STRING, defaultValue: 'admin' },
}, {
  // Exclude password field from query results by default for security
  defaultScope: { attributes: { exclude: ['password'] } },
});

/**
 * Order Model
 * Represents customer purchase orders
 */
sequelize.define('Order', {
  orderId: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  custId:  { type: DataTypes.INTEGER, allowNull: false },
  status:  { type: DataTypes.STRING, defaultValue: 'pending' },
  total:   { type: DataTypes.DECIMAL(10, 2) }, // Order total with 2 decimal places
});

// --- Associations ---
// Define relationships between models
const { Customer, Order, Product, Staff, Admin } = sequelize.models;

// One customer can have many orders
Customer.hasMany(Order, { foreignKey: 'custId' });

// --- Instance Methods ---

/**
 * Generate JWT token for customer authentication
 * @param {Object} payload - Data to encode in the token
 * @returns {string} Signed JWT token
 */
Customer.prototype.signToken = function(payload){
  const token = jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: '7d',
    algorithm: 'HS512',
  });
  return token;
};

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} Hashed password
 */
Customer.prototype.hashPwd = async function(password){
  const salt = await bcrypt.genSalt(11); // Generate salt with 11 rounds
  return bcrypt.hash(password, salt);
};

// --- Export ---
// Export database instance and all models
const db = {};
db.sequelize = sequelize; // Sequelize instance
db.Sequelize = Sequelize; // Sequelize constructor
db.Customer = Customer;
db.Order    = Order;
db.Product  = Product;
db.Staff    = Staff;
db.Admin    = Admin;

module.exports = db;