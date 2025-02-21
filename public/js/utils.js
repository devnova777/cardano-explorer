/**
 * Cardano Explorer Utilities
 *
 * Core utility functions for the Cardano Explorer application:
 * - Date & Time: Formatting, relative time, range checks
 * - Currency: ADA/Lovelace conversion, number formatting
 * - DOM: Safe element manipulation, event handling
 * - Validation: Data type checking, format validation
 * - UI: Error handling, loading states, visibility
 *
 * Features:
 * - Comprehensive error handling and logging
 * - Type-safe operations with validation
 * - Consistent formatting across the application
 * - Performance optimized DOM operations
 * - Accessibility support
 *
 * @module utils
 * @version 1.0.0
 */

// Core Constants
const CONSTANTS = {
  CURRENCY: {
    LOVELACE_TO_ADA: 1000000,
    SYMBOL: '₳',
    DEFAULT_DECIMALS: 6,
  },
  TIME: {
    UNITS: {
      YEAR: 31536000,
      MONTH: 2592000,
      WEEK: 604800,
      DAY: 86400,
      HOUR: 3600,
      MINUTE: 60,
      SECOND: 1,
    },
    DATE_OPTIONS: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    },
  },
  FORMAT: {
    NUMBER: {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    },
  },
  REGEX: {
    HASH: /^[0-9a-fA-F]{64}$/,
    ADDRESS: /^addr1[a-zA-Z0-9]+$/,
    STAKE_ADDRESS: /^stake1[a-zA-Z0-9]+$/,
    POOL_ID: /^pool1[a-zA-Z0-9]+$/,
    ADA_AMOUNT: /^\d+(\.\d{0,6})?$/,
  },
  UI: {
    TRANSITION_DURATION: 300,
    AUTO_HIDE_DURATION: 5000,
  },
};

/**
 * Date and Time Utilities
 * @namespace dateUtils
 */
const dateUtils = {
  /**
   * Formats a Unix timestamp to a localized date string
   * @param {number|string} timestamp - Unix timestamp in seconds
   * @param {Intl.DateTimeFormatOptions} [options] - Custom date format options
   * @returns {string} Formatted date string
   * @throws {TypeError} If timestamp is invalid
   */
  formatDate(timestamp, options = CONSTANTS.TIME.DATE_OPTIONS) {
    if (!timestamp) return 'N/A';
    try {
      const ts =
        typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      if (!Number.isFinite(ts)) {
        throw new TypeError('Invalid timestamp format');
      }
      return new Date(ts * 1000).toLocaleString(undefined, options);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  },

  /**
   * Converts a date to a relative time string
   * @param {number|string} timestamp - Unix timestamp in seconds
   * @returns {string} Relative time string (e.g., "2 hours ago")
   */
  getRelativeTime(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      const ts =
        typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      if (!Number.isFinite(ts)) {
        throw new TypeError('Invalid timestamp format');
      }

      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      const diff = (ts * 1000 - Date.now()) / 1000;
      const absDiff = Math.abs(diff);

      for (const [unit, seconds] of Object.entries(CONSTANTS.TIME.UNITS)) {
        if (absDiff >= seconds) {
          return rtf.format(Math.round(diff / seconds), unit.toLowerCase());
        }
      }
      return 'just now';
    } catch (error) {
      console.error('Relative time calculation error:', error);
      return 'Unknown time';
    }
  },

  /**
   * Formats a timestamp into a short date string
   * @param {number|string} timestamp - Unix timestamp in seconds
   * @returns {string} Short date string (YYYY-MM-DD)
   */
  formatShortDate(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      const ts =
        typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      if (!Number.isFinite(ts)) {
        throw new TypeError('Invalid timestamp format');
      }
      return new Date(ts * 1000).toISOString().split('T')[0];
    } catch (error) {
      console.error('Short date formatting error:', error);
      return 'Invalid Date';
    }
  },

  /**
   * Checks if a timestamp is within a specified range from now
   * @param {number|string} timestamp - Unix timestamp in seconds
   * @param {{value: number, unit: string}} range - Time range configuration
   * @returns {boolean} Whether the timestamp is within range
   */
  isWithinRange(timestamp, range) {
    try {
      const ts =
        typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      if (!Number.isFinite(ts)) return false;

      const now = Date.now() / 1000;
      const multiplier = CONSTANTS.TIME.UNITS[range.unit.toUpperCase()];

      if (!multiplier) {
        throw new Error(`Invalid time unit: ${range.unit}`);
      }

      return Math.abs(now - ts) <= range.value * multiplier;
    } catch (error) {
      console.error('Time range check error:', error);
      return false;
    }
  },
};

