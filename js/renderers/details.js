import { formatDate, formatAda } from '../utils.js';

/**
 * Creates a copyable hash element
 * @param {string} hash - Hash value to display
 * @param {string} label - Label for the hash
 * @returns {string} HTML for hash element with copy button
 */
function createHashElement(hash, label) {
  return `
    <div class="hash-container">
      <span class="hash-label">${label}</span>
      <div class="hash-value-container">
        <span class="hash-value" title="${hash}">${hash}</span>
        <button class="copy-btn" data-hash="${hash}" title="Copy ${label}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

/**
 * Renders a list of transactions
 * @param {Array} transactions - Array of transaction data
 * @returns {string} HTML for transaction list
 */
function renderTransactionList(transactions) {
  if (!transactions || transactions.length === 0) {
    return '<div class="no-data">No transactions in this block</div>';
  }

  const transactionItems = transactions
    .map(
      (tx) => `
    <div class="transaction-item" data-tx-hash="${tx.hash}">
      ${createHashElement(tx.hash, 'Transaction Hash')}
      <div class="transaction-details">
        <div class="detail-row">
          <span class="detail-label">Time</span>
          <span class="detail-value">${formatDate(tx.block_time)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Input/Output Count</span>
          <span class="detail-value">${tx.inputs}/${tx.outputs}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Output</span>
          <span class="detail-value">${formatAda(tx.output_amount)} ₳</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fees</span>
          <span class="detail-value">${formatAda(tx.fees)} ₳</span>
        </div>
      </div>
      <button class="view-tx-btn action-btn" data-tx-hash="${tx.hash}">
        View Details
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
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
}

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
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
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
        <div class="block-summary">
          <h3 class="section-title">Block Summary</h3>
          <div class="detail-row">
            <span class="detail-label">Block Height</span>
            <span class="detail-value">${block.height.toLocaleString()}</span>
          </div>
          ${createHashElement(block.hash, 'Block Hash')}
          <div class="detail-row">
            <span class="detail-label">Slot</span>
            <span class="detail-value">${block.slot.toLocaleString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Time</span>
            <span class="detail-value">${formatDate(block.time)}</span>
          </div>
          <div class="detail-row clickable" id="view-transactions">
            <span class="detail-label">Transactions</span>
            <span class="detail-value">
              ${block.tx_count}
              ${
                block.tx_count > 0
                  ? `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              `
                  : ''
              }
            </span>
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
        </div>
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

/**
 * Renders transaction details
 * @param {Object} transaction - Transaction data
 * @returns {string} HTML for transaction details
 */
export function renderTransactionDetails(transaction) {
  try {
    // Add back button to contextual nav
    document.getElementById('contextual-nav').innerHTML = `
      <button class="back-btn action-btn" id="back-to-transactions">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        Back to Transactions
      </button>
    `;

    return `
      <div class="transaction-details">
        <div class="block-header">
          <h3 class="section-title">Transaction Details</h3>
        </div>

        <div class="transaction-summary">
          ${createHashElement(transaction.hash, 'Transaction Hash')}
          <div class="detail-row">
            <span class="detail-label">Block</span>
            <span class="detail-value">
              <a href="?hash=${
                transaction.block
              }&type=block" class="hash-link">${transaction.block}</a>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Time</span>
            <span class="detail-value">${formatDate(
              transaction.block_time
            )}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Input</span>
            <span class="detail-value">${formatAda(
              transaction.input_amount
            )} ₳</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Output</span>
            <span class="detail-value">${formatAda(
              transaction.output_amount
            )} ₳</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Fees</span>
            <span class="detail-value">${formatAda(transaction.fees)} ₳</span>
          </div>
        </div>

        <div class="transaction-io">
          <div class="inputs-section">
            <h3 class="section-title">Inputs (${transaction.inputs})</h3>
            ${transaction.utxos.inputs
              .map(
                (input) => `
              <div class="utxo-item">
                ${createHashElement(input.tx_hash, 'Input UTXO')}
                <div class="detail-row">
                  <span class="detail-label">Amount</span>
                  <span class="detail-value">${formatAda(input.amount)} ₳</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>

          <div class="outputs-section">
            <h3 class="section-title">Outputs (${transaction.outputs})</h3>
            ${transaction.utxos.outputs
              .map(
                (output) => `
              <div class="utxo-item">
                <div class="detail-row">
                  <span class="detail-label">Address</span>
                  <span class="detail-value address">${output.address}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Amount</span>
                  <span class="detail-value">${formatAda(
                    output.amount
                  )} ₳</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering transaction details:', error);
    return renderError('Failed to render transaction details');
  }
}
