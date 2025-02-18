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

const CONFIG = {
  REFRESH_INTERVAL: 20000, // 20 seconds
  MIN_SEARCH_LENGTH: 3,
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
};

class ExplorerState {
  constructor() {
    this.autoRefreshInterval = null;
    this.currentBlockHash = null;
  }

  setCurrentBlock(hash) {
    this.currentBlockHash = hash;
  }

  clearCurrentBlock() {
    this.currentBlockHash = null;
  }
}

const state = new ExplorerState();

const validateBlockData = (block, context = 'block') => {
  if (!block) throw new Error(`No ${context} data received from API`);
  if (!block.hash || !block.height) {
    console.error(`Invalid ${context} data structure:`, block);
    throw new Error(`Invalid ${context} data structure received`);
  }
  return block;
};

const validateTransactionData = (txData) => {
  if (!txData) throw new Error('No transaction data received from API');
  if (!txData.transactions || !Array.isArray(txData.transactions)) {
    console.error('Invalid transaction data structure:', txData);
    throw new Error('Invalid transaction data structure received');
  }
  return txData;
};

const autoRefresh = {
  start() {
    if (!state.autoRefreshInterval) {
      state.autoRefreshInterval = setInterval(
        window.fetchLatestBlock,
        CONFIG.REFRESH_INTERVAL
      );
      const btn = getElement(CONFIG.ELEMENTS.AUTO_REFRESH);
      if (btn) btn.textContent = 'Stop Auto-Refresh';
    }
  },

  stop() {
    if (state.autoRefreshInterval) {
      clearInterval(state.autoRefreshInterval);
      state.autoRefreshInterval = null;
      const btn = getElement(CONFIG.ELEMENTS.AUTO_REFRESH);
      if (btn) btn.textContent = 'Start Auto-Refresh';
    }
  },

  toggle() {
    state.autoRefreshInterval ? this.stop() : this.start();
  },
};

window.fetchLatestBlock = async function fetchLatestBlock() {
  try {
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
  }
};

window.loadBlockTransactions = async function loadBlockTransactions(blockHash) {
  if (!blockHash) {
    console.error('Block hash is required');
    return;
  }

  try {
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
  }
};

window.clearBlockSelection = function clearBlockSelection() {
  state.clearCurrentBlock();
  hideBlockContent();
  window.fetchLatestBlock();
};

window.loadBlockList = async function loadBlockList(page = 1) {
  try {
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
  }
};

window.loadBlockDetails = function loadBlockDetails(blockHash) {
  if (!blockHash) {
    console.error('Block hash is required');
    return;
  }
  window.location.href = `pages/details.html?hash=${blockHash}&type=block`;
};

const handleSearch = async (query) => {
  if (!query?.trim() || query.trim().length < CONFIG.MIN_SEARCH_LENGTH) {
    alert(
      `Please enter at least ${CONFIG.MIN_SEARCH_LENGTH} characters to search`
    );
    return;
  }

  try {
    displayLoading(CONFIG.ELEMENTS.LATEST_BLOCK);
    const searchResult = await search(query.trim());

    if (!searchResult || !searchResult.type || !searchResult.result) {
      throw new Error('No results found');
    }

    // Redirect to details page with appropriate parameters
    if (searchResult.type === 'block') {
      window.location.href = `pages/details.html?type=block&hash=${searchResult.result.hash}`;
    } else if (searchResult.type === 'transaction') {
      window.location.href = `pages/details.html?type=transaction&hash=${searchResult.result.hash}`;
    } else {
      throw new Error('Unsupported search result type');
    }
  } catch (error) {
    console.error('Search error:', error);
    displayError(
      error.message || 'Search failed. Please try again.',
      CONFIG.ELEMENTS.LATEST_BLOCK
    );
  }
};

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
      if (event.key === 'Enter') handleSearch(searchInput.value);
    });
  }
};

const initializeApp = async () => {
  try {
    hideBlockContent();
    await Promise.all([window.fetchLatestBlock(), window.loadBlockList()]);
    autoRefresh.start();
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing application:', error);
    displayError('Failed to initialize the application');
  }
};

document.addEventListener('DOMContentLoaded', initializeApp);

export {
  initializeApp,
  setupEventListeners,
  CONFIG,
  autoRefresh as refreshController,
};
