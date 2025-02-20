import { getTransactionDetails, search } from './api.js';
import { renderTransactionDetails } from './renderers/transactions.js';
import { renderError, renderLoading } from './renderers/shared.js';

// Constants
const UI = {
  ELEMENTS: {
    CONTENT: 'transaction-content',
    SEARCH_INPUT: '#search-input',
    SEARCH_BUTTON: '#search-btn',
  },
  MINIMUM_SEARCH_LENGTH: 3,
};

/**
 * Handle search functionality
 * @param {string} query - Search query
 */
const handleSearch = async (query) => {
  if (!query?.trim() || query.trim().length < UI.MINIMUM_SEARCH_LENGTH) {
    alert(
      `Please enter at least ${UI.MINIMUM_SEARCH_LENGTH} characters to search`
    );
    return;
  }

  const contentElement = document.getElementById(UI.ELEMENTS.CONTENT);

  try {
    contentElement.innerHTML = renderLoading('Searching...');

    // Clean up the query - remove any whitespace
    const cleanedQuery = query.trim();
    console.log('Initiating search with query:', cleanedQuery);

    // For transaction hashes (64 characters, hex)
    if (/^[0-9a-fA-F]{64}$/.test(cleanedQuery)) {
      window.location.href = `transaction.html?hash=${cleanedQuery}`;
      return;
    }

    // For addresses (starting with addr1)
    if (/^addr1[a-zA-Z0-9]+$/.test(cleanedQuery)) {
      window.location.href = `wallet.html?address=${cleanedQuery}`;
      return;
    }

    // For block heights (numeric only)
    if (/^\d+$/.test(cleanedQuery)) {
      window.location.href = `details.html?type=block&height=${cleanedQuery}`;
      return;
    }

    // For block hashes (64 characters, hex)
    if (/^[0-9a-fA-F]{64}$/.test(cleanedQuery)) {
      window.location.href = `details.html?type=block&hash=${cleanedQuery}`;
      return;
    }

    // If none of the above, use the search API
    const searchResult = await search(cleanedQuery);
    console.log('Search result:', searchResult);

    if (!searchResult || !searchResult.type || !searchResult.result) {
      throw new Error('No results found');
    }

    // Redirect based on result type
    switch (searchResult.type) {
      case 'transaction':
        window.location.href = `transaction.html?hash=${searchResult.result.hash}`;
        break;
      case 'block':
        window.location.href = `details.html?type=block&hash=${searchResult.result.hash}`;
        break;
      case 'address':
        window.location.href = `wallet.html?address=${searchResult.result.address}`;
        break;
      default:
        throw new Error('Unsupported search result type');
    }
  } catch (error) {
    console.error('Search error:', error);
    contentElement.innerHTML = renderError(
      error.message || 'Search failed. Please try again.'
    );
  }
};

/**
 * Handle back navigation
 */
const handleBackNavigation = () => {
  const params = new URLSearchParams(window.location.search);
  const blockHash = params.get('blockHash');

  if (blockHash) {
    window.location.href = `details.html?type=block&hash=${blockHash}`;
  } else {
    window.history.back();
  }
};

/**
 * Setup event listeners for the page
 */
const setupEventListeners = () => {
  // Setup back button
  const backBtn = document.querySelector('#back-to-block');
  if (backBtn) {
    backBtn.addEventListener('click', handleBackNavigation);
  }

  // Setup copy buttons
  setupCopyButtons();

  // Setup address links
  setupAddressLinks();

  // Setup search functionality
  const searchInput = document.querySelector(UI.ELEMENTS.SEARCH_INPUT);
  const searchButton = document.querySelector(UI.ELEMENTS.SEARCH_BUTTON);

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
 * Initialize the transaction details page
 */
async function initTransactionPage() {
  const params = new URLSearchParams(window.location.search);
  const hash = params.get('hash');
  const blockHash = params.get('blockHash'); // Get block hash if available
  const contentElement = document.getElementById(UI.ELEMENTS.CONTENT);

  if (!contentElement) {
    console.error('Content element not found');
    return;
  }

  if (!hash) {
    contentElement.innerHTML = renderError('No transaction hash provided');
    return;
  }

  try {
    contentElement.innerHTML = renderLoading('Loading transaction details...');

    // Validate transaction hash format
    if (!/^[0-9a-fA-F]{64}$/.test(hash)) {
      throw new Error('Invalid transaction hash format');
    }

    // Get and display transaction details
    console.log('Loading transaction:', hash);
    const transaction = await getTransactionDetails(hash);
    console.log('Transaction loaded:', transaction);

    // Use block_hash from API response, fallback to blockHash from URL if needed
    transaction.block = transaction.block_hash || blockHash;

    // Render the transaction
    contentElement.innerHTML = renderTransactionDetails(transaction);

    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Error loading transaction:', error);
    contentElement.innerHTML = renderError(
      error.message || 'Failed to load transaction details'
    );
  }
}

/**
 * Setup copy functionality for hash elements
 */
function setupCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.hash);
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
}

// Add function to setup address links
const setupAddressLinks = () => {
  document.querySelectorAll('.address-value').forEach((link) => {
    if (link.tagName === 'A') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        window.location.href = href;
      });
    }
  });
};

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initTransactionPage);

// Export for testing if needed
export { initTransactionPage, handleSearch };
