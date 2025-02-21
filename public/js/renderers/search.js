/**
 * Search Results Renderer
 *
 * Manages search functionality and result display:
 * - Multi-entity search processing
 * - Result formatting and display
 * - Error handling and user feedback
 * - Navigation controls
 * - Entity-specific rendering
 *
 * @module renderers/search
 */

import { formatDate, formatAda } from '../utils.js';

// Navigation and Path Utilities
const getBasePath = () =>
  window.location.pathname.includes('/pages/') ? '.' : 'pages';
const renderLink = (hash, type, text) =>
  `<a href="${getBasePath()}/details.html?hash=${hash}&type=${type}">${text}</a>`;

// Common UI Components
const renderResultCard = (title, content) => `
  <div class="results-grid">
    <div class="result-card">
      <h4>${title}</h4>
      ${content}
    </div>
  </div>
`;

const renderResultSection = (type, content) => `
  <section class="result-section">
    <h3>${type} Found</h3>
    ${content}
  </section>
`;

// Entity-Specific Renderers
const RESULT_RENDERERS = {
  block: (block) =>
    renderResultSection(
      'Block',
      renderResultCard(
        `Block #${block.height.toLocaleString()}`,
        `
      <p>Hash: ${renderLink(block.hash, 'block', block.hash)}</p>
      <p>Height: ${block.height.toLocaleString()}</p>
      <p>Time: ${formatDate(block.time)}</p>
      <p>Transactions: ${block.tx_count.toLocaleString()}</p>
      <p>Size: ${block.size.toLocaleString()} bytes</p>
      <p>Epoch: ${block.epoch}</p>
    `
      )
    ),

  transaction: (tx) =>
    renderResultSection(
      'Transaction',
      renderResultCard(
        'Transaction',
        `
      <p>Hash: ${renderLink(tx.hash, 'transaction', tx.hash)}</p>
      <p>Block: ${renderLink(tx.block, 'block', `#${tx.block_height}`)}</p>
      <p>Amount: ${formatAda(tx.output_amount)} ₳</p>
    `
      )
    ),

  epoch: (epoch) =>
    renderResultSection(
      'Epoch',
      renderResultCard(
        `Epoch #${epoch.epoch}`,
        `
      <p>Start Time: ${formatDate(epoch.start_time)}</p>
      <p>End Time: ${formatDate(epoch.end_time)}</p>
      <p>Latest Block: ${renderLink(
        epoch.latestBlock.hash,
        'block',
        epoch.latestBlock.hash
      )}</p>
      <p>Block Count: ${epoch.block_count}</p>
      <p>Tx Count: ${epoch.tx_count}</p>
    `
      )
    ),

  address: (addr) =>
    renderResultSection(
      'Address',
      renderResultCard(
        'Address',
        `
      <p>${renderLink(addr.address, 'address', addr.address)}</p>
      <p>Balance: ${formatAda(addr.balance)} ₳</p>
      <p>Transactions: ${addr.transactions?.length || 0}</p>
      ${addr.stake_address ? `<p>Stake Address: ${addr.stake_address}</p>` : ''}
    `
      )
    ),

  stake_address: (stake) =>
    renderResultSection(
      'Stake Address',
      renderResultCard(
        'Stake Address',
        `
      <p>${stake.stake_address}</p>
      <p>Active Stake: ${formatAda(stake.active_stake)} ₳</p>
      <p>Controlled Amount: ${formatAda(stake.controlled_amount)} ₳</p>
      <p>Rewards: ${formatAda(stake.withdrawable_amount)} ₳</p>
      ${stake.pool_id ? `<p>Delegated to: ${stake.pool_id}</p>` : ''}
    `
      )
    ),

  policy: (policy) =>
    renderResultSection(
      'Asset Policy',
      renderResultCard(
        'Policy ID',
        `
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
    `
      )
    ),

  pool: (pool) =>
    renderResultSection(
      'Stake Pool',
      renderResultCard(
        pool.metadata?.name || 'Stake Pool',
        `
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
    `
      )
    ),
};

// Error Handling
const renderError = (message) => `
  <div class="error">
    <h2>Search Results</h2>
    <p>${message}</p>
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

const ERROR_MESSAGES = {
  'not found':
    'No results found for your search. Please try a different query.',
  Invalid:
    'Please enter a valid Cardano block hash, transaction hash, address, or epoch number.',
  'too short': 'Please enter a longer search term (at least 3 characters).',
};

// API Interactions
export const search = async (query) => {
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search request failed');

    const data = await response.json();
    if (!data?.type || !data?.result) throw new Error('No results found');

    return { type: data.type, result: data.result };
  } catch (error) {
    console.error('Search API error:', error);
    throw error;
  }
};

export const getUserFriendlyError = (error) => {
  const message = error.message;
  return (
    Object.entries(ERROR_MESSAGES).find(([key]) =>
      message.includes(key)
    )?.[1] || message
  );
};

// Main Render Function
export const renderSearchResults = async (query) => {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '<div class="loading">Searching...</div>';

  try {
    const response = await search(query);
    const resultHtml =
      RESULT_RENDERERS[response.type]?.(response.result) ||
      '<p class="no-results">No results found</p>';

    mainContent.innerHTML = `
      <div class="search-results">
        <h2>Search Results for "${query}"</h2>
        ${resultHtml}
        <div class="search-footer">
          <button class="action-btn back-to-explorer">Back to Explorer</button>
        </div>
      </div>
    `;
  } catch (error) {
    mainContent.innerHTML = renderError(getUserFriendlyError(error));
  } finally {
    document
      .querySelector('.back-to-explorer')
      ?.addEventListener('click', () => window.location.reload());
  }
};
