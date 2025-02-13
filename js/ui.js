// ui.js
export function displayBlock(response) {
  const block = response.data;

  document.getElementById('block-info').innerHTML = `
    <div class="card">
      <p><strong>Block Height:</strong> <span class="value">${block.height.toLocaleString()}</span></p>
      <p><strong>Block Hash:</strong> <span class="hash">${
        block.hash
      }</span></p>
      <p><strong>Slot:</strong> <span class="value">${block.slot.toLocaleString()}</span></p>
      <p><strong>Time:</strong> <span class="value">${new Date(
        block.time * 1000
      ).toLocaleString()}</span></p>
      <p><strong>Transactions:</strong> <span class="value">${block.tx_count.toLocaleString()}</span></p>
      <p><strong>Size:</strong> <span class="value">${block.size.toLocaleString()} bytes</span></p>
      <p><strong>Epoch:</strong> <span class="value">${block.epoch}</span></p>
      <p><strong>Fees:</strong> <span class="value">${(
        parseInt(block.fees) / 1000000
      ).toFixed(6)} ₳</span></p>
      ${
        block.tx_count > 0
          ? '<button id="view-transactions" class="mt-4">View Transactions</button>'
          : ''
      }
    </div>
  `;

  // Add event listener for view transactions button
  const viewTxButton = document.getElementById('view-transactions');
  if (viewTxButton) {
    viewTxButton.addEventListener('click', () => {
      window.loadBlockTransactions(block.hash);
    });
  }
}
// Update the displayTransactions function in ui.js

export function displayTransactions(response) {
  const { transactions, pagination } = response.data;

  document.getElementById('block-info').innerHTML = `
    <div class="card">
      <div class="header-section">
        <h3>Block Transactions</h3>
        <button id="back-to-block" class="secondary">Back to Block</button>
      </div>
      <div class="transaction-list">
        ${transactions
          .map(
            (tx) => `
          <div class="transaction-item">
            <p class="hash">Hash: ${tx.hash}</p>
            <div class="tx-details">
              <span>Time: ${new Date(
                tx.block_time * 1000
              ).toLocaleString()}</span>
              <span>Inputs: ${tx.inputs}</span>
              <span>Outputs: ${tx.outputs}</span>
              <span>Input Amount: ${(tx.input_amount / 1000000).toFixed(
                6
              )} ₳</span>
              <span>Output Amount: ${(tx.output_amount / 1000000).toFixed(
                6
              )} ₳</span>
              <span>Fees: ${(parseInt(tx.fees) / 1000000).toFixed(6)} ₳</span>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
      ${renderPagination(pagination)}
    </div>
  `;

  // Add event listeners
  document.getElementById('back-to-block').addEventListener('click', () => {
    window.fetchLatestBlock();
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

export function displayError(message) {
  document.getElementById('block-info').innerHTML = `
    <div class="error">
      <strong>Error:</strong> ${message}
    </div>
  `;
}

export function displayLoading() {
  document.getElementById('block-info').innerHTML = `
    <div class="card">
      <p>Loading...</p>
    </div>
  `;
}
