/**
 * Transaction List and Details Renderer
 *
 * Manages the rendering of transaction-related UI components:
 * - Transaction list views with summary information
 * - Detailed transaction views with full information
 * - Input/Output (UTXO) displays with address information
 * - Asset information for token transfers
 * - Navigation controls and copy functionality
 *
 * @module renderers/transactions
 */

import { SVG_ICONS, formatAda, formatDate } from '../utils.js';
import { renderDetailRow, createHashElement, renderError } from './shared.js';

// Constants
const PATHS = {
  HOME: '../index.html',
  DETAILS: '../pages/details.html',
  TRANSACTION: '../pages/transaction.html',
  WALLET: '../pages/wallet.html',
};

const UI_ELEMENTS = {
  CONTEXTUAL_NAV: 'contextual-nav',
  NO_DATA: 'no-data',
  TRANSACTION_ITEM: 'transaction-item',
  TRANSACTION_LIST: 'transaction-list',
  IO_SECTION: 'io-section',
  IO_ITEM: 'io-item',
};

/**
 * Renders a list of transactions with summary information
 * @param {Array<Object>} transactions - Array of transaction objects
 * @returns {string} HTML string for transaction list
 */
export const renderTransactionList = (transactions) => {
  if (!transactions?.length) {
    return `<div class="${UI_ELEMENTS.NO_DATA}">No transactions in this block</div>`;
  }

  const transactionItems = transactions
    .map(
      (tx) => `
      <div class="${UI_ELEMENTS.TRANSACTION_ITEM}">
        ${createHashElement(tx.hash, 'Transaction Hash')}
        <div class="transaction-details">
          ${renderDetailRow('Time', formatDate(tx.block_time))}
          ${renderDetailRow('Input/Output Count', `${tx.inputs}/${tx.outputs}`)}
          ${renderDetailRow('Total Output', `${formatAda(tx.output_amount)} ₳`)}
          ${renderDetailRow('Fees', `${formatAda(tx.fees)} ₳`)}
          <div class="transaction-actions">
            <a href="${PATHS.TRANSACTION}?hash=${tx.hash}" class="view-tx-btn">
              View Details ${SVG_ICONS.rightArrow}
            </a>
          </div>
        </div>
      </div>
    `
    )
    .join('');

  return `
    <div class="${UI_ELEMENTS.TRANSACTION_LIST}">
      <h3 class="section-title">Transactions (${transactions.length})</h3>
      ${transactionItems}
    </div>
  `;
};

/**
 * Renders an individual input or output item
 * @param {Object} item - Input/Output item data
 * @param {number} index - Item index
 * @param {boolean} isInput - Whether this is an input item
 * @returns {string} HTML string for I/O item
 */
const renderIOItem = (item, index, isInput) => `
  <div class="${UI_ELEMENTS.IO_ITEM}">
    <div class="io-item-header">
      <div class="io-index">#${index + 1}</div>
      <div class="io-amount">${formatAda(item.amount)} ₳</div>
    </div>
    <div class="io-item-content">
      <div class="io-address">
        <span class="address-label">Address:</span>
        <a href="${PATHS.WALLET}?address=${item.address}" class="address-value">
          ${item.address}
        </a>
        <button class="copy-btn" data-hash="${
          item.address
        }" title="Copy Address">
          ${SVG_ICONS.copy}
        </button>
      </div>
      ${
        isInput && item.tx_hash
          ? `
        <div class="io-tx-hash">
          <span class="tx-label">Tx Hash:</span>
          <a href="${PATHS.TRANSACTION}?hash=${item.tx_hash}" class="tx-hash">
            ${item.tx_hash}
          </a>
          <button class="copy-btn" data-hash="${item.tx_hash}" title="Copy Transaction Hash">
            ${SVG_ICONS.copy}
          </button>
        </div>
      `
          : ''
      }
      ${renderAssets(item)}
    </div>
  </div>
`;

/**
 * Renders transaction inputs and outputs
 * @param {Object} transaction - Transaction object with UTXO data
 * @returns {string} HTML string for transaction I/O
 */
