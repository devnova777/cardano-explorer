/**
 * Blocks API Routes
 *
 * Handles all block-related API endpoints:
 * - Latest block retrieval
 * - Block list pagination
 * - Block details by hash
 * - Block transactions
 * - Transaction details
 * - Address details
 * - Search functionality
 *
 * @module routes/blocks
 */

import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  getLatestBlock,
  getBlocks,
  getBlockByHash,
  getBlockTransactions,
  getTransactionDetails,
  search,
  getAddressDetails,
  getBlockByHeight,
} from '../services/blockfrost.js';
import { APIError } from '../utils/APIError.js';

const router = express.Router();

// Common validation middleware
const validateHash = (req, res, next) => {
  const hash = req.params.hash;
  if (!hash || hash === 'undefined' || hash.length !== 64) {
    throw new APIError('Invalid hash', 400);
  }
  next();
};

// Logging middleware
router.use((req, res, next) => {
  console.log('Route hit:', {
    baseUrl: req.baseUrl,
    path: req.path,
    params: req.params,
    originalUrl: req.originalUrl,
  });
  next();
});

// Search endpoint (must be first to prevent conflicts)
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const query = req.query.q;
    if (!query) {
      throw new APIError('Search query is required', 400);
    }

    try {
      const results = await search(query);
      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('Search error:', {
        query,
        error: {
          message: error.message,
          status: error.status,
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      });

      if (!(error instanceof APIError)) {
        if (error.status === 404 || error.message.includes('not found')) {
          throw new APIError('No results found for your search', 404);
        }
        throw new APIError(
          error.message || 'Search failed',
          error.status || 500
        );
      }
      throw error;
    }
  })
);

// Latest blocks endpoint
router.get(
  '/latest',
  asyncHandler(async (req, res) => {
    const data = await getLatestBlock();
    res.json({ success: true, data });
  })
);

// Address details endpoint
router.get(
  '/address/:address',
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    const data = await getAddressDetails(address);
    res.json({ success: true, data });
  })
);

// Transaction details endpoint
router.get(
  '/tx/:hash',
  validateHash,
  asyncHandler(async (req, res) => {
    const { hash } = req.params;
    const data = await getTransactionDetails(hash);
    res.json({ success: true, data });
  })
);

// Block transactions endpoint
router.get(
  '/:hash/transactions',
  validateHash,
  asyncHandler(async (req, res) => {
    const { hash } = req.params;
    const data = await getBlockTransactions(hash);
    res.json({ success: true, data });
  })
);

// Blocks list endpoint
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const data = await getBlocks(parseInt(page), parseInt(limit));
    res.json({ success: true, data });
  })
);

// Block by hash or height endpoint
router.get(
  '/:hashOrHeight',
  asyncHandler(async (req, res) => {
    const { hashOrHeight } = req.params;
    let block;

    try {
      // If it's a number, treat it as a height and get the block by height
      if (!isNaN(hashOrHeight)) {
        console.log('Looking up block by height:', hashOrHeight);
        const height = parseInt(hashOrHeight);
        const latestBlock = await getLatestBlock();

        // Validate height is within range
        if (height > latestBlock.height || height < 0) {
          throw new APIError('Block height out of range', 404);
        }

        // Get block by hash from Blockfrost
        const blocks = await getBlockByHeight(height);
        if (!blocks) {
          throw new APIError('Block not found', 404);
        }
        block = blocks;
      } else {
        // Otherwise treat it as a hash
        console.log('Looking up block by hash:', hashOrHeight);
        block = await getBlockByHash(hashOrHeight);
      }

      res.json({ success: true, data: block });
    } catch (error) {
      console.error('Error getting block:', error);
      if (error.status === 404) {
        throw new APIError('Block not found', 404);
      }
      throw error;
    }
  })
);

export default router;
