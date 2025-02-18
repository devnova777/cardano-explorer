import { getAddressDetails, search } from './api.js';
import { renderError, renderLoading } from './renderers/shared.js';
import { formatAda } from './utils.js';

const UI = {
  ELEMENTS: {
    CONTENT: 'wallet-content',
    SEARCH_INPUT: '#search-input',
    SEARCH_BUTTON: '#search-btn',
  },
  MINIMUM_SEARCH_LENGTH: 3,
};

/**
 * Render wallet details
 */
const renderWalletDetails = (data) => {
  return `
    <div class="wallet-overview">
      <div class="wallet-details-grid">
        <div class="balance-info">
          <h3>Balance</h3>
          <div class="balance-amount">${formatAda(data.amount)}</div>
        </div>
        <div class="address-info">
          <h3>Address Details</h3>
          <div class="info-row">
            <span class="label">Address</span>
            <div class="value-with-copy">
              ${data.address}
              <button class="copy-btn" data-hash="${
                data.address
              }" title="Copy address">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>
          ${
            data.stake_address
              ? `
            <div class="info-row">
              <span class="label">Stake Address</span>
              <div class="value-with-copy">
                ${data.stake_address}
                <button class="copy-btn" data-hash="${data.stake_address}" title="Copy stake address">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
          `
              : ''
          }
        </div>
      </div>
    </div>
  `;
};

/**
 * Handle search functionality
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
    const searchResult = await search(query.trim());

    if (!searchResult || !searchResult.type || !searchResult.result) {
      throw new Error('No results found');
    }

    // Redirect based on result type
    if (searchResult.type === 'address') {
      window.location.href = `wallet.html?address=${searchResult.result.address}`;
    } else if (searchResult.type === 'transaction') {
      window.location.href = `transaction.html?hash=${searchResult.result.hash}`;
    } else if (searchResult.type === 'block') {
      window.location.href = `details.html?type=block&hash=${searchResult.result.hash}`;
    }
  } catch (error) {
    console.error('Search error:', error);
    contentElement.innerHTML = renderError(
      error.message || 'Search failed. Please try again.'
    );
  }
};

/**
 * Initialize the wallet page
 */
const initWalletPage = async () => {
  const contentElement = document.getElementById(UI.ELEMENTS.CONTENT);
  const searchParams = new URLSearchParams(window.location.search);
  const address = searchParams.get('address');
  console.log('Initializing wallet page with params:', {
    searchParams: Object.fromEntries(searchParams),
    address,
  });

  if (!contentElement) {
    console.error('Content element not found');
    return;
  }

  if (!address) {
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    if (errorContainer && errorMessage) {
      errorMessage.textContent = 'Please provide a wallet address';
      errorContainer.style.display = 'block';
    }
    return;
  }

  try {
    // Show loading state
    contentElement.innerHTML = renderLoading('Loading wallet details...');

    const response = await fetch(`/api/blocks/address/${address}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch wallet data: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error('Invalid wallet data received');
    }

    const walletData = data.data;
    console.log('Wallet data:', walletData);

    // Calculate total balance from amount array if it's an array
    let totalBalance = '0';
    if (Array.isArray(walletData.amount)) {
      totalBalance = walletData.amount
        .filter((amt) => amt.unit === 'lovelace')
        .reduce((sum, amt) => sum + BigInt(amt.quantity), BigInt(0))
        .toString();
    } else if (typeof walletData.amount === 'string') {
      totalBalance = walletData.amount;
    }

    // Render the full wallet content
    contentElement.innerHTML = `
      <div id="error-container" style="display: none;">
        <div class="error-message" id="error-message"></div>
      </div>
      <div class="wallet-overview">
        <div class="wallet-details-grid">
          <div class="balance-info">
            <h3>Balance</h3>
            <div id="wallet-balance" class="balance-amount">${formatAda(
              totalBalance
            )} ₳</div>
          </div>
          <div class="address-info">
            <h3>Address Details</h3>
            <div class="info-row">
              <span class="label">Address</span>
              <div class="value-with-copy">
                ${walletData.address}
                <button class="copy-btn" data-hash="${
                  walletData.address
                }" title="Copy address">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
            ${
              walletData.stake_address
                ? `
              <div class="info-row">
                <span class="label">Stake Address</span>
                <div class="value-with-copy">
                  ${walletData.stake_address}
                  <button class="copy-btn" data-hash="${walletData.stake_address}" title="Copy stake address">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
              </div>
            `
                : ''
            }
            ${
              Array.isArray(walletData.amount) && walletData.amount.length > 1
                ? `
              <div class="tokens-section">
                <h3>Tokens</h3>
                <div class="token-list">
                  ${walletData.amount
                    .filter((amt) => amt.unit !== 'lovelace')
                    .map(
                      (token) => `
                      <div class="token-item">
                        <span class="token-unit">${token.unit}</span>
                        <span class="token-quantity">${token.quantity}</span>
                      </div>
                    `
                    )
                    .join('')}
                </div>
              </div>
            `
                : ''
            }
          </div>
        </div>
        <div class="transactions-section">
          <h3>Recent Transactions</h3>
          <ul id="transactions-list" class="transaction-list">
            ${
              Array.isArray(walletData.transactions) &&
              walletData.transactions.length > 0
                ? walletData.transactions
                    .map(
                      (tx) => `
                    <li class="transaction-item">
                      <a href="transaction.html?hash=${tx.tx_hash}">${
                        tx.tx_hash
                      }</a>
                      <span class="transaction-time">${new Date(
                        tx.block_time * 1000
                      ).toLocaleString()}</span>
                    </li>
                  `
                    )
                    .join('')
                : '<li>No transactions found</li>'
            }
          </ul>
        </div>
      </div>
    `;

    // Setup copy buttons after rendering
    setupCopyButtons();
  } catch (error) {
    console.error('Error loading wallet:', error);
    contentElement.innerHTML = `
      <div id="error-container" style="display: block;">
        <div class="error-message" id="error-message">${error.message}</div>
      </div>
      <div class="wallet-overview">
        <div class="wallet-details-grid">
          <div class="balance-info">
            <h3>Balance</h3>
            <div id="wallet-balance" class="balance-amount">0 ₳</div>
          </div>
          <div class="address-info">
            <h3>Address Details</h3>
            <div class="info-row">
              <span class="label">Address</span>
              <div id="wallet-address" class="value-with-copy">No address available</div>
            </div>
          </div>
        </div>
        <div class="transactions-section">
          <h3>Recent Transactions</h3>
          <ul id="transactions-list" class="transaction-list">
            <li>No transactions found</li>
          </ul>
        </div>
      </div>
    `;
  }
};

/**
 * Setup copy functionality for addresses
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

/**
 * Setup event listeners
 */
function setupEventListeners() {
  const searchInput = document.querySelector(UI.ELEMENTS.SEARCH_INPUT);
  const searchButton = document.querySelector(UI.ELEMENTS.SEARCH_BUTTON);

  if (searchInput && searchButton) {
    searchButton.addEventListener('click', () => {
      handleSearch(searchInput.value);
    });

    searchInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        handleSearch(searchInput.value);
      }
    });
  }
}

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initWalletPage();
  setupEventListeners();
});

export { initWalletPage, handleSearch };
