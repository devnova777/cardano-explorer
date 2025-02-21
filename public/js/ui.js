/**
 * UI Component Manager
 *
 * Manages the rendering and interaction of UI components for the Cardano Explorer:
 * - Block Components: Latest block display, block list, block details
 * - Transaction Components: Transaction lists and details
 * - State Components: Loading states, error messages
 * - Navigation: Back buttons, view transitions
 *
 * Features:
 * - Responsive UI components with consistent styling
 * - Error boundary protection for all rendering operations
 * - Centralized template management
 * - Event delegation for dynamic content
 * - Accessibility support with ARIA attributes
 *
 * @module ui
 */

import { formatDate, formatAda, getElement } from './utils.js';

// Configuration Constants
const CONFIG = {
  UI: {
    ELEMENTS: {
      LATEST_BLOCK: 'latest-block-info',
      BLOCK_LIST: 'block-list',
      CONTENT: 'block-content',
      BACK_TO_LIST: 'back-to-list',
      BACK_TO_BLOCK: 'back-to-block',
      VIEW_TRANSACTIONS: 'view-transactions',
    },
    CLASSES: {
      CARD: 'card-content',
      ERROR: 'error-message',
      LOADING: 'loading',
      BLOCK_ITEM: 'block-list-item',
      TX_ITEM: 'transaction-item',
      PRIMARY_BTN: 'primary-btn',
      SECONDARY_BTN: 'secondary-btn',
    },
  },
  TEMPLATES: {
    ERROR: (message, details = '') => `
      <div class="${CONFIG.UI.CLASSES.ERROR}" role="alert">
        <strong>Error:</strong> ${message}
        ${details ? `<div class="error-details">${details}</div>` : ''}
      </div>
    `,
    LOADING: (message = 'Loading...') => `
      <div class="${CONFIG.UI.CLASSES.LOADING}" role="status" aria-live="polite">
        <div class="loading-spinner"></div>
        <span>${message}</span>
      </div>
    `,
    CARD: (content, title = '') => `
      <div class="${CONFIG.UI.CLASSES.CARD}" role="region" ${
      title ? `aria-label="${title}"` : ''
    }>
        ${content}
      </div>
    `,
  },
  VALIDATION: {
    REQUIRED_BLOCK_FIELDS: ['hash', 'height', 'time', 'epoch'],
    REQUIRED_TX_FIELDS: ['hash', 'block_time', 'inputs', 'outputs'],
  },
};

/**
 * Validates block data structure and required fields
 * @param {Object} block - Block data to validate
 * @throws {Error} If validation fails
 * @returns {Object} Validated block data
 */
