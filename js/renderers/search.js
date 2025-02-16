import { search } from '../api.js';
import { formatDate, formatAda } from '../utils.js';

/**
 * Gets the correct relative path for details page
 * @param {string} path - The path to adjust
 * @returns {string} The correct relative path
 */
function getDetailsPath(path) {
  // If we're already on the details page, remove the leading '../'
  return window.location.pathname.includes('/pages/')
    ? path.replace('../', '')
    : path;
}

/**
 * Sets up event listeners for the back button
 */
function setupBackButton() {
  const backBtn = document.querySelector('.back-to-explorer');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

/**
 * Renders search results in the main content area
 * @param {string} query - The search query
 */
export async function renderSearchResults(query) {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '<div class="loading">Searching...</div>';

  try {
    const response = await search(query);
    const basePath = window.location.pathname.includes('/pages/')
      ? '.'
      : 'pages';

    let html = `
      <div class="search-results">
        <h2>Search Results for "${query}"</h2>
    `;

    switch (response.type) {
      case 'block':
        const block = response.result;
        html += `
          <section class="result-section">
            <h3>Block Found</h3>
            <div class="results-grid">
              <div class="result-card">
                <h4>Block #${block.height}</h4>
                <p>Hash: <a href="${basePath}/details.html?hash=${
          block.hash
        }&type=block">${block.hash}</a></p>
                <p>Time: ${formatDate(block.time)}</p>
                <p>Transactions: ${block.tx_count}</p>
              </div>
            </div>
          </section>
        `;
        break;

      case 'transaction':
        const tx = response.result;
        html += `
          <section class="result-section">
            <h3>Transaction Found</h3>
            <div class="results-grid">
              <div class="result-card">
                <h4>Transaction</h4>
                <p>Hash: <a href="${basePath}/details.html?hash=${
          tx.hash
        }&type=transaction">${tx.hash}</a></p>
                <p>Block: <a href="${basePath}/details.html?hash=${
          tx.block
        }&type=block">#${tx.block_height}</a></p>
                <p>Amount: ${formatAda(tx.output_amount)} ₳</p>
              </div>
            </div>
          </section>
        `;
        break;

      case 'epoch':
        const epoch = response.result;
        html += `
          <section class="result-section">
            <h3>Epoch Found</h3>
            <div class="results-grid">
              <div class="result-card">
                <h4>Epoch #${epoch.epoch}</h4>
                <p>Start Time: ${formatDate(epoch.start_time)}</p>
                <p>End Time: ${formatDate(epoch.end_time)}</p>
                <p>Latest Block: <a href="${basePath}/details.html?hash=${
          epoch.latestBlock.hash
        }&type=block">${epoch.latestBlock.hash}</a></p>
                <p>Block Count: ${epoch.block_count}</p>
                <p>Tx Count: ${epoch.tx_count}</p>
              </div>
            </div>
          </section>
        `;
        break;

      case 'address':
        const addr = response.result;
        html += `
          <section class="result-section">
            <h3>Address Found</h3>
            <div class="results-grid">
              <div class="result-card">
                <h4>Address</h4>
                <p><a href="${basePath}/details.html?hash=${
          addr.address
        }&type=address">${addr.address}</a></p>
                <p>Balance: ${formatAda(addr.balance)} ₳</p>
                <p>Transactions: ${addr.transactions?.length || 0}</p>
                ${
                  addr.stake_address
                    ? `<p>Stake Address: ${addr.stake_address}</p>`
                    : ''
                }
              </div>
            </div>
          </section>
        `;
        break;

      case 'stake_address':
        const stake = response.result;
        html += `
          <section class="result-section">
            <h3>Stake Address Found</h3>
            <div class="results-grid">
              <div class="result-card">
                <h4>Stake Address</h4>
                <p>${stake.stake_address}</p>
                <p>Active Stake: ${formatAda(stake.active_stake)} ₳</p>
                <p>Controlled Amount: ${formatAda(
                  stake.controlled_amount
                )} ₳</p>
                <p>Rewards: ${formatAda(stake.withdrawable_amount)} ₳</p>
                ${stake.pool_id ? `<p>Delegated to: ${stake.pool_id}</p>` : ''}
              </div>
            </div>
          </section>
        `;
        break;

      case 'policy':
        const policy = response.result;
        html += `
          <section class="result-section">
            <h3>Asset Policy Found</h3>
            <div class="results-grid">
              <div class="result-card">
                <h4>Policy ID</h4>
                <p>${policy.policy_id}</p>
                <h5>Assets (First 10)</h5>
                <ul class="asset-list">
                  ${policy.assets
                    .map(
                      (asset) => `
                    <li>
                      <p>Asset: ${asset.asset}</p>
                      <p>Quantity: ${asset.quantity}</p>
                    </li>
                  `
                    )
                    .join('')}
                </ul>
              </div>
            </div>
          </section>
        `;
        break;

      case 'pool':
        const pool = response.result;
        html += `
          <section class="result-section">
            <h3>Stake Pool Found</h3>
            <div class="results-grid">
              <div class="result-card">
                <h4>${pool.metadata?.name || 'Stake Pool'}</h4>
                <p>Pool ID: ${pool.pool_id}</p>
                <p>Active Stake: ${formatAda(pool.active_stake)} ₳</p>
                <p>Live Stake: ${formatAda(pool.live_stake)} ₳</p>
                ${
                  pool.metadata?.description
                    ? `<p>Description: ${pool.metadata.description}</p>`
                    : ''
                }
                ${
                  pool.metadata?.homepage
                    ? `<p><a href="${pool.metadata.homepage}" target="_blank">Website</a></p>`
                    : ''
                }
              </div>
            </div>
          </section>
        `;
        break;

      default:
        html += '<p class="no-results">No results found</p>';
    }

    html += `
      <div class="search-footer">
        <button class="action-btn back-to-explorer">Back to Explorer</button>
      </div>
    </div>`;

    mainContent.innerHTML = html;
    setupBackButton();
  } catch (error) {
    let errorMessage = error.message;

    // Convert technical errors to user-friendly messages
    if (errorMessage.includes('not found')) {
      errorMessage =
        'No results found for your search. Please try a different query.';
    } else if (errorMessage.includes('Invalid')) {
      errorMessage =
        'Please enter a valid Cardano block hash, transaction hash, address, or epoch number.';
    } else if (errorMessage.includes('too short')) {
      errorMessage =
        'Please enter a longer search term (at least 3 characters).';
    }

    mainContent.innerHTML = `
      <div class="error">
        <h2>Search Results</h2>
        <p>${errorMessage}</p>
        <div class="search-tips">
          <h3>Search Tips:</h3>
          <ul>
            <li>For blocks or transactions: Enter a 64-character hash</li>
            <li>For addresses: Enter a Cardano address starting with 'addr1'</li>
            <li>For epochs: Enter an epoch number</li>
            <li>For stake addresses: Enter an address starting with 'stake1'</li>
            <li>For pools: Enter a pool ID starting with 'pool1'</li>
          </ul>
        </div>
        <button class="action-btn back-to-explorer">Back to Explorer</button>
      </div>
    `;
    setupBackButton();
  }
}