/**
 * Currency and Number Formatting Utilities
 * @namespace currencyUtils
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
        throw new TypeError('Invalid lovelace amount');
      }
      const value = BigInt(lovelace.toString()) || BigInt(0);
      const ada = Number(value) / CONSTANTS.CURRENCY.LOVELACE_TO_ADA;
      return ada.toLocaleString(undefined, CONSTANTS.FORMAT.NUMBER);
    } catch (error) {
      console.error('ADA formatting error:', error);
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
        throw new TypeError('Invalid ADA amount');
      }
      const value = parseFloat(ada.toString()) || 0;
      return Math.round(value * CONSTANTS.CURRENCY.LOVELACE_TO_ADA).toString();
    } catch (error) {
      console.error('Lovelace conversion error:', error);
      return '0';
    }
  },

  /**
   * Formats a number with custom options
   * @param {number|string} value - Number to format
   * @param {{decimals?: number, trimZeros?: boolean}} [options] - Format options
   * @returns {string} Formatted number
   */
  formatNumber(value, options = {}) {
    try {
      if (typeof value !== 'string' && typeof value !== 'number') {
        throw new TypeError('Invalid number format');
      }

      const number = parseFloat(value.toString()) || 0;
      const formatOptions = {
        minimumFractionDigits: options.decimals ?? 0,
        maximumFractionDigits: options.decimals ?? 0,
      };

      let formatted = number.toLocaleString(undefined, formatOptions);
      if (options.trimZeros && formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '');
      }

      return formatted;
    } catch (error) {
      console.error('Number formatting error:', error);
      return '0';
    }
  },
};

/**
 * DOM Manipulation Utilities
 * @namespace domUtils
 */
const domUtils = {
  /**
   * Gets a DOM element safely
   * @param {string} id - Element ID
   * @returns {HTMLElement|null} Found element or null
   */
  getElement(id) {
    try {
      if (typeof id !== 'string') {
        throw new TypeError('Element ID must be a string');
      }
      return document.getElementById(id);
    } catch (error) {
      console.error('Element retrieval error:', error);
      return null;
    }
  },

  /**
   * Creates an element with attributes and content
   * @param {string} tag - HTML tag name
   * @param {Object} [attributes] - HTML attributes
   * @param {string|HTMLElement} [content] - Inner content
   * @returns {HTMLElement|null} Created element
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
      console.error('Element creation error:', error);
      return null;
    }
  },

  /**
   * Safely adds event listener with validation
   * @param {HTMLElement} element - Target element
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {boolean} Success status
   */
  addSafeEventListener(element, event, handler) {
    try {
      if (!element || !(element instanceof HTMLElement)) {
        throw new TypeError('Invalid element');
      }
      if (typeof event !== 'string' || typeof handler !== 'function') {
        throw new TypeError('Invalid event or handler');
      }

      element.addEventListener(event, handler);
      return true;
    } catch (error) {
      console.error('Event listener error:', error);
      return false;
    }
  },
};

/**
 * UI State Management Utilities
 * @namespace uiUtils
 */
