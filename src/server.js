// File: src/server.js
// -------------------------------------------------------------
// Main entry point for the API application.
// This file sets up the Express server, loads configuration,
// connects to the database, and enables centralized logging
// using Morgan + Winston.
// -------------------------------------------------------------

// Import express framework
const express = require('express');

// Import our configuration file (port, db, jwt, etc.)
const config = require('./config/config');

// Import Sequelize database and models
const db = require('./models');

// Import all route files
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');

// Import our custom Winston logger and Morgan middleware
const logger = require('./logger');
const morganMiddleware = require('./morganMiddleware');

// -------------------------------------------------------------
// Create an Express app instance
// -------------------------------------------------------------
const app = express();

// -------------------------------------------------------------
// Global Middleware
// -------------------------------------------------------------

// Middleware: parse incoming JSON data
app.use(express.json());

// Middleware: parse URL-encoded form data (for HTML forms)
app.use(express.urlencoded({ extended: true }));

// Middleware: log all incoming HTTP requests (Morgan + Winston)
app.use(morganMiddleware);

// -------------------------------------------------------------
// Mount routes
// -------------------------------------------------------------
// All routes are grouped by their base path
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/orders', orderRoutes);

// -------------------------------------------------------------
// Start server and connect to DB
// -------------------------------------------------------------
db.sequelize
  .sync() // Synchronize Sequelize models with the database
  .then(() => {
    app.listen(config.port, () => {
      // ✅ Use Winston instead of console.log
      logger.info(`✅ Server is running on http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    // ✅ Log any startup or DB sync errors
    logger.error('❌ Database synchronization failed:', err);
  });
