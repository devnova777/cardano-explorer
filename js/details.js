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

// Constants
const DETAILS_CONTENT_ID = 'details-content';
const DETAIL_TYPE_CLASS = '.detail-type';

/**
 * Sets up event listeners for block details view
 * @param {Object} block - Block data
 * @param {boolean} hasTransactions - Whether transactions are being displayed
 */
function setupBlockEventListeners(block, hasTransactions) {
  // Copy button listeners
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const hash = btn.dataset.hash;
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
    });
  });

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
}

/**
 * Sets up event listeners for transaction details view
 * @param {Object} transaction - Transaction data
 */
function setupTransactionEventListeners(transaction) {
  // Copy button listeners
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const hash = btn.dataset.hash;
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
    });
  });

  // Back button listener
  const backBtn = document.getElementById('back-to-transactions');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.loadBlockTransactions(transaction.block);
    });
  }
}

/**
 * Extracts URL parameters for block details
 * @returns {{hash: string|null, type: string|null}} URL parameters
 */
function getUrlParams() {
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
}

/**
 * Displays block details in the UI
 * @param {Object} block - Block data to display
 * @param {Array} [transactions] - Optional array of transaction data
 */
function displayBlockDetails(block, transactions = null) {
  try {
    if (!block) {
      throw new Error('Invalid block data');
    }

    const detailsContent = getElement(DETAILS_CONTENT_ID);
    const detailType = document.querySelector(DETAIL_TYPE_CLASS);

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
}

/**
 * Displays transaction details in the UI
 * @param {Object} transaction - Transaction data to display
 */
function displayTransactionDetails(transaction) {
  try {
    if (!transaction) {
      throw new Error('Invalid transaction data');
    }

    const detailsContent = getElement(DETAILS_CONTENT_ID);
    const detailType = document.querySelector(DETAIL_TYPE_CLASS);

    if (detailType) {
      detailType.textContent = `Transaction Details`;
    }

    detailsContent.innerHTML = renderTransactionDetails(transaction);
    setupTransactionEventListeners(transaction);
  } catch (error) {
    console.error('Error displaying transaction details:', error);
    displayError('Failed to display transaction details');
  }
}

/**
 * Displays error message in the UI
 * @param {string} message - Error message to display
 */
function displayError(message) {
  const detailsContent = getElement(DETAILS_CONTENT_ID);
  detailsContent.innerHTML = renderError(message);
}

/**
 * Displays loading state in the UI
 */
function displayLoading() {
  const detailsContent = getElement(DETAILS_CONTENT_ID);
  detailsContent.innerHTML = renderLoading();
}

/**
 * Loads block details
 * @param {string} blockHash - Hash of the block to load
 */
window.loadBlockDetails = async function loadBlockDetails(blockHash) {
  try {
    displayLoading();
    const response = await getBlockDetails(blockHash);

    if (!response?.data) {
      throw new Error('Invalid response data');
    }

    displayBlockDetails(response.data);
  } catch (error) {
    console.error('Error loading block details:', error);
    displayError(error.message || 'Failed to load block details');
  }
};

/**
 * Loads block transactions
 * @param {string} blockHash - Hash of the block
 */
window.loadBlockTransactions = async function loadBlockTransactions(blockHash) {
  try {
    displayLoading();
    const [blockResponse, txResponse] = await Promise.all([
      getBlockDetails(blockHash),
      getBlockTransactions(blockHash),
    ]);

    if (!blockResponse?.data || !txResponse?.data) {
      throw new Error('Invalid response data');
    }

    displayBlockDetails(blockResponse.data, txResponse.data.transactions);
  } catch (error) {
    console.error('Error loading block transactions:', error);
    displayError(error.message || 'Failed to load block transactions');
  }
};

/**
 * Loads transaction details
 * @param {string} txHash - Hash of the transaction
 */
window.loadTransactionDetails = async function loadTransactionDetails(txHash) {
  try {
    displayLoading();
    const response = await getTransactionDetails(txHash);

    if (!response?.data) {
      throw new Error('Invalid response data');
    }

    displayTransactionDetails(response.data);
  } catch (error) {
    console.error('Error loading transaction details:', error);
    displayError(error.message || 'Failed to load transaction details');
  }
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
    // Hide the details container and show the main content for search results
    const detailsContainer = document.querySelector('.details-container');
    if (detailsContainer) {
      detailsContainer.style.display = 'none';
    }

    // Create main content div if it doesn't exist
    let mainContent = document.getElementById('main-content');
    if (!mainContent) {
      mainContent = document.createElement('div');
      mainContent.id = 'main-content';
      document.querySelector('.container').appendChild(mainContent);
    }

    await renderSearchResults(query.trim());
  } catch (error) {
    console.error('Search error:', error);
    renderError('Failed to perform search');
  }
}

/**
 * Sets up event listeners for the page
 */
function setupEventListeners() {
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
 * Initializes the details page
 */
async function initDetailsPage() {
  try {
    setupEventListeners();

    const { hash, type } = getUrlParams();
    if (!hash || !type) {
      throw new Error('Missing required URL parameters');
    }

    const detailsContent = getElement(DETAILS_CONTENT_ID);
    if (!detailsContent) {
      throw new Error('Details content element not found');
    }

    renderLoading(detailsContent);

    switch (type) {
      case 'block':
        await loadBlockDetails(hash);
        break;
      case 'transaction':
        await loadTransactionDetails(hash);
        break;
      default:
        throw new Error(`Unsupported detail type: ${type}`);
    }
  } catch (error) {
    console.error('Error initializing details page:', error);
    renderError(error.message);
  }
}

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initDetailsPage);

// Export functions for testing
export { initDetailsPage, getUrlParams, setupEventListeners, handleSearch };
