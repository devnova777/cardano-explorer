import { APIError } from '../../utils/APIError.js';
import { fetchFromBlockfrost, calculateAmount } from './utils.js';

export const getTransactionDetails = async (hash) => {
  if (!hash || hash.length !== 64)
    throw new APIError('Invalid transaction hash', 400);

  try {
    // First get transaction data
    const txData = await fetchFromBlockfrost(`/txs/${hash}`);

    // Then get UTXO data and block data in parallel
    const [utxoData, blockData] = await Promise.all([
      fetchFromBlockfrost(`/txs/${hash}/utxos`),
      fetchFromBlockfrost(`/blocks/${txData.block}`),
    ]);

    return {
      hash,
      block_hash: txData.block,
      block_height: txData.block_height,
      block_time: blockData.time,
      slot: txData.slot,
      index: txData.index,
      output_amount: calculateAmount(utxoData.outputs),
      input_amount: calculateAmount(utxoData.inputs),
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
  } catch (error) {
    if (error.status === 404) throw new APIError('Transaction not found', 404);
    throw error;
  }
};
