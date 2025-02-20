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
   * @param {number|string} timestamp - Unix timestamp in seconds
   * @param {Object} [options] - Custom date format options
   * @returns {string} Formatted date string
   */
  formatDate(timestamp, options = CONSTANTS.DATE_OPTIONS) {
    if (!timestamp) return 'N/A';
    try {
      const ts =
        typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      if (!Number.isFinite(ts)) {
        console.warn('Invalid timestamp provided');
        return 'Invalid Date';
      }
      return new Date(ts * 1000).toLocaleString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  },

  /**
   * Converts a date to a relative time string (e.g., "2 hours ago")
   * @param {number|string} timestamp - Unix timestamp in seconds
   * @returns {string} Relative time string
   */
  getRelativeTime(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      const ts =
        typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      if (!Number.isFinite(ts)) {
        console.warn('Invalid timestamp provided');
        return 'Invalid Date';
      }

      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      const diff = (ts * 1000 - Date.now()) / 1000;
      const absDiff = Math.abs(diff);

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
        if (absDiff >= seconds) {
          return rtf.format(Math.round(diff / seconds), unit);
        }
      }
      return 'just now';
    } catch (error) {
      console.error('Error calculating relative time:', error);
      return 'Unknown time';
    }
  },

  /**
   * Formats a timestamp into a short date string (e.g., "2024-03-21")
   * @param {number|string} timestamp - Unix timestamp in seconds
   * @returns {string} Short date string
   */
  formatShortDate(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      const ts =
        typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      if (!Number.isFinite(ts)) {
        console.warn('Invalid timestamp provided');
        return 'Invalid Date';
      }
      const date = new Date(ts * 1000);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting short date:', error);
      return 'Invalid Date';
    }
  },

  /**
   * Checks if a timestamp is within a specified range from now
   * @param {number|string} timestamp - Unix timestamp in seconds
   * @param {Object} range - Time range configuration
   * @param {number} range.value - Number of units
   * @param {string} range.unit - Time unit (seconds, minutes, hours, days)
   * @returns {boolean} Whether the timestamp is within range
   */
  isWithinRange(timestamp, range) {
    try {
      const ts =
        typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      if (!Number.isFinite(ts)) return false;

      const now = Date.now() / 1000;
      const units = {
        seconds: 1,
        minutes: 60,
        hours: 3600,
        days: 86400,
      };

      const multiplier = units[range.unit];
      if (!multiplier) {
        console.warn('Invalid time unit provided');
        return false;
      }

      const diff = Math.abs(now - ts);
      return diff <= range.value * multiplier;
    } catch (error) {
      console.error('Error checking time range:', error);
      return false;
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
      if (typeof lovelace !== 'string' && typeof lovelace !== 'number') {
        console.warn('Invalid lovelace amount provided');
        return '0.000000';
      }
      const value = BigInt(lovelace.toString()) || BigInt(0);
      const ada = Number(value) / CONSTANTS.LOVELACE_TO_ADA;
      return ada.toLocaleString(undefined, CONSTANTS.NUMBER_FORMAT);
    } catch (error) {
      console.error('Error formatting ADA:', error);
      return '0.000000';
    }
  },

  /**
   * Converts ADA to Lovelace
   * @param {string|number} ada - Amount in ADA
   * @returns {string} Amount in Lovelace
   */
  adaToLovelace(ada) {
    try {
      if (typeof ada !== 'string' && typeof ada !== 'number') {
        console.warn('Invalid ADA amount provided');
        return '0';
      }
      const value = parseFloat(ada.toString()) || 0;
      return Math.round(value * CONSTANTS.LOVELACE_TO_ADA).toString();
    } catch (error) {
      console.error('Error converting to Lovelace:', error);
      return '0';
    }
  },

  /**
   * Formats a number with thousands separators and optional decimal places
   * @param {number|string} value - Number to format
   * @param {Object} [options] - Formatting options
   * @param {number} [options.decimals] - Number of decimal places
   * @param {boolean} [options.trimZeros=false] - Whether to trim trailing zeros
   * @returns {string} Formatted number
   */
  formatNumber(value, options = {}) {
    try {
      if (typeof value !== 'string' && typeof value !== 'number') {
        console.warn('Invalid number provided for formatting');
        return '0';
      }

      const number = parseFloat(value.toString()) || 0;
      const formatOptions = {
        minimumFractionDigits: options.decimals || 0,
        maximumFractionDigits: options.decimals || 0,
      };

      let formatted = number.toLocaleString(undefined, formatOptions);

      if (options.trimZeros && formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '');
      }

      return formatted;
    } catch (error) {
      console.error('Error formatting number:', error);
      return '0';
    }
  },

  /**
   * Validates if a string represents a valid ADA amount
   * @param {string} value - Value to validate
   * @returns {boolean} Whether the value is a valid ADA amount
   */
  isValidAdaAmount(value) {
    if (typeof value !== 'string') return false;
    return /^\d+(\.\d{0,6})?$/.test(value) && parseFloat(value) >= 0;
  },
};

