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
import { renderBlockDetails, updateDetailType } from './renderers/blocks.js';
import { renderTransactionDetails } from './renderers/transactions.js';
import { renderSearchResults } from './renderers/search.js';
import { renderError, renderLoading } from './renderers/shared.js';
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
  console.log('Setting up block event listeners:', { block, hasTransactions });
  setupCopyButtons();

  if (hasTransactions) {
    console.log('Setting up transaction listeners');
    // Back button listener
    const backBtn = document.getElementById('back-to-block');
    if (backBtn) {
      console.log('Found back button');
      backBtn.addEventListener('click', (e) => {
        console.log('Back button clicked');
        e.preventDefault();
        window.loadBlockDetails(block.hash);
      });
    }
  } else {
    console.log('Setting up transaction row listener');
    const txRow = document.getElementById('view-transactions');
    if (txRow && block.tx_count > 0) {
      console.log('Found transaction row with transactions');

      // Handle click event
      txRow.addEventListener('click', (e) => {
        console.log('Transaction row clicked');
        e.preventDefault();
        window.loadBlockTransactions(block.hash);
      });

      // Handle keyboard events for accessibility
      txRow.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          console.log('Transaction row activated via keyboard');
          e.preventDefault();
          window.loadBlockTransactions(block.hash);
        }
      });
    }
  }
};

/**
 * Extracts URL parameters for block details
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

  if (!['block', 'transaction'].includes(type)) {
    throw new Error('Invalid type parameter. Must be "block" or "transaction"');
  }

  return { type, hash };
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
  if (!blockData) {
    throw new Error('No block data received');
  }
  if (!blockData.hash || !blockData.height) {
    console.error('Invalid block data structure:', blockData);
    throw new Error('Invalid block data structure');
  }
  return blockData;
};

/**
 * Loads and displays block details
 * @param {string} hashOrHeight - The block hash or height
 */
window.loadBlockDetails = async (hashOrHeight) => {
  try {
    displayLoading();
    const block = await getBlockDetails(hashOrHeight);
    validateBlockData(block);
    displayBlockDetails(block);
    // Update URL without reloading
    history.pushState({}, '', `?type=block&hash=${block.hash}`);
  } catch (error) {
    console.error('Error loading block details:', error);
    displayError(error.message || 'Failed to load block details');
  }
};

/**
 * Loads and displays block transactions
 * @param {string} hash - The block hash
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
    displayError(error.message);
  }
};

/**
 * Loads and displays transaction details
 * @param {string} hash - The transaction hash
 */
window.loadTransactionDetails = async (hash) => {
  try {
    displayLoading();
    const transaction = await getTransactionDetails(hash);
    if (!transaction) {
      throw new Error('No transaction data received');
    }
    const detailsContent = getElement(UI.SELECTORS.DETAILS_CONTENT);
    detailsContent.innerHTML = renderTransactionDetails(transaction);
    setupCopyButtons();
    // Update URL without reloading
    history.pushState({}, '', `?type=transaction&hash=${hash}`);
  } catch (error) {
    console.error('Error loading transaction details:', error);
    displayError(error.message || 'Failed to load transaction details');
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
    console.log('Initializing details page');
    setupEventListeners();

    const params = getUrlParams();
    console.log('URL params:', params);

    const detailsContent = getElement(UI.SELECTORS.DETAILS_CONTENT);
    if (!detailsContent) {
      throw new Error('Details content element not found in the DOM');
    }

    displayLoading();
    if (params.type === 'block') {
      await window.loadBlockDetails(params.hash);
    } else if (params.type === 'transaction') {
      await window.loadTransactionDetails(params.hash);
    }
    console.log('Content loaded successfully');
  } catch (error) {
    console.error('Error initializing details page:', error);
    displayError(
      error.message.includes('URL parameter')
        ? 'Please provide both a type (block/transaction) and hash in the URL.'
        : error.message
    );
  }
};

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing page');
  initDetailsPage();
});

// Export functions for testing
export { initDetailsPage, getUrlParams, setupEventListeners, handleSearch };
