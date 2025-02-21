/**
 * Main Application Controller
 *
 * Manages the main explorer page functionality including:
 * - Latest block updates and auto-refresh
 * - Block list pagination
 * - Search functionality
 * - Navigation to block details
 * - UI state management
 *
 * @module main
 */

import {
  getLatestBlock,
  getBlocks,
  getBlockTransactions,
  search,
} from './api.js';
import {
  displayLatestBlock,
  displayBlockList,
  displayTransactions,
  displayError,
  displayLoading,
  showBlockContent,
  hideBlockContent,
} from './ui.js';
import { getElement } from './utils.js';

// Configuration Constants
const CONFIG = {
  TIMINGS: {
    REFRESH_INTERVAL: 20000, // 20 seconds
    ERROR_DISPLAY_DURATION: 5000, // 5 seconds
  },
  VALIDATION: {
    MIN_SEARCH_LENGTH: 3,
    REQUIRED_BLOCK_FIELDS: ['hash', 'height', 'time', 'epoch', 'slot'],
    REQUIRED_TX_FIELDS: ['transactions'],
  },
  ELEMENTS: {
    LATEST_BLOCK: 'latest-block-info',
    BLOCK_LIST: 'block-list',
    CONTENT: 'block-content',
    FETCH_BLOCK: 'fetch-block',
    AUTO_REFRESH: 'auto-refresh',
    SEARCH_INPUT: '#search-input',
    SEARCH_BUTTON: '#search-btn',
    MAIN_CONTENT: 'main-content',
    EXPLORER_GRID: '.explorer-grid',
    CONTAINER: '.container',
  },
  ROUTES: {
    DETAILS: 'pages/details.html',
  },
};

/**
 * Manages application state and auto-refresh functionality
 */
class ExplorerState {
  constructor() {
    this.autoRefreshInterval = null;
    this.currentBlockHash = null;
    this.isLoading = false;
  }

  setCurrentBlock(hash) {
    this.currentBlockHash = hash;
  }

  clearCurrentBlock() {
    this.currentBlockHash = null;
  }

  setLoading(isLoading) {
    this.isLoading = isLoading;
  }

  isAutoRefreshActive() {
    return !!this.autoRefreshInterval;
  }
}

const state = new ExplorerState();

/**
 * Validates block data structure and content
 * @param {Object} block - Block data to validate
 * @param {string} [context='block'] - Context for error messages
 * @returns {Object} Validated block data
 * @throws {Error} If validation fails
 */
const validateBlockData = (block, context = 'block') => {
  if (!block) {
    throw new Error(`No ${context} data received from API`);
  }

  const missingFields = CONFIG.VALIDATION.REQUIRED_BLOCK_FIELDS.filter(
    (field) => !block[field]
  );

  if (missingFields.length > 0) {
    console.error(`Invalid ${context} data structure:`, block);
    throw new Error(
      `Invalid ${context} data: missing required fields (${missingFields.join(
        ', '
      )})`
    );
  }

  return block;
};

/**
 * Validates transaction data structure
 * @param {Object} txData - Transaction data to validate
 * @returns {Object} Validated transaction data
 * @throws {Error} If validation fails
 */
const validateTransactionData = (txData) => {
  if (!txData) {
    throw new Error('No transaction data received from API');
  }

  const missingFields = CONFIG.VALIDATION.REQUIRED_TX_FIELDS.filter(
    (field) => !txData[field]
  );

  if (missingFields.length > 0 || !Array.isArray(txData.transactions)) {
    console.error('Invalid transaction data structure:', txData);
    throw new Error('Invalid transaction data structure received');
  }

  return txData;
};

/**
 * Manages auto-refresh functionality
 */
const autoRefresh = {
  start() {
    if (!state.isAutoRefreshActive()) {
      state.autoRefreshInterval = setInterval(
        window.fetchLatestBlock,
        CONFIG.TIMINGS.REFRESH_INTERVAL
      );
      this.updateButtonText('Stop Auto-Refresh');
    }
  },

  stop() {
    if (state.isAutoRefreshActive()) {
      clearInterval(state.autoRefreshInterval);
      state.autoRefreshInterval = null;
      this.updateButtonText('Start Auto-Refresh');
    }
  },

  toggle() {
    state.isAutoRefreshActive() ? this.stop() : this.start();
  },

  updateButtonText(text) {
    const btn = getElement(CONFIG.ELEMENTS.AUTO_REFRESH);
    if (btn) btn.textContent = text;
  },
};

/**
 * Fetches and displays the latest block
 */
window.fetchLatestBlock = async function fetchLatestBlock() {
  try {
    state.setLoading(true);
    displayLoading(CONFIG.ELEMENTS.LATEST_BLOCK);

    const block = await getLatestBlock();
    const validatedBlock = validateBlockData(block, 'latest block');
    displayLatestBlock(validatedBlock);
  } catch (error) {
    console.error('Error fetching latest block:', { error });
    displayError(
      `Failed to fetch latest block: ${error.message}`,
      CONFIG.ELEMENTS.LATEST_BLOCK
    );
  } finally {
    state.setLoading(false);
  }
};

