import { getLatestBlock, getBlockTransactions } from './api.js';
import {
  displayBlock,
  displayLatestBlock,
  displayTransactions,
  displayError,
  displayLoading,
} from './ui.js';

let autoRefreshInterval;
let currentBlockHash = null;
const REFRESH_INTERVAL = 20000; // 20 seconds

// Make these functions available to the window object for event handlers
window.fetchLatestBlock = async function fetchLatestBlock() {
  try {
    displayLoading('latest-block-info');
    const block = await getLatestBlock();

    // Always update the latest block display
    displayLatestBlock(block);

    // If we're not viewing a specific block, update the main content too
    if (!currentBlockHash) {
      displayBlock(block);
    }
  } catch (error) {
    displayError('Failed to fetch block data');
    console.error('Error:', error);
  }
};

window.loadBlockTransactions = async function loadBlockTransactions(blockHash) {
  try {
    console.log('Loading transactions for block:', blockHash); // Debug log
    displayLoading();
    currentBlockHash = blockHash;
    const response = await getBlockTransactions(blockHash);
    displayTransactions(response);
  } catch (error) {
    displayError('Failed to load transactions');
    console.error('Error:', error);
  }
};

// Add function to clear current block selection
window.clearBlockSelection = function clearBlockSelection() {
  currentBlockHash = null;
  window.fetchLatestBlock();
};

function startAutoRefresh() {
  if (!autoRefreshInterval) {
    autoRefreshInterval = setInterval(
      window.fetchLatestBlock,
      REFRESH_INTERVAL
    );
    const autoRefreshBtn = document.getElementById('auto-refresh');
    if (autoRefreshBtn) {
      autoRefreshBtn.textContent = 'Stop Auto-Refresh';
    }
  }
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    const autoRefreshBtn = document.getElementById('auto-refresh');
    if (autoRefreshBtn) {
      autoRefreshBtn.textContent = 'Start Auto-Refresh';
    }
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  // Initial load
  await window.fetchLatestBlock();
  startAutoRefresh();

  // Set up event listeners
  const fetchBlockBtn = document.getElementById('fetch-block');
  if (fetchBlockBtn) {
    fetchBlockBtn.addEventListener('click', window.fetchLatestBlock);
  }

  const autoRefreshBtn = document.getElementById('auto-refresh');
  if (autoRefreshBtn) {
    autoRefreshBtn.addEventListener('click', () => {
      if (autoRefreshInterval) {
        stopAutoRefresh();
      } else {
        startAutoRefresh();
      }
    });
  }
});
