/**
 * Async Handler Middleware
 *
 * Provides error handling wrapper for async route handlers:
 * - Catches and forwards all errors to error middleware
 * - Handles promise rejections
 * - Ensures proper error stack traces
 * - Supports both async/await and promise-based handlers
 * - Preserves original error context
 *
 * @module middleware/asyncHandler
 */

/**
 * Custom error for timeout handling
 */
class RequestTimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'RequestTimeoutError';
    this.status = 408;
  }
}

/**
 * Wraps an async function with timeout and error handling
 * @param {Function} fn - Async route handler function
 * @param {Object} options - Configuration options
 * @param {number} [options.timeout=30000] - Timeout in milliseconds
 * @returns {Function} Wrapped route handler
 */
export const asyncHandler = (fn, options = {}) => {
  const timeout = options.timeout || 30000; // Default 30 second timeout

  return (req, res, next) => {
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new RequestTimeoutError());
      }, timeout);
    });

    // Create handler promise
    const handlerPromise = Promise.resolve(fn(req, res, next)).catch(
      (error) => {
        // Preserve error status and custom properties
        if (error instanceof Error) {
          if (!error.status && error.name === 'ValidationError') {
            error.status = 400;
          }
          if (!error.status && error.name === 'NotFoundError') {
            error.status = 404;
          }
        }

        // Add request context to error
        error.path = req.path;
        error.method = req.method;
        error.timestamp = new Date().toISOString();

        throw error;
      }
    );

    // Race between timeout and handler
    return Promise.race([handlerPromise, timeoutPromise]).catch((error) => {
      // Log error details if needed
      if (process.env.NODE_ENV !== 'test') {
        console.error('Request error:', {
          path: req.path,
          method: req.method,
          error: {
            name: error.name,
            message: error.message,
            status: error.status,
            stack: error.stack,
          },
        });
      }

      next(error);
    });
  };
};

/**
 * Creates an async handler with custom options
 * @param {Object} options - Handler options
 * @returns {Function} Configured async handler creator
 */
export const createAsyncHandler = (options = {}) => {
  return (fn) => asyncHandler(fn, options);
};

/**
 * Specialized handler for API routes with shorter timeout
 */
export const apiHandler = createAsyncHandler({
  timeout: 15000, // 15 second timeout for API routes
});

/**
 * Specialized handler for database operations with longer timeout
 */
export const dbHandler = createAsyncHandler({
  timeout: 60000, // 60 second timeout for DB operations
});

/**
 * Error types for consistent error handling
 */
export const ErrorTypes = {
  RequestTimeout: RequestTimeoutError,
  ValidationError: class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ValidationError';
      this.status = 400;
    }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = 'NotFoundError';
      this.status = 404;
    }
  },
};
