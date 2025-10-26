/**
 * Application Configuration Module
 * 
 * Centralizes all configuration settings for the photostore application.
 * Loads environment variables from .env file and provides fallback defaults.
 * 
 * @module config
 */

// Load environment variables from .env file into process.env
require('dotenv').config();

/**
 * Configuration object containing all application settings
 * @type {Object}
 */
module.exports = {
  /**
   * Server port number for the application
   * @type {number}
   * @default 3001
   */
  port: process.env.PORT || 3001,

  /**
   * Database configuration for Sequelize ORM
   * @type {Object}
   * @property {string} username - Database username for authentication
   * @property {string} password - Database password for authentication
   * @property {string} database - Name of the database to connect to
   * @property {string} host - Database host address
   * @property {string} dialect - SQL dialect (e.g., 'mysql', 'postgres', 'sqlite')
   * @property {string} storage - File path for SQLite database (only used with SQLite dialect)
   */
  db: {
    /** Database username (default: 'root') */
    username: process.env.DB_USER || 'root',
    
    /** Database password (default: empty string) */
    password: process.env.DB_PASS || '',
    
    /** Database name (default: 'photostore') */
    database: process.env.DB_NAME || 'photostore',
    
    /** Database host address (default: 'localhost') */
    host: process.env.DB_HOST || 'localhost',
    
    /** SQL dialect type (default: 'sqlite') */
    dialect: process.env.DB_DIALECT || 'sqlite',
    
    /** SQLite file storage path (default: './data/photostore.sqlite') */
    storage: process.env.DB_STORAGE || './data/photostore.sqlite',
  },

  /**
   * Authentication and JWT (JSON Web Token) configuration
   * @type {Object}
   * @property {string} jwtSecret - Secret key used to sign and verify JWT tokens (REQUIRED in production)
   * @property {string} jwtExpiresIn - Token expiration time (e.g., '7d', '24h', '30m')
   * @property {string} jwtIssuer - JWT issuer claim identifying who issued the token
   * @property {string} jwtAudience - JWT audience claim identifying intended recipients
   */
  auth: {
    /** 
     * Secret key for JWT signing and verification
     * WARNING: This must be set in production via JWT_SECRET environment variable
     * @type {string}
     */
    jwtSecret: process.env.JWT_SECRET,
    
    /** 
     * JWT expiration time
     * Accepts time strings like '7d' (7 days), '24h' (24 hours), '30m' (30 minutes)
     * @type {string}
     * @default '7d'
     */
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    
    /** 
     * JWT issuer claim - identifies the principal that issued the token
     * @type {string}
     * @default 'photostore-api'
     */
    jwtIssuer: process.env.JWT_ISSUER || 'photostore-api',
    
    /** 
     * JWT audience claim - identifies the recipients that the token is intended for
     * @type {string}
     * @default 'photostore-users'
     */
    jwtAudience: process.env.JWT_AUDIENCE || 'photostore-users',
  },
};