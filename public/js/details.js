/**
 * Details Page Controller
 *
 * Manages the display and interaction of blockchain entity details:
 * - Block details and transaction lists
 * - Transaction details with UTXO information
 * - Search functionality across entities
 * - UI state management and event handling
 * - Navigation and clipboard operations
 *
 * @module details
 */

import {
  getBlockDetails,
  getBlockTransactions,
  getTransactionDetails,
  search,
} from './api.js';
import { renderBlockDetails, updateDetailType } from './renderers/blocks.js';
import { renderTransactionDetails } from './renderers/transactions.js';
import { renderError, renderLoading } from './renderers/shared.js';
import { getElement } from './utils.js';

// Configuration Constants
const CONFIG = {
  UI: {
    SELECTORS: {
      DETAILS_CONTENT: 'details-content',
      DETAIL_TYPE: '.detail-type',
      SEARCH_INPUT: '#search-input',
      SEARCH_BUTTON: '#search-btn',
      DETAILS_CONTAINER: '.details-container',
      MAIN_CONTENT: '#main-content',
      CONTAINER: '.container',
      COPY_BUTTON: '.copy-btn',
      BACK_BUTTON: '#back-to-block',
      VIEW_TRANSACTIONS: '#view-transactions',
    },
    MINIMUM_SEARCH_LENGTH: 3,
    COPY_FEEDBACK_DURATION: 2000,
  },
  VALIDATION: {
    HASH_REGEX: /^[0-9a-fA-F]{64}$/,
    ENTITY_TYPES: ['block', 'transaction', 'address'],
    REQUIRED_BLOCK_FIELDS: ['hash', 'height', 'slot', 'time', 'epoch'],
  },
  ROUTES: {
    WALLET: 'wallet.html',
    TRANSACTION: 'transaction.html',
    DETAILS: 'details.html',
  },
};

/**
 * Copies text to clipboard with visual feedback
 * @param {HTMLElement} btn - Button element that triggered the copy
 * @param {string} hash - Text to copy
 */
const copyToClipboard = async (btn, hash) => {
  try {
    await navigator.clipboard.writeText(hash);
    const originalTitle = btn.title;
    btn.title = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.title = originalTitle;
      btn.classList.remove('copied');
    }, CONFIG.UI.COPY_FEEDBACK_DURATION);
  } catch (err) {
    console.error('Failed to copy:', err);
    btn.title = 'Failed to copy';
  }
};

/**
 * Sets up copy functionality for all copy buttons
 */
const setupCopyButtons = () => {
  document.querySelectorAll(CONFIG.UI.SELECTORS.COPY_BUTTON).forEach((btn) => {
    btn.addEventListener('click', () => copyToClipboard(btn, btn.dataset.hash));
  });
};

/**
 * Sets up event listeners for block details view
 * @param {Object} block - Block data
 * @param {boolean} hasTransactions - Whether transactions are being displayed
 */
const setupBlockEventListeners = (block, hasTransactions) => {
  console.log('Setting up block event listeners:', { block, hasTransactions });
  setupCopyButtons();

  if (hasTransactions) {
    const backBtn = document.getElementById(
      CONFIG.UI.SELECTORS.BACK_BUTTON.slice(1)
    );
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.loadBlockDetails(block.hash);
      });
    }
  } else {
    const txRow = document.getElementById(
      CONFIG.UI.SELECTORS.VIEW_TRANSACTIONS.slice(1)
    );
    if (txRow && block.tx_count > 0) {
      const loadTransactions = (e) => {
        e.preventDefault();
        window.loadBlockTransactions(block.hash);
      };

      txRow.addEventListener('click', loadTransactions);
      txRow.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadTransactions(e);
        }
      });
    }
  }
};

/**
 * Extracts and validates URL parameters
 * @returns {{type: string, hash: string}} URL parameters
 * @throws {Error} If parameters are missing or invalid
 */
