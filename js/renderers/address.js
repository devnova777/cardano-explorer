/**
 * Address Details Renderer
 *
 * Responsible for rendering detailed information about a Cardano address including:
 * - Basic address information and balance
 * - Stake address (if delegated)
 * - UTXOs with associated assets
 * - Recent transactions
 *
 * Dependencies:
 * - getAddressDetails: Fetches address data from the API
 * - formatAda: Formats ADA amounts
 * - formatTimestamp: Formats block timestamps
 *
 * @module renderers/address
 */

import { getAddressDetails } from '../api.js';
import { formatAda, formatTimestamp } from '../utils.js';

const renderOverviewSection = (address, details) => `
  <div class="overview-grid">
    <div class="overview-item">
      <h3>Address</h3>
      <p class="address-text">${address}</p>
    </div>
    <div class="overview-item">
      <h3>Balance</h3>
      <p class="balance">${formatAda(details.balance)} ₳</p>
    </div>
    ${details.stake_address ? renderStakeAddress(details.stake_address) : ''}
  </div>
`;

const renderStakeAddress = (stakeAddress) => `
  <div class="overview-item">
    <h3>Stake Address</h3>
    <p class="stake-address">${stakeAddress}</p>
  </div>
`;

const renderAssetsList = (assets) =>
  assets?.length
    ? `
  <div class="assets">
    <h5>Assets</h5>
    <ul>
      ${assets
        .map((asset) => `<li>${asset.quantity} ${asset.unit}</li>`)
        .join('')}
    </ul>
  </div>
`
    : '';

const renderUtxoSection = (utxos) => `
  <section class="utxo-section">
    <h3>UTXOs</h3>
    <div class="utxo-grid">
      ${utxos
        .map(
          (utxo) => `
        <div class="utxo-card">
          <h4>UTXO</h4>
          <p>TX Hash: <a href="/tx/${utxo.tx_hash}">${utxo.tx_hash}</a></p>
          <p>Output Index: ${utxo.output_index}</p>
          <p>Amount: ${formatAda(utxo.amount)} ₳</p>
          ${renderAssetsList(utxo.assets)}
        </div>
      `
        )
        .join('')}
    </div>
  </section>
`;

const renderTransactionSection = (transactions) => `
  <section class="transactions-section">
    <h3>Recent Transactions</h3>
    <div class="transaction-list">
      ${transactions
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
`;

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
    const html = `
      <div class="address-details">
        <h2>Address Details</h2>
        ${renderOverviewSection(address, details)}
        ${renderUtxoSection(details.utxos)}
        ${renderTransactionSection(details.transactions)}
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
