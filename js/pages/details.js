import { CONFIG } from '../config.js';
import { getBlock, getTransaction } from '../api.js';
import { renderBlockDetails } from '../renderers/blocks.js';
import { renderTransactionDetails } from '../renderers/transactions.js';
import { displayError, displayLoading } from '../utils.js';

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

    if (type === 'block') {
      const block = await getBlock(hash);
      await renderBlockDetails(block);
    } else if (type === 'transaction') {
      const transaction = await getTransaction(hash);
      await renderTransactionDetails(transaction);
    } else {
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
