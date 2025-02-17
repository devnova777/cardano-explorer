/**
 * Cardano Block Explorer API Client
 *
 * Provides a centralized interface for all API communications with the backend server.
 * Implements consistent error handling and response normalization.
 *
 * Features:
 * - Unified error handling and mapping
 * - Response normalization
 * - Automatic query parameter handling
 * - Type-safe endpoint definitions
 *
 * @module api
 */

const API_CONFIG = {
  BASE_URL: '/api',
  DEFAULT_PAGE_SIZE: 10,
  ENDPOINTS: {
    LATEST_BLOCK: '/blocks/latest',
    BLOCK_DETAILS: (hash) => `/blocks/${hash}`,
    BLOCK_TRANSACTIONS: (hash) => `/blocks/${hash}/transactions`,
    BLOCKS_LIST: '/blocks',
    TRANSACTION_DETAILS: (hash) => `/blocks/tx/${hash}`,
    SEARCH: '/blocks/search',
    ADDRESS_DETAILS: (address) => `/blocks/address/${address}`,
  },
};

const ERROR_MESSAGES = {
  'No block or transaction found':
    'No results found for this hash. Please verify the hash and try again.',
  'Invalid search format':
    'Please enter a valid block hash, transaction hash, address, epoch number, or pool ID.',
  'Search query too short': 'Please enter at least 3 characters to search.',
  'Resource not found': 'No results found. Please try a different search term.',
  'Invalid response format': 'Something went wrong. Please try again later.',
  'Network error':
    'Unable to connect to the server. Please check your internet connection.',
  'Server error': 'The server encountered an error. Please try again later.',
  default: 'An unexpected error occurred. Please try again.',
};

const createQueryString = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );
  return query.toString() ? `?${query}` : '';
};

const normalizeResponse = (data) => {
  if (data.success === false) {
    throw new Error(data.error || 'API request failed');
  }
  return data.success ? data.data : data;
};

const getFriendlyErrorMessage = (error) => {
  const matchedMessage = Object.entries(ERROR_MESSAGES).find(([key]) =>
    error.message.includes(key)
  )?.[1];
  return matchedMessage || ERROR_MESSAGES.default;
};

const handleApiError = (error, endpoint) => {
  console.error('API request failed:', {
    endpoint,
    status: error.status || 500,
    message: error.message,
    error,
  });

  const enhancedError = new Error(getFriendlyErrorMessage(error));
  enhancedError.status = error.status || 500;
  enhancedError.originalError = error;
  throw enhancedError;
};

async function apiRequest(endpoint, options = {}) {
  try {
    console.log('Making API request:', { endpoint, options });
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
    const data = await response.json();
    console.log('API response:', { endpoint, status: response.status, data });

    if (!response.ok || !data.success) {
      throw new Error(
        data.error?.message ||
          data.message ||
          ERROR_MESSAGES[data.error?.code] ||
          ERROR_MESSAGES.default
      );
    }

    return data.data;
  } catch (error) {
    console.error('API request failed:', { endpoint, error });
    throw new Error(error.message || ERROR_MESSAGES.default);
  }
}

export async function getLatestBlock() {
  return apiRequest(API_CONFIG.ENDPOINTS.LATEST_BLOCK);
}

export async function getBlockDetails(hashOrHeight) {
  console.log('Getting block details for:', hashOrHeight);
  return apiRequest(API_CONFIG.ENDPOINTS.BLOCK_DETAILS(hashOrHeight));
}

export async function getBlockTransactions(blockHash) {
  console.log('Getting block transactions:', blockHash);
  const data = await apiRequest(
    API_CONFIG.ENDPOINTS.BLOCK_TRANSACTIONS(blockHash)
  );
  console.log('Block transactions response:', data);
  return data.transactions || [];
}

export async function getBlocks(
  page = 1,
  limit = API_CONFIG.DEFAULT_PAGE_SIZE
) {
  const query = createQueryString({ page, limit });
  return apiRequest(`${API_CONFIG.ENDPOINTS.BLOCKS_LIST}${query}`);
}

export async function getTransactionDetails(txHash) {
  console.log('Getting transaction details for:', txHash);
  const data = await apiRequest(
    API_CONFIG.ENDPOINTS.TRANSACTION_DETAILS(txHash)
  );
  console.log('Transaction details response:', JSON.stringify(data, null, 2));
  return data;
}

export async function search(query) {
  try {
    const endpoint = `${API_CONFIG.ENDPOINTS.SEARCH}${createQueryString({
      q: query,
    })}`;
    return await apiRequest(endpoint);
  } catch (error) {
    handleApiError(error, 'search');
  }
}

export async function getAddressDetails(address) {
  return apiRequest(API_CONFIG.ENDPOINTS.ADDRESS_DETAILS(address));
}
