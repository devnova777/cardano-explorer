/**
 * Cardano Block Explorer API Client
 *
 * Provides a comprehensive interface to interact with the Cardano blockchain API:
 * - Block information retrieval
 * - Transaction details and history
 * - Address information and UTXO data
 * - Search functionality across multiple entity types
 * - Error handling and data validation
 *
 * @module api
 */

// API Configuration
const API_CONFIG = {
  BASE_URL: '/api',
  DEFAULT_PAGE_SIZE: 10,
  ENDPOINTS: {
    BLOCKS: '/blocks',
    LATEST_BLOCK: '/blocks/latest',
    BLOCK_BY_HASH: (hash) => `/blocks/${hash}`,
    BLOCK_TRANSACTIONS: (hash) => `/blocks/${hash}/transactions`,
    TRANSACTION: (hash) => `/tx/${hash}`,
    SEARCH: '/blocks/search',
    ADDRESS: (address) => `/blocks/address/${address}`,
  },
  VALIDATION: {
    HASH_REGEX: /^[0-9a-fA-F]{64}$/,
    MIN_SEARCH_LENGTH: 3,
    MAX_TRANSACTIONS_DISPLAY: 20,
  },
};

// Error Message Mapping
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
  'Invalid block hash':
    'The provided block hash is invalid. Please check the format.',
  'Invalid transaction hash':
    'The provided transaction hash is invalid. Please check the format.',
  'Invalid address format':
    'The provided address format is invalid. Please check the address.',
  'Empty response': 'The server returned an empty response. Please try again.',
  default: 'An unexpected error occurred. Please try again.',
};

/**
 * Gets the base URL depending on environment
 * @returns {string} Base URL for API requests
 */
const getBaseUrl = () => {
  const isProduction = window.location.hostname !== 'localhost';
  return isProduction ? window.location.origin : '';
};

/**
 * Creates a URL query string from parameters
 * @param {Object} params - Query parameters
 * @returns {string} Formatted query string
 */
const createQueryString = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );
  return query.toString() ? `?${query}` : '';
};

/**
 * Gets a user-friendly error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
const getFriendlyErrorMessage = (error) => {
  const matchedMessage = Object.entries(ERROR_MESSAGES).find(([key]) =>
    error.message?.includes(key)
  )?.[1];
  return matchedMessage || ERROR_MESSAGES.default;
};

/**
 * Enhances error with additional context
 * @param {Error} error - Original error
 * @param {Object} context - Additional context
 * @throws {Error} Enhanced error object
 */
const handleApiError = (error, context = {}) => {
  console.error('API error:', { ...context, error });

  if (error.status && error.message) {
    throw error;
  }

  const enhancedError = new Error(getFriendlyErrorMessage(error));
  enhancedError.status = error.status || 500;
  enhancedError.originalError = error;
  enhancedError.context = context;
  throw enhancedError;
};

/**
 * Makes an API request with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response data
 * @throws {Error} Enhanced error with context
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${API_CONFIG.BASE_URL}${endpoint}`;

    console.log('Making API request:', { url, options });

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error('Invalid JSON response from server');
    }

    console.log('API response:', { url, status: response.status, data });

    if (!data) {
      throw new Error(ERROR_MESSAGES['Empty response']);
    }

    if (data.error) {
      const error = new Error(
        data.error.message ||
          data.message ||
          ERROR_MESSAGES[data.error.code] ||
          ERROR_MESSAGES.default
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    if (!data.success || !data.data) {
      throw new Error(ERROR_MESSAGES['Invalid response format']);
    }

    return data.data;
  } catch (error) {
    console.error('API request failed:', {
      endpoint,
      error: {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack,
      },
    });
    handleApiError(error, { endpoint, options });
  }
}

/**
 * Retrieves the latest block information
 * @returns {Promise<Object>} Latest block data
 */
export async function getLatestBlock() {
  return apiRequest(API_CONFIG.ENDPOINTS.LATEST_BLOCK);
}

/**
 * Retrieves block details by hash or height
 * @param {string|number} hashOrHeight - Block hash or height
 * @returns {Promise<Object>} Block details
 * @throws {Error} If identifier format is invalid
 */
