import { SVG_ICONS } from '../utils.js';
import { formatAda, formatDate } from '../utils.js';

/**
 * Renders a detail row with label and value
 * @param {string} label - Label text
 * @param {string} value - Value text
 * @returns {string} HTML string for detail row
 */
export const renderDetailRow = (label, value) => `
  <div class="detail-row">
    <span class="detail-label">${label}</span>
    <span class="detail-value">${value}</span>
  </div>
`;

/**
 * Creates a hash element with label
 * @param {string} hash - Hash value
 * @param {string} label - Label text
 * @returns {string} HTML string for hash element
 */
export const createHashElement = (hash, label) => `
  <div class="hash-container">
    <span class="hash-label">${label}</span>
    <div class="hash-value" title="${hash}">${hash}</div>
  </div>
`;

/**
 * Renders an error message
 * @param {string} message - Error message to display
 * @returns {string} HTML string for error message
 */
export const renderError = (message) => `
  <div class="error-message">
    ${message}
  </div>
`;

/**
 * Renders a loading spinner with message
 * @param {string} [message='Loading...'] - Loading message to display
 * @returns {string} HTML string for loading state
 */
export const renderLoading = (message = 'Loading...') => `
  <div class="loading" role="status">
    <div class="spinner"></div>
    <span>${message}</span>
  </div>
`;

export { SVG_ICONS, formatAda, formatDate };