/**
 * DOM manipulation utilities
 */
const domUtils = {
  /**
   * Gets a DOM element by ID
   * @param {string} id - Element ID
   * @returns {HTMLElement|null} The found element or null if not found
   * @throws {TypeError} If id is not a string
   */
  getElement(id) {
    if (typeof id !== 'string') {
      throw new TypeError('Element ID must be a string');
    }
    return document.getElementById(id);
  },

  /**
   * Safely adds event listener with type checking
   * @param {HTMLElement|null} element - Target element
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {boolean} Whether the listener was added successfully
   */
  addSafeEventListener(element, event, handler) {
    if (!element || !(element instanceof HTMLElement)) {
      console.warn('Invalid element provided to addSafeEventListener');
      return false;
    }
    if (typeof event !== 'string') {
      console.warn('Event name must be a string');
      return false;
    }
    if (typeof handler !== 'function') {
      console.warn('Event handler must be a function');
      return false;
    }

    try {
      element.addEventListener(event, handler);
      return true;
    } catch (error) {
      console.error('Error adding event listener:', error);
      return false;
    }
  },

  /**
   * Safely removes event listener with type checking
   * @param {HTMLElement|null} element - Target element
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {boolean} Whether the listener was removed successfully
   */
  removeSafeEventListener(element, event, handler) {
    if (!element || !(element instanceof HTMLElement)) {
      console.warn('Invalid element provided to removeSafeEventListener');
      return false;
    }
    if (typeof event !== 'string') {
      console.warn('Event name must be a string');
      return false;
    }
    if (typeof handler !== 'function') {
      console.warn('Event handler must be a function');
      return false;
    }

    try {
      element.removeEventListener(event, handler);
      return true;
    } catch (error) {
      console.error('Error removing event listener:', error);
      return false;
    }
  },

  /**
   * Creates an element with attributes and optional content
   * @param {string} tag - HTML tag name
   * @param {Object} [attributes={}] - HTML attributes
   * @param {string|HTMLElement} [content=''] - Inner content or child element
   * @returns {HTMLElement|null} The created element or null if creation failed
   */
  createElement(tag, attributes = {}, content = '') {
    try {
      const element = document.createElement(tag);

      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
          element.className = value;
        } else if (key === 'dataset') {
          Object.entries(value).forEach(([dataKey, dataValue]) => {
            element.dataset[dataKey] = dataValue;
          });
        } else {
          element.setAttribute(key, value);
        }
      });

      if (content instanceof HTMLElement) {
        element.appendChild(content);
      } else if (content) {
        element.textContent = content;
      }

      return element;
    } catch (error) {
      console.error('Error creating element:', error);
      return null;
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

/**
 * UI utilities for error and loading states
 */
const uiUtils = {
  /**
   * Displays an error message in the specified target element
   * @param {string} message - Error message to display
   * @param {string} targetId - Target element ID
   * @param {Object} [options] - Display options
   * @param {boolean} [options.isWarning=false] - Whether to display as warning
   * @param {number} [options.autoHide] - Auto-hide after milliseconds
   * @returns {void}
   */
  displayError(message, targetId, options = {}) {
    try {
      const element = document.getElementById(targetId);
      if (!element) {
        console.warn(`Target element '${targetId}' not found`);
        return;
      }

      const className = options.isWarning ? 'warning-message' : 'error-message';
      const prefix = options.isWarning ? 'Warning' : 'Error';

      element.innerHTML = `
        <div class="${className}" role="alert">
          <strong>${prefix}:</strong> ${message}
          ${
            options.autoHide ? '<button class="close-btn">&times;</button>' : ''
          }
        </div>
      `;

      if (options.autoHide) {
        setTimeout(() => {
          if (element.querySelector(`.${className}`)) {
            element.innerHTML = '';
          }
        }, options.autoHide);

        const closeBtn = element.querySelector('.close-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            element.innerHTML = '';
          });
        }
      }
    } catch (error) {
      console.error('Error displaying message:', error);
    }
  },

  /**
   * Displays a loading state in the specified target element
   * @param {string} targetId - Target element ID
   * @param {Object} [options] - Display options
   * @param {string} [options.message='Loading...'] - Custom loading message
   * @param {boolean} [options.showSpinner=true] - Whether to show loading spinner
   * @returns {void}
   */
  displayLoading(targetId, options = {}) {
    try {
      const element = document.getElementById(targetId);
      if (!element) {
        console.warn(`Target element '${targetId}' not found`);
        return;
      }

      const message = options.message || 'Loading...';
      const spinner =
        options.showSpinner !== false ? '<div class="spinner"></div>' : '';

      element.innerHTML = `
        <div class="loading" role="status">
          ${spinner}
          <span>${message}</span>
        </div>
      `;
    } catch (error) {
      console.error('Error displaying loading state:', error);
    }
  },

  /**
   * Clears the content of a target element
   * @param {string} targetId - Target element ID
   * @returns {boolean} Whether the operation was successful
   */
  clearContent(targetId) {
    try {
      const element = document.getElementById(targetId);
      if (!element) {
        console.warn(`Target element '${targetId}' not found`);
        return false;
      }
      element.innerHTML = '';
      return true;
    } catch (error) {
      console.error('Error clearing content:', error);
      return false;
    }
  },

  /**
   * Shows or hides an element with smooth transition
   * @param {string} targetId - Target element ID
   * @param {boolean} [show=true] - Whether to show or hide
   * @returns {boolean} Whether the operation was successful
   */
  toggleVisibility(targetId, show = true) {
    try {
      const element = document.getElementById(targetId);
      if (!element) {
        console.warn(`Target element '${targetId}' not found`);
        return false;
      }

      element.style.transition = 'opacity 0.3s ease-in-out';
      element.style.opacity = show ? '1' : '0';
      element.style.visibility = show ? 'visible' : 'hidden';

      return true;
    } catch (error) {
      console.error('Error toggling visibility:', error);
      return false;
    }
  },
};

