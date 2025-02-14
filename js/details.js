import { getBlockDetails } from './api.js';
import {
  renderBlockDetails,
  renderError,
  renderLoading,
  updateDetailType,
} from './renderers/details.js';

// Function to get URL parameters
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    hash: params.get('hash'),
    type: params.get('type'),
  };
}

// Function to display block details
function displayBlockDetails(block) {
  const detailsContent = document.getElementById('details-content');
  const detailType = document.querySelector('.detail-type');

  // Update the detail type
  updateDetailType(detailType, block);

  // Render and display the content
  detailsContent.innerHTML = renderBlockDetails(block);
}

// Function to display error message
function displayError(message) {
  const detailsContent = document.getElementById('details-content');
  detailsContent.innerHTML = renderError(message);
}

// Function to display loading state
function displayLoading() {
  const detailsContent = document.getElementById('details-content');
  detailsContent.innerHTML = renderLoading();
}

// Initialize the details page
async function initDetailsPage() {
  const { hash, type } = getUrlParams();

  if (!hash) {
    displayError('No block hash provided');
    return;
  }

  try {
    displayLoading();
    const blockDetails = await getBlockDetails(hash);
    displayBlockDetails(blockDetails.data);
  } catch (error) {
    console.error('Error loading block details:', error);
    displayError('Failed to load block details');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDetailsPage);