export const renderTransactionIO = (transaction) => `
  <div class="transaction-io">
    <div class="${UI_ELEMENTS.IO_SECTION} inputs-section">
      <div class="io-header">
        <h3 class="section-title">
          ${SVG_ICONS.rightArrow} Inputs (${transaction.utxos.inputs.length})
        </h3>
        <div class="io-total">${formatAda(transaction.input_amount)} ₳</div>
      </div>
      <div class="io-list">
        ${transaction.utxos.inputs
          .map((item, index) => renderIOItem(item, index, true))
          .join('')}
      </div>
    </div>
    <div class="${UI_ELEMENTS.IO_SECTION} outputs-section">
      <div class="io-header">
        <h3 class="section-title">
          ${SVG_ICONS.rightArrow} Outputs (${transaction.utxos.outputs.length})
        </h3>
        <div class="io-total">${formatAda(transaction.output_amount)} ₳</div>
      </div>
      <div class="io-list">
        ${transaction.utxos.outputs
          .map((item, index) => renderIOItem(item, index, false))
          .join('')}
      </div>
    </div>
  </div>
`;

/**
 * Renders asset information for outputs
 * @param {Object} item - Transaction input/output item
 * @returns {string} HTML string for asset information
 */
const renderAssets = (item) => {
  if (!item.assets?.length) return '';

  return `
    <div class="io-assets">
      <span class="label">Assets:</span>
      <div class="asset-list">
        ${item.assets
          .map(
            (asset) => `
          <div class="asset-item">
            <span class="asset-policy">${asset.unit.slice(0, 56)}</span>
            <span class="asset-name">${asset.unit.slice(56)}</span>
            <span class="asset-amount">${asset.quantity}</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
};

/**
 * Renders the back navigation button
 * @returns {string} HTML string for back button
 */
const renderBackButton = () => `
  <button class="back-btn action-btn" id="back-to-block">
    ${SVG_ICONS.leftArrow}
    Back to Explorer
  </button>
`;

/**
 * Renders transaction details view
 * @param {Object} transaction - Transaction data
 * @returns {string} HTML string for transaction details
 * @throws {Error} If transaction data is invalid
 */
export const renderTransactionDetails = (transaction) => {
  try {
    if (!transaction?.hash) {
      throw new Error('Invalid transaction data');
    }

    // Add back button to contextual nav
    document.getElementById(UI_ELEMENTS.CONTEXTUAL_NAV).innerHTML =
      renderBackButton();

    const totalValue = formatAda(transaction.output_amount);
    const fee = formatAda(transaction.fees);
    const totalWithFees = formatAda(
      (BigInt(transaction.output_amount) + BigInt(transaction.fees)).toString()
    );

    return `
      <div class="transaction-content">
        <div class="transaction-header">
          ${createHashElement(transaction.hash, 'Transaction Hash')}
          ${
            transaction.block
              ? createHashElement(transaction.block, 'Block Hash')
              : renderDetailRow(
                  'Block Height',
                  `#${transaction.block_height.toLocaleString()}`
                )
          }
        </div>
        <div class="transaction-details">
          <div class="transaction-summary">
            <div class="summary-row">
              <div class="summary-item">
                <div class="summary-label">Status</div>
                <div class="summary-value status-confirmed">
                  ${SVG_ICONS.checkmark}
                  Confirmed
                </div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Block Height</div>
                <div class="summary-value">
                  <a href="${PATHS.DETAILS}?type=block&height=${
      transaction.block_height
    }" class="hash-link">
                    #${transaction.block_height.toLocaleString()}
                  </a>
                </div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Timestamp</div>
                <div class="summary-value">${formatDate(
                  transaction.block_time
                )}</div>
              </div>
            </div>
            <div class="summary-row amounts">
              <div class="summary-item">
                <div class="summary-label">Total Value</div>
                <div class="summary-value highlight">${totalValue} ₳</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Fee</div>
                <div class="summary-value">${fee} ₳</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Value + Fees</div>
                <div class="summary-value">${totalWithFees} ₳</div>
              </div>
            </div>
          </div>
          ${renderTransactionIO(transaction)}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering transaction details:', error);
    return renderError('Failed to render transaction details', error.message);
  }
};
