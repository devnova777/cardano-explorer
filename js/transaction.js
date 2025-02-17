import { getTransactionDetails, getBlockDetails } from './api.js';
import { renderTransactionDetails } from './renderers/transactions.js';
import { renderError, renderLoading } from './renderers/shared.js';

// Constants
const ELEMENTS = {
  CONTENT: 'transaction-content',
  CONTEXTUAL_NAV: 'contextual-nav',
  DETAIL_TYPE: '.detail-type',
};

/**
 * Initialize the transaction details page
 */
async function initTransactionPage() {
  const params = new URLSearchParams(window.location.search);
  const hash = params.get('hash');
  const contentElement = document.getElementById(ELEMENTS.CONTENT);

  if (!hash) {
    contentElement.innerHTML = renderError('No transaction hash provided');
    return;
  }

  try {
    contentElement.innerHTML = renderLoading('Loading transaction details...');
    const transaction = await loadTransactionData(hash);

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
 * Load transaction data and associated block information
 * @param {string} hash - Transaction hash
 * @returns {Promise<Object>} Transaction data with block information
 */
async function loadTransactionData(hash) {
  console.log('Loading transaction:', hash);
  const transaction = await getTransactionDetails(hash);
  console.log('Transaction loaded:', transaction);

  // Ensure we have either block_hash or block_height
  if (!transaction.block_hash && !transaction.block_height) {
    console.error('Transaction missing block reference:', transaction);
    throw new Error('Invalid transaction data: missing block reference');
  }

  // Always set a block reference - either hash or height
  transaction.blockReference =
    transaction.block_hash || transaction.block_height.toString();

  // Try to get block hash if we only have height
  if (!transaction.block_hash && transaction.block_height) {
    try {
      console.log(
        'Fetching block details for height:',
        transaction.block_height
      );
      const blockData = await getBlockDetails(transaction.block_height);
      if (blockData && blockData.hash) {
        transaction.block_hash = blockData.hash;
        transaction.blockReference = blockData.hash;
      }
    } catch (error) {
      console.warn('Could not fetch block details:', error);
      // Continue with height as reference
    }
  }

  return transaction;
}

/**
 * Setup event listeners for the page
 */
function setupEventListeners() {
  // Setup block navigation
  const backButton = document.getElementById('back-to-block');
  if (backButton) {
    backButton.addEventListener('click', handleBlockNavigation);
  }

  // Setup block links
  document.querySelectorAll('.block-link').forEach((link) => {
    link.addEventListener('click', handleBlockNavigation);
  });

  // Setup copy buttons
  setupCopyButtons();
}

/**
 * Handle navigation back to block details
 * @param {Event} event - Click event
 */
async function handleBlockNavigation(event) {
  event.preventDefault();
  const element = event.currentTarget;
  const blockHash = element.dataset.blockHash;
  const blockHeight = element.dataset.blockHeight;

  // If we have a valid hash, use it
  if (blockHash && /^[0-9a-fA-F]{64}$/.test(blockHash)) {
    window.location.href = `details.html?type=block&hash=${blockHash}`;
    return;
  }

  // Otherwise, use the height
  if (blockHeight) {
    window.location.href = `details.html?type=block&hash=${blockHeight}`;
    return;
  }

  console.error('No valid block reference found for navigation');
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

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initTransactionPage);

// Export for testing if needed
export { initTransactionPage, handleBlockNavigation, setupEventListeners };
