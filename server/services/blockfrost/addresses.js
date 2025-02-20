import { APIError } from '../../utils/APIError.js';
import { fetchFromBlockfrost } from './utils.js';

export const getAddressUTXOs = async (address) => {
  if (!address) throw new APIError('Invalid address', 400);

  try {
    const utxos = await fetchFromBlockfrost(`/addresses/${address}/utxos`);
    return utxos
      .map((utxo) => {
        const lovelaceAmount = utxo.amount?.find((a) => a.unit === 'lovelace');
        return lovelaceAmount
          ? {
              tx_hash: utxo.tx_hash,
              output_index: utxo.output_index,
              amount: lovelaceAmount.quantity,
              assets: utxo.amount.filter((a) => a.unit !== 'lovelace'),
            }
          : null;
      })
      .filter(Boolean);
  } catch (error) {
    if (error.status === 404) throw new APIError('Address not found', 404);
    throw error;
  }
};

export const getAddressDetails = async (address) => {
  if (!address) throw new APIError('Invalid address', 400);

  try {
    const [details, utxos, transactions] = await Promise.all([
      fetchFromBlockfrost(`/addresses/${address}`),
      fetchFromBlockfrost(`/addresses/${address}/utxos`),
      fetchFromBlockfrost(
        `/addresses/${address}/transactions?order=desc&limit=20`
      ),
    ]);

    return {
      address,
      amount: details.amount || '0',
      stake_address: details.stake_address,
      type: details.type,
      utxos: utxos
        .map((utxo) => ({
          tx_hash: utxo.tx_hash,
          output_index: utxo.output_index,
          amount: utxo.amount || '0',
          assets: [],
        }))
        .filter(Boolean),
      transactions: transactions
        .map((tx) => ({
          tx_hash: tx.tx_hash,
          block_height: tx.block_height,
          block_time: tx.block_time,
          tx_index: tx.tx_index,
          block_hash: tx.block_hash,
        }))
        .filter(Boolean),
    };
  } catch (error) {
    if (error.status === 404) throw new APIError('Address not found', 404);
    throw error;
  }
};
