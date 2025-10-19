// Load environment variables from .env file
require('dotenv').config();

// Export configuration as an object so we can use it elsewhere
module.exports = {
  // The port the server will listen on
  port: process.env.PORT,

  // Database configuration (for Sequelize)
  db: {
    username: process.env.DB_USER,       // Database username
    password: process.env.DB_PASS,       // Database password (blank for sqlite)
    database: process.env.DB_NAME,       // Database name (sqlite file)
    host: process.env.HOST,              // Hostname (not used in sqlite, but required in Sequelize)
    dialect: process.env.DIALECT, // Database dialect, default sqlite
    storage: './data/photostore.sqlite'        // SQLite file location
  },
  auth: {
    // Secret key used for JWT token signing
    jwtSecret: process.env.JWT_SECRET
  }
};
