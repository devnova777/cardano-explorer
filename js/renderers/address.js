import { getAddressDetails } from '../api.js';
import { formatAda, formatTimestamp } from '../utils.js';

/**
 * Renders address details in the main content area
 * @param {string} address - The address to display
 */
export async function renderAddressDetails(address) {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML =
    '<div class="loading">Loading address details...</div>';

  try {
    const details = await getAddressDetails(address);

    let html = `
      <div class="address-details">
        <h2>Address Details</h2>
        
        <div class="overview-grid">
          <div class="overview-item">
            <h3>Address</h3>
            <p class="address-text">${address}</p>
          </div>
          <div class="overview-item">
            <h3>Balance</h3>
            <p class="balance">${formatAda(details.balance)} ₳</p>
          </div>
          ${
            details.stake_address
              ? `
            <div class="overview-item">
              <h3>Stake Address</h3>
              <p class="stake-address">${details.stake_address}</p>
            </div>
          `
              : ''
          }
        </div>

        <section class="utxo-section">
          <h3>UTXOs</h3>
          <div class="utxo-grid">
            ${details.utxos
              .map(
                (utxo) => `
              <div class="utxo-card">
                <h4>UTXO</h4>
                <p>TX Hash: <a href="/tx/${utxo.tx_hash}">${
                  utxo.tx_hash
                }</a></p>
                <p>Output Index: ${utxo.output_index}</p>
                <p>Amount: ${formatAda(utxo.amount)} ₳</p>
                ${
                  utxo.assets?.length
                    ? `
                  <div class="assets">
                    <h5>Assets</h5>
                    <ul>
                      ${utxo.assets
                        .map(
                          (asset) => `
                        <li>${asset.quantity} ${asset.unit}</li>
                      `
                        )
                        .join('')}
                    </ul>
                  </div>
                `
                    : ''
                }
              </div>
            `
              )
              .join('')}
          </div>
        </section>

        <section class="transactions-section">
          <h3>Recent Transactions</h3>
          <div class="transaction-list">
            ${details.transactions
              .map(
                (tx) => `
              <div class="transaction-item">
                <div class="tx-header">
                  <h4><a href="/tx/${tx.hash}">${tx.hash}</a></h4>
                  <span class="tx-time">${formatTimestamp(tx.block_time)}</span>
                </div>
                <div class="tx-details">
                  <p>Block: <a href="/block/${tx.block_height}">#${
                  tx.block_height
                }</a></p>
                  <p>Amount: ${formatAda(tx.amount)} ₳</p>
                  <p>Fee: ${formatAda(tx.fee)} ₳</p>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </section>
      </div>
    `;

    mainContent.innerHTML = html;
  } catch (error) {
    mainContent.innerHTML = `
      <div class="error">
        <h2>Error</h2>
        <p>${error.message}</p>
      </div>
    `;
  }
}
