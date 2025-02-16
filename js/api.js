/**
 * API Client for Cardano Block Explorer
 * Handles all API communications with the backend server
 */

const BASE_URL = '/api';

/**
 * Generic API request handler with error handling
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || 'API request failed');
      error.status = response.status;
      throw error;
    }

    // Handle both wrapped and unwrapped response formats
    if (data.success === false) {
      throw new Error(data.error || 'API request failed');
    }

    // Return the data directly if it's unwrapped, or data.data if it's wrapped
    return data.success ? data.data : data;
  } catch (error) {
    console.error('API request failed:', {
      endpoint,
      status: error.status || 500,
      message: error.message,
      error,
    });
    throw error;
  }
}

/**
 * Fetches the latest block from the Cardano blockchain
 * @returns {Promise<Object>} Latest block data
 */
export async function getLatestBlock() {
  return apiRequest('/blocks/latest');
}

/**
 * Fetches details for a specific block
 * @param {string} hash - The block hash
 * @returns {Promise<Object>} Block details
 */
export async function getBlockDetails(hash) {
  return apiRequest(`/blocks/${hash}`);
}

/**
 * Fetches transactions for a specific block
 * @param {string} blockHash - The block hash
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=10] - Number of items per page
 * @returns {Promise<Object>} Block transactions
 */
export async function getBlockTransactions(blockHash, page = 1, limit = 10) {
  return apiRequest(
    `/blocks/${blockHash}/transactions?page=${page}&limit=${limit}`
  );
}

/**
 * Fetches a list of blocks with pagination
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=10] - Number of items per page
 * @returns {Promise<Object>} List of blocks
 */
export async function getBlocks(page = 1, limit = 10) {
  return apiRequest(`/blocks?page=${page}&limit=${limit}`);
}

/**
 * Fetches details for a specific transaction
 * @param {string} txHash - The transaction hash
 * @returns {Promise<Object>} Transaction details
 */
export async function getTransactionDetails(txHash) {
  return apiRequest(`/blocks/tx/${txHash}`);
}

/**
 * Performs a search across blocks, transactions, and addresses
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results
 */
export async function search(query) {
  try {
    return await apiRequest(`/blocks/search?q=${encodeURIComponent(query)}`);
  } catch (error) {
    // Map error messages to user-friendly versions
    const errorMessages = {
      'No block or transaction found':
        'No results found for this hash. Please verify the hash and try again.',
      'Invalid search format':
        'Please enter a valid block hash, transaction hash, address, epoch number, or pool ID.',
      'Search query too short': 'Please enter at least 3 characters to search.',
      'Resource not found':
        'No results found. Please try a different search term.',
      'Invalid response format':
        'Something went wrong. Please try again later.',
    };

    // Find matching error message or use a default
    const friendlyMessage =
      Object.entries(errorMessages).find(([key]) =>
        error.message.includes(key)
      )?.[1] || 'Search failed. Please try again.';

    const enhancedError = new Error(friendlyMessage);
    enhancedError.status = error.status || 500;
    throw enhancedError;
  }
}

/**
 * Fetches details for a specific address
 * @param {string} address - The address to look up
 * @returns {Promise<Object>} Address details including balance and transactions
 */
export async function getAddressDetails(address) {
  return apiRequest(`/blocks/address/${address}`);
}