/**
 * SVG Icons used throughout the application
 */
export const SVG_ICONS = {
  copy: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>`,
  rightArrow: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M9 18l6-6-6-6"/>
  </svg>`,
  leftArrow: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M15 18l-6-6 6-6"/>
  </svg>`,
  checkmark: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M20 6L9 17l-5-5"/>
  </svg>`,
  HOME: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>`,
  SEARCH: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>`,
};

// Export individual utilities and constants
export const { formatDate, getRelativeTime, formatShortDate, isWithinRange } =
  dateUtils;

export const { formatAda, adaToLovelace, formatNumber, isValidAdaAmount } =
  currencyUtils;

export const {
  getElement,
  addSafeEventListener,
  removeSafeEventListener,
  createElement,
} = domUtils;

export const { isValidHash, isValidEpoch } = validationUtils;

export const { LOVELACE_TO_ADA } = CONSTANTS;

export const { displayError, displayLoading, clearContent, toggleVisibility } =
  uiUtils;

/**
 * Common validation utilities
 */
export const validators = {
  isValidHash: (hash) =>
    typeof hash === 'string' && /^[0-9a-fA-F]{64}$/.test(hash),
  isValidAddress: (address) =>
    typeof address === 'string' && /^addr1[a-zA-Z0-9]+$/.test(address),
  isValidStakeAddress: (address) =>
    typeof address === 'string' && /^stake1[a-zA-Z0-9]+$/.test(address),
  isValidPoolId: (poolId) =>
    typeof poolId === 'string' && /^pool1[a-zA-Z0-9]+$/.test(poolId),
  isValidBlockHeight: (height) => {
    const num = parseInt(height);
    return !isNaN(num) && num >= 0 && num.toString() === height.toString();
  },
  isValidSearchQuery: (query) => query && query.length >= 3,
};
