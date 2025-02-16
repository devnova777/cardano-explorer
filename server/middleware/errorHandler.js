/**
 * Error Handler Middleware
 *
 * Provides error handling and API configuration validation:
 * - Validates Blockfrost API key configuration
 * - Handles API errors with appropriate status codes
 * - Handles validation errors
 * - Provides development-specific error details
 *
 * @module middleware/errorHandler
 */

import { APIError } from '../utils/APIError.js';

/**
 * Validates API configuration
 */
export const validateApiConfig = (req, res, next) => {
  if (!process.env.BLOCKFROST_API_KEY) {
    return res.status(500).json({
      error: 'Blockfrost API key is not configured',
    });
  }
  next();
};

/**
 * Global error handler
 */
export const errorHandler = (err, req, res, next) => {
  // Ensure we have a valid status code
  let statusCode = 500;

  if (err.status && !isNaN(err.status)) {
    statusCode = err.status;
  } else if (err.statusCode && !isNaN(err.statusCode)) {
    statusCode = err.statusCode;
  }

  console.error('Error:', {
    path: req.path,
    statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle Blockfrost specific errors
  if (err instanceof APIError) {
    return res.status(statusCode).json({
      success: false,
      error: err.message,
      status: statusCode,
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message,
      status: 400,
    });
  }

  // Handle other errors
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    status: statusCode,
  });
};
