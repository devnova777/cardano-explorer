/**
 * Cardano Explorer Utilities
 *
 * Provides shared utility functions for:
 * - Date formatting
 * - Currency conversion and formatting
 * - DOM manipulation
 * - Data validation
 * - Error handling
 *
 * @module utils
 */

const CONSTANTS = {
  LOVELACE_TO_ADA: 1000000,
  DATE_OPTIONS: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  },
  NUMBER_FORMAT: {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  },
};

/**
 * Date formatting utilities
 */
const dateUtils = {
  /**
   * Formats a Unix timestamp to a localized date string
   * @param {number} timestamp - Unix timestamp in seconds
   * @returns {string} Formatted date string
   */
  formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp * 1000).toLocaleString(
        undefined,
        CONSTANTS.DATE_OPTIONS
      );
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  },

  /**
   * Converts a date to a relative time string (e.g., "2 hours ago")
   * @param {number} timestamp - Unix timestamp in seconds
   * @returns {string} Relative time string
   */
  getRelativeTime(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      const diff = (timestamp * 1000 - Date.now()) / 1000;

      const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1,
      };

      for (const [unit, seconds] of Object.entries(intervals)) {
        if (Math.abs(diff) >= seconds) {
          return rtf.format(Math.round(diff / seconds), unit);
        }
      }
      return 'just now';
    } catch (error) {
      console.error('Error calculating relative time:', error);
      return 'Unknown time';
    }
  },
};

/**
 * Currency formatting utilities
 */
const currencyUtils = {
  /**
   * Converts Lovelace to ADA with proper formatting
   * @param {string|number} lovelace - Amount in Lovelace
   * @returns {string} Formatted ADA amount
   */
  formatAda(lovelace) {
    try {
      const value = parseInt(lovelace) || 0;
      return (value / CONSTANTS.LOVELACE_TO_ADA).toLocaleString(
        undefined,
        CONSTANTS.NUMBER_FORMAT
      );
    } catch (error) {
      console.error('Error formatting ADA:', error);
      return '0.000000';
    }
  },

  /**
   * Formats a number with thousands separators
   * @param {number} value - Number to format
   * @returns {string} Formatted number
   */
  formatNumber(value) {
    try {
      return parseInt(value).toLocaleString() || '0';
    } catch (error) {
      console.error('Error formatting number:', error);
      return '0';
    }
  },
};

/**
 * DOM manipulation utilities
 */
const domUtils = {
  /**
   * Gets a DOM element by ID with error handling
   * @param {string} id - Element ID
   * @returns {HTMLElement} The found element or a placeholder
   */
  getElement(id) {
    try {
      const element = document.getElementById(id);
      if (!element) {
        console.warn(`Element with id '${id}' not found, creating placeholder`);
        const placeholder = document.createElement('div');
        placeholder.id = id;
        document.body.appendChild(placeholder);
        return placeholder;
      }
      return element;
    } catch (error) {
      console.error('Error getting element:', error);
      return document.createElement('div');
    }
  },

  /**
   * Safely adds event listener with error handling
   * @param {HTMLElement} element - Target element
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  addSafeEventListener(element, event, handler) {
    try {
      if (element && typeof handler === 'function') {
        element.addEventListener(event, handler);
      }
    } catch (error) {
      console.error('Error adding event listener:', error);
    }
  },
};

/**
 * Data validation utilities
 */
const validationUtils = {
  /**
   * Validates a hash string
   * @param {string} hash - Hash to validate
   * @returns {boolean} Whether the hash is valid
   */
  isValidHash(hash) {
    return /^[0-9a-fA-F]{64}$/.test(hash);
  },

  /**
   * Validates an epoch number
   * @param {number} epoch - Epoch to validate
   * @returns {boolean} Whether the epoch is valid
   */
  isValidEpoch(epoch) {
    return Number.isInteger(epoch) && epoch >= 0;
  },
};

// Export individual utilities and constants
export const { formatDate, getRelativeTime } = dateUtils;

export const { formatAda, formatNumber } = currencyUtils;

export const { getElement, addSafeEventListener } = domUtils;

export const { isValidHash, isValidEpoch } = validationUtils;

export const { LOVELACE_TO_ADA } = CONSTANTS;
