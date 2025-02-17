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
    ${renderIOSection(
      'Inputs',
      transaction.utxos.inputs,
      transaction.inputs,
      transaction.input_amount
    )}
    ${renderIOSection(
      'Outputs',
      transaction.utxos.outputs,
      transaction.outputs,
      transaction.output_amount
    )}
  </div>
`;

const renderIOItem = (item, index, type) => {
  const isInput = type === 'Inputs';
  const amount = formatAda(item.amount);

  return `
    <div class="io-item">
      <div class="io-item-header">
        <span class="io-index">${index + 1}</span>
        <span class="io-amount">${amount} ₳</span>
      </div>
      <div class="io-item-details">
        ${isInput ? renderInputSource(item) : ''}
        <div class="io-address">
          <span class="label">Address:</span>
          <a href="${PATHS.DETAILS}?type=address&hash=${
    item.address
  }" class="address-link">
            ${item.address}
          </a>
        </div>
        ${renderAssets(item, isInput)}
      </div>
    </div>
  `;
};

const renderInputSource = (item) => `
  <div class="io-source">
    <span class="label">From TX:</span>
    <a href="${PATHS.TRANSACTION}?hash=${item.tx_hash}" class="hash-link">
      ${item.tx_hash}
    </a>
    <span class="output-index">#${item.output_index}</span>
  </div>
`;

const renderAssets = (item, isInput) => {
  if (isInput || !item.assets?.length) return '';

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

const renderIOSection = (type, items, count, total) => `
  <div class="io-section ${type.toLowerCase()}-section">
    <div class="io-header">
      <h3 class="section-title">
        ${
          SVG_ICONS[type === 'Inputs' ? 'rightArrow' : 'leftArrow']
        } ${type} (${count})
      </h3>
      <div class="io-total">${formatAda(total)} ₳</div>
    </div>
    <div class="io-list">
      ${items.map((item, index) => renderIOItem(item, index, type)).join('')}
    </div>
  </div>
`;

const getBlockReference = (transaction) => {
  const blockRef =
    transaction.block_hash || transaction.block_height?.toString();
  const blockHeight = transaction.block_height;

  if (!blockRef || !blockHeight) {
    throw new Error('Invalid transaction data: missing block reference');
  }

  const isValidHash = /^[0-9a-fA-F]{64}$/.test(blockRef);

  return {
    blockRef: isValidHash ? blockRef : blockHeight.toString(),
    blockHeight,
    isValidHash,
  };
};

const calculateTransactionValues = (transaction) => ({
  totalValue: formatAda(transaction.output_amount),
  fee: formatAda(transaction.fees),
  totalWithFees: formatAda(
    (BigInt(transaction.output_amount) + BigInt(transaction.fees)).toString()
  ),
});

/**
 * Renders transaction details
 * @param {Object} transaction - Transaction data
 * @returns {string} HTML string for transaction details
 */
export const renderTransactionDetails = (transaction) => {
  try {
    const { blockRef, blockHeight, isValidHash } =
      getBlockReference(transaction);
    const { totalValue, fee, totalWithFees } =
      calculateTransactionValues(transaction);

    return `
      <div class="transaction-content">
        <div class="navigation-bar">
          <a href="${PATHS.HOME}" class="action-btn" id="home-button">
            ${SVG_ICONS.home}
            Home
          </a>
          <button class="back-btn action-btn" id="back-to-block" 
                  data-block-hash="${isValidHash ? blockRef : ''}"
                  data-block-height="${blockHeight}">
            ${SVG_ICONS.leftArrow}
            Back to Block
          </button>
          <div class="detail-type">Transaction Details</div>
        </div>
        <div class="transaction-details">
          ${createHashElement(transaction.hash, 'Transaction Hash')}
          <div class="transaction-summary">
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Status</div>
                <div class="summary-value status-confirmed">
                  ${SVG_ICONS.checkmark}
                  Confirmed
                </div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Block</div>
                <div class="summary-value">
                  <span class="block-link" 
                        data-block-hash="${isValidHash ? blockRef : ''}"
                        data-block-height="${blockHeight}">
                    #${blockHeight.toLocaleString()}
                  </span>
                </div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Timestamp</div>
                <div class="summary-value">${formatDate(
                  transaction.block_time
                )}</div>
              </div>
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
    return renderError('Failed to render transaction details');
  }
};