const validateBlockData = (block) => {
  if (!block) {
    throw new Error('Block data is required');
  }

  const missingFields = CONFIG.VALIDATION.REQUIRED_BLOCK_FIELDS.filter(
    (field) => !block[field]
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Invalid block data: missing required fields (${missingFields.join(
        ', '
      )})`
    );
  }

  return block;
};

/**
 * Creates HTML for block information rows
 * @param {Object} block - Block data
 * @returns {string} HTML string
 */
const createBlockInfoRows = (block) => `
  <div class="info-rows" role="list">
    <div class="info-row" role="listitem">
      <strong>Block Height</strong>
      <span class="value">${block.height.toLocaleString()}</span>
    </div>
    <div class="info-row" role="listitem">
      <strong>Block Hash</strong>
      <span class="hash" title="${block.hash}">${block.hash}</span>
    </div>
    <div class="info-row" role="listitem">
      <strong>Time</strong>
      <span class="value">${formatDate(block.time)}</span>
    </div>
    <div class="info-row" role="listitem">
      <strong>Transactions</strong>
      <span class="value">${block.tx_count || 0}</span>
    </div>
    <div class="info-row" role="listitem">
      <strong>Size</strong>
      <span class="value">${block.size?.toLocaleString() || 0} bytes</span>
    </div>
    <div class="info-row" role="listitem">
      <strong>Epoch</strong>
      <span class="value">${block.epoch}</span>
    </div>
    <div class="info-row" role="listitem">
      <strong>Fees</strong>
      <span class="value">${formatAda(block.fees || 0)} ₳</span>
    </div>
  </div>
`;

/**
 * Creates HTML for a transaction item
 * @param {Object} tx - Transaction data
 * @returns {string} HTML string
 */
const createTransactionItem = (tx) => `
  <div class="${CONFIG.UI.CLASSES.TX_ITEM}" 
       data-tx-hash="${tx.hash}" 
       role="article"
       tabindex="0">
    <div class="tx-header">
      <span class="tx-hash" title="${tx.hash}">${tx.hash}</span>
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

/**
 * Sets up event listeners for block details view
 * @param {Object} block - Block data
 */
const setupBlockListeners = (block) => {
  const backButton = document.getElementById(CONFIG.UI.ELEMENTS.BACK_TO_LIST);
  backButton?.addEventListener('click', () => {
    hideBlockContent();
    window.loadBlockList();
  });

  const viewTxButton = document.getElementById(
    CONFIG.UI.ELEMENTS.VIEW_TRANSACTIONS
  );
  if (viewTxButton && block.tx_count > 0) {
    viewTxButton.addEventListener('click', () => {
      window.loadBlockTransactions(block.hash);
    });
  }
};

/**
 * Sets up event listeners for transaction list view
 */
const setupTransactionListeners = () => {
  const backButton = document.getElementById(CONFIG.UI.ELEMENTS.BACK_TO_BLOCK);
  backButton?.addEventListener('click', () => window.clearBlockSelection());

  document.querySelectorAll(`.${CONFIG.UI.CLASSES.TX_ITEM}`).forEach((item) => {
    const handleClick = () =>
      window.loadTransactionDetails(item.dataset.txHash);
    item.addEventListener('click', handleClick);
    item.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleClick();
    });
  });
};

/**
 * Displays the latest block information
 * @param {Object} block - Block data to display
 */
export function displayLatestBlock(block) {
  try {
    validateBlockData(block);
    const content = `
      <div class="latest-block-info" role="region" aria-label="Latest Block Information">
        ${createBlockInfoRows(block)}
      </div>
    `;
    getElement(CONFIG.UI.ELEMENTS.LATEST_BLOCK).innerHTML = content;
  } catch (error) {
    console.error('Error displaying latest block:', error);
    displayError(
      'Failed to display latest block',
      CONFIG.UI.ELEMENTS.LATEST_BLOCK
    );
  }
}

/**
 * Displays the block list with pagination
 * @param {Object} blockData - Block list data
 */
export function displayBlockList(blockData) {
  try {
    const blockList = getElement(CONFIG.UI.ELEMENTS.BLOCK_LIST);

    if (!blockData?.blocks?.length) {
      blockList.innerHTML = CONFIG.TEMPLATES.CARD(
        '<p>No blocks available.</p>',
        'Empty Block List'
      );
      return;
    }

    const blockListItems = blockData.blocks
      .map(
        (block) => `
      <div class="${CONFIG.UI.CLASSES.BLOCK_ITEM}" role="article">
        <div class="block-info">
          <div class="block-height">#${block.height.toLocaleString()}</div>
          <div class="block-hash" title="${block.hash}">${block.hash}</div>
        </div>
        <button class="view-block-btn" 
                data-block-hash="${block.hash}"
                aria-label="View details for block ${block.height}">
          <img src="images/Explore.svg" alt="View Block Details">
        </button>
      </div>
    `
      )
      .join('');

    blockList.innerHTML = `
      <div role="feed" aria-label="Block List">
        ${blockListItems}
      </div>
    `;

    document.querySelectorAll('.view-block-btn').forEach((button) => {
      button.addEventListener('click', () => {
        window.loadBlockDetails(button.dataset.blockHash);
      });
    });
  } catch (error) {
    console.error('Error displaying block list:', error);
    displayError('Failed to display block list', CONFIG.UI.ELEMENTS.BLOCK_LIST);
  }
}

