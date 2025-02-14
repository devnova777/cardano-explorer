// Constants for common values and elements
const LOVELACE_TO_ADA = 1000000;
const LATEST_BLOCK_TARGET = 'latest-block-info';
const CONTENT_TARGET = 'block-content';

// Helper functions
function getElement(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Element with id '${id}' not found`);
  return element;
}

function createCardTemplate(content) {
  return `<div class="card-content">${content}</div>`;
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
}

function formatAda(lovelace) {
  const value = parseInt(lovelace) || 0;
  return (value / LOVELACE_TO_ADA).toFixed(6);
}

// Display functions
function displayLatestBlock(response) {
  const block = response.data;
  const content = `
    <div class="latest-block-info">
      <div class="info-row">
        <strong>Block Height</strong>
        <span class="value">${block.height.toLocaleString()}</span>
      </div>
      <div class="info-row">
        <strong>Block Hash</strong>
        <span class="hash">${block.hash}</span>
      </div>
      <div class="info-row">
        <strong>Time</strong>
        <span class="value">${formatDate(block.time)}</span>
      </div>
      <div class="info-row">
        <strong>Transactions</strong>
        <span class="value">${block.tx_count}</span>
      </div>
      <div class="info-row">
        <strong>Size</strong>
        <span class="value">${block.size.toLocaleString()} bytes</span>
      </div>
      <div class="info-row">
        <strong>Epoch</strong>
        <span class="value">${block.epoch}</span>
      </div>
      <div class="info-row">
        <strong>Fees</strong>
        <span class="value">${formatAda(block.fees)} ₳</span>
      </div>
    </div>
  `;

  getElement('latest-block-info').innerHTML = content;
}

function displayBlockList(response) {
  const blockList = getElement('block-list');

  if (!response.data || !response.data.blocks) {
    blockList.innerHTML = '<p>No blocks available.</p>';
    return;
  }

  const { blocks } = response.data;

  const blockListItems = blocks
    .map(
      (block) => `
    <div class="block-list-item">
      <div class="block-info">
        <div class="block-height">#${block.height.toLocaleString()}</div>
        <div class="block-hash">${block.hash}</div>
      </div>
      <button class="view-block-btn" data-block-hash="${block.hash}">
        <img src="images/Explore.svg" alt="View Block Details">
      </button>
    </div>
  `
    )
    .join('');

  blockList.innerHTML = blockListItems;

  // Add event listeners for block list items
  document.querySelectorAll('.view-block-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const blockHash = button.dataset.blockHash;
      window.loadBlockDetails(blockHash);
    });
  });
}

function displayBlock(response) {
  const block = response.data;
  const content = `
    <div class="block-details">
      <div class="header-section">
        <h2>Block Details</h2>
        <button id="back-to-list" class="secondary-btn">Back to List</button>
      </div>
      <div class="info-row">
        <strong>Block Height</strong>
        <span class="value">${block.height.toLocaleString()}</span>
      </div>
      <div class="info-row">
        <strong>Block Hash</strong>
        <span class="hash">${block.hash}</span>
      </div>
      <div class="info-row">
        <strong>Slot</strong>
        <span class="value">${block.slot.toLocaleString()}</span>
      </div>
      <div class="info-row">
        <strong>Time</strong>
        <span class="value">${formatDate(block.time)}</span>
      </div>
      <div class="info-row">
        <strong>Transactions</strong>
        <span class="value">${block.tx_count}</span>
      </div>
      <div class="info-row">
        <strong>Size</strong>
        <span class="value">${block.size.toLocaleString()} bytes</span>
      </div>
      <div class="info-row">
        <strong>Epoch</strong>
        <span class="value">${block.epoch}</span>
      </div>
      <div class="info-row">
        <strong>Fees</strong>
        <span class="value">${formatAda(block.fees)} ₳</span>
      </div>
      ${
        block.tx_count > 0
          ? `<button id="view-transactions" class="primary-btn">View Transactions</button>`
          : ''
      }
    </div>
  `;

  getElement('block-content').innerHTML = createCardTemplate(content);

  // Add event listeners
  const backButton = getElement('back-to-list');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.loadBlockList();
    });
  }

  const viewTxButton = getElement('view-transactions');
  if (viewTxButton) {
    viewTxButton.addEventListener('click', () => {
      window.loadBlockTransactions(block.hash);
    });
  }
}

function displayTransactions(response) {
  const { transactions } = response.data;

  if (!transactions || transactions.length === 0) {
    getElement(CONTENT_TARGET).innerHTML = createCardTemplate(
      '<p>No transactions found for this block.</p>'
    );
    return;
  }

  const transactionTemplate = (tx) => `
    <div class="transaction-item" data-tx-hash="${tx.hash}">
      <div class="tx-header">
        <span class="tx-hash">${tx.hash}</span>
        <span class="tx-time">${formatDate(tx.block_time)}</span>
      </div>
      <div class="tx-details">
        <div class="tx-row">
          <span class="tx-label">Inputs/Outputs:</span>
          <span class="tx-value">${tx.inputs || 0} / ${tx.outputs || 0}</span>
        </div>
        <div class="tx-row">
          <span class="tx-label">Amount:</span>
          <span class="tx-value">${formatAda(tx.output_amount || 0)} ₳</span>
        </div>
        <div class="tx-row">
          <span class="tx-label">Fees:</span>
          <span class="tx-value">${formatAda(tx.fees || 0)} ₳</span>
        </div>
      </div>
    </div>
  `;

  const content = `
    <div class="transactions-container">
      <div class="header-section">
        <h3>Block Transactions</h3>
        <button id="back-to-block" class="secondary">Back to Block</button>
      </div>
      <div class="transactions-list">
        ${transactions.map(transactionTemplate).join('')}
      </div>
    </div>
  `;

  getElement(CONTENT_TARGET).innerHTML = content;

  // Add event listener for back button
  const backButton = getElement('back-to-block');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.clearBlockSelection();
    });
  }

  // Add click listeners to transaction items
  document.querySelectorAll('.transaction-item').forEach((item) => {
    item.addEventListener('click', () => {
      const txHash = item.dataset.txHash;
      console.log('Transaction clicked:', txHash);
      // You can implement transaction details view here
    });
  });
}

function renderPagination({ page, limit, total }) {
  if (total <= limit) return '';

  const totalPages = Math.ceil(total / limit);
  return `
    <div class="pagination">
      ${
        page > 1
          ? `<button class="page-btn" data-page="${page - 1}">Previous</button>`
          : ''
      }
      <span>Page ${page} of ${totalPages}</span>
      ${
        page < totalPages
          ? `<button class="page-btn" data-page="${page + 1}">Next</button>`
          : ''
      }
    </div>
  `;
}

function displayError(message, targetId = 'block-content') {
  getElement(targetId).innerHTML = `
    <div class="error-message">
      Error: ${message}
    </div>
  `;
}

function displayLoading(targetId = 'block-content') {
  getElement(targetId).innerHTML = `
    <div class="loading">
      Loading...
    </div>
  `;
}

// Update loadBlockDetails in main.js to clear the right panel first
window.loadBlockDetails = async function loadBlockDetails(blockHash) {
  try {
    displayLoading('block-content');
    currentBlockHash = blockHash;
    const response = await getBlockDetails(blockHash);
    displayBlock(response);
  } catch (error) {
    displayError('Failed to load block details', 'block-content');
    console.error('Error:', error);
  }
};

// Clear the right panel content when returning to the main view
window.clearBlockSelection = function clearBlockSelection() {
  currentBlockHash = null;
  getElement('block-content').innerHTML = ''; // Clear the right panel
};

// Export all functions
export {
  displayLatestBlock,
  displayBlockList,
  displayBlock,
  displayTransactions,
  displayError,
  displayLoading,
  getElement,
  createCardTemplate,
  formatDate,
  formatAda,
};
