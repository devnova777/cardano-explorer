/**
 * Cardano Wallet Details Controller
 *
 * Manages the wallet details page functionality:
 * - Wallet balance and address display
 * - Transaction history with pagination
 * - Search functionality
 * - Copy-to-clipboard operations
 * - Error handling and loading states
 *
 * Features:
 * - Real-time balance updates
 * - Transaction pagination
 * - Responsive error handling
 * - Accessibility support
 * - Clipboard integration
 *
 * @module wallet
 * @version 1.0.0
 */

import { getAddressDetails, search } from './api.js';
import { renderError, renderLoading } from './renderers/shared.js';
import { formatAda, SVG_ICONS, validators } from './utils.js';

// Configuration Constants
const CONFIG = {
  UI: {
    ELEMENTS: {
      CONTENT: 'wallet-content',
      SEARCH_INPUT: '#search-input',
      SEARCH_BUTTON: '#search-btn',
      ERROR_CONTAINER: 'error-container',
      ERROR_MESSAGE: 'error-message',
    },
    CLASSES: {
      CARD: 'card',
      SECTION: 'section',
      COPIED: 'copied',
      ACTIVE: 'active',
      PAGINATION_BTN: 'pagination-btn',
    },
  },
  PAGINATION: {
    ITEMS_PER_PAGE: 10,
    VISIBLE_PAGES: 5,
  },
  VALIDATION: {
    MIN_SEARCH_LENGTH: 3,
  },
  TIMING: {
    COPY_FEEDBACK_DURATION: 2000,
  },
  ROUTES: {
    WALLET: 'wallet.html',
    TRANSACTION: 'transaction.html',
    DETAILS: 'details.html',
  },
};

/**
 * Renders wallet overview section
 * @param {Object} data - Wallet data
 * @returns {string} HTML string
 */
const renderWalletOverview = (data) => {
  const totalBalance = calculateTotalBalance(data.amount);

  return `
    <div class="wallet-overview" role="region" aria-label="Wallet Overview">
      <div class="wallet-details-grid">
        <div class="balance-info">
          <h3>Balance</h3>
          <div class="balance-amount" aria-label="Balance: ${formatAda(
            totalBalance
          )} ADA">
            ${formatAda(totalBalance)}
          </div>
        </div>
        <div class="address-info">
          <h3>Address Details</h3>
          ${renderAddressDetails(data)}
        </div>
      </div>
    </div>
  `;
};

/**
 * Renders address details section
 * @param {Object} data - Wallet data
 * @returns {string} HTML string
 */
const renderAddressDetails = (data) => `
  <div class="info-row">
    <span class="label">Address</span>
    <div class="value-with-copy">
      <div class="address-value" title="${data.address}">${data.address}</div>
      <button class="copy-btn" data-hash="${
        data.address
      }" title="Copy address" aria-label="Copy address">
        ${SVG_ICONS.COPY}
      </button>
    </div>
  </div>
  ${
    data.stake_address
      ? `
    <div class="info-row">
      <span class="label">Stake Address</span>
      <div class="value-with-copy">
        <div class="address-value" title="${data.stake_address}">${data.stake_address}</div>
        <button class="copy-btn" data-hash="${data.stake_address}" title="Copy stake address" aria-label="Copy stake address">
          ${SVG_ICONS.COPY}
        </button>
      </div>
    </div>
  `
      : ''
  }
`;

/**
 * Calculates total balance from amount data
 * @param {Array|string} amount - Amount data
 * @returns {string} Total balance in Lovelace
 */
const calculateTotalBalance = (amount) => {
  if (Array.isArray(amount)) {
    return amount
      .filter((amt) => amt.unit === 'lovelace')
      .reduce((sum, amt) => sum + BigInt(amt.quantity), BigInt(0))
      .toString();
  }
  return amount?.toString() || '0';
};

/**
 * Handles search functionality
 * @param {string} query - Search query
 */
