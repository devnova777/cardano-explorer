import {
  getLatestBlock,
  getBlocks,
  getBlockDetails,
  getBlockTransactions,
} from './api.js';
import {
  displayLatestBlock,
  displayBlockList,
  displayBlock,
  displayTransactions,
  displayError,
  displayLoading,
} from './ui.js';
import { getElement } from './utils.js';

// Constants
const REFRESH_INTERVAL = 20000; // 20 seconds
const ELEMENTS = {
  LATEST_BLOCK: 'latest-block-info',
  BLOCK_LIST: 'block-list',
  BLOCK_CONTENT: 'block-content',
  FETCH_BLOCK: 'fetch-block',
  AUTO_REFRESH: 'auto-refresh',
};

// Application state
let autoRefreshInterval = null;
let currentBlockHash = null;

/**
 * Fetches and displays the latest block
 */
window.fetchLatestBlock = async function fetchLatestBlock() {
  try {
    displayLoading(ELEMENTS.LATEST_BLOCK);
    const block = await getLatestBlock();

    if (!block || !block.data) {
      throw new Error('Invalid block data received');
    }

    // Always update the latest block display
    displayLatestBlock(block);

    // If we're not viewing a specific block, update the main content too
    if (!currentBlockHash) {
      displayBlock(block);
    }
  } catch (error) {
    console.error('Error fetching latest block:', error);
    displayError('Failed to fetch block data', ELEMENTS.LATEST_BLOCK);
  }
};

/**
 * Loads and displays transactions for a specific block
 * @param {string} blockHash - The block hash to load transactions for
 */
window.loadBlockTransactions = async function loadBlockTransactions(blockHash) {
  if (!blockHash) {
    console.error('Block hash is required');
    return;
  }

  try {
    displayLoading(ELEMENTS.BLOCK_LIST);
    currentBlockHash = blockHash;
    const response = await getBlockTransactions(blockHash);

    if (!response || !response.data) {
      throw new Error('Invalid transaction data received');
    }

    displayTransactions(response);
  } catch (error) {
    console.error('Error loading transactions:', error);
    displayError('Failed to load transactions', ELEMENTS.BLOCK_LIST);
  }
};

/**
 * Clears current block selection and refreshes latest block
 */
window.clearBlockSelection = function clearBlockSelection() {
  currentBlockHash = null;
  window.fetchLatestBlock();
};

/**
 * Starts auto-refresh of latest block
 */
function startAutoRefresh() {
  if (!autoRefreshInterval) {
    autoRefreshInterval = setInterval(
      window.fetchLatestBlock,
      REFRESH_INTERVAL
    );
    const autoRefreshBtn = getElement(ELEMENTS.AUTO_REFRESH);
    if (autoRefreshBtn) {
      autoRefreshBtn.textContent = 'Stop Auto-Refresh';
    }
  }
}

/**
 * Stops auto-refresh of latest block
 */
function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    const autoRefreshBtn = getElement(ELEMENTS.AUTO_REFRESH);
    if (autoRefreshBtn) {
      autoRefreshBtn.textContent = 'Start Auto-Refresh';
    }
  }
}

/**
 * Loads and displays block list
 * @param {number} page - Page number to load
 */
window.loadBlockList = async function loadBlockList(page = 1) {
  try {
    displayLoading(ELEMENTS.BLOCK_LIST);
    const response = await getBlocks(page);

    if (!response || !response.data) {
      throw new Error('Invalid block list data received');
    }

    displayBlockList(response);
  } catch (error) {
    console.error('Error loading block list:', error);
    displayError('Failed to load block list', ELEMENTS.BLOCK_LIST);
  }
};

/**
 * Navigates to block details page
 * @param {string} blockHash - Hash of the block to view
 */
window.loadBlockDetails = function loadBlockDetails(blockHash) {
  if (!blockHash) {
    console.error('Block hash is required');
    return;
  }
  window.location.href = `pages/details.html?hash=${blockHash}&type=block`;
};

/**
 * Sets up event listeners for the application
 */
function setupEventListeners() {
  const fetchBlockBtn = getElement(ELEMENTS.FETCH_BLOCK);
  if (fetchBlockBtn) {
    fetchBlockBtn.addEventListener('click', window.fetchLatestBlock);
  }

  const autoRefreshBtn = getElement(ELEMENTS.AUTO_REFRESH);
  if (autoRefreshBtn) {
    autoRefreshBtn.addEventListener('click', () => {
      if (autoRefreshInterval) {
        stopAutoRefresh();
      } else {
        startAutoRefresh();
      }
    });
  }
}

/**
 * Initializes the application
 */
async function initializeApp() {
  try {
    // Initial load of latest block and block list
    await Promise.all([window.fetchLatestBlock(), window.loadBlockList()]);

    // Clear the right panel initially
    const blockContent = getElement(ELEMENTS.BLOCK_CONTENT);
    if (blockContent) {
      blockContent.innerHTML = '';
    }

    startAutoRefresh();
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing application:', error);
    displayError('Failed to initialize the application');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Export functions for testing
export {
  startAutoRefresh,
  stopAutoRefresh,
  initializeApp,
  setupEventListeners,
  ELEMENTS,
  REFRESH_INTERVAL,
};
