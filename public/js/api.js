/**
 * Cardano Block Explorer API Client
 */

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

// Get the base URL depending on environment
const getBaseUrl = () => {
  const isProduction = window.location.hostname !== 'localhost';
  return isProduction ? window.location.origin : '';
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

    const data = await response.json();
    console.log('API response:', { url, status: response.status, data });

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
    handleApiError(error, { endpoint, options });
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
      const endpoint = API_CONFIG.ENDPOINTS.BLOCK_BY_HASH(heightNum);
      const blockHashes = await apiRequest(endpoint);

      if (!Array.isArray(blockHashes) || blockHashes.length === 0) {
        throw new Error('Block not found at this height');
      }

      return await apiRequest(
        API_CONFIG.ENDPOINTS.BLOCK_BY_HASH(blockHashes[0])
      );
    } else {
      return await apiRequest(API_CONFIG.ENDPOINTS.BLOCK_BY_HASH(hashOrHeight));
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

export async function getBlocks(
  page = 1,
  limit = API_CONFIG.DEFAULT_PAGE_SIZE
) {
  const query = createQueryString({ page, limit });
  return apiRequest(`${API_CONFIG.ENDPOINTS.BLOCKS}${query}`);
}

export async function getBlockTransactions(blockHash) {
  if (!blockHash || !/^[0-9a-fA-F]{64}$/.test(blockHash)) {
    throw new Error('Invalid block hash format');
  }

  try {
    const data = await apiRequest(
      API_CONFIG.ENDPOINTS.BLOCK_TRANSACTIONS(blockHash)
    );

    if (!data || !data.transactions) {
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
        : 'Error loading block transactions: ' + error.message
    );
  }
}

export async function getTransactionDetails(txHash) {
  console.log('Getting transaction details for:', txHash);
  const data = await apiRequest(API_CONFIG.ENDPOINTS.TRANSACTION(txHash));
  console.log('Transaction details response:', JSON.stringify(data, null, 2));
  return data;
}

export async function search(query) {
  try {
    const cleanQuery = query
      .trim()
      .replace(/^(\d+,?)+$/, (match) => match.replace(/,/g, ''));

    const endpoint = `${API_CONFIG.ENDPOINTS.SEARCH}${createQueryString({
      q: cleanQuery,
    })}`;

    const data = await apiRequest(endpoint);
    return data;
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

export async function getAddressDetails(address) {
  try {
    const details = await apiRequest(API_CONFIG.ENDPOINTS.ADDRESS(address));

    if (details) {
      const [utxos, txs] = await Promise.all([
        apiRequest(API_CONFIG.ENDPOINTS.ADDRESS(address)),
        apiRequest(API_CONFIG.ENDPOINTS.ADDRESS(address)),
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