const handleSearch = async (query) => {
  const contentElement = document.getElementById(CONFIG.UI.ELEMENTS.CONTENT);

  if (!validators.isValidSearchQuery(query)) {
    contentElement.innerHTML = renderError(
      'Invalid search query',
      `Please enter at least ${CONFIG.VALIDATION.MIN_SEARCH_LENGTH} characters to search`
    );
    return;
  }

  try {
    contentElement.innerHTML = renderLoading('Searching...');
    const searchResult = await search(query.trim());

    if (!searchResult?.type || !searchResult?.result) {
      throw new Error('No results found');
    }

    const redirectMap = {
      address: `${CONFIG.ROUTES.WALLET}?address=`,
      transaction: `${CONFIG.ROUTES.TRANSACTION}?hash=`,
      block: `${CONFIG.ROUTES.DETAILS}?type=block&hash=`,
    };

    const redirectUrl = redirectMap[searchResult.type];
    if (!redirectUrl) {
      throw new Error('Unsupported search result type');
    }

    window.location.href =
      redirectUrl + (searchResult.result.hash || searchResult.result.address);
  } catch (error) {
    console.error('Search error:', error);
    contentElement.innerHTML = renderError('Search failed', error.message);
  }
};

/**
 * Renders pagination controls
 * @param {number} currentPage - Current page number
 * @param {number} totalItems - Total number of items
 * @returns {string} HTML string
 */
const renderPagination = (currentPage, totalItems) => {
  const totalPages = Math.ceil(totalItems / CONFIG.PAGINATION.ITEMS_PER_PAGE);
  if (totalPages <= 1) return '';

  const pages = [];
  const halfVisible = Math.floor(CONFIG.PAGINATION.VISIBLE_PAGES / 2);
  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(
    totalPages,
    startPage + CONFIG.PAGINATION.VISIBLE_PAGES - 1
  );

  if (endPage - startPage + 1 < CONFIG.PAGINATION.VISIBLE_PAGES) {
    startPage = Math.max(1, endPage - CONFIG.PAGINATION.VISIBLE_PAGES + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(`
      <button class="${CONFIG.UI.CLASSES.PAGINATION_BTN} ${
      i === currentPage ? CONFIG.UI.CLASSES.ACTIVE : ''
    }" 
              data-page="${i}"
              ${i === currentPage ? 'disabled aria-current="page"' : ''}
              aria-label="Page ${i}">
        ${i}
      </button>
    `);
  }

  return `
    <nav class="pagination" role="navigation" aria-label="Transaction history pagination">
      <button class="${CONFIG.UI.CLASSES.PAGINATION_BTN}" 
              data-page="${currentPage - 1}"
              ${currentPage === 1 ? 'disabled' : ''}
              aria-label="Previous page">
        ${SVG_ICONS.LEFT_ARROW}
      </button>
      ${pages.join('')}
      <button class="${CONFIG.UI.CLASSES.PAGINATION_BTN}" 
              data-page="${currentPage + 1}"
              ${currentPage === totalPages ? 'disabled' : ''}
              aria-label="Next page">
        ${SVG_ICONS.RIGHT_ARROW}
      </button>
    </nav>
  `;
};

/**
 * Renders transaction list
 * @param {Array} transactions - Transaction data
 * @param {number} currentPage - Current page number
 * @returns {string} HTML string
 */
const renderTransactions = (transactions, currentPage = 1) => {
  const start = (currentPage - 1) * CONFIG.PAGINATION.ITEMS_PER_PAGE;
  const end = start + CONFIG.PAGINATION.ITEMS_PER_PAGE;
  const paginatedTransactions = transactions.slice(start, end);

  return `
    <div class="transactions-section" role="region" aria-label="Transaction History">
      <h3>Recent Transactions</h3>
      <div class="transaction-list">
        ${paginatedTransactions
          .map(
            (tx) => `
          <article class="transaction-item" role="article">
            <div class="tx-header">
              <time class="tx-time" datetime="${new Date(
                tx.block_time * 1000
              ).toISOString()}">
                ${new Date(tx.block_time * 1000).toLocaleString()}
              </time>
            </div>
            <div class="tx-details">
              <div class="value-with-copy">
                <a href="${CONFIG.ROUTES.TRANSACTION}?hash=${tx.tx_hash}" 
                   class="address-value" 
                   title="${tx.tx_hash}">
                  ${tx.tx_hash}
                </a>
                <button class="copy-btn" 
                        data-hash="${tx.tx_hash}" 
                        title="Copy transaction hash"
                        aria-label="Copy transaction hash">
                  ${SVG_ICONS.COPY}
                </button>
              </div>
            </div>
          </article>
        `
          )
          .join('')}
      </div>
      ${renderPagination(currentPage, transactions.length)}
    </div>
  `;
};