const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  const hash = params.get('hash');

  if (!type || !hash) {
    throw new Error('Missing required URL parameters: type and hash');
  }

  if (!CONFIG.VALIDATION.ENTITY_TYPES.includes(type)) {
    throw new Error(
      `Invalid type parameter. Must be one of: ${CONFIG.VALIDATION.ENTITY_TYPES.join(
        ', '
      )}`
    );
  }

  return { type, hash };
};

/**
 * Validates block data structure and content
 * @param {Object} blockData - Block data to validate
 * @returns {Object} Validated block data
 * @throws {Error} If validation fails
 */
const validateBlockData = (blockData) => {
  if (!blockData) {
    throw new Error('No block data received from server');
  }

  const missingFields = CONFIG.VALIDATION.REQUIRED_BLOCK_FIELDS.filter(
    (field) => !blockData[field]
  );
  if (missingFields.length > 0) {
    throw new Error(
      `Invalid block data: missing required fields (${missingFields.join(
        ', '
      )})`
    );
  }

  if (!CONFIG.VALIDATION.HASH_REGEX.test(blockData.hash)) {
    throw new Error('Invalid block data: incorrect hash format');
  }

  const numericFields = ['height', 'slot', 'epoch'];
  const invalidTypes = numericFields.filter(
    (field) => typeof blockData[field] !== 'number'
  );
  if (invalidTypes.length > 0) {
    throw new Error(
      `Invalid block data: fields must be numeric (${invalidTypes.join(', ')})`
    );
  }

  return blockData;
};

/**
 * Displays block details in the UI
 * @param {Object} block - Block data to display
 * @param {Array} [transactions] - Optional array of transaction data
 */
const displayBlockDetails = (block, transactions = null) => {
  try {
    if (!block) {
      throw new Error('Invalid block data');
    }

    const detailsContent = getElement(CONFIG.UI.SELECTORS.DETAILS_CONTENT);
    const detailType = document.querySelector(CONFIG.UI.SELECTORS.DETAIL_TYPE);

    if (detailType) {
      updateDetailType(detailType, block);
    }

    detailsContent.innerHTML = renderBlockDetails(block, transactions);
    setupBlockEventListeners(block, !!transactions);
  } catch (error) {
    console.error('Error displaying block details:', error);
    displayError('Failed to display block details', error.message);
  }
};

/**
 * Displays error message in the UI
 * @param {string} message - Main error message
 * @param {string} [details] - Optional error details
 */
const displayError = (message, details = '') => {
  const detailsContent = getElement(CONFIG.UI.SELECTORS.DETAILS_CONTENT);
  let errorDetails = details;

  if (!errorDetails && details instanceof Error) {
    if (details.status === 404) {
      errorDetails =
        'The requested resource could not be found. Please verify the hash and try again.';
    } else if (details.status === 400) {
      errorDetails =
        'The request was invalid. Please check the provided parameters.';
    } else if (details.status >= 500) {
      errorDetails = 'A server error occurred. Please try again later.';
    }
  }

  detailsContent.innerHTML = renderError(message, errorDetails);
};

/**
 * Displays loading state in the UI
 */
const displayLoading = () => {
  const detailsContent = getElement(CONFIG.UI.SELECTORS.DETAILS_CONTENT);
  detailsContent.innerHTML = renderLoading('Loading details...');
};

/**
 * Updates browser history without page reload
 * @param {string} type - Entity type
 * @param {string} hash - Entity hash
 */
const updateBrowserHistory = (type, hash) => {
  history.pushState({}, '', `?type=${type}&hash=${hash}`);
};

/**
 * Loads and displays block details
 * @param {string} hashOrHeight - Block hash or height
 */
window.loadBlockDetails = async (hashOrHeight) => {
  try {
    displayLoading();
    const block = await getBlockDetails(hashOrHeight);
    validateBlockData(block);
    displayBlockDetails(block);
    updateBrowserHistory('block', block.hash);
  } catch (error) {
    console.error('Error loading block details:', error);
    displayError('Failed to load block details', error);
  }
};

