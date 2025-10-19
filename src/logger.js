// File: src/logger.js
const { createLogger, format, transports, addColors } = require('winston');
const path = require('path');

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ''
    }`;
  })
);

// Custom log levels (add HTTP level for requests)
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
  }
};
addColors(customLevels.colors);

const logger = createLogger({
  levels: customLevels.levels,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join('logs', 'combined.log') }),
    new transports.File({ filename: path.join('logs', 'error.log'), level: 'error' }),
  ],
});

module.exports = logger;
