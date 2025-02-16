import fetch from 'node-fetch';
import { APIError } from '../utils/APIError.js';

const BLOCKFROST_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

/**
 * Base headers for Blockfrost API calls
 */
const getHeaders = () => ({
  project_id: process.env.BLOCKFROST_API_KEY,
  'Content-Type': 'application/json',
});

/**
 * Fetches data from Blockfrost API with error handling
 */
async function fetchFromBlockfrost(endpoint, options = {}) {
  const response = await fetch(`${BLOCKFROST_URL}${endpoint}`, {
    ...options,
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new APIError(
      `Blockfrost API error: ${response.statusText}`,
      response.status
    );
  }

  return response.json();
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
  return fetchFromBlockfrost(`/blocks/${hash}`);
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
