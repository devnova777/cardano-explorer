/**
 * Details Page Handler
 *
 * Manages content display for detailed views:
 * - URL parameter processing
 * - Block detail rendering
 * - Transaction detail rendering
 * - Loading states
 * - Error handling
 *
 * @module pages/details
 */

import { CONFIG } from '../config.js';
import { getBlock, getTransaction } from '../api.js';
import { renderBlockDetails } from '../renderers/blocks.js';
import { renderTransactionDetails } from '../renderers/transactions.js';
import { displayError, displayLoading } from '../utils.js';

const CONTENT_TYPES = {
  BLOCK: 'block',
  TRANSACTION: 'transaction',
};

const loadContent = async () => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  const hash = params.get('hash');

  if (!type || !hash) {
    displayError('Invalid URL parameters', CONFIG.ELEMENTS.DETAILS_CONTAINER);
    return;
  }

  try {
    displayLoading(CONFIG.ELEMENTS.DETAILS_CONTAINER);

    switch (type) {
      case CONTENT_TYPES.BLOCK:
        await renderBlockDetails(await getBlock(hash));
        break;
      case CONTENT_TYPES.TRANSACTION:
        await renderTransactionDetails(await getTransaction(hash));
        break;
      default:
        throw new Error('Unsupported content type');
    }
  } catch (error) {
    console.error('Failed to load content:', error);
    displayError(
      error.message || 'Failed to load content',
      CONFIG.ELEMENTS.DETAILS_CONTAINER
    );
  }
};

document.addEventListener('DOMContentLoaded', loadContent);
