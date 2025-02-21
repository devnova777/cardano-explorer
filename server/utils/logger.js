/**
 * Logger Service
 *
 * Provides unified logging functionality across the application:
 * - Standardized log formatting
 * - Multiple log levels (ERROR, WARN, INFO, DEBUG)
 * - Environment-aware logging
 * - Contextual data support
 * - Timestamp tracking
 *
 * @module utils/logger
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

const formatLogMessage = (level, message, context = {}) => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  ...context,
  environment: process.env.NODE_ENV,
});

export const logger = {
  error: (message, context = {}) =>
    console.error(formatLogMessage(LOG_LEVELS.ERROR, message, context)),

  warn: (message, context = {}) =>
    console.warn(formatLogMessage(LOG_LEVELS.WARN, message, context)),

  info: (message, context = {}) =>
    console.log(formatLogMessage(LOG_LEVELS.INFO, message, context)),

  debug: (message, context = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatLogMessage(LOG_LEVELS.DEBUG, message, context));
    }
  },
};
