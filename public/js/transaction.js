/**
 * Transaction Details Controller
 *
 * Manages the transaction details page functionality:
 * - Transaction data loading and display
 * - Search functionality across entities
 * - Navigation and clipboard operations
 * - Event handling and user interactions
 * - Error handling and validation
 *
 * @module transaction
 */

import { getTransactionDetails, search } from './api.js';
import { renderTransactionDetails } from './renderers/transactions.js';
import { renderError, renderLoading } from './renderers/shared.js';

// Configuration Constants
const CONFIG = {
  UI: {
    ELEMENTS: {
      CONTENT: 'transaction-content',
      SEARCH_INPUT: '#search-input',
      SEARCH_BUTTON: '#search-btn',
      BACK_BUTTON: '#back-to-block',
      COPY_BUTTON: '.copy-btn',
      ADDRESS_LINK: '.address-value',
    },
    MINIMUM_SEARCH_LENGTH: 3,
    COPY_FEEDBACK_DURATION: 2000,
  },
  VALIDATION: {
    HASH_REGEX: /^[0-9a-fA-F]{64}$/,
    ADDRESS_REGEX: /^addr1[a-zA-Z0-9]+$/,
    HEIGHT_REGEX: /^\d+$/,
  },
  ROUTES: {
    TRANSACTION: 'transaction.html',
    WALLET: 'wallet.html',
    DETAILS: 'details.html',
  },
};

/**
 * Validates and processes search query
 * @param {string} query - Raw search query
 * @returns {{type: string, value: string}|null} Processed query info or null if invalid
 */
const processSearchQuery = (query) => {
  const cleanedQuery = query.trim();

  if (CONFIG.VALIDATION.HASH_REGEX.test(cleanedQuery)) {
    return { type: 'hash', value: cleanedQuery };
  }
  if (CONFIG.VALIDATION.ADDRESS_REGEX.test(cleanedQuery)) {
    return { type: 'address', value: cleanedQuery };
  }
  if (CONFIG.VALIDATION.HEIGHT_REGEX.test(cleanedQuery)) {
    return { type: 'height', value: cleanedQuery };
  }
  return null;
};

/**
 * Handles direct navigation based on query type
 * @param {{type: string, value: string}} queryInfo - Processed query information
 * @returns {string|null} Redirect URL or null if no direct match
 */
const getDirectNavigationUrl = (queryInfo) => {
  switch (queryInfo.type) {
    case 'hash':
      return `${CONFIG.ROUTES.TRANSACTION}?hash=${queryInfo.value}`;
    case 'address':
      return `${CONFIG.ROUTES.WALLET}?address=${queryInfo.value}`;
    case 'height':
      return `${CONFIG.ROUTES.DETAILS}?type=block&height=${queryInfo.value}`;
    default:
      return null;
  }
};

/**
 * Handles search functionality
 * @param {string} query - Search query
 */
const handleSearch = async (query) => {
  const contentElement = document.getElementById(CONFIG.UI.ELEMENTS.CONTENT);

  if (!query?.trim() || query.trim().length < CONFIG.UI.MINIMUM_SEARCH_LENGTH) {
    contentElement.innerHTML = renderError(
      'Invalid search query',
      `Please enter at least ${CONFIG.UI.MINIMUM_SEARCH_LENGTH} characters to search`
    );
    return;
  }

  try {
    contentElement.innerHTML = renderLoading('Searching...');
    const queryInfo = processSearchQuery(query);

    if (queryInfo) {
      const directUrl = getDirectNavigationUrl(queryInfo);
      if (directUrl) {
        window.location.href = directUrl;
        return;
      }
    }

    const searchResult = await search(query.trim());
    if (!searchResult?.type || !searchResult?.result) {
      throw new Error('No results found');
    }

    const { type, result } = searchResult;
    let redirectUrl;

    switch (type) {
      case 'transaction':
        redirectUrl = `${CONFIG.ROUTES.TRANSACTION}?hash=${result.hash}`;
        break;
      case 'block':
        redirectUrl = `${CONFIG.ROUTES.DETAILS}?type=block&hash=${result.hash}`;
        break;
      case 'address':
        redirectUrl = `${CONFIG.ROUTES.WALLET}?address=${result.address}`;
        break;
      default:
        throw new Error('Unsupported search result type');
    }

    window.location.href = redirectUrl;
  } catch (error) {
    console.error('Search error:', error);
    contentElement.innerHTML = renderError('Search failed', error.message);
  }
};

/**
 * Handles back navigation with context awareness
 */
const handleBackNavigation = () => {
  const params = new URLSearchParams(window.location.search);
  const blockHash = params.get('blockHash');

  if (blockHash) {
    window.location.href = `${CONFIG.ROUTES.DETAILS}?type=block&hash=${blockHash}`;
  } else {
    window.history.back();
  }
};

/**
 * Copies text to clipboard with visual feedback
 * @param {HTMLElement} btn - Button element that triggered the copy
 * @param {string} text - Text to copy
 */
const copyToClipboard = async (btn, text) => {
  try {
    await navigator.clipboard.writeText(text);
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
 * Sets up copy functionality for hash elements
 */
const setupCopyButtons = () => {
  document.querySelectorAll(CONFIG.UI.ELEMENTS.COPY_BUTTON).forEach((btn) => {
    btn.addEventListener('click', () => copyToClipboard(btn, btn.dataset.hash));
  });
};

/**
 * Sets up address link navigation
 */
const setupAddressLinks = () => {
  document.querySelectorAll(CONFIG.UI.ELEMENTS.ADDRESS_LINK).forEach((link) => {
    if (link.tagName === 'A') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = link.getAttribute('href');
      });
    }
  });
};

/**
 * Sets up event listeners for the page
 */
const setupEventListeners = () => {
  const backBtn = document.querySelector(CONFIG.UI.ELEMENTS.BACK_BUTTON);
  backBtn?.addEventListener('click', handleBackNavigation);

  setupCopyButtons();
  setupAddressLinks();

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

/**
 * Validates transaction parameters
 * @param {string} hash - Transaction hash
 * @returns {boolean} Whether parameters are valid
 */
const validateTransactionParams = (hash) => {
  if (!hash) {
    throw new Error('No transaction hash provided');
  }
  if (!CONFIG.VALIDATION.HASH_REGEX.test(hash)) {
    throw new Error('Invalid transaction hash format');
  }
  return true;
};

/**
 * Initializes the transaction details page
 */
const initTransactionPage = async () => {
  const contentElement = document.getElementById(CONFIG.UI.ELEMENTS.CONTENT);
  if (!contentElement) {
    console.error('Content element not found');
    return;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const hash = params.get('hash');
    const blockHash = params.get('blockHash');

    validateTransactionParams(hash);
    contentElement.innerHTML = renderLoading('Loading transaction details...');

    const transaction = await getTransactionDetails(hash);
    transaction.block = transaction.block_hash || blockHash;

    contentElement.innerHTML = renderTransactionDetails(transaction);
    setupEventListeners();
  } catch (error) {
    console.error('Error loading transaction:', error);
    contentElement.innerHTML = renderError(
      'Failed to load transaction',
      error.message
    );
  }
};

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initTransactionPage);

// Export for testing
export { initTransactionPage, handleSearch };
