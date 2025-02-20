import fetch from 'node-fetch';
import { APIError } from '../../utils/APIError.js';

export const BLOCKFROST_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

export const getApiKey = () => {
  const apiKey = process.env.BLOCKFROST_API_KEY?.trim();
  if (!apiKey) throw new APIError('Blockfrost API key is not configured', 500);
  return apiKey;
};

export const fetchFromBlockfrost = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${BLOCKFROST_URL}${endpoint}`, {
      ...options,
      method: 'GET',
      headers: { project_id: getApiKey() },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 403) {
        throw new APIError('Invalid Blockfrost API key', 403);
      }
      throw new APIError(
        data.message || 'Blockfrost API error',
        response.status
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(error.message, error.status || 500);
  }
};

export const calculateAmount = (items) =>
  items
    .reduce((sum, item) => {
      const lovelace = item.amount.find((a) => a.unit === 'lovelace');
      return sum + (lovelace ? BigInt(lovelace.quantity) : BigInt(0));
    }, BigInt(0))
    .toString();
