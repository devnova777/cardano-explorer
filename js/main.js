import {
  getLatestBlock,
  getBlocks,
  getBlockDetails,
  getBlockTransactions,
  search,
} from './api.js';
import {
  displayLatestBlock,
  displayBlockList,
  displayBlock,
  displayTransactions,
  displayError,
  displayLoading,
  showBlockContent,
  hideBlockContent,
} from './ui.js';
import { getElement } from './utils.js';
import { renderSearchResults } from './renderers/search.js';

// Constants
const REFRESH_INTERVAL = 20000; // 20 seconds
const ELEMENTS = {
  LATEST_BLOCK: 'latest-block-info',
  BLOCK_LIST: 'block-list',
  CONTENT: 'block-content',
  FETCH_BLOCK: 'fetch-block',
  AUTO_REFRESH: 'auto-refresh',
  SEARCH_INPUT: 'search-input',
  SEARCH_BUTTON: 'search-btn',
  MAIN_CONTENT: 'main-content',
};

// Application state
let autoRefreshInterval = null;
let currentBlockHash = null;

// Add this at the top of the file
document.addEventListener('DOMContentLoaded', () => {
  console.log('CSS loaded:', document.styleSheets);
  // This will help us verify if and how the stylesheets are loading
  Array.from(document.styleSheets).forEach((sheet, index) => {
    console.log(`Stylesheet ${index}:`, {
      href: sheet.href,
      rules: sheet.cssRules?.length || 'Not accessible (CORS)',
      disabled: sheet.disabled,
    });
  });
});

/**
 * Fetches and displays the latest block
 */
window.fetchLatestBlock = async function fetchLatestBlock() {
  try {
    displayLoading(ELEMENTS.LATEST_BLOCK);
    const block = await getLatestBlock();

    console.log('Latest block response:', block); // Debug log

    if (!block) {
      throw new Error('No block data received from API');
    }

    if (!block.hash || !block.height) {
      console.error('Invalid block data structure:', block); // Debug log
      throw new Error('Invalid block data structure received');
    }

    // Only update the latest block display
    displayLatestBlock(block);
  } catch (error) {
    console.error('Error fetching latest block:', {
      error,
      message: error.message,
      stack: error.stack,
    });
    displayError(
      'Failed to fetch block data: ' + error.message,
      ELEMENTS.LATEST_BLOCK
    );
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
    const txData = await getBlockTransactions(blockHash);

    console.log('Transaction data response:', txData); // Debug log

    if (!txData) {
      throw new Error('No transaction data received from API');
    }

    if (!txData.transactions || !Array.isArray(txData.transactions)) {
      console.error('Invalid transaction data structure:', txData); // Debug log
      throw new Error('Invalid transaction data structure received');
    }

    displayTransactions(txData);
  } catch (error) {
    console.error('Error loading transactions:', {
      error,
      blockHash,
      message: error.message,
      stack: error.stack,
    });
    displayError(
      'Failed to load transactions: ' + error.message,
      ELEMENTS.BLOCK_LIST
    );
  }
};

/**
 * Clears current block selection and refreshes latest block
 */
window.clearBlockSelection = function clearBlockSelection() {
  currentBlockHash = null;
  hideBlockContent();
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
    hideBlockContent();
    const blockData = await getBlocks(page);

    console.log('Block list response:', blockData); // Debug log

    if (!blockData) {
      throw new Error('No block list data received from API');
    }

    if (!blockData.blocks || !Array.isArray(blockData.blocks)) {
      console.error('Invalid block list data structure:', blockData); // Debug log
      throw new Error('Invalid block list data structure received');
    }

    displayBlockList(blockData);
  } catch (error) {
    console.error('Error loading block list:', {
      error,
      page,
      message: error.message,
      stack: error.stack,
    });
    displayError(
      'Failed to load block list: ' + error.message,
      ELEMENTS.BLOCK_LIST
    );
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
 * Handles search functionality
 * @param {string} query - The search query
 */
async function handleSearch(query) {
  if (!query || query.trim().length < 3) {
    alert('Please enter at least 3 characters to search');
    return;
  }

  try {
    // Hide the explorer grid and show the main content for search results
    const explorerGrid = document.querySelector('.explorer-grid');
    if (explorerGrid) {
      explorerGrid.style.display = 'none';
    }

    // Create main content div if it doesn't exist
    let mainContent = document.getElementById(ELEMENTS.MAIN_CONTENT);
    if (!mainContent) {
      mainContent = document.createElement('div');
      mainContent.id = ELEMENTS.MAIN_CONTENT;
      document.querySelector('.container').appendChild(mainContent);
    }

    await renderSearchResults(query.trim());
  } catch (error) {
    console.error('Search error:', error);
    displayError('Failed to perform search', ELEMENTS.MAIN_CONTENT);
  }
}

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

  // Add search event listeners
  const searchInput = document.querySelector('.search-bar input');
  const searchButton = document.querySelector('.search-btn');

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
}

/**
 * Initializes the application
 */
async function initializeApp() {
  try {
    // Hide block content initially
    hideBlockContent();

    // Initial load of latest block and block list
    await Promise.all([window.fetchLatestBlock(), window.loadBlockList()]);

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
