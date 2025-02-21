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
} from '../services/blockfrost/index.js';
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

// Block height endpoint - Must come before /:hash to prevent conflicts
router.get(
  '/height/:height',
  asyncHandler(async (req, res) => {
    const { height } = req.params;
    const heightNum = parseInt(height);

    if (isNaN(heightNum) || heightNum < 0) {
      throw new APIError('Invalid block height', 400);
    }

    try {
      // Get latest block to validate height range
      const latestBlock = await getLatestBlock();
      if (heightNum > latestBlock.height) {
        throw new APIError('Block height out of range', 404);
      }

      // Get block hash(es) for this height
      const blockHashes = await getBlockByHeight(heightNum);

      // If we got block hashes, return them
      if (Array.isArray(blockHashes) && blockHashes.length > 0) {
        res.json({ success: true, data: blockHashes });
        return;
      }

      throw new APIError('Block not found at this height', 404);
    } catch (error) {
      console.error('Error getting block by height:', {
        height: heightNum,
        error,
      });
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        error.message || 'Failed to get block by height',
        error.status || 500
      );
    }
  })
);

// Address details endpoint
router.get(
  '/address/:address',
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    if (!address || address === 'undefined') {
      throw new APIError('Invalid address parameter', 400);
    }
    console.log('Getting address details for:', address);
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

// Block by hash endpoint - Must come after all other specific endpoints
router.get(
  '/:hash',
  validateHash,
  asyncHandler(async (req, res) => {
    const { hash } = req.params;
    try {
      console.log('Fetching block details for hash:', hash);
      const block = await getBlockByHash(hash);
      console.log('Block data received:', block);

      // Validate block data structure
      if (!block || typeof block !== 'object') {
        console.error('Invalid block data received:', block);
        throw new APIError('Invalid block data received from Blockfrost', 500);
      }

      // Ensure all required fields are present
      const requiredFields = ['hash', 'height', 'slot', 'time', 'epoch'];
      const missingFields = requiredFields.filter((field) => !block[field]);

      if (missingFields.length > 0) {
        console.error('Missing required fields in block data:', {
          missingFields,
          block,
        });
        throw new APIError(
          `Missing required block fields: ${missingFields.join(', ')}`,
          500
        );
      }

      // Send response
      res.json({
        success: true,
        data: {
          ...block,
          height: Number(block.height),
          slot: Number(block.slot),
          epoch: Number(block.epoch),
          time: Number(block.time),
        },
      });
    } catch (error) {
      console.error('Error getting block by hash:', {
        hash,
        error: {
          message: error.message,
          status: error.status,
          stack: error.stack,
        },
      });
      if (error.status === 404) {
        throw new APIError('Block not found', 404);
      }
      throw error;
    }
  })
);

export default router;