/**
 * Loads and displays transactions for a specific block
 * @param {string} blockHash - Block hash to load transactions for
 */
window.loadBlockTransactions = async function loadBlockTransactions(blockHash) {
  if (!blockHash) {
    displayError('Block hash is required', CONFIG.ELEMENTS.BLOCK_LIST);
    return;
  }

  try {
    state.setLoading(true);
    displayLoading(CONFIG.ELEMENTS.BLOCK_LIST);
    state.setCurrentBlock(blockHash);

    const txData = await getBlockTransactions(blockHash);
    const validatedData = validateTransactionData(txData);
    displayTransactions(validatedData);
  } catch (error) {
    console.error('Error loading transactions:', { error, blockHash });
    displayError(
      `Failed to load transactions: ${error.message}`,
      CONFIG.ELEMENTS.BLOCK_LIST
    );
  } finally {
    state.setLoading(false);
  }
};

/**
 * Clears block selection and resets view
 */
window.clearBlockSelection = function clearBlockSelection() {
  state.clearCurrentBlock();
  hideBlockContent();
  window.fetchLatestBlock();
};

/**
 * Loads and displays block list with pagination
 * @param {number} [page=1] - Page number to load
 */
window.loadBlockList = async function loadBlockList(page = 1) {
  try {
    state.setLoading(true);
    displayLoading(CONFIG.ELEMENTS.BLOCK_LIST);
    hideBlockContent();

    const blockData = await getBlocks(page);
    if (!blockData?.blocks || !Array.isArray(blockData.blocks)) {
      throw new Error('Invalid block list data structure received');
    }

    displayBlockList(blockData);
  } catch (error) {
    console.error('Error loading block list:', { error, page });
    displayError(
      `Failed to load block list: ${error.message}`,
      CONFIG.ELEMENTS.BLOCK_LIST
    );
  } finally {
    state.setLoading(false);
  }
};

/**
 * Navigates to block details page
 * @param {string} blockHash - Block hash to view details for
 */
window.loadBlockDetails = function loadBlockDetails(blockHash) {
  if (!blockHash) {
    displayError('Block hash is required', CONFIG.ELEMENTS.BLOCK_LIST);
    return;
  }
  window.location.href = `${CONFIG.ROUTES.DETAILS}?hash=${blockHash}&type=block`;
};

/**
 * Handles search functionality
 * @param {string} query - Search query
 */
const handleSearch = async (query) => {
  const trimmedQuery = query?.trim();
  if (
    !trimmedQuery ||
    trimmedQuery.length < CONFIG.VALIDATION.MIN_SEARCH_LENGTH
  ) {
    displayError(
      'Invalid search query',
      `Please enter at least ${CONFIG.VALIDATION.MIN_SEARCH_LENGTH} characters to search`,
      CONFIG.ELEMENTS.LATEST_BLOCK
    );
    return;
  }

  try {
    state.setLoading(true);
    displayLoading(CONFIG.ELEMENTS.LATEST_BLOCK);

    const searchResult = await search(trimmedQuery);
    if (!searchResult?.type || !searchResult?.result) {
      throw new Error('No results found');
    }

    const { type, result } = searchResult;
    const redirectUrl = new URL(CONFIG.ROUTES.DETAILS, window.location.origin);
    redirectUrl.searchParams.set('type', type);
    redirectUrl.searchParams.set('hash', result.hash);

    window.location.href = redirectUrl.toString();
  } catch (error) {
    console.error('Search error:', error);
    displayError('Search failed', error.message, CONFIG.ELEMENTS.LATEST_BLOCK);
  } finally {
    state.setLoading(false);
  }
};

/**
 * Sets up event listeners for the application
 */
const setupEventListeners = () => {
  const fetchBlockBtn = getElement(CONFIG.ELEMENTS.FETCH_BLOCK);
  fetchBlockBtn?.addEventListener('click', window.fetchLatestBlock);

  const autoRefreshBtn = getElement(CONFIG.ELEMENTS.AUTO_REFRESH);
  autoRefreshBtn?.addEventListener('click', () => autoRefresh.toggle());

  const searchInput = document.querySelector(CONFIG.ELEMENTS.SEARCH_INPUT);
  const searchButton = document.querySelector(CONFIG.ELEMENTS.SEARCH_BUTTON);

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
 * Initializes the application
 */
const initializeApp = async () => {
  try {
    state.setLoading(true);
    hideBlockContent();

    await Promise.all([window.fetchLatestBlock(), window.loadBlockList()]);

    autoRefresh.start();
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing application:', error);
    displayError(
      'Failed to initialize the application',
      error.message,
      CONFIG.ELEMENTS.MAIN_CONTENT
    );
  } finally {
    state.setLoading(false);
  }
};

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Export for testing and external use
export {
  initializeApp,
  setupEventListeners,
  CONFIG,
  autoRefresh as refreshController,
};