/**
 * Displays detailed block information
 * @param {Object} block - Block data to display
 */
export function displayBlock(block) {
  try {
    validateBlockData(block);
    showBlockContent();

    const content = `
      <div class="block-details" role="region" aria-label="Block Details">
        <div class="header-section">
          <h2>Block Details</h2>
          <button id="${CONFIG.UI.ELEMENTS.BACK_TO_LIST}" 
                  class="${CONFIG.UI.CLASSES.SECONDARY_BTN}"
                  aria-label="Return to block list">
            Back to List
          </button>
        </div>
        ${createBlockInfoRows(block)}
        ${
          block.tx_count > 0
            ? `
          <button id="${CONFIG.UI.ELEMENTS.VIEW_TRANSACTIONS}" 
                  class="${CONFIG.UI.CLASSES.PRIMARY_BTN}"
                  aria-label="View block transactions">
            View Transactions
          </button>
        `
            : ''
        }
      </div>
    `;

    getElement(CONFIG.UI.ELEMENTS.CONTENT).innerHTML =
      CONFIG.TEMPLATES.CARD(content);
    setupBlockListeners(block);
  } catch (error) {
    console.error('Error displaying block:', error);
    displayError('Failed to display block details', CONFIG.UI.ELEMENTS.CONTENT);
  }
}

/**
 * Displays transaction list for a block
 * @param {Object} txData - Transaction data to display
 */
export function displayTransactions(txData) {
  try {
    if (!txData?.transactions?.length) {
      getElement(CONFIG.UI.ELEMENTS.CONTENT).innerHTML = CONFIG.TEMPLATES.CARD(
        '<p>No transactions found for this block.</p>',
        'Empty Transaction List'
      );
      return;
    }

    const content = `
      <div class="transactions-container" role="region" aria-label="Block Transactions">
        <div class="header-section">
          <h3>Block Transactions</h3>
          <button id="${CONFIG.UI.ELEMENTS.BACK_TO_BLOCK}" 
                  class="${CONFIG.UI.CLASSES.SECONDARY_BTN}"
                  aria-label="Return to block details">
            Back to Block
          </button>
        </div>
        <div class="transactions-list" role="feed">
          ${txData.transactions.map(createTransactionItem).join('')}
        </div>
      </div>
    `;

    getElement(CONFIG.UI.ELEMENTS.CONTENT).innerHTML = content;
    setupTransactionListeners();
  } catch (error) {
    console.error('Error displaying transactions:', error);
    displayError('Failed to display transactions', CONFIG.UI.ELEMENTS.CONTENT);
  }
}

/**
 * Displays an error message
 * @param {string} message - Error message to display
 * @param {string} targetId - Target element ID
 * @param {string} [details] - Additional error details
 */
export function displayError(
  message,
  targetId = CONFIG.UI.ELEMENTS.CONTENT,
  details = ''
) {
  try {
    getElement(targetId).innerHTML = CONFIG.TEMPLATES.ERROR(message, details);
  } catch (error) {
    console.error('Error displaying error message:', error);
  }
}

/**
 * Displays a loading state
 * @param {string} targetId - Target element ID
 * @param {string} [message] - Custom loading message
 */
export function displayLoading(targetId = CONFIG.UI.ELEMENTS.CONTENT, message) {
  try {
    getElement(targetId).innerHTML = CONFIG.TEMPLATES.LOADING(message);
  } catch (error) {
    console.error('Error displaying loading state:', error);
  }
}

/**
 * Shows the block content container
 */
export function showBlockContent() {
  getElement(CONFIG.UI.ELEMENTS.CONTENT).style.display = 'block';
}

/**
 * Hides the block content container
 */
export function hideBlockContent() {
  getElement(CONFIG.UI.ELEMENTS.CONTENT).style.display = 'none';
}

// Export configuration for external use
export const ELEMENTS = CONFIG.UI.ELEMENTS;
