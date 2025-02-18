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
    BLOCK_BY_HEIGHT: (height) => `/blocks/height/${height}`,
    BLOCK_TRANSACTIONS: (hash) => `/blocks/${hash}/transactions`,
    BLOCKS_LIST: '/blocks',
    TRANSACTION_DETAILS: (hash) => `/blocks/tx/${hash}`,
    SEARCH: '/blocks/search',
    ADDRESS_DETAILS: (address) => `/blocks/address/${address}`,
    ADDRESS_UTXOS: (address) => `/addresses/${address}/utxos`,
    ADDRESS_TXS: (address) => `/addresses/${address}/txs`,
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

const getFriendlyErrorMessage = (error) => {
  const matchedMessage = Object.entries(ERROR_MESSAGES).find(([key]) =>
    error.message.includes(key)
  )?.[1];
  return matchedMessage || ERROR_MESSAGES.default;
};

async function apiRequest(endpoint, options = {}) {
  try {
    console.log('Making API request:', { endpoint, options });
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
    const data = await response.json();
    console.log('API response:', { endpoint, status: response.status, data });

    if (!response.ok) {
      const error = new Error(
        data.error?.message ||
          data.message ||
          ERROR_MESSAGES[data.error?.code] ||
          ERROR_MESSAGES.default
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    if (!data.success) {
      const error = new Error(data.error || 'API request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data.data;
  } catch (error) {
    console.error('API request failed:', { endpoint, error });
    if (error.status) {
      throw error;
    }
    const enhancedError = new Error(error.message || ERROR_MESSAGES.default);
    enhancedError.status = 500;
    enhancedError.originalError = error;
    throw enhancedError;
  }
}

export async function getLatestBlock() {
  return apiRequest(API_CONFIG.ENDPOINTS.LATEST_BLOCK);
}

export async function getBlockDetails(hashOrHeight) {
  console.log('Getting block details for:', hashOrHeight);

  const isHash =
    typeof hashOrHeight === 'string' && /^[0-9a-fA-F]{64}$/.test(hashOrHeight);
  const heightNum = parseInt(hashOrHeight);
  const isHeight =
    !isNaN(heightNum) && heightNum.toString() === hashOrHeight.toString();

  if (!isHash && !isHeight) {
    console.warn('Invalid block identifier:', {
      hashOrHeight,
      isHash,
      isHeight,
    });
    throw new Error(
      'Invalid block identifier: must be a 64-character hash or block height'
    );
  }

  try {
    if (isHeight) {
      // For height, first get the block hash
      console.log('Getting block hash for height:', heightNum);
      const endpoint = API_CONFIG.ENDPOINTS.BLOCK_BY_HEIGHT(heightNum);
      const blockHashes = await apiRequest(endpoint);

      // Validate block hashes response
      if (!Array.isArray(blockHashes) || blockHashes.length === 0) {
        throw new Error('Block not found at this height');
      }

      // Get full block details using the first hash
      console.log('Getting block details for hash:', blockHashes[0]);
      return await apiRequest(
        API_CONFIG.ENDPOINTS.BLOCK_DETAILS(blockHashes[0])
      );
    } else {
      // For hash, directly get block details
      return await apiRequest(API_CONFIG.ENDPOINTS.BLOCK_DETAILS(hashOrHeight));
    }
  } catch (error) {
    console.error('Block details error:', { hashOrHeight, error });
    if (error.status === 404) {
      throw new Error(
        isHash
          ? 'Block not found with this hash'
          : 'Block not found at this height'
      );
    }
    throw error;
  }
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
    // Clean up the query - remove commas if it's a number
    const cleanQuery = query
      .trim()
      .replace(/^(\d+,?)+$/, (match) => match.replace(/,/g, ''));
    console.log('Initiating search with query:', {
      original: query,
      cleaned: cleanQuery,
    });

    const endpoint = `${API_CONFIG.ENDPOINTS.SEARCH}${createQueryString({
      q: cleanQuery,
    })}`;
    console.log('Search endpoint:', endpoint);

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`);
    console.log('Search response status:', response.status);

    const data = await response.json();
    console.log('Search response data:', data);

    if (!response.ok) {
      const error = new Error(
        data.error?.message || data.error || 'Search request failed'
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Invalid search response format');
    }

    return data.data;
  } catch (error) {
    console.error('Search error details:', {
      message: error.message,
      status: error.status,
      data: error.data,
      originalError: error,
    });

    const enhancedError = new Error(getFriendlyErrorMessage(error));
    enhancedError.status = error.status || 500;
    enhancedError.originalError = error;
    throw enhancedError;
  }
}

/**
 * Get address details including balance and stake address
 * @param {string} address - The address to get details for
 * @returns {Promise<Object>} Address details
 */
export async function getAddressDetails(address) {
  try {
    // Fetch basic address info first
    const details = await apiRequest(
      API_CONFIG.ENDPOINTS.ADDRESS_DETAILS(address)
    );

    // Only fetch additional data if we have basic details
    if (details) {
      const [utxos, txs] = await Promise.all([
        apiRequest(API_CONFIG.ENDPOINTS.ADDRESS_UTXOS(address)),
        apiRequest(API_CONFIG.ENDPOINTS.ADDRESS_TXS(address)),
      ]);

      return {
        address,
        amount: details.amount,
        stake_address: details.stake_address,
        utxos: utxos || [],
        transactions: (txs || []).slice(0, 20), // Limit to last 20 transactions
      };
    }

    throw new Error('Address not found');
  } catch (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
}