export async function getBlockDetails(hashOrHeight) {
  console.log('Getting block details for:', hashOrHeight);

  const isHash =
    typeof hashOrHeight === 'string' &&
    API_CONFIG.VALIDATION.HASH_REGEX.test(hashOrHeight);
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
      const endpoint = API_CONFIG.ENDPOINTS.BLOCK_BY_HASH(heightNum);
      console.log('Fetching block by height:', { endpoint });
      const blockHashes = await apiRequest(endpoint);

      if (!Array.isArray(blockHashes) || blockHashes.length === 0) {
        throw new Error('Block not found at this height');
      }

      const blockEndpoint = API_CONFIG.ENDPOINTS.BLOCK_BY_HASH(blockHashes[0]);
      console.log('Fetching block by hash:', {
        endpoint: blockEndpoint,
        hash: blockHashes[0],
      });
      return await apiRequest(blockEndpoint);
    } else {
      const endpoint = API_CONFIG.ENDPOINTS.BLOCK_BY_HASH(hashOrHeight);
      console.log('Fetching block by hash:', { endpoint });
      return await apiRequest(endpoint);
    }
  } catch (error) {
    console.error('Block details error:', {
      hashOrHeight,
      error: {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack,
      },
    });

    if (error.status === 404) {
      throw new Error(
        isHash
          ? 'Block not found with this hash'
          : 'Block not found at this height'
      );
    }

    if (error.message.includes('Invalid response format')) {
      throw new Error(
        'Unable to process block data from server. Please try again.'
      );
    }

    throw error;
  }
}

/**
 * Retrieves a list of blocks
 * @param {number} [page=1] - Page number
 * @param {number} [limit=API_CONFIG.DEFAULT_PAGE_SIZE] - Results per page
 * @returns {Promise<Object>} Paginated block list
 */
export async function getBlocks(
  page = 1,
  limit = API_CONFIG.DEFAULT_PAGE_SIZE
) {
  const query = createQueryString({ page, limit });
  return apiRequest(`${API_CONFIG.ENDPOINTS.BLOCKS}${query}`);
}

/**
 * Retrieves transactions for a specific block
 * @param {string} blockHash - Block hash
 * @returns {Promise<Array>} List of transactions
 * @throws {Error} If block hash is invalid
 */
export async function getBlockTransactions(blockHash) {
  if (!blockHash || !API_CONFIG.VALIDATION.HASH_REGEX.test(blockHash)) {
    throw new Error(ERROR_MESSAGES['Invalid block hash']);
  }

  try {
    const data = await apiRequest(
      API_CONFIG.ENDPOINTS.BLOCK_TRANSACTIONS(blockHash)
    );
    if (!data?.transactions) {
      console.warn('Unexpected response format:', data);
      return [];
    }
    return data.transactions;
  } catch (error) {
    console.error('Error fetching block transactions:', {
      blockHash,
      error: {
        message: error.message,
        status: error.status,
        originalError: error.originalError,
      },
    });
    throw new Error(
      error.status === 404
        ? 'Block not found'
        : `Error loading block transactions: ${error.message}`
    );
  }
}

/**
 * Retrieves transaction details
 * @param {string} txHash - Transaction hash
 * @returns {Promise<Object>} Transaction details
 * @throws {Error} If transaction hash is invalid
 */
export async function getTransactionDetails(txHash) {
  if (!txHash || !API_CONFIG.VALIDATION.HASH_REGEX.test(txHash)) {
    throw new Error(ERROR_MESSAGES['Invalid transaction hash']);
  }

  console.log('Getting transaction details for:', txHash);
  const data = await apiRequest(API_CONFIG.ENDPOINTS.TRANSACTION(txHash));
  console.log('Transaction details response:', JSON.stringify(data, null, 2));
  return data;
}

/**
 * Performs a search across multiple entity types
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results
 * @throws {Error} If search query is invalid
 */
export async function search(query) {
  if (!query || query.length < API_CONFIG.VALIDATION.MIN_SEARCH_LENGTH) {
    throw new Error(ERROR_MESSAGES['Search query too short']);
  }

  try {
    const cleanQuery = query
      .trim()
      .replace(/^(\d+,?)+$/, (match) => match.replace(/,/g, ''));
    const endpoint = `${API_CONFIG.ENDPOINTS.SEARCH}${createQueryString({
      q: cleanQuery,
    })}`;
    return await apiRequest(endpoint);
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
 * Retrieves address details including UTXOs and transactions
 * @param {string} address - Cardano address
 * @returns {Promise<Object>} Address details, UTXOs, and recent transactions
 * @throws {Error} If address format is invalid
 */
export async function getAddressDetails(address) {
  if (!address) {
    throw new Error(ERROR_MESSAGES['Invalid address format']);
  }

  try {
    const details = await apiRequest(API_CONFIG.ENDPOINTS.ADDRESS(address));

    if (!details) {
      throw new Error('Address not found');
    }

    const [utxos, txs] = await Promise.all([
      apiRequest(API_CONFIG.ENDPOINTS.ADDRESS(address)),
      apiRequest(API_CONFIG.ENDPOINTS.ADDRESS(address)),
    ]);

    return {
      address,
      amount: details.amount,
      stake_address: details.stake_address,
      utxos: utxos || [],
      transactions: (txs || []).slice(
        0,
        API_CONFIG.VALIDATION.MAX_TRANSACTIONS_DISPLAY
      ),
    };
  } catch (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
}