/**
 * Loads and displays block transactions
 * @param {string} hash - Block hash
 */
window.loadBlockTransactions = async (hash) => {
  try {
    displayLoading();
    const [block, transactions] = await Promise.all([
      getBlockDetails(hash),
      getBlockTransactions(hash),
    ]);
    validateBlockData(block);
    displayBlockDetails(block, transactions);
  } catch (error) {
    console.error('Error loading block transactions:', error);
    displayError('Failed to load block transactions', error);
  }
};

/**
 * Loads and displays transaction details
 * @param {string} hash - Transaction hash
 */
window.loadTransactionDetails = async (hash) => {
  try {
    displayLoading();
    const transaction = await getTransactionDetails(hash);
    if (!transaction) {
      throw new Error('No transaction data received');
    }
    const detailsContent = getElement(CONFIG.UI.SELECTORS.DETAILS_CONTENT);
    detailsContent.innerHTML = renderTransactionDetails(transaction);
    setupCopyButtons();
    updateBrowserHistory('transaction', hash);
  } catch (error) {
    console.error('Error loading transaction details:', error);
    displayError('Failed to load transaction details', error);
  }
};

/**
 * Handles search functionality
 * @param {string} query - Search query
 */
const handleSearch = async (query) => {
  const trimmedQuery = query?.trim();
  if (!trimmedQuery || trimmedQuery.length < CONFIG.UI.MINIMUM_SEARCH_LENGTH) {
    displayError(
      'Invalid search query',
      `Please enter at least ${CONFIG.UI.MINIMUM_SEARCH_LENGTH} characters to search`
    );
    return;
  }

  try {
    displayLoading();
    const searchResult = await search(trimmedQuery);

    if (!searchResult?.type || !searchResult?.result) {
      throw new Error('No results found');
    }

    const { type, result } = searchResult;
    let redirectUrl;

    switch (type) {
      case 'address':
        redirectUrl = `${CONFIG.ROUTES.WALLET}?address=${result.address}`;
        break;
      case 'transaction':
        redirectUrl = `${CONFIG.ROUTES.TRANSACTION}?hash=${result.hash}`;
        break;
      case 'block':
        redirectUrl = `${CONFIG.ROUTES.DETAILS}?type=block&hash=${result.hash}`;
        break;
      default:
        throw new Error('Unsupported search result type');
    }

    window.location.href = redirectUrl;
  } catch (error) {
    console.error('Search error:', error);
    displayError('Search failed', error);
  }
};

/**
 * Sets up event listeners for the page
 */
const setupEventListeners = () => {
  const searchInput = document.querySelector(CONFIG.UI.SELECTORS.SEARCH_INPUT);
  const searchButton = document.querySelector(
    CONFIG.UI.SELECTORS.SEARCH_BUTTON
  );

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

/**
 * Initializes the details page
 */
const initDetailsPage = async () => {
  try {
    console.log('Initializing details page');
    setupEventListeners();

    const params = getUrlParams();
    console.log('URL params:', params);

    if (params.type === 'address') {
      window.location.href = `${CONFIG.ROUTES.WALLET}?address=${params.hash}`;
      return;
    }

    const detailsContent = getElement(CONFIG.UI.SELECTORS.DETAILS_CONTENT);
    if (!detailsContent) {
      throw new Error('Details content element not found');
    }

    displayLoading();
    if (params.type === 'block') {
      await window.loadBlockDetails(params.hash);
    } else if (params.type === 'transaction') {
      await window.loadTransactionDetails(params.hash);
    }
  } catch (error) {
    console.error('Error initializing details page:', error);
    displayError('Failed to initialize page', error);
  }
};

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initDetailsPage);

// Export functions for testing
export { initDetailsPage, getUrlParams, setupEventListeners, handleSearch };
