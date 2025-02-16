/**
 * Details Page Controller
 *
 * Manages the block and transaction details page functionality including:
 * - Loading and displaying block/transaction details
 * - Managing UI state and event listeners
 * - Handling search functionality
 * - Copy to clipboard operations
 *
 * @module details
 */

import {
  getBlockDetails,
  getBlockTransactions,
  getTransactionDetails,
  search,
} from './api.js';
import {
  renderBlockDetails,
  renderTransactionDetails,
  renderError,
  renderLoading,
  updateDetailType,
} from './renderers/details.js';
import { renderSearchResults } from './renderers/search.js';
import { getElement } from './utils.js';

const UI = {
  SELECTORS: {
    DETAILS_CONTENT: 'details-content',
    DETAIL_TYPE: '.detail-type',
    SEARCH_INPUT: '.search-bar input',
    SEARCH_BUTTON: '.search-btn',
    DETAILS_CONTAINER: '.details-container',
    MAIN_CONTENT: '#main-content',
    CONTAINER: '.container',
  },
  MINIMUM_SEARCH_LENGTH: 3,
};

const copyToClipboard = async (btn, hash) => {
  try {
    await navigator.clipboard.writeText(hash);
    const originalTitle = btn.title;
    btn.title = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.title = originalTitle;
      btn.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    btn.title = 'Failed to copy';
  }
};

const setupCopyButtons = () => {
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => copyToClipboard(btn, btn.dataset.hash));
  });
};

/**
 * Sets up event listeners for block details view
 * @param {Object} block - Block data
 * @param {boolean} hasTransactions - Whether transactions are being displayed
 */
const setupBlockEventListeners = (block, hasTransactions) => {
  setupCopyButtons();

  if (hasTransactions) {
    // Back button listener
    const backBtn = document.getElementById('back-to-block');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.loadBlockDetails(block.hash);
      });
    }

    // Transaction item click listeners
    document.querySelectorAll('.transaction-item').forEach((item) => {
      item.addEventListener('click', () => {
        const txHash = item.dataset.txHash;
        window.loadTransactionDetails(txHash);
      });
    });
  } else {
    // Transaction row click listener
    const txRow = document.getElementById('view-transactions');
    if (txRow && block.tx_count > 0) {
      txRow.addEventListener('click', () => {
        window.loadBlockTransactions(block.hash);
      });
    }
  }
};

/**
 * Sets up event listeners for transaction details view
 * @param {Object} transaction - Transaction data
 */
const setupTransactionEventListeners = (transaction) => {
  setupCopyButtons();

  // Back button listener
  const backBtn = document.getElementById('back-to-transactions');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.loadBlockTransactions(transaction.block);
    });
  }
};

/**
 * Extracts URL parameters for block details
 * @returns {{hash: string|null, type: string|null}} URL parameters
 */
const getUrlParams = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      hash: params.get('hash'),
      type: params.get('type'),
    };
  } catch (error) {
    console.error('Error parsing URL parameters:', error);
    return { hash: null, type: null };
  }
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

    const detailsContent = getElement(UI.SELECTORS.DETAILS_CONTENT);
    const detailType = document.querySelector(UI.SELECTORS.DETAIL_TYPE);

    if (!detailType) {
      console.warn('Detail type element not found');
    } else {
      updateDetailType(detailType, block);
    }

    detailsContent.innerHTML = renderBlockDetails(block, transactions);
    setupBlockEventListeners(block, !!transactions);
  } catch (error) {
    console.error('Error displaying block details:', error);
    displayError('Failed to display block details');
  }
};

/**
 * Displays transaction details in the UI
 * @param {Object} transaction - Transaction data to display
 */
const displayTransactionDetails = (transaction) => {
  try {
    if (!transaction) {
      throw new Error('Invalid transaction data');
    }

    const detailsContent = getElement(UI.SELECTORS.DETAILS_CONTENT);
    const detailType = document.querySelector(UI.SELECTORS.DETAIL_TYPE);

    if (detailType) {
      detailType.textContent = `Transaction Details`;
    }

    detailsContent.innerHTML = renderTransactionDetails(transaction);
    setupTransactionEventListeners(transaction);
  } catch (error) {
    console.error('Error displaying transaction details:', error);
    displayError('Failed to display transaction details');
  }
};

/**
 * Displays error message in the UI
 * @param {string} message - Error message to display
 */
const displayError = (message) => {
  const detailsContent = getElement(UI.SELECTORS.DETAILS_CONTENT);
  detailsContent.innerHTML = renderError(message);
};

/**
 * Displays loading state in the UI
 */
const displayLoading = () => {
  const detailsContent = getElement(UI.SELECTORS.DETAILS_CONTENT);
  detailsContent.innerHTML = renderLoading();
};

const validateBlockData = (blockData) => {
  if (!blockData) throw new Error('No block data received');
  if (!blockData.hash || !blockData.height)
    throw new Error('Invalid block data structure');
  return blockData;
};

