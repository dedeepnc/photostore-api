// File: src/morganMiddleware.js
// -------------------------------------------
// This middleware combines Morgan (HTTP request logger)
// with Winston (our main logger) to create structured,
// JSON-formatted logs for every incoming HTTP request.
// -------------------------------------------

// Import the morgan HTTP logger library
const morgan = require('morgan');
// Import our custom Winston logger instance
const logger = require('./logger');

// -------------------------------------------
// Define a custom Morgan format that outputs JSON.
// Each request log will contain detailed info about
// the request and response such as method, URL, status,
// response time, and user-agent.
// -------------------------------------------
const morganMiddleware = morgan(
  function (tokens, req, res) {
    // Return the request/response details as a JSON string
    return JSON.stringify({
      // HTTP method used (GET, POST, PUT, DELETE)
      method: tokens.method(req, res),

      // The requested URL path
      url: tokens.url(req, res),

      // Numeric status code returned by the response
      status: Number.parseFloat(tokens.status(req, res)),

      // Size of the response (in bytes)
      content_length: tokens.res(req, res, 'content-length'),

      // Total response time (in ms, as a number)
      response_time: Number.parseFloat(tokens['response-time'](req, res)),

      // Response time formatted as text with "ms"
      response_time_ms: tokens['response-time'](req, res) + ' ms',

      // IP address of the client making the request
      remote_address: tokens['remote-addr'](req, res),

      // Authenticated username if available (usually blank)
      remote_user: tokens['remote-user'](req, res),

      // Date and time of the request
      date: tokens.date(req, res),

      // HTTP protocol version (e.g., 1.1 or 2.0)
      http_version: tokens['http-version'](req, res),

      // Browser or tool that sent the request
      user_agent: tokens['user-agent'](req, res),

      // The "referrer" header (where the request came from)
      referrer: tokens.referrer(req, res),
    });
  },
  {
    // -------------------------------------------
    // Define how Morgan should output (stream) the logs.
    // Instead of writing to the console, we send the log
    // data directly into Winston for advanced handling.
    // -------------------------------------------
    stream: {
      // "write" is called every time Morgan creates a log entry
      write: (message) => {
        // Convert the JSON string (from above) into an object
        const data = JSON.parse(message);

        // Log it using Winston at the "http" level
        // so it can be filtered separately from app logs.
        logger.http('Incoming Request', data);
      },
    },
  }
);

// Export the middleware so we can use it in server.js
module.exports = morganMiddleware;
