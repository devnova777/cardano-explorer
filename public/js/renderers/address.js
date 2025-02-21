/**
 * Address Details Renderer
 *
 * Manages the display of Cardano address information:
 * - Address overview and balance
 * - Stake delegation details
 * - UTXO management
 * - Transaction history
 * - Asset holdings
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

export const renderAddressDetails = async (address) => {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML =
    '<div class="loading">Loading address details...</div>';

  try {
    const details = await getAddressDetails(address);
    mainContent.innerHTML = `
      <div class="address-details">
        <h2>Address Details</h2>
        ${renderOverviewSection(address, details)}
        ${renderUtxoSection(details.utxos)}
        ${renderTransactionSection(details.transactions)}
      </div>
    `;
  } catch (error) {
    mainContent.innerHTML = `
      <div class="error">
        <h2>Error</h2>
        <p>${error.message}</p>
      </div>
    `;
  }
};
