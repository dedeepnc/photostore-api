/**
 * Main Server Entry Point
 * Sets up Express server, configures middleware, mounts routes,
 * and connects to the database using Sequelize
 */

const express = require('express');

// Import configuration (port, database, JWT settings)
const config = require('./config/config');

// Import database and models
const db = require('./models');

const helmet = require('helmet');
// Import route modules
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');

// Import logging utilities
const logger = require('./logger');
const morganMiddleware = require('./morganMiddleware');

// Create Express application
const app = express();

// ---------- Global Middleware ----------

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Add this after creating the app
app.use(helmet());

// Log all HTTP requests using Morgan + Winston
app.use(morganMiddleware);


// ---------- Route Mounting ----------
// Mount API routes with version prefix

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/orders', orderRoutes);

// ---------- Server Startup ----------

/**
 * Start server after database synchronization
 * 1. Sync Sequelize models with database
 * 2. Start Express server on configured port
 */
db.sequelize
  .sync() // Synchronize models with database
  .then(() => {
    // Start listening for requests
    app.listen(config.port, () => {
      logger.info(`✅ Server is running on http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    // Log database connection or sync errors
    logger.error('❌ Database synchronization failed:', err);
  });