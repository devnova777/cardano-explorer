// Constants for common values and elements
const LOVELACE_TO_ADA = 1000000;
const LATEST_BLOCK_TARGET = 'latest-block-info';
const CONTENT_TARGET = 'block-content';

// Helper functions
const formatAda = (lovelace) => {
  const value = parseInt(lovelace) || 0;
  return (value / LOVELACE_TO_ADA).toFixed(6);
};
const getElement = (id) => document.getElementById(id);
const formatDate = (timestamp) => new Date(timestamp * 1000).toLocaleString();

// Template generators
const createCardTemplate = (content) => `
  <div class="card-content">
    ${content}
  </div>
`;

const createInfoRow = (label, value, className = 'value') => `
  <p><strong>${label}:</strong> <span class="${className}">${value}</span></p>
`;

// Display the latest block in the left panel
export function displayLatestBlock(response) {
  const block = response.data;
  const content = [
    createInfoRow('Block Height', block.height.toLocaleString()),
    createInfoRow('Block Hash', block.hash, 'hash'),
    createInfoRow('Time', formatDate(block.time)),
    createInfoRow('Transactions', block.tx_count.toLocaleString()),
    createInfoRow('Size', `${block.size.toLocaleString()} bytes`),
    createInfoRow('Epoch', block.epoch),
    createInfoRow('Fees', `${formatAda(block.fees)} ₳`),
  ].join('');

  getElement(LATEST_BLOCK_TARGET).innerHTML = createCardTemplate(content);
}

// Display block content in the right panel
export function displayBlock(response) {
  const block = response.data;
  const content = [
    createInfoRow('Block Height', block.height.toLocaleString()),
    createInfoRow('Block Hash', block.hash, 'hash'),
    createInfoRow('Slot', block.slot.toLocaleString()),
    createInfoRow('Time', formatDate(block.time)),
    createInfoRow('Transactions', block.tx_count.toLocaleString()),
    createInfoRow('Size', `${block.size.toLocaleString()} bytes`),
    createInfoRow('Epoch', block.epoch),
    createInfoRow('Fees', `${formatAda(block.fees)} ₳`),
    block.tx_count > 0
      ? '<button id="view-transactions" class="mt-4">View Transactions</button>'
      : '',
  ].join('');

  getElement(CONTENT_TARGET).innerHTML = createCardTemplate(content);

  // Add event listener for view transactions button
  const viewTxButton = getElement('view-transactions');
  if (viewTxButton) {
    viewTxButton.addEventListener('click', () => {
      console.log('Loading transactions for block:', block.hash); // Debug log
      window.loadBlockTransactions(block.hash);
    });
  }
}

// Display transactions in the right panel
export function displayTransactions(response) {
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

// Utility display functions
export function displayError(message, target = CONTENT_TARGET) {
  getElement(target).innerHTML = `
    <div class="error">
      <strong>Error:</strong> ${message}
    </div>
  `;
}

export function displayLoading(target = CONTENT_TARGET) {
  getElement(target).innerHTML = createCardTemplate('<p>Loading...</p>');
}
