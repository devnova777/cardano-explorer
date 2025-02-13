import { getLatestBlock, getBlockTransactions } from './api.js';
import {
  displayBlock,
  displayTransactions,
  displayError,
  displayLoading,
} from './ui.js';

let autoRefreshInterval;
const REFRESH_INTERVAL = 20000; // 20 seconds

// Make these functions available to the window object for event handlers
window.fetchLatestBlock = async function fetchLatestBlock() {
  try {
    displayLoading();
    const block = await getLatestBlock();
    displayBlock(block);
  } catch (error) {
    displayError('Failed to fetch block data');
    console.error('Error:', error);
  }
};

window.loadBlockTransactions = async function loadBlockTransactions(
  blockHash,
  page = 1
) {
  try {
    displayLoading();
    const transactions = await getBlockTransactions(blockHash, page);
    displayTransactions(transactions);
  } catch (error) {
    displayError('Failed to load transactions');
    console.error('Error:', error);
  }
};

function startAutoRefresh() {
  if (!autoRefreshInterval) {
    autoRefreshInterval = setInterval(
      window.fetchLatestBlock,
      REFRESH_INTERVAL
    );
    document.getElementById('auto-refresh').textContent = 'Stop Auto-Refresh';
  }
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    document.getElementById('auto-refresh').textContent = 'Start Auto-Refresh';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await window.fetchLatestBlock();
  startAutoRefresh();
});

document
  .getElementById('fetch-block')
  .addEventListener('click', window.fetchLatestBlock);

document.getElementById('auto-refresh').addEventListener('click', () => {
  if (autoRefreshInterval) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
  }
});
