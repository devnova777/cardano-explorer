/**
 * UI Component Manager
 *
 * Responsible for rendering and managing all UI components including:
 * - Latest block display
 * - Block list
 * - Block details
 * - Transaction lists
 * - Loading states
 * - Error messages
 *
 * Dependencies:
 * - formatDate: Formats timestamps
 * - formatAda: Formats ADA amounts
 * - getElement: Safe element retrieval
 *
 * @module ui
 */

import { formatDate, formatAda, getElement } from './utils.js';

const UI_CONFIG = {
  ELEMENTS: {
    LATEST_BLOCK: 'latest-block-info',
    BLOCK_LIST: 'block-list',
    CONTENT: 'block-content',
  },
  TEMPLATES: {
    ERROR: (message) => `
      <div class="error-message">Error: ${message}</div>
    `,
    LOADING: `
      <div class="loading">Loading...</div>
    `,
    CARD: (content) => `
      <div class="card-content">${content}</div>
    `,
  },
};

const validateBlockData = (block) => {
  if (!block?.hash || !block?.height) {
    throw new Error('Invalid block data structure');
  }
  return block;
};

const createBlockInfoRows = (block) => `
  <div class="info-row">
    <strong>Block Height</strong>
    <span class="value">${block.height.toLocaleString()}</span>
  </div>
  <div class="info-row">
    <strong>Block Hash</strong>
    <span class="hash">${block.hash}</span>
  </div>
  <div class="info-row">
    <strong>Time</strong>
    <span class="value">${formatDate(block.time)}</span>
  </div>
  <div class="info-row">
    <strong>Transactions</strong>
    <span class="value">${block.tx_count}</span>
  </div>
  <div class="info-row">
    <strong>Size</strong>
    <span class="value">${block.size.toLocaleString()} bytes</span>
  </div>
  <div class="info-row">
    <strong>Epoch</strong>
    <span class="value">${block.epoch}</span>
  </div>
  <div class="info-row">
    <strong>Fees</strong>
    <span class="value">${formatAda(block.fees)} ₳</span>
  </div>
`;

const createTransactionItem = (tx) => `
  <div class="transaction-item" data-tx-hash="${tx.hash}">
    <div class="tx-header">
      <span class="tx-hash">${tx.hash}</span>
      <span class="tx-time">${formatDate(tx.block_time)}</span>
    </div>
    <div class="tx-details">
      <div class="tx-row">
        <span class="tx-label">Inputs/Outputs:</span>
        <span class="tx-value">${tx.inputs || 0} / ${tx.outputs || 0}</span>
      </div>
      <div class="tx-row">
        <span class="tx-label">Amount:</span>
        <span class="tx-value">${formatAda(tx.output_amount || 0)} ₳</span>
      </div>
      <div class="tx-row">
        <span class="tx-label">Fees:</span>
        <span class="tx-value">${formatAda(tx.fees || 0)} ₳</span>
      </div>
    </div>
  </div>
`;

const setupBlockListeners = (block) => {
  const backButton = document.getElementById('back-to-list');
  backButton?.addEventListener('click', () => {
    hideBlockContent();
    window.loadBlockList();
  });

  const viewTxButton = document.getElementById('view-transactions');
  if (viewTxButton && block.tx_count > 0) {
    viewTxButton.addEventListener('click', () => {
      window.loadBlockTransactions(block.hash);
    });
  }
};

const setupTransactionListeners = () => {
  const backButton = document.getElementById('back-to-block');
  backButton?.addEventListener('click', () => window.clearBlockSelection());

  document.querySelectorAll('.transaction-item').forEach((item) => {
    item.addEventListener('click', () => {
      window.loadTransactionDetails(item.dataset.txHash);
    });
  });
};

export function displayLatestBlock(block) {
  try {
    validateBlockData(block);
    const content = `
      <div class="latest-block-info">
        ${createBlockInfoRows(block)}
      </div>
    `;
    getElement(UI_CONFIG.ELEMENTS.LATEST_BLOCK).innerHTML = content;
  } catch (error) {
    console.error('Error displaying latest block:', error);
    displayError(
      'Failed to display latest block',
      UI_CONFIG.ELEMENTS.LATEST_BLOCK
    );
  }
}

