import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  getLatestBlock,
  getBlocks,
  getBlockByHash,
  getBlockTransactions,
} from '../services/blockfrost.js';

const router = express.Router();

// Get latest block
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

// Get blocks list with pagination
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

// Get block by hash
router.get(
  '/:hash',
  asyncHandler(async (req, res) => {
    const { hash } = req.params;
    const data = await getBlockByHash(hash);
    res.json({
      success: true,
      data,
    });
  })
);

// Get block transactions
router.get(
  '/:hash/transactions',
  asyncHandler(async (req, res) => {
    const { hash } = req.params;
    const data = await getBlockTransactions(hash);
    res.json({
      success: true,
      data,
    });
  })
);

export default router;
