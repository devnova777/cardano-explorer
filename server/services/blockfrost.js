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
    const response = await fetch(`${BLOCKFROST_URL}${endpoint}`, {
      ...options,
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle all Blockfrost error formats
      if (data.status_code || data.status === 'fail') {
        const statusCode = data.status_code || response.status;
        const message = data.message || 'Resource not found';

        // Map common Blockfrost error messages to our standard format
        if (message.includes('not been found') || statusCode === 404) {
          throw new APIError('Resource not found', 404);
        }

        throw new APIError(message, statusCode);
      }

      throw new APIError(
        `Blockfrost API error: ${response.statusText}`,
        response.status
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    // Handle network or parsing errors
    throw new APIError(`Blockfrost request failed: ${error.message}`, 500);
  }
}

/**
 * Gets the latest block
 */
export async function getLatestBlock() {
  return fetchFromBlockfrost('/blocks/latest');
}

/**
 * Gets previous blocks from a specific block hash
 */
export async function getPreviousBlocks(hash, count) {
  return fetchFromBlockfrost(`/blocks/${hash}/previous?count=${count}`);
}

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

  const [blockData, txHashes] = await Promise.all([
    fetchFromBlockfrost(`/blocks/${hash}`),
    fetchFromBlockfrost(`/blocks/${hash}/txs?order=desc`),
  ]);

  const transactions = await Promise.all(
    txHashes.map(async (txHash) => {
      const [txData, utxoData] = await Promise.all([
        fetchFromBlockfrost(`/txs/${txHash}`),
        fetchFromBlockfrost(`/txs/${txHash}/utxos`),
      ]);

      return {
        hash: txHash,
        block_time: blockData.time,
        inputs: utxoData.inputs.length,
        outputs: utxoData.outputs.length,
        input_amount: utxoData.inputs
          .reduce((sum, input) => {
            const lovelace = input.amount.find((a) => a.unit === 'lovelace');
            return sum + (lovelace ? BigInt(lovelace.quantity) : BigInt(0));
          }, BigInt(0))
          .toString(),
        output_amount: utxoData.outputs
          .reduce((sum, output) => {
            const lovelace = output.amount.find((a) => a.unit === 'lovelace');
            return sum + (lovelace ? BigInt(lovelace.quantity) : BigInt(0));
          }, BigInt(0))
          .toString(),
        fees: txData.fees,
      };
    })
  );

  return { transactions };
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
    // First check if transaction exists
    const txData = await fetchFromBlockfrost(`/txs/${hash}`);

    // If we get here, transaction exists, now get UTXOs
    const utxoData = await fetchFromBlockfrost(`/txs/${hash}/utxos`);

    // Calculate total input/output amounts
    const input_amount = utxoData.inputs
      .reduce((sum, input) => {
        const lovelace = input.amount.find((a) => a.unit === 'lovelace');
        return sum + (lovelace ? BigInt(lovelace.quantity) : BigInt(0));
      }, BigInt(0))
      .toString();

    const output_amount = utxoData.outputs
      .reduce((sum, output) => {
        const lovelace = output.amount.find((a) => a.unit === 'lovelace');
        return sum + (lovelace ? BigInt(lovelace.quantity) : BigInt(0));
      }, BigInt(0))
      .toString();

    // Get block data for timestamp
    const blockData = await fetchFromBlockfrost(
      `/blocks/${txData.block_height}`
    );

    return {
      hash: hash,
      block: txData.block_hash,
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
      inputs: utxoData.inputs.length,
      outputs: utxoData.outputs.length,
    };
  } catch (error) {
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
 * Gets address details and transactions
 */
export async function getAddressDetails(address) {
  if (!address) {
    throw new APIError('Invalid address', 400);
  }

  const [details, utxos, transactions] = await Promise.all([
    fetchFromBlockfrost(`/addresses/${address}`),
    fetchFromBlockfrost(`/addresses/${address}/utxos`),
    fetchFromBlockfrost(
      `/addresses/${address}/transactions?order=desc&limit=20`
    ),
  ]);

  return {
    address,
    balance: details.amount.find((a) => a.unit === 'lovelace')?.quantity || '0',
    stake_address: details.stake_address,
    utxos: utxos.map((utxo) => ({
      tx_hash: utxo.tx_hash,
      output_index: utxo.output_index,
      amount: utxo.amount.find((a) => a.unit === 'lovelace')?.quantity || '0',
      assets: utxo.amount.filter((a) => a.unit !== 'lovelace'),
    })),
    transactions: transactions.map((tx) => ({
      tx_hash: tx.tx_hash,
      block_height: tx.block_height,
      block_time: tx.block_time,
    })),
  };
}

/**
 * Search across different entities
 */
export async function search(query) {
  if (!query || query.length < 3) {
    throw new APIError('Search query too short', 400);
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

  // For epoch numbers
  if (/^\d+$/.test(query)) {
    try {
      const epochData = await fetchFromBlockfrost(`/epochs/${query}`);
      const blocks = await fetchFromBlockfrost(
        `/epochs/${query}/blocks?order=desc&limit=1`
      );

      if (blocks.length > 0) {
        const latestBlock = await getBlockByHash(blocks[0]);
        return {
          type: 'epoch',
          result: {
            ...epochData,
            latestBlock,
          },
        };
      }
      throw new APIError('Epoch has no blocks', 404);
    } catch (error) {
      if (error.status === 404) {
        throw new APIError('Epoch not found', 404);
      }
      throw error;
    }
  }

  // For Cardano addresses
  if (/^addr1[a-zA-Z0-9]+$/.test(query)) {
    try {
      const address = await getAddressDetails(query);
      return {
        type: 'address',
        result: address,
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
    'Invalid search format. Please enter a valid block hash, transaction hash, address, epoch number, or pool ID.',
    400
  );
}
