/**
 * Transaction List and Details Renderer
 *
 * Responsible for rendering transaction lists and detailed transaction views.
 * Handles rendering of transaction details, lists, and input/output displays.
 */

import { SVG_ICONS, formatAda, formatDate } from '../utils.js';
import { renderDetailRow, createHashElement, renderError } from './shared.js';

// Constants for URL handling
const PATHS = {
  HOME: '../index.html',
  DETAILS: '../pages/details.html',
  TRANSACTION: '../pages/transaction.html',
};

/**
 * Renders a list of transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {string} HTML string for transaction list
 */
export const renderTransactionList = (transactions) => {
  if (!transactions?.length) {
    return '<div class="no-data">No transactions in this block</div>';
  }

  const transactionItems = transactions
    .map(
      (tx) => `
      <div class="transaction-item">
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
    <div class="transaction-list">
      <h3 class="section-title">Transactions (${transactions.length})</h3>
      ${transactionItems}
    </div>
  `;
};

/**
 * Renders transaction inputs and outputs
 * @param {Object} transaction - Transaction object with UTXO data
 * @returns {string} HTML string for transaction I/O
 */
export const renderTransactionIO = (transaction) => `
  <div class="transaction-io">
    <div class="io-section inputs-section">
      <div class="io-header">
        <h3 class="section-title">
          ${SVG_ICONS.rightArrow} Inputs (${transaction.utxos.inputs.length})
        </h3>
        <div class="io-total">${formatAda(transaction.input_amount)} ₳</div>
      </div>
      <div class="io-list">
        ${transaction.utxos.inputs
          .map(
            (item, index) => `
          <div class="io-item">
            <div class="io-item-header">
              <div class="io-index">#${index + 1}</div>
              <div class="io-amount">${formatAda(item.amount)} ₳</div>
            </div>
            <div class="io-item-content">
              <div class="io-address">
                <span class="address-label">Address:</span>
                <a href="wallet.html?address=${
                  item.address
                }" class="address-value">
                  ${item.address}
                </a>
                <button class="copy-btn" data-hash="${
                  item.address
                }" title="Copy Address">
                  ${SVG_ICONS.copy}
                </button>
              </div>
              ${
                item.tx_hash
                  ? `
                <div class="io-tx-hash">
                  <span class="tx-label">Tx Hash:</span>
                  <a href="transaction.html?hash=${item.tx_hash}" class="tx-hash">
                    ${item.tx_hash}
                  </a>
                  <button class="copy-btn" data-hash="${item.tx_hash}" title="Copy Transaction Hash">
                    ${SVG_ICONS.copy}
                  </button>
                </div>
              `
                  : ''
              }
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
    <div class="io-section outputs-section">
      <div class="io-header">
        <h3 class="section-title">
          ${SVG_ICONS.rightArrow} Outputs (${transaction.utxos.outputs.length})
        </h3>
        <div class="io-total">${formatAda(transaction.output_amount)} ₳</div>
      </div>
      <div class="io-list">
        ${transaction.utxos.outputs
          .map(
            (item, index) => `
          <div class="io-item">
            <div class="io-item-header">
              <div class="io-index">#${index + 1}</div>
              <div class="io-amount">${formatAda(item.amount)} ₳</div>
            </div>
            <div class="io-item-content">
              <div class="io-address">
                <span class="address-label">Address:</span>
                <a href="wallet.html?address=${
                  item.address
                }" class="address-value">
                  ${item.address}
                </a>
                <button class="copy-btn" data-hash="${
                  item.address
                }" title="Copy Address">
                  ${SVG_ICONS.copy}
                </button>
              </div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  </div>
`;

/**
 * Renders asset information for outputs
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
 * Renders transaction details
 * @param {Object} transaction - Transaction data
 * @returns {string} HTML string for transaction details
 */
export const renderTransactionDetails = (transaction) => {
  try {
    // Add back button to contextual nav
    document.getElementById('contextual-nav').innerHTML = `
      <button class="back-btn action-btn" id="back-to-block">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        Back to Explorer
      </button>
    `;

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
                  <a href="details.html?type=block&height=${
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
    throw error;
  }
};
