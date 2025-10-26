/**
 * Morgan HTTP Request Logger Middleware
 * Integrates Morgan with Winston to log HTTP requests in JSON format
 * Captures detailed request/response information for each API call
 */

const morgan = require('morgan');
const logger = require('./logger');

/**
 * Morgan middleware with custom JSON format
 * Logs all incoming HTTP requests with detailed metadata
 * Streams output to Winston logger at 'http' level
 */
const morganMiddleware = morgan(
  // Custom format function - returns JSON string with request details
  function (tokens, req, res) {
    return JSON.stringify({
      method: tokens.method(req, res),                              // HTTP method (GET, POST, etc.)
      url: tokens.url(req, res),                                    // Request URL path
      status: Number.parseFloat(tokens.status(req, res)),           // Response status code
      content_length: tokens.res(req, res, 'content-length'),       // Response size in bytes
      response_time: Number.parseFloat(tokens['response-time'](req, res)), // Response time (ms)
      response_time_ms: tokens['response-time'](req, res) + ' ms',  // Response time formatted
      remote_address: tokens['remote-addr'](req, res),              // Client IP address
      remote_user: tokens['remote-user'](req, res),                 // Authenticated user (if any)
      date: tokens.date(req, res),                                  // Request timestamp
      http_version: tokens['http-version'](req, res),               // HTTP protocol version
      user_agent: tokens['user-agent'](req, res),                   // Client browser/tool
      referrer: tokens.referrer(req, res),                          // Referrer header
    });
  },
  {
    // Stream configuration - send logs to Winston instead of console
    stream: {
      /**
       * Write function called by Morgan for each request
       * @param {string} message - JSON string with request data
       */
      write: (message) => {
        // Parse JSON and log through Winston at 'http' level
        const data = JSON.parse(message);
        logger.http('Incoming Request', data);
      },
    },
  }
);

module.exports = morganMiddleware;