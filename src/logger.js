/**
 * Logger Module (Winston)
 * Provides centralized logging with custom levels and multiple transports
 * Logs to console and files (combined.log and error.log)
 */

const { createLogger, format, transports, addColors } = require('winston');
const path = require('path');

/**
 * Log format configuration
 * Combines timestamp with custom formatting
 */
const logFormat = format.combine(
  // Add timestamp to each log entry
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  
  // Custom format: [timestamp] LEVEL: message {metadata}
  format.printf(({ timestamp, level, message, ...meta }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ''
    }`;
  })
);

/**
 * Custom log levels and colors
 * Levels (priority order): error > warn > info > http > debug
 */
const customLevels = {
  levels: {
    error: 0,  // Highest priority
    warn: 1,
    info: 2,
    http: 3,   // For HTTP request logging
    debug: 4   // Lowest priority (most verbose)
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
  }
};

// Apply custom colors to console output
addColors(customLevels.colors);

/**
 * Winston logger instance
 * Configured with custom levels and multiple output transports
 * 
 * Log level based on environment:
 * - Production: 'info' and above (error, warn, info)
 * - Development: 'debug' and above (all levels)
 */
const logger = createLogger({
  levels: customLevels.levels,
  
  // Set log level based on environment
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  
  format: logFormat,
  
  // Output transports (where logs are written)
  transports: [
    // Console output (all levels)
    new transports.Console(),
    
    // File output - all logs
    new transports.File({ filename: path.join('logs', 'combined.log') }),
    
    // File output - errors only
    new transports.File({ filename: path.join('logs', 'error.log'), level: 'error' }),
  ],
});

module.exports = logger;