export function displayBlockList(blockData) {
  try {
    const blockList = getElement(UI_CONFIG.ELEMENTS.BLOCK_LIST);

    if (!blockData?.blocks?.length) {
      blockList.innerHTML = '<p>No blocks available.</p>';
      return;
    }

    const blockListItems = blockData.blocks
      .map(
        (block) => `
      <div class="block-list-item">
        <div class="block-info">
          <div class="block-height">#${block.height.toLocaleString()}</div>
          <div class="block-hash">${block.hash}</div>
        </div>
        <button class="view-block-btn" data-block-hash="${block.hash}">
          <img src="images/Explore.svg" alt="View Block Details">
        </button>
      </div>
    `
      )
      .join('');

    blockList.innerHTML = blockListItems;

    document.querySelectorAll('.view-block-btn').forEach((button) => {
      button.addEventListener('click', () => {
        window.loadBlockDetails(button.dataset.blockHash);
      });
    });
  } catch (error) {
    console.error('Error displaying block list:', error);
    displayError('Failed to display block list', UI_CONFIG.ELEMENTS.BLOCK_LIST);
  }
}

export function displayBlock(block) {
  try {
    validateBlockData(block);
    showBlockContent();

    const content = `
      <div class="block-details">
        <div class="header-section">
          <h2>Block Details</h2>
          <button id="back-to-list" class="secondary-btn">Back to List</button>
        </div>
        ${createBlockInfoRows(block)}
        ${
          block.tx_count > 0
            ? '<button id="view-transactions" class="primary-btn">View Transactions</button>'
            : ''
        }
      </div>
    `;

    getElement(UI_CONFIG.ELEMENTS.CONTENT).innerHTML =
      UI_CONFIG.TEMPLATES.CARD(content);
    setupBlockListeners(block);
  } catch (error) {
    console.error('Error displaying block:', error);
    displayError('Failed to display block details', UI_CONFIG.ELEMENTS.CONTENT);
  }
}

export function displayTransactions(txData) {
  try {
    if (!txData?.transactions?.length) {
      getElement(UI_CONFIG.ELEMENTS.CONTENT).innerHTML =
        UI_CONFIG.TEMPLATES.CARD(
          '<p>No transactions found for this block.</p>'
        );
      return;
    }

    const content = `
      <div class="transactions-container">
        <div class="header-section">
          <h3>Block Transactions</h3>
          <button id="back-to-block" class="secondary">Back to Block</button>
        </div>
        <div class="transactions-list">
          ${txData.transactions.map(createTransactionItem).join('')}
        </div>
      </div>
    `;

    getElement(UI_CONFIG.ELEMENTS.CONTENT).innerHTML = content;
    setupTransactionListeners();
  } catch (error) {
    console.error('Error displaying transactions:', error);
    displayError('Failed to display transactions', UI_CONFIG.ELEMENTS.CONTENT);
  }
}

export function displayError(message, targetId = UI_CONFIG.ELEMENTS.CONTENT) {
  try {
    getElement(targetId).innerHTML = UI_CONFIG.TEMPLATES.ERROR(message);
  } catch (error) {
    console.error('Error displaying error message:', error);
  }
}

export function displayLoading(targetId = UI_CONFIG.ELEMENTS.CONTENT) {
  try {
    getElement(targetId).innerHTML = UI_CONFIG.TEMPLATES.LOADING;
  } catch (error) {
    console.error('Error displaying loading state:', error);
  }
}

export function showBlockContent() {
  getElement(UI_CONFIG.ELEMENTS.CONTENT).style.display = 'block';
}

export function hideBlockContent() {
  getElement(UI_CONFIG.ELEMENTS.CONTENT).style.display = 'none';
}

export const ELEMENTS = UI_CONFIG.ELEMENTS;
