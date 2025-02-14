import { formatDate, formatAda } from '../utils.js';

/**
 * Renders detailed block information
 * @param {Object} block - Block data object
 * @returns {string} HTML string for block details
 */
export function renderBlockDetails(block) {
  try {
    return `
      <div class="detail-row">
        <span class="detail-label">Block Height</span>
        <span class="detail-value">${block.height.toLocaleString()}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Block Hash</span>
        <span class="detail-value hash">${block.hash}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Slot</span>
        <span class="detail-value">${block.slot.toLocaleString()}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time</span>
        <span class="detail-value">${formatDate(block.time)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Transactions</span>
        <span class="detail-value">${block.tx_count}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Size</span>
        <span class="detail-value">${block.size.toLocaleString()} bytes</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Epoch</span>
        <span class="detail-value">${block.epoch}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Fees</span>
        <span class="detail-value">${formatAda(block.fees)} ₳</span>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering block details:', error);
    return renderError('Failed to render block details');
  }
}

/**
 * Renders an error message
 * @param {string} message - Error message to display
 * @returns {string} HTML string for error message
 */
export function renderError(message) {
  return `
    <div class="error-message">
      ${message}
    </div>
  `;
}

/**
 * Renders a loading indicator
 * @returns {string} HTML string for loading state
 */
export function renderLoading() {
  return `
    <div class="loading">
      Loading...
    </div>
  `;
}

/**
 * Updates the detail type element with block information
 * @param {HTMLElement} element - Element to update
 * @param {Object} block - Block data object
 */
export function updateDetailType(element, block) {
  if (element && block) {
    element.textContent = `Block #${block.height.toLocaleString()}`;
  }
}
