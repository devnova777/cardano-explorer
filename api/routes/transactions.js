/**
 * Transaction API Routes
 * Handles all transaction-related API endpoints
 */

import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getTransactionDetails } from '../services/blockfrost/index.js';
import { APIError } from '../utils/APIError.js';

const router = express.Router();

// Validate transaction hash
const validateTxHash = (req, res, next) => {
  const { hash } = req.params;
  if (!hash || hash.length !== 64) {
    throw new APIError('Invalid transaction hash', 400);
  }
  next();
};

router.get(
  '/:hash',
  validateTxHash,
  asyncHandler(async (req, res) => {
    const { hash } = req.params;
    const data = await getTransactionDetails(hash);
    res.json({ success: true, data });
  })
);

export default router;
