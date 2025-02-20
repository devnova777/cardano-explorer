/**
 * Block Details Renderer
 *
 * Responsible for rendering block details and transaction lists
 */

import { SVG_ICONS, formatAda, formatDate } from '../utils.js';
import { renderDetailRow, createHashElement, renderError } from './shared.js';
import { renderTransactionList } from './transactions.js';

/**
 * Renders block summary information
 * @param {Object} block - Block data object
 * @returns {string} HTML string for block summary
 */
export const renderBlockSummary = (block) => `
  <div class="block-summary">
    ${renderDetailRow('Block Height', block.height.toLocaleString())}
    ${createHashElement(block.hash, 'Block Hash')}
    ${renderDetailRow('Slot', block.slot.toLocaleString())}
    ${renderDetailRow('Time', formatDate(block.time))}
    ${
      block.tx_count > 0
        ? `<div class="detail-row clickable" id="view-transactions" role="button" tabindex="0">
            <span class="detail-label">Transactions</span>
            <span class="detail-value">${block.tx_count.toLocaleString()} ${
            SVG_ICONS.rightArrow
          }</span>
          </div>`
        : renderDetailRow('Transactions', '0')
    }
    ${renderDetailRow('Size', `${block.size.toLocaleString()} bytes`)}
    ${renderDetailRow('Epoch', block.epoch)}
    ${renderDetailRow('Fees', `${formatAda(block.fees)} ₳`)}
  </div>
`;

/**
 * Renders detailed block information
 * @param {Object} block - Block data object
 * @param {Array} [transactions] - Optional array of transaction data
 * @returns {string} HTML string for block details
 */
export function renderBlockDetails(block, transactions = null) {
  try {
    // If we have transactions, render the transaction list view
    if (transactions) {
      // Add back button to contextual nav
      document.getElementById('contextual-nav').innerHTML = `
        <button class="back-btn action-btn" id="back-to-block">
          ${SVG_ICONS.leftArrow}
          Back to Block
        </button>
      `;

      return `
        <div class="block-details">
          <div class="block-header">
            <h3 class="section-title">Block #${block.height.toLocaleString()} Transactions</h3>
            ${createHashElement(block.hash, 'Block Hash')}
          </div>
          ${renderTransactionList(transactions)}
        </div>
      `;
    }

    // For block summary view, clear contextual nav
    document.getElementById('contextual-nav').innerHTML = '';

    // Otherwise, render the block summary view
    return `
      <div class="block-details">
        <h3 class="section-title">Block Summary</h3>
        ${renderBlockSummary(block)}
      </div>
    `;
  } catch (error) {
    console.error('Error rendering block details:', error);
    return renderError('Failed to render block details');
  }
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
