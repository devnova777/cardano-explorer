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
    next(new APIError('Invalid hash', 400));
  } else {
    next();
  }
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
    if (!req.query.q) {
      throw new APIError('Search query is required', 400);
    }
    try {
      res.json({ success: true, data: await search(req.query.q) });
    } catch (error) {
      if (error instanceof APIError) throw error;
      if (error.status === 404 || error.message.includes('not found')) {
        throw new APIError('No results found for your search', 404);
      }
      throw new APIError(error.message || 'Search failed', error.status || 500);
    }
  })
);

// Latest blocks endpoint
router.get(
  '/latest',
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await getLatestBlock() });
  })
);

// Block height endpoint - Must come before /:hash to prevent conflicts
router.get(
  '/height/:height',
  asyncHandler(async (req, res) => {
    const heightNum = parseInt(req.params.height);
    if (isNaN(heightNum) || heightNum < 0) {
      throw new APIError('Invalid block height', 400);
    }

    const latestBlock = await getLatestBlock();
    if (heightNum > latestBlock.height) {
      throw new APIError('Block height out of range', 404);
    }

    const blockHashes = await getBlockByHeight(heightNum);
    if (!Array.isArray(blockHashes) || !blockHashes.length) {
      throw new APIError('Block not found at this height', 404);
    }

    res.json({ success: true, data: blockHashes });
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
    res.json({ success: true, data: await getAddressDetails(address) });
  })
);

// Transaction details endpoint
router.get(
  '/tx/:hash',
  validateHash,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: await getTransactionDetails(req.params.hash),
    });
  })
);

// Block transactions endpoint
router.get(
  '/:hash/transactions',
  validateHash,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: await getBlockTransactions(req.params.hash),
    });
  })
);

// Blocks list endpoint
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    res.json({ success: true, data: await getBlocks(page, limit) });
  })
);

// Block by hash endpoint - Must come after all other specific endpoints
router.get(
  '/:hash',
  validateHash,
  asyncHandler(async (req, res) => {
    const block = await getBlockByHash(req.params.hash);
    if (!block || typeof block !== 'object') {
      throw new APIError('Invalid block data received from Blockfrost', 500);
    }

    const requiredFields = ['hash', 'height', 'slot', 'time', 'epoch'];
    const missingFields = requiredFields.filter((field) => !block[field]);
    if (missingFields.length) {
      throw new APIError(
        `Missing required block fields: ${missingFields.join(', ')}`,
        500
      );
    }

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
  })
);

export default router;
