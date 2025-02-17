import { getTransactionDetails } from './api.js';
import { renderTransactionDetails } from './renderers/transactions.js';
import { renderError, renderLoading } from './renderers/shared.js';

// Constants
const ELEMENTS = {
  CONTENT: 'transaction-content',
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

    // Get and display transaction details
    console.log('Loading transaction:', hash);
    const transaction = await getTransactionDetails(hash);
    console.log('Transaction loaded:', transaction);

    // Render the transaction
    contentElement.innerHTML = renderTransactionDetails(transaction);

    // Setup copy buttons
    setupCopyButtons();
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

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initTransactionPage);

// Export for testing if needed
export { initTransactionPage };
