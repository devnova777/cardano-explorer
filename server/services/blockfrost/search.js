/**
 * Search Service
 *
 * Handles unified search across all Cardano entities:
 * - Block search by height/hash
 * - Transaction search by hash
 * - Address search (base/stake)
 * - Stake pool search
 * - Validation and type detection
 *
 * @module services/blockfrost/search
 */

import { APIError } from '../../utils/APIError.js';
import { fetchFromBlockfrost } from './utils.js';
import { getBlockByHash } from './blocks.js';
import { getTransactionDetails } from './transactions.js';
import { getAddressDetails } from './addresses.js';

const SEARCH_PATTERNS = {
  HEIGHT: /^\d+$/,
  HASH: /^[0-9a-fA-F]{64}$/,
  ADDRESS: /^addr1[a-zA-Z0-9]+$/,
  STAKE: /^stake1[a-zA-Z0-9]+$/,
  POOL: /^pool1[a-zA-Z0-9]+$/,
};

export const search = async (query) => {
  if (!query || query.length < 3)
    throw new APIError('Search query too short', 400);

  const cleanQuery = query.replace(/,/g, '');

  // Block height search
  if (SEARCH_PATTERNS.HEIGHT.test(cleanQuery)) {
    const block = await fetchFromBlockfrost(`/blocks/${parseInt(cleanQuery)}`);
    return { type: 'block', result: block };
  }

  // Hash search (block or transaction)
  if (SEARCH_PATTERNS.HASH.test(query)) {
    const [block, transaction] = await Promise.allSettled([
      getBlockByHash(query),
      getTransactionDetails(query),
    ]);

    if (transaction.status === 'fulfilled')
      return { type: 'transaction', result: transaction.value };
    if (block.status === 'fulfilled')
      return { type: 'block', result: block.value };

    throw new APIError('No block or transaction found with this hash', 404);
  }

  // Address search
  if (SEARCH_PATTERNS.ADDRESS.test(query)) {
    const address = await getAddressDetails(query);
    return { type: 'address', result: { address: query, ...address } };
  }

  // Stake address search
  if (SEARCH_PATTERNS.STAKE.test(query)) {
    const [details, rewards] = await Promise.all([
      fetchFromBlockfrost(`/accounts/${query}`),
      fetchFromBlockfrost(`/accounts/${query}/rewards`),
    ]);
    return {
      type: 'stake_address',
      result: { ...details, rewards: rewards.slice(0, 10) },
    };
  }

  // Pool search
  if (SEARCH_PATTERNS.POOL.test(query)) {
    const [pool, metadata] = await Promise.all([
      fetchFromBlockfrost(`/pools/${query}`),
      fetchFromBlockfrost(`/pools/${query}/metadata`),
    ]);
    return { type: 'pool', result: { ...pool, metadata } };
  }

  throw new APIError('Invalid search format', 400);
};
