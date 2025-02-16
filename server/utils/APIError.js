/**
 * Unified API Error class for handling all types of API errors
 */
export class APIError extends Error {
  constructor(message, statusCode = 500, type = 'error') {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.type = type;
    Error.captureStackTrace(this, this.constructor);
  }

  static get types() {
    return {
      VALIDATION: 'validation',
      NOT_FOUND: 'not_found',
      TIMEOUT: 'timeout',
      UNAUTHORIZED: 'unauthorized',
      FORBIDDEN: 'forbidden',
    };
  }

  static validation(message) {
    return new APIError(message, 400, this.types.VALIDATION);
  }

  static notFound(message) {
    return new APIError(message, 404, this.types.NOT_FOUND);
  }

  static timeout(message = 'Request timed out') {
    return new APIError(message, 408, this.types.TIMEOUT);
  }

  static unauthorized(message) {
    return new APIError(message, 401, this.types.UNAUTHORIZED);
  }

  static forbidden(message) {
    return new APIError(message, 403, this.types.FORBIDDEN);
  }
}
