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
    const response = await fetch(`${BASE_URL}/block/latest`);
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
  const response = await fetch(`${BASE_URL}/block/${hash}`);
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
    `${BASE_URL}/block/${blockHash}/transactions?page=${page}&limit=${limit}`
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
