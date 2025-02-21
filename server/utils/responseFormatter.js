/**
 * Response Formatter Service
 *
 * Provides standardized API response formatting:
 * - Success response formatting
 * - Error response handling
 * - Pagination support
 * - Environment-aware error details
 * - Consistent structure
 *
 * @module utils/responseFormatter
 */

export const formatSuccess = (data) => ({
  success: true,
  data,
});

export const formatError = (error) => ({
  success: false,
  error: error.message || 'Internal Server Error',
  status: error.status || 500,
  ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
});

export const formatPagination = (
  data,
  { currentPage, totalPages, hasNext, hasPrevious, totalItems }
) => ({
  success: true,
  data,
  pagination: {
    currentPage,
    totalPages,
    hasNext,
    hasPrevious,
    totalItems,
  },
});