const validateTransactionData = (txData) => {
  if (!txData) throw new Error('No transaction data received');
  if (!txData.hash || !txData.block)
    throw new Error('Invalid transaction data structure');
  return txData;
};

/**
 * Loads block details
 * @param {string} blockHash - Hash of the block to load
 */
window.loadBlockDetails = async (blockHash) => {
  try {
    if (!blockHash) throw new Error('Block hash is required');

    displayLoading();
    const blockData = await getBlockDetails(blockHash);
    const validatedData = validateBlockData(blockData);

    displayBlockDetails(validatedData);
  } catch (error) {
    console.error('Error loading block details:', error);
    displayError(
      error.message === 'Invalid block data structure'
        ? 'The block data appears to be corrupted. Please try again.'
        : 'Failed to load block details'
    );
  }
};

/**
 * Loads block transactions
 * @param {string} blockHash - Hash of the block
 */
window.loadBlockTransactions = async (blockHash) => {
  try {
    if (!blockHash) throw new Error('Block hash is required');

    displayLoading();
    const [blockData, txData] = await Promise.all([
      getBlockDetails(blockHash),
      getBlockTransactions(blockHash),
    ]);

    const validatedBlock = validateBlockData(blockData);
    if (!txData?.transactions) throw new Error('Invalid transaction list data');

    displayBlockDetails(validatedBlock, txData.transactions);
  } catch (error) {
    console.error('Error loading block transactions:', error);
    displayError(
      error.message.includes('Invalid')
        ? 'The transaction data appears to be corrupted. Please try again.'
        : 'Failed to load block transactions'
    );
  }
};

/**
 * Loads transaction details
 * @param {string} txHash - Hash of the transaction
 */
window.loadTransactionDetails = async (txHash) => {
  try {
    if (!txHash) throw new Error('Transaction hash is required');

    displayLoading();
    const txData = await getTransactionDetails(txHash);
    const validatedData = validateTransactionData(txData);

    displayTransactionDetails(validatedData);
  } catch (error) {
    console.error('Error loading transaction details:', error);
    displayError(
      error.message.includes('Invalid')
        ? 'The transaction data appears to be corrupted. Please try again.'
        : 'Failed to load transaction details'
    );
  }
};

/**
 * Handles search functionality
 * @param {string} query - The search query
 */
const handleSearch = async (query) => {
  if (!query?.trim() || query.trim().length < UI.MINIMUM_SEARCH_LENGTH) {
    alert(
      `Please enter at least ${UI.MINIMUM_SEARCH_LENGTH} characters to search`
    );
    return;
  }

  try {
    // Hide the details container and show the main content for search results
    const detailsContainer = document.querySelector(
      UI.SELECTORS.DETAILS_CONTAINER
    );
    if (detailsContainer) {
      detailsContainer.style.display = 'none';
    }

    // Create main content div if it doesn't exist
    let mainContent = document.querySelector(UI.SELECTORS.MAIN_CONTENT);
    if (!mainContent) {
      mainContent = document.createElement('div');
      mainContent.id = 'main-content';
      document.querySelector(UI.SELECTORS.CONTAINER).appendChild(mainContent);
    }

    await renderSearchResults(query.trim());
  } catch (error) {
    console.error('Search error:', error);
    displayError('Failed to perform search');
  }
};

/**
 * Sets up event listeners for the page
 */
const setupEventListeners = () => {
  // Add search event listeners
  const searchInput = document.querySelector(UI.SELECTORS.SEARCH_INPUT);
  const searchButton = document.querySelector(UI.SELECTORS.SEARCH_BUTTON);

  if (searchInput && searchButton) {
    // Handle search button click
    searchButton.addEventListener('click', () => {
      handleSearch(searchInput.value);
    });

    // Handle enter key in search input
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
    setupEventListeners();

    const { hash, type } = getUrlParams();
    if (!hash || !type) {
      throw new Error(
        'Missing required URL parameters: hash and type are required'
      );
    }

    const detailsContent = getElement(UI.SELECTORS.DETAILS_CONTENT);
    if (!detailsContent) {
      throw new Error('Details content element not found in the DOM');
    }

    displayLoading();

    const loaders = {
      block: () => window.loadBlockDetails(hash),
      transaction: () => window.loadTransactionDetails(hash),
    };

    const loader = loaders[type];
    if (!loader) {
      throw new Error(
        `Unsupported detail type: ${type}. Supported types are: block, transaction`
      );
    }

    await loader();
  } catch (error) {
    console.error('Error initializing details page:', error);
    displayError(
      error.message.includes('URL parameters')
        ? 'Invalid page URL. Please check the address and try again.'
        : error.message
    );
  }
};

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initDetailsPage);

// Export functions for testing
export { initDetailsPage, getUrlParams, setupEventListeners, handleSearch };
