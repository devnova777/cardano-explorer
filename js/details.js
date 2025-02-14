import { getBlockDetails } from './api.js';
import {
  renderBlockDetails,
  renderError,
  renderLoading,
  updateDetailType,
} from './renderers/details.js';
import { getElement } from './utils.js';

// Constants
const DETAILS_CONTENT_ID = 'details-content';
const DETAIL_TYPE_CLASS = '.detail-type';

/**
 * Extracts URL parameters for block details
 * @returns {{hash: string|null, type: string|null}} URL parameters
 */
function getUrlParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      hash: params.get('hash'),
      type: params.get('type'),
    };
  } catch (error) {
    console.error('Error parsing URL parameters:', error);
    return { hash: null, type: null };
  }
}

/**
 * Displays block details in the UI
 * @param {Object} block - Block data to display
 */
function displayBlockDetails(block) {
  try {
    if (!block) {
      throw new Error('Invalid block data');
    }

    const detailsContent = getElement(DETAILS_CONTENT_ID);
    const detailType = document.querySelector(DETAIL_TYPE_CLASS);

    if (!detailType) {
      console.warn('Detail type element not found');
    } else {
      updateDetailType(detailType, block);
    }

    detailsContent.innerHTML = renderBlockDetails(block);
  } catch (error) {
    console.error('Error displaying block details:', error);
    displayError('Failed to display block details');
  }
}

/**
 * Displays an error message
 * @param {string} message - Error message to display
 */
function displayError(message) {
  try {
    const detailsContent = getElement(DETAILS_CONTENT_ID);
    detailsContent.innerHTML = renderError(message);
  } catch (error) {
    console.error('Error displaying error message:', error);
  }
}

/**
 * Displays loading state
 */
function displayLoading() {
  try {
    const detailsContent = getElement(DETAILS_CONTENT_ID);
    detailsContent.innerHTML = renderLoading();
  } catch (error) {
    console.error('Error displaying loading state:', error);
  }
}

/**
 * Initializes the details page
 */
async function initDetailsPage() {
  try {
    const { hash, type } = getUrlParams();

    if (!hash) {
      displayError('No block hash provided');
      return;
    }

    displayLoading();
    const response = await getBlockDetails(hash);

    if (!response || !response.data) {
      throw new Error('Invalid response data');
    }

    displayBlockDetails(response.data);
  } catch (error) {
    console.error('Error initializing details page:', error);
    displayError(error.message || 'Failed to load block details');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDetailsPage);

// Export functions for testing or reuse
export {
  getUrlParams,
  displayBlockDetails,
  displayError,
  displayLoading,
  initDetailsPage,
};
