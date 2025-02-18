/**
 * Blockfrost API Service
 *
 * Handles all Blockfrost API interactions:
 * - Block data retrieval
 * - Transaction processing
 * - Address information
 * - Search functionality
 * - UTXO management
 * - Stake and pool operations
 *
 * @module services/blockfrost
 */

import fetch from 'node-fetch';
import { APIError } from '../utils/APIError.js';

const BLOCKFROST_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

/**
 * Base headers for Blockfrost API calls
 */
const getHeaders = () => {
  const apiKey = process.env.BLOCKFROST_API_KEY;
  if (!apiKey) {
    throw new APIError('Blockfrost API key is not configured', 500);
  }
  return {
    project_id: apiKey,
    'Content-Type': 'application/json',
  };
};

/**
 * Fetches data from Blockfrost API with error handling
 */
async function fetchFromBlockfrost(endpoint, options = {}) {
  try {
    const apiKey = process.env.BLOCKFROST_API_KEY?.trim();
    if (!apiKey) {
      throw new APIError('Blockfrost API key is not configured', 500);
    }

    // Using the exact header format from Blockfrost example
    const response = await fetch(`${BLOCKFROST_URL}${endpoint}`, {
      ...options,
      method: 'GET',
      headers: {
        project_id: apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 403) {
        console.error('Blockfrost authentication failed:', {
          status: response.status,
          data,
        });
        throw new APIError('Invalid Blockfrost API key', 403);
      }
      throw new APIError(
        data.message || 'Blockfrost API error',
        response.status
      );
    }

    return data;
  } catch (error) {
    console.error('Blockfrost API error:', {
      endpoint,
      error: error.message,
    });
    throw error;
  }
}

const calculateAmount = (items) =>
  items
    .reduce((sum, item) => {
      const lovelace = item.amount.find((a) => a.unit === 'lovelace');
      return sum + (lovelace ? BigInt(lovelace.quantity) : BigInt(0));
    }, BigInt(0))
    .toString();

/**
 * Gets the latest block
 */
export const getLatestBlock = () => fetchFromBlockfrost('/blocks/latest');

/**
 * Gets previous blocks from a specific block hash
 */
export const getPreviousBlocks = (hash, count) =>
  fetchFromBlockfrost(`/blocks/${hash}/previous?count=${count}`);

/**
 * Gets block details by hash
 */
export async function getBlockByHash(hash) {
  if (!hash || hash.length !== 64) {
    throw new APIError('Invalid block hash', 400);
  }
  try {
    const block = await fetchFromBlockfrost(`/blocks/${hash}`);
    return block;
  } catch (error) {
    if (error.status === 404) {
      throw new APIError('Block not found', 404);
    }
    throw error;
  }
}

/**
 * Gets block transactions
 */
export async function getBlockTransactions(hash) {
  if (!hash || hash.length !== 64) {
    throw new APIError('Invalid block hash', 400);
  }

  console.log('Getting block transactions for hash:', hash);

  try {
    const [blockData, txHashes] = await Promise.all([
      fetchFromBlockfrost(`/blocks/${hash}`),
      fetchFromBlockfrost(`/blocks/${hash}/txs?order=desc`),
    ]);

    console.log('Block data and tx hashes:', {
      blockTime: blockData.time,
      txCount: txHashes?.length || 0,
    });

    if (!Array.isArray(txHashes) || txHashes.length === 0) {
      console.log('No transactions found for block');
      return { transactions: [] };
    }

    // Limit to first 50 transactions for performance
    const limitedTxHashes = txHashes.slice(0, 50);
    console.log(`Processing ${limitedTxHashes.length} transactions`);

    const transactions = await Promise.all(
      limitedTxHashes.map(async (txHash) => {
        try {
          console.log('Fetching transaction details for:', txHash);
          const [txData, utxoData] = await Promise.all([
            fetchFromBlockfrost(`/txs/${txHash}`),
            fetchFromBlockfrost(`/txs/${txHash}/utxos`),
          ]);

          const transaction = {
            hash: txHash,
            block: hash,
            block_time: blockData.time,
            inputs: utxoData.inputs?.length || 0,
            outputs: utxoData.outputs?.length || 0,
            input_amount: calculateAmount(utxoData.inputs || []),
            output_amount: calculateAmount(utxoData.outputs || []),
            fees: txData.fees || '0',
          };

          console.log('Processed transaction:', {
            hash: txHash,
            inputs: transaction.inputs,
            outputs: transaction.outputs,
          });

          return transaction;
        } catch (error) {
          console.error('Error processing transaction:', { txHash, error });
          // Skip failed transactions instead of failing the entire request
          return null;
        }
      })
    );

    // Filter out any failed transactions
    const validTransactions = transactions.filter((tx) => tx !== null);
    console.log(
      'Successfully processed transactions:',
      validTransactions.length
    );

    return { transactions: validTransactions };
  } catch (error) {
    console.error('Error getting block transactions:', error);
    throw error;
  }
}

/**
 * Gets a paginated list of blocks
 */
export async function getBlocks(page = 1, limit = 10) {
  const latestBlock = await getLatestBlock();
  const previousBlocks = await getPreviousBlocks(latestBlock.hash, limit);

  const blocks = [latestBlock, ...previousBlocks];
  const totalPages = Math.ceil(latestBlock.height / limit);

  return {
    blocks,
    pagination: {
      currentPage: page,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
      totalBlocks: latestBlock.height,
    },
  };
}

/**
 * Gets transaction details by hash
 */
export async function getTransactionDetails(hash) {
  if (!hash || hash.length !== 64) {
    throw new APIError('Invalid transaction hash', 400);
  }

  try {
    console.log('Fetching transaction details for:', hash);

    // First check if transaction exists
    const txData = await fetchFromBlockfrost(`/txs/${hash}`);
    console.log('Transaction data:', txData);

    // If we get here, transaction exists, now get UTXOs
    const utxoData = await fetchFromBlockfrost(`/txs/${hash}/utxos`);
    console.log('UTXO data:', utxoData);

    // Calculate total input/output amounts
    const input_amount = calculateAmount(utxoData.inputs);
    const output_amount = calculateAmount(utxoData.outputs);

    // Get block data for timestamp
    const blockData = await fetchFromBlockfrost(
      `/blocks/${txData.block_height}`
    );
    console.log('Block data:', blockData);

    const transaction = {
      hash: hash,
      block_hash: txData.block_hash,
      block_height: txData.block_height,
      block_time: blockData.time,
      slot: txData.slot,
      index: txData.index,
      output_amount,
      input_amount,
      fees: txData.fees,
      deposit: txData.deposit,
      size: txData.size,
      invalid_before: txData.invalid_before,
      invalid_hereafter: txData.invalid_hereafter,
      inputs: utxoData.inputs.length,
      outputs: utxoData.outputs.length,
      utxos: {
        inputs: utxoData.inputs.map((input) => ({
          tx_hash: input.tx_hash,
          output_index: input.output_index,
          amount:
            input.amount.find((a) => a.unit === 'lovelace')?.quantity || '0',
          address: input.address,
        })),
        outputs: utxoData.outputs.map((output) => ({
          address: output.address,
          amount:
            output.amount.find((a) => a.unit === 'lovelace')?.quantity || '0',
          assets: output.amount.filter((a) => a.unit !== 'lovelace'),
        })),
      },
    };

    console.log('Processed transaction:', transaction);
    return transaction;
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    if (
      error.status === 404 ||
      (error.status_code && error.status_code === 404)
    ) {
      throw new APIError('Transaction not found', 404);
    }
    throw error;
  }
}

/**
 * Gets address UTXOs
 */
export async function getAddressUTXOs(address) {
  if (!address) {
    throw new APIError('Invalid address', 400);
  }

  try {
    const utxos = await fetchFromBlockfrost(`/addresses/${address}/utxos`);

    if (!Array.isArray(utxos)) {
      throw new APIError('Invalid response from Blockfrost API', 500);
    }

    return utxos
      .map((utxo) => {
        if (!Array.isArray(utxo.amount)) {
          console.warn('Invalid UTXO format:', utxo);
          return null;
        }

        const lovelaceAmount = utxo.amount.find((a) => a.unit === 'lovelace');
        return {
          tx_hash: utxo.tx_hash,
          output_index: utxo.output_index,
          amount: lovelaceAmount ? lovelaceAmount.quantity : '0',
          assets: utxo.amount.filter((a) => a.unit !== 'lovelace'),
        };
      })
      .filter((utxo) => utxo !== null);
  } catch (error) {
    if (error.status === 400) {
      throw new APIError('Invalid address format', 400);
    }
    if (error.status === 404) {
      throw new APIError('Address not found', 404);
    }
    throw error;
  }
}

/**
 * Gets address transactions
 */
export async function getAddressTransactions(address) {
  if (!address) {
    throw new APIError('Invalid address', 400);
  }

  try {
    const transactions = await fetchFromBlockfrost(
      `/addresses/${address}/transactions?order=desc&limit=20`
    );

    if (!Array.isArray(transactions)) {
      throw new APIError('Invalid response from Blockfrost API', 500);
    }

    return transactions.map((tx) => ({
      tx_hash: tx.tx_hash,
      block_height: tx.block_height,
      block_time: tx.block_time,
      tx_index: tx.tx_index,
      block_hash: tx.block_hash,
    }));
  } catch (error) {
    if (error.status === 400) {
      throw new APIError('Invalid address format', 400);
    }
    if (error.status === 404) {
      throw new APIError('Address not found', 404);
    }
    throw error;
  }
}

/**
 * Gets address details
 */
export async function getAddressDetails(address) {
  if (!address) {
    throw new APIError('Invalid address', 400);
  }

  try {
    // Get basic address info
    const details = await fetchFromBlockfrost(`/addresses/${address}`);

    // According to Blockfrost docs, the response should be an object
    if (!details || typeof details !== 'object') {
      throw new APIError('Invalid response format from Blockfrost API', 500);
    }

    // Get UTXOs and transactions in parallel
    let utxos = [];
    let transactions = [];

    try {
      [utxos, transactions] = await Promise.all([
        fetchFromBlockfrost(`/addresses/${address}/utxos`),
        fetchFromBlockfrost(
          `/addresses/${address}/transactions?order=desc&limit=20`
        ),
      ]);
    } catch (error) {
      console.warn('Error fetching additional address data:', error);
      // Continue with basic address info if additional data fails
    }

    // Ensure utxos and transactions are arrays
    utxos = Array.isArray(utxos) ? utxos : [];
    transactions = Array.isArray(transactions) ? transactions : [];

    // Process UTXOs
    const processedUtxos = utxos
      .map((utxo) => {
        if (!utxo || !utxo.tx_hash || !utxo.output_index) {
          console.warn('Invalid UTXO format:', utxo);
          return null;
        }
        return {
          tx_hash: utxo.tx_hash,
          output_index: utxo.output_index,
          amount: utxo.amount || '0',
          assets: [], // We'll fetch asset details separately if needed
        };
      })
      .filter((utxo) => utxo !== null);

    // Process transactions
    const processedTxs = transactions
      .map((tx) => {
        if (!tx || !tx.tx_hash) {
          console.warn('Invalid transaction format:', tx);
          return null;
        }
        return {
          tx_hash: tx.tx_hash,
          block_height: tx.block_height,
          block_time: tx.block_time,
          tx_index: tx.tx_index,
          block_hash: tx.block_hash,
        };
      })
      .filter((tx) => tx !== null);

    // Return combined data
    return {
      address,
      amount: details.amount || '0',
      stake_address: details.stake_address || null,
      type: details.type || null,
      utxos: processedUtxos,
      transactions: processedTxs,
    };
  } catch (error) {
    console.error('Error getting address details:', {
      address,
      error: error.message,
      stack: error.stack,
    });

    if (error.status === 400) {
      throw new APIError('Invalid address format', 400);
    }
    if (error.status === 404) {
      throw new APIError('Address not found', 404);
    }
    if (error.status === 403) {
      throw new APIError('Invalid Blockfrost API key', 403);
    }
    if (error.status === 429) {
      throw new APIError('Too many requests to Blockfrost API', 429);
    }
    throw error;
  }
}

/**
 * Search across different entities
 */
export async function search(query) {
  if (!query || query.length < 3) {
    throw new APIError('Search query too short', 400);
  }

  // For block height (numeric only)
  if (/^\d+$/.test(query.replace(/,/g, ''))) {
    try {
      // Clean the query - remove any commas and convert to integer
      const height = parseInt(query.replace(/,/g, ''));
      console.log('Searching for block height:', height);

      // Get block directly by number
      const block = await fetchFromBlockfrost(`/blocks/${height}`);
      return {
        type: 'block',
        result: block,
      };
    } catch (error) {
      throw new APIError('Block not found', 404);
    }
  }

  // For block or transaction hashes (64 characters)
  if (/^[0-9a-fA-F]{64}$/.test(query)) {
    let blockError = null;
    let txError = null;

    // Try both block and transaction in parallel
    const [blockResult, txResult] = await Promise.allSettled([
      getBlockByHash(query).catch((error) => {
        blockError = error;
        return null;
      }),
      getTransactionDetails(query).catch((error) => {
        txError = error;
        return null;
      }),
    ]);

    // Check transaction result first
    if (txResult.status === 'fulfilled' && txResult.value) {
      return {
        type: 'transaction',
        result: txResult.value,
      };
    }

    // Then check block result
    if (blockResult.status === 'fulfilled' && blockResult.value) {
      return {
        type: 'block',
        result: blockResult.value,
      };
    }

    // If neither was found, throw appropriate error
    if (blockError?.status === 404 && txError?.status === 404) {
      throw new APIError('No block or transaction found with this hash', 404);
    }

    // If one of the errors wasn't a 404, throw it
    const nonNotFoundError = [blockError, txError].find(
      (err) => err && err.status !== 404
    );
    if (nonNotFoundError) {
      throw nonNotFoundError;
    }

    // Fallback error
    throw new APIError('No block or transaction found with this hash', 404);
  }

  // For Cardano addresses
  if (/^addr1[a-zA-Z0-9]+$/.test(query)) {
    try {
      const address = await getAddressDetails(query);
      return {
        type: 'address',
        result: {
          address: query,
          ...address,
        },
      };
    } catch (error) {
      if (error.status === 404) {
        throw new APIError('Address not found', 404);
      }
      throw error;
    }
  }

  // For stake addresses
  if (/^stake1[a-zA-Z0-9]+$/.test(query)) {
    try {
      const [details, rewards] = await Promise.all([
        fetchFromBlockfrost(`/accounts/${query}`),
        fetchFromBlockfrost(`/accounts/${query}/rewards`),
      ]);
      return {
        type: 'stake_address',
        result: {
          ...details,
          rewards: rewards.slice(0, 10),
        },
      };
    } catch (error) {
      if (error.status === 404) {
        throw new APIError('Stake address not found', 404);
      }
      throw error;
    }
  }

  // For pool IDs
  if (/^pool1[a-zA-Z0-9]+$/.test(query)) {
    try {
      const [pool, metadata] = await Promise.all([
        fetchFromBlockfrost(`/pools/${query}`),
        fetchFromBlockfrost(`/pools/${query}/metadata`),
      ]);
      return {
        type: 'pool',
        result: {
          ...pool,
          metadata,
        },
      };
    } catch (error) {
      if (error.status === 404) {
        throw new APIError('Stake pool not found', 404);
      }
      throw error;
    }
  }

  // If query format doesn't match any known pattern
  throw new APIError(
    'Invalid search format. Please enter a valid block hash, transaction hash, block height, address, epoch number, or pool ID.',
    400
  );
}

/**
 * Gets block details by height
 * @param {number} height - Block height to fetch
 * @returns {Promise<Object>} Block details
 */
export async function getBlockByHeight(height) {
  if (typeof height !== 'number' || height < 0) {
    throw new APIError('Invalid block height', 400);
  }

  try {
    console.log('Getting block by height:', height);

    // First get the latest block to validate height range
    const latestBlock = await getLatestBlock();
    if (height > latestBlock.height) {
      throw new APIError('Block height out of range', 404);
    }

    // Get block hash at this height from Blockfrost
    const blockData = await fetchFromBlockfrost(`/blocks/number/${height}`);
    if (!blockData || !blockData.hash) {
      throw new APIError('Block not found at this height', 404);
    }

    // Return the block hash
    return [blockData.hash];
  } catch (error) {
    console.error('Error getting block by height:', { height, error });
    if (error.status === 404) {
      throw new APIError('Block not found at this height', 404);
    }
    if (error.status === 400) {
      throw new APIError('Invalid block height', 400);
    }
    throw error;
  }
}
