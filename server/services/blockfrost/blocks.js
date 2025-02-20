import { APIError } from '../../utils/APIError.js';
import { fetchFromBlockfrost, calculateAmount } from './utils.js';

export const getLatestBlock = () => fetchFromBlockfrost('/blocks/latest');

export const getPreviousBlocks = (hash, count) =>
  fetchFromBlockfrost(`/blocks/${hash}/previous?count=${count}`);

export const getBlockByHash = async (hash) => {
  if (!hash || hash.length !== 64)
    throw new APIError('Invalid block hash', 400);

  try {
    return await fetchFromBlockfrost(`/blocks/${hash}`);
  } catch (error) {
    if (error.status === 404) throw new APIError('Block not found', 404);
    throw error;
  }
};

export const getBlockTransactions = async (hash) => {
  if (!hash || hash.length !== 64)
    throw new APIError('Invalid block hash', 400);

  try {
    const [blockData, txHashes] = await Promise.all([
      fetchFromBlockfrost(`/blocks/${hash}`),
      fetchFromBlockfrost(`/blocks/${hash}/txs?order=desc`),
    ]);

    if (!txHashes?.length) return { transactions: [] };

    const transactions = await Promise.all(
      txHashes.slice(0, 50).map(async (txHash) => {
        try {
          const [txData, utxoData] = await Promise.all([
            fetchFromBlockfrost(`/txs/${txHash}`),
            fetchFromBlockfrost(`/txs/${txHash}/utxos`),
          ]);

          return {
            hash: txHash,
            block: hash,
            block_time: blockData.time,
            inputs: utxoData.inputs?.length || 0,
            outputs: utxoData.outputs?.length || 0,
            input_amount: calculateAmount(utxoData.inputs || []),
            output_amount: calculateAmount(utxoData.outputs || []),
            fees: txData.fees || '0',
          };
        } catch (error) {
          console.error('Error fetching transaction details:', {
            txHash,
            error,
          });
          return null;
        }
      })
    );

    return { transactions: transactions.filter(Boolean) };
  } catch (error) {
    console.error('Error fetching block transactions:', { hash, error });
    if (error.status === 404) throw new APIError('Block not found', 404);
    throw error;
  }
};

export const getBlocks = async (page = 1, limit = 10) => {
  const latestBlock = await getLatestBlock();
  const previousBlocks = await getPreviousBlocks(latestBlock.hash, limit);

  return {
    blocks: [latestBlock, ...previousBlocks],
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(latestBlock.height / limit),
      hasNext: page < Math.ceil(latestBlock.height / limit),
      hasPrevious: page > 1,
      totalBlocks: latestBlock.height,
    },
  };
};

export const getBlockByHeight = async (height) => {
  if (typeof height !== 'number' || height < 0) {
    throw new APIError('Invalid block height', 400);
  }

  const latestBlock = await getLatestBlock();
  if (height > latestBlock.height) {
    throw new APIError('Block height out of range', 404);
  }

  const blockData = await fetchFromBlockfrost(`/blocks/number/${height}`);
  if (!blockData?.hash)
    throw new APIError('Block not found at this height', 404);

  return [blockData.hash];
};
