/**
 * Error Handler Middleware
 *
 * Provides centralized error handling and API configuration validation:
 * - Validates API configuration and environment settings
 * - Handles API errors with appropriate status codes
 * - Provides detailed error responses based on environment
 * - Supports custom error types and validation
 * - Includes security headers and sanitization
 * - Tracks error metrics and patterns
 *
 * @module middleware/errorHandler
 * @version 1.1.0
 */

import { APIError } from '../utils/APIError.js';

// Configuration Constants
const CONFIG = {
  ENVIRONMENTS: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test',
  },
  STATUS_CODES: {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TIMEOUT: 408,
    CONFLICT: 409,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
  ERROR_TYPES: {
    VALIDATION: 'ValidationError',
    API: 'APIError',
    NETWORK: 'NetworkError',
    DATABASE: 'DatabaseError',
    AUTH: 'AuthenticationError',
  },
  REQUIRED_ENV_VARS: ['BLOCKFROST_API_KEY', 'NODE_ENV'],
};

/**
 * Tracks error metrics for monitoring
 * @param {Error} error - Error instance
 * @param {Object} req - Express request object
 * @private
 */
const trackErrorMetrics = (error, req) => {
  if (process.env.NODE_ENV === CONFIG.ENVIRONMENTS.PRODUCTION) {
    console.warn('Error metrics:', {
      path: req.path,
      method: req.method,
      errorType: error.name,
      status: error.status || error.statusCode,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Sanitizes error messages for production
 * @param {string} message - Error message
 * @returns {string} Sanitized message
 * @private
 */
const sanitizeErrorMessage = (message) => {
  if (!message) return 'An error occurred';

  // Remove sensitive information patterns
  return message
    .replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, '[EMAIL]')
    .replace(/\b\d{4}[-]?\d{4}[-]?\d{4}[-]?\d{4}\b/g, '[CARD]')
    .replace(/([0-9a-fA-F]{32}|[0-9a-fA-F]{64})/g, '[HASH]');
};

/**
 * Validates required environment variables
 * @throws {Error} If required variables are missing
 * @private
 */
const validateEnvironment = () => {
  const missingVars = CONFIG.REQUIRED_ENV_VARS.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};

/**
 * Validates API configuration and environment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const validateApiConfig = (req, res, next) => {
  try {
    validateEnvironment();
    next();
  } catch (error) {
    console.error('Configuration error:', error.message);
    res.status(CONFIG.STATUS_CODES.SERVICE_UNAVAILABLE).json({
      success: false,
      error: 'Service configuration error',
      status: CONFIG.STATUS_CODES.SERVICE_UNAVAILABLE,
    });
  }
};

/**
 * Formats error response based on environment and error type
 * @param {Error} error - Error instance
 * @param {Object} req - Express request object
 * @returns {Object} Formatted error response
 * @private
 */
const formatErrorResponse = (error, req) => {
  const isDevelopment =
    process.env.NODE_ENV === CONFIG.ENVIRONMENTS.DEVELOPMENT;
  const statusCode =
    error.status || error.statusCode || CONFIG.STATUS_CODES.INTERNAL_ERROR;

  const baseResponse = {
    success: false,
    status: statusCode,
    error: isDevelopment ? error.message : sanitizeErrorMessage(error.message),
  };

  // Add development-specific information
  if (isDevelopment) {
    return {
      ...baseResponse,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      type: error.name,
      code: error.code,
    };
  }

  return baseResponse;
};

/**
 * Global error handler middleware
 * @param {Error} err - Error instance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const errorHandler = (err, req, res, next) => {
  // Track error metrics
  trackErrorMetrics(err, req);

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.removeHeader('X-Powered-By');

  // Determine status code
  const statusCode =
    err.status ||
    err.statusCode ||
    (err.name === CONFIG.ERROR_TYPES.VALIDATION
      ? CONFIG.STATUS_CODES.BAD_REQUEST
      : CONFIG.STATUS_CODES.INTERNAL_ERROR);

  // Log error details in non-test environment
  if (process.env.NODE_ENV !== CONFIG.ENVIRONMENTS.TEST) {
    console.error('Error details:', {
      path: req.path,
      method: req.method,
      statusCode,
      name: err.name,
      message: err.message,
      stack:
        process.env.NODE_ENV === CONFIG.ENVIRONMENTS.DEVELOPMENT
          ? err.stack
          : undefined,
    });
  }

  // Handle specific error types
  if (err instanceof APIError) {
    return res.status(statusCode).json(formatErrorResponse(err, req));
  }

  // Handle validation errors
  if (err.name === CONFIG.ERROR_TYPES.VALIDATION) {
    return res.status(CONFIG.STATUS_CODES.BAD_REQUEST).json(
      formatErrorResponse(
        {
          ...err,
          status: CONFIG.STATUS_CODES.BAD_REQUEST,
        },
        req
      )
    );
  }

  // Handle network errors
  if (err.name === CONFIG.ERROR_TYPES.NETWORK) {
    return res.status(CONFIG.STATUS_CODES.SERVICE_UNAVAILABLE).json(
      formatErrorResponse(
        {
          ...err,
          status: CONFIG.STATUS_CODES.SERVICE_UNAVAILABLE,
        },
        req
      )
    );
  }

  // Handle authentication errors
  if (err.name === CONFIG.ERROR_TYPES.AUTH) {
    return res.status(CONFIG.STATUS_CODES.UNAUTHORIZED).json(
      formatErrorResponse(
        {
          ...err,
          status: CONFIG.STATUS_CODES.UNAUTHORIZED,
        },
        req
      )
    );
  }

  // Handle all other errors
  res.status(statusCode).json(
    formatErrorResponse(
      {
        ...err,
        message: err.message || 'Internal Server Error',
        status: statusCode,
      },
      req
    )
  );
};
