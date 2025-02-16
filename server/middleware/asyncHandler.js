/**
 * Async handler wrapper to avoid try-catch blocks in route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped route handler
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
