import { getLatestBlock } from './api.js';
import { displayBlock, displayError, displayLoading } from './ui.js';

let autoRefreshInterval;
const REFRESH_INTERVAL = 20000; // 20 seconds

async function fetchLatestBlock() {
  try {
    displayLoading();
    const block = await getLatestBlock();
    displayBlock(block);
  } catch (error) {
    displayError('Failed to fetch block data');
    console.error('Error:', error);
  }
}

function startAutoRefresh() {
  if (!autoRefreshInterval) {
    autoRefreshInterval = setInterval(fetchLatestBlock, REFRESH_INTERVAL);
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
  await fetchLatestBlock();
  startAutoRefresh();
});

document
  .getElementById('fetch-block')
  .addEventListener('click', fetchLatestBlock);

document.getElementById('auto-refresh').addEventListener('click', () => {
  if (autoRefreshInterval) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
  }
});
