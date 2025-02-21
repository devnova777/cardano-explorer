/**
 * Async Handler Middleware
 *
 * Provides error handling wrapper for async route handlers:
 * - Catches and forwards all errors to error middleware
 * - Handles promise rejections and timeouts
 * - Ensures proper error stack traces
 * - Supports both async/await and promise-based handlers
 * - Preserves original error context
 * - Includes performance monitoring
 * - Supports custom error mapping
 *
 * @module middleware/asyncHandler
 * @version 1.1.0
 */

import { APIError } from '../utils/APIError.js';

// Configuration Constants
const CONFIG = {
  TIMEOUTS: {
    DEFAULT: 30000, // 30 seconds
    API: 15000, // 15 seconds
    DATABASE: 60000, // 60 seconds
    MINIMUM: 1000, // 1 second minimum
    MAXIMUM: 300000, // 5 minutes maximum
  },
  MONITORING: {
    SLOW_THRESHOLD: 5000, // Log requests taking longer than 5 seconds
  },
  ERROR_TYPES: {
    VALIDATION: 'ValidationError',
    NOT_FOUND: 'NotFoundError',
    TIMEOUT: 'RequestTimeoutError',
  },
};

/**
 * Performance monitoring for request handlers
 * @param {string} path - Request path
 * @param {string} method - HTTP method
 * @param {number} duration - Request duration in ms
 * @private
 */
const monitorPerformance = (path, method, duration) => {
  if (duration > CONFIG.MONITORING.SLOW_THRESHOLD) {
    console.warn('Slow request detected:', {
      path,
      method,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Maps error types to APIError instances
 * @param {Error} error - Original error
 * @param {Object} context - Error context
 * @returns {APIError} Mapped API error
 * @private
 */
const mapError = (error, context) => {
  if (error instanceof APIError) {
    return error;
  }

  const errorMap = {
    [CONFIG.ERROR_TYPES.VALIDATION]: () => APIError.validation(error.message),
    [CONFIG.ERROR_TYPES.NOT_FOUND]: () => APIError.notFound(error.message),
    [CONFIG.ERROR_TYPES.TIMEOUT]: () =>
      APIError.timeout('Request processing timed out'),
  };

  const mappedError =
    errorMap[error.name]?.() ||
    new APIError(error.message, error.status || 500);

  // Add request context
  Object.assign(mappedError, {
    path: context.path,
    method: context.method,
    timestamp: new Date().toISOString(),
    originalError: process.env.NODE_ENV === 'development' ? error : undefined,
  });

  return mappedError;
};

/**
 * Validates and normalizes timeout value
 * @param {number} timeout - Timeout in milliseconds
 * @returns {number} Normalized timeout value
 * @private
 */
const normalizeTimeout = (timeout) => {
  const value = parseInt(timeout);
  if (isNaN(value) || value < CONFIG.TIMEOUTS.MINIMUM) {
    return CONFIG.TIMEOUTS.DEFAULT;
  }
  return Math.min(value, CONFIG.TIMEOUTS.MAXIMUM);
};

/**
 * Wraps an async function with timeout and error handling
 * @param {Function} fn - Async route handler function
 * @param {Object} [options={}] - Configuration options
 * @param {number} [options.timeout] - Timeout in milliseconds
 * @param {Function} [options.onError] - Custom error handler
 * @param {Function} [options.onTimeout] - Custom timeout handler
 * @returns {Function} Wrapped route handler
 */
export const asyncHandler = (fn, options = {}) => {
  const timeout = normalizeTimeout(options.timeout);

  return async (req, res, next) => {
    const startTime = Date.now();

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          const error = new ErrorTypes.RequestTimeout();
          if (options.onTimeout) {
            options.onTimeout(error, req);
          }
          reject(error);
        }, timeout);
      });

      // Execute handler with timeout race
      await Promise.race([Promise.resolve(fn(req, res, next)), timeoutPromise]);

      // Monitor performance
      monitorPerformance(req.path, req.method, Date.now() - startTime);
    } catch (error) {
      const mappedError = mapError(error, {
        path: req.path,
        method: req.method,
      });

      // Custom error handling if provided
      if (options.onError) {
        options.onError(mappedError, req);
      }

      // Log error in non-test environments
      if (process.env.NODE_ENV !== 'test') {
        console.error('Request error:', {
          path: req.path,
          method: req.method,
          duration: `${Date.now() - startTime}ms`,
          error: {
            name: mappedError.name,
            message: mappedError.message,
            status: mappedError.status,
            type: mappedError.type,
            stack:
              process.env.NODE_ENV === 'development'
                ? mappedError.stack
                : undefined,
          },
        });
      }

      next(mappedError);
    }
  };
};

/**
 * Specialized handler for API routes with shorter timeout
 * @param {Function} fn - Route handler
 * @returns {Function} Configured async handler
 */
export const apiHandler = (fn) =>
  asyncHandler(fn, {
    timeout: CONFIG.TIMEOUTS.API,
    onTimeout: (error) => {
      console.warn('API request timeout:', error.message);
    },
  });

/**
 * Specialized handler for database operations with longer timeout
 * @param {Function} fn - Route handler
 * @returns {Function} Configured async handler
 */
export const dbHandler = (fn) =>
  asyncHandler(fn, {
    timeout: CONFIG.TIMEOUTS.DATABASE,
    onTimeout: (error) => {
      console.warn('Database operation timeout:', error.message);
    },
  });

/**
 * Creates an async handler with custom options
 * @param {Object} options - Handler options
 * @returns {Function} Configured async handler creator
 */
export const createAsyncHandler = (options = {}) => {
  return (fn) => asyncHandler(fn, options);
};

/**
 * Error types for consistent error handling
 * @namespace ErrorTypes
 */
export const ErrorTypes = {
  /**
   * Request timeout error
   * @class RequestTimeoutError
   * @extends Error
   */
  RequestTimeout: class RequestTimeoutError extends Error {
    constructor(message = 'Request timed out') {
      super(message);
      this.name = CONFIG.ERROR_TYPES.TIMEOUT;
      this.status = 408;
    }
  },

  /**
   * Validation error
   * @class ValidationError
   * @extends Error
   */
  ValidationError: class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = CONFIG.ERROR_TYPES.VALIDATION;
      this.status = 400;
    }
  },

  /**
   * Not found error
   * @class NotFoundError
   * @extends Error
   */
  NotFoundError: class NotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = CONFIG.ERROR_TYPES.NOT_FOUND;
      this.status = 404;
    }
  },
};
