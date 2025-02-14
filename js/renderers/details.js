import { formatDate, formatAda } from '../ui.js';

export function renderBlockDetails(block) {
  return `
        <div class="detail-row">
            <span class="detail-label">Block Height</span>
            <span class="detail-value">${block.height.toLocaleString()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Block Hash</span>
            <span class="detail-value hash">${block.hash}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Slot</span>
            <span class="detail-value">${block.slot.toLocaleString()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Time</span>
            <span class="detail-value">${formatDate(block.time)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Transactions</span>
            <span class="detail-value">${block.tx_count}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Size</span>
            <span class="detail-value">${block.size.toLocaleString()} bytes</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Epoch</span>
            <span class="detail-value">${block.epoch}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Fees</span>
            <span class="detail-value">${formatAda(block.fees)} ₳</span>
        </div>
    `;
}

export function renderError(message) {
  return `
        <div class="error-message">
            ${message}
        </div>
    `;
}

export function renderLoading() {
  return `
        <div class="loading">
            Loading...
        </div>
    `;
}

export function updateDetailType(element, block) {
  element.textContent = `Block #${block.height.toLocaleString()}`;
}
