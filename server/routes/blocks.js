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
} from '../services/blockfrost.js';
import { APIError } from '../utils/APIError.js';

const router = express.Router();

// Logging middleware for this router
router.use((req, res, next) => {
  console.log('Route hit:', {
    baseUrl: req.baseUrl,
    path: req.path,
    params: req.params,
    originalUrl: req.originalUrl,
  });
  next();
});

// Search endpoint must be first to prevent conflicts
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
      // Log the full error for debugging
      console.error('Search error:', {
        query,
        error: {
          message: error.message,
          status: error.status,
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      });

      // Convert any error to APIError format
      if (!(error instanceof APIError)) {
        if (error.status === 404 || error.message.includes('not found')) {
          throw new APIError('No results found for your search', 404);
        } else {
          throw new APIError(
            error.message || 'Search failed',
            error.status || 500
          );
        }
      }
      throw error; // Let the global error handler handle it
    }
  })
);

// Latest blocks endpoint
router.get(
  '/latest',
  asyncHandler(async (req, res) => {
    const data = await getLatestBlock();
    res.json({
      success: true,
      data,
    });
  })
);

// Address details endpoint
router.get(
  '/address/:address',
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    const addressDetails = await getAddressDetails(address);
    res.json({
      success: true,
      data: addressDetails,
    });
  })
);

// Transaction details endpoint
router.get(
  '/tx/:hash',
  asyncHandler(async (req, res) => {
    const { hash } = req.params;
    const data = await getTransactionDetails(hash);
    res.json({
      success: true,
      data,
    });
  })
);

// Block transactions endpoint
router.get(
  '/:hash/transactions',
  asyncHandler(async (req, res) => {
    const { hash } = req.params;

    if (!hash || hash === 'undefined') {
      throw new APIError('Invalid block hash', 400);
    }

    const data = await getBlockTransactions(hash);
    res.json({
      success: true,
      data,
    });
  })
);

// Blocks list endpoint
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const data = await getBlocks(parseInt(page), parseInt(limit));
    res.json({
      success: true,
      data,
    });
  })
);

// Block by hash endpoint (must be last as it's a catch-all)
router.get(
  '/:hash',
  asyncHandler(async (req, res) => {
    const { hash } = req.params;

    if (!hash || hash === 'undefined') {
      throw new APIError('Invalid block hash', 400);
    }

    const block = await getBlockByHash(hash);
    res.json({
      success: true,
      data: block,
    });
  })
);

export default router;
