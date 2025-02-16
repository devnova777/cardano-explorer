/**
 * API Client for Cardano Block Explorer
 * Handles all API communications with the backend server
 */

const BASE_URL = '/api';

/**
 * Fetches the latest block from the Cardano blockchain
 * @returns {Promise<Object>} Latest block data
 */
export async function getLatestBlock() {
  try {
    const response = await fetch(`${BASE_URL}/blocks/latest`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(
        `HTTP error! status: ${response.status} - ${
          errorData?.message || response.statusText
        }`
      );
    }
    return response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

/**
 * Fetches details for a specific block
 * @param {string} hash - The block hash
 * @returns {Promise<Object>} Block details
 */
export async function getBlockDetails(hash) {
  const response = await fetch(`${BASE_URL}/blocks/${hash}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetches transactions for a specific block
 * @param {string} blockHash - The block hash
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=10] - Number of items per page
 * @returns {Promise<Object>} Block transactions
 */
export async function getBlockTransactions(blockHash, page = 1, limit = 10) {
  const response = await fetch(
    `${BASE_URL}/blocks/${blockHash}/transactions?page=${page}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetches a list of blocks with pagination
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=10] - Number of items per page
 * @returns {Promise<Object>} List of blocks
 */
export async function getBlocks(page = 1, limit = 10) {
  const response = await fetch(
    `${BASE_URL}/blocks?page=${page}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetches details for a specific transaction
 * @param {string} txHash - The transaction hash
 * @returns {Promise<Object>} Transaction details
 */
export async function getTransactionDetails(txHash) {
  const response = await fetch(`${BASE_URL}/tx/${txHash}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Generic error handler for API requests
 * @param {Response} response - Fetch API response object
 * @throws {Error} Throws an error with status and message
 */
async function handleApiError(response) {
  const error = await response.json().catch(() => ({
    message: 'An unknown error occurred',
  }));

  throw new Error(error.message || `HTTP error! status: ${response.status}`);
}

/**
 * Performs a search across blocks, transactions, and addresses
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results
 */
export async function search(query) {
  try {
    const response = await fetch(
      `${BASE_URL}/blocks/search?q=${encodeURIComponent(query)}`
    );

    const data = await response.json();

    if (!response.ok) {
      // Handle error response
      const error = new Error(data.error || 'Search failed');
      error.status = response.status;
      throw error;
    }

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from server');
    }

    return data.data;
  } catch (error) {
    console.error('Search failed:', {
      query,
      status: error.status || 500,
      message: error.message,
      error,
    });

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
  const response = await fetch(`${BASE_URL}/blocks/address/${address}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
