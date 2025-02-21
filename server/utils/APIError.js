/**
 * API Error Handler
 *
 * Unified error handling system for API operations:
 * - Standardized error formatting
 * - HTTP status code management
 * - Error type classification
 * - Stack trace capture
 * - Factory methods for common errors
 *
 * @module utils/APIError
 */

export class APIError extends Error {
  static ERROR_TYPES = {
    VALIDATION: 'validation',
    NOT_FOUND: 'not_found',
    TIMEOUT: 'timeout',
    UNAUTHORIZED: 'unauthorized',
    FORBIDDEN: 'forbidden',
  };

  constructor(message, statusCode = 500, type = 'error') {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.type = type;
    Error.captureStackTrace(this, this.constructor);
  }

  static get types() {
    return this.ERROR_TYPES;
  }

  static validation(message) {
    return new APIError(message, 400, this.ERROR_TYPES.VALIDATION);
  }

  static notFound(message) {
    return new APIError(message, 404, this.ERROR_TYPES.NOT_FOUND);
  }

  static timeout(message = 'Request timed out') {
    return new APIError(message, 408, this.ERROR_TYPES.TIMEOUT);
  }

  static unauthorized(message) {
    return new APIError(message, 401, this.ERROR_TYPES.UNAUTHORIZED);
  }

  static forbidden(message) {
    return new APIError(message, 403, this.ERROR_TYPES.FORBIDDEN);
  }
}