/**
 * Initializes the wallet page
 */
const initWalletPage = async () => {
  const contentElement = document.getElementById(CONFIG.UI.ELEMENTS.CONTENT);
  if (!contentElement) {
    console.error('Content element not found');
    return;
  }

  const address = new URLSearchParams(window.location.search).get('address');
  if (!validators.isValidAddress(address)) {
    contentElement.innerHTML = renderError(
      'Invalid address',
      'Please provide a valid wallet address'
    );
    return;
  }

  try {
    contentElement.innerHTML = renderLoading('Loading wallet details...');

    const response = await fetch(`/api/blocks/address/${address}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch wallet data: ${response.statusText}`);
    }

    const { success, data } = await response.json();
    if (!success || !data) {
      throw new Error('Invalid wallet data received');
    }

    contentElement.innerHTML = `
      <div class="${CONFIG.UI.CLASSES.SECTION}">
        <div class="${CONFIG.UI.CLASSES.CARD}">
          ${renderWalletOverview(data)}
          ${
            data.transactions?.length
              ? renderTransactions(data.transactions, 1)
              : ''
          }
        </div>
      </div>
    `;

    setupCopyButtons();
    if (data.transactions?.length) {
      setupPaginationButtons(data.transactions);
    }
  } catch (error) {
    console.error('Error loading wallet:', error);
    contentElement.innerHTML = renderError(
      'Failed to load wallet',
      error.message
    );
  }
};

/**
 * Sets up copy-to-clipboard functionality
 */
const setupCopyButtons = () => {
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.hash);
        const originalTitle = btn.title;
        btn.title = 'Copied!';
        btn.classList.add(CONFIG.UI.CLASSES.COPIED);
        setTimeout(() => {
          btn.title = originalTitle;
          btn.classList.remove(CONFIG.UI.CLASSES.COPIED);
        }, CONFIG.TIMING.COPY_FEEDBACK_DURATION);
      } catch (error) {
        console.error('Copy operation failed:', error);
        btn.title = 'Failed to copy';
      }
    });
  });
};

/**
 * Sets up pagination event listeners
 * @param {Array} transactions - Transaction data
 */
const setupPaginationButtons = (transactions) => {
  document
    .querySelectorAll(`.${CONFIG.UI.CLASSES.PAGINATION_BTN}`)
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!btn.disabled) {
          const page = parseInt(btn.dataset.page);
          const transactionsSection = document.querySelector(
            '.transactions-section'
          );
          if (transactionsSection) {
            transactionsSection.outerHTML = renderTransactions(
              transactions,
              page
            );
            setupCopyButtons();
            setupPaginationButtons(transactions);
          }
        }
      });
    });
};

/**
 * Sets up page event listeners
 */
const setupEventListeners = () => {
  const searchInput = document.querySelector(CONFIG.UI.ELEMENTS.SEARCH_INPUT);
  const searchButton = document.querySelector(CONFIG.UI.ELEMENTS.SEARCH_BUTTON);

  if (searchInput && searchButton) {
    searchButton.addEventListener('click', () =>
      handleSearch(searchInput.value)
    );
    searchInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        handleSearch(searchInput.value);
      }
    });
  }
};

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initWalletPage();
  setupEventListeners();
});

// Export for testing
export { initWalletPage, handleSearch };
