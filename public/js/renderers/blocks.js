/**
 * Block Details Renderer
 *
 * Manages the display of Cardano block information:
 * - Block summary and statistics
 * - Transaction listings
 * - Navigation controls
 * - Detail type updates
 * - Error handling
 *
 * @module renderers/blocks
 */

import { SVG_ICONS, formatAda, formatDate } from '../utils.js';
import { renderDetailRow, createHashElement, renderError } from './shared.js';
import { renderTransactionList } from './transactions.js';

const renderTransactionCount = (count) =>
  count > 0
    ? `<div class="detail-row clickable" id="view-transactions" role="button" tabindex="0">
        <span class="detail-label">Transactions</span>
        <span class="detail-value">${count.toLocaleString()} ${
        SVG_ICONS.rightArrow
      }</span>
      </div>`
    : renderDetailRow('Transactions', '0');

const renderBlockSummary = (block) => `
  <div class="block-summary">
    ${renderDetailRow('Block Height', block.height.toLocaleString())}
    ${createHashElement(block.hash, 'Block Hash')}
    ${renderDetailRow('Slot', block.slot.toLocaleString())}
    ${renderDetailRow('Time', formatDate(block.time))}
    ${renderTransactionCount(block.tx_count)}
    ${renderDetailRow('Size', `${block.size.toLocaleString()} bytes`)}
    ${renderDetailRow('Epoch', block.epoch)}
    ${renderDetailRow('Fees', `${formatAda(block.fees)} ₳`)}
  </div>
`;

const renderTransactionView = (block, transactions) => {
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
};

const renderSummaryView = (block) => {
  document.getElementById('contextual-nav').innerHTML = '';

  return `
    <div class="block-details">
      <h3 class="section-title">Block Summary</h3>
      ${renderBlockSummary(block)}
    </div>
  `;
};

export const renderBlockDetails = (block, transactions = null) => {
  try {
    return transactions
      ? renderTransactionView(block, transactions)
      : renderSummaryView(block);
  } catch (error) {
    console.error('Error rendering block details:', error);
    return renderError('Failed to render block details');
  }
};

export const updateDetailType = (element, block) => {
  if (element && block) {
    element.textContent = `Block #${block.height.toLocaleString()}`;
  }
};
