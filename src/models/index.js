const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    dialect: config.db.dialect,
    storage: config.db.storage,
    logging: false,
  }
);

// --- Models ---
sequelize.define('Product', {
  prodId: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:   { type: DataTypes.STRING, allowNull: false },
  price:  { type: DataTypes.DECIMAL(10, 2) },
  stock:  { type: DataTypes.INTEGER },
});

sequelize.define('Customer', {
  custId:   { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:     { type: DataTypes.STRING, allowNull: false },
  email:    { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role:     { type: DataTypes.STRING, defaultValue: 'customer' },
}, {
  defaultScope: { attributes: { exclude: ['password'] } },
});

sequelize.define('Staff', {
  staffId:  { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:     { type: DataTypes.STRING, allowNull: false },
  email:    { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role:     { type: DataTypes.STRING, defaultValue: 'staff' },
}, {
  defaultScope: { attributes: { exclude: ['password'] } },
});

sequelize.define('Admin', {
  adminId:  { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name:     { type: DataTypes.STRING, allowNull: false },
  email:    { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role:     { type: DataTypes.STRING, defaultValue: 'admin' },
}, {
  defaultScope: { attributes: { exclude: ['password'] } },
});

sequelize.define('Order', {
  orderId: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  custId:  { type: DataTypes.INTEGER, allowNull: false },
  status:  { type: DataTypes.STRING, defaultValue: 'pending' },
  total:   { type: DataTypes.DECIMAL(10, 2) },
});

// --- Associations ---
const { Customer, Order, Product, Staff, Admin } = sequelize.models;
Customer.hasMany(Order, { foreignKey: 'custId' });

// --- Instance helpers (kept from your original) ---
Customer.prototype.signToken = function(payload){
  const token = jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: '7d',
    algorithm: 'HS512',
  });
  return token;
};

Customer.prototype.hashPwd = async function(password){
  const salt = await bcrypt.genSalt(11);
  return bcrypt.hash(password, salt);
};

// --- Export ---
const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Customer = Customer;
db.Order    = Order;
db.Product  = Product;
db.Staff    = Staff;
db.Admin    = Admin;

module.exports = db;