const uiUtils = {
  /**
   * Displays an error message
   * @param {string} message - Error message
   * @param {string} targetId - Target element ID
   * @param {{isWarning?: boolean, autoHide?: number}} [options] - Display options
   */
  displayError(message, targetId, options = {}) {
    try {
      const element = domUtils.getElement(targetId);
      if (!element) return;

      const className = options.isWarning ? 'warning-message' : 'error-message';
      const prefix = options.isWarning ? 'Warning' : 'Error';

      element.innerHTML = `
        <div class="${className}" role="alert">
          <strong>${prefix}:</strong> ${message}
          ${
            options.autoHide
              ? '<button class="close-btn" aria-label="Close">&times;</button>'
              : ''
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
          domUtils.addSafeEventListener(closeBtn, 'click', () => {
            element.innerHTML = '';
          });
        }
      }
    } catch (error) {
      console.error('Error display error:', error);
    }
  },

  /**
   * Displays a loading state
   * @param {string} targetId - Target element ID
   * @param {{message?: string, showSpinner?: boolean}} [options] - Display options
   */
  displayLoading(targetId, options = {}) {
    try {
      const element = domUtils.getElement(targetId);
      if (!element) return;

      const message = options.message || 'Loading...';
      const spinner =
        options.showSpinner !== false
          ? '<div class="spinner" role="progressbar"></div>'
          : '';

      element.innerHTML = `
        <div class="loading" role="status" aria-live="polite">
          ${spinner}
          <span>${message}</span>
        </div>
      `;
    } catch (error) {
      console.error('Loading display error:', error);
    }
  },

  /**
   * Toggles element visibility with animation
   * @param {string} targetId - Target element ID
   * @param {boolean} [show=true] - Show/hide flag
   * @returns {boolean} Success status
   */
  toggleVisibility(targetId, show = true) {
    try {
      const element = domUtils.getElement(targetId);
      if (!element) return false;

      element.style.transition = `opacity ${CONSTANTS.UI.TRANSITION_DURATION}ms ease-in-out`;
      element.style.opacity = show ? '1' : '0';
      element.style.visibility = show ? 'visible' : 'hidden';

      return true;
    } catch (error) {
      console.error('Visibility toggle error:', error);
      return false;
    }
  },
};

/**
 * Data Validation Utilities
 * @namespace validators
 */
const validators = {
  isValidHash: (hash) => CONSTANTS.REGEX.HASH.test(hash),
  isValidAddress: (address) => CONSTANTS.REGEX.ADDRESS.test(address),
  isValidStakeAddress: (address) => CONSTANTS.REGEX.STAKE_ADDRESS.test(address),
  isValidPoolId: (poolId) => CONSTANTS.REGEX.POOL_ID.test(poolId),
  isValidBlockHeight: (height) => {
    const num = parseInt(height);
    return !isNaN(num) && num >= 0 && num.toString() === height.toString();
  },
  isValidSearchQuery: (query) => query && query.length >= 3,
  isValidAdaAmount: (value) => CONSTANTS.REGEX.ADA_AMOUNT.test(value),
};

// SVG Icons used throughout the application
export const SVG_ICONS = {
  COPY: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" role="img" aria-label="Copy">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>`,
  RIGHT_ARROW: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" role="img" aria-label="Next">
    <path d="M9 18l6-6-6-6"/>
  </svg>`,
  LEFT_ARROW: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" role="img" aria-label="Previous">
    <path d="M15 18l-6-6 6-6"/>
  </svg>`,
  CHECKMARK: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" role="img" aria-label="Success">
    <path d="M20 6L9 17l-5-5"/>
  </svg>`,
  HOME: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" role="img" aria-label="Home">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>`,
  SEARCH: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" role="img" aria-label="Search">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>`,
};

// Export individual utilities
export const { formatDate, getRelativeTime, formatShortDate, isWithinRange } =
  dateUtils;

export const { formatAda, adaToLovelace, formatNumber } = currencyUtils;

export const { getElement, createElement, addSafeEventListener } = domUtils;

export const { displayError, displayLoading, toggleVisibility } = uiUtils;

// Export constants and validators
export const { LOVELACE_TO_ADA } = CONSTANTS.CURRENCY;
export { validators, CONSTANTS };
