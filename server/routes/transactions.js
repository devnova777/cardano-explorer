/**
 * Transaction API Routes
 * @module routes/transactions
 */

import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getTransactionDetails } from '../services/blockfrost/index.js';
import { APIError } from '../utils/APIError.js';

const router = express.Router();

const validateTxHash = (req, res, next) =>
  !req.params.hash || req.params.hash.length !== 64
    ? next(new APIError('Invalid transaction hash', 400))
    : next();

router.get(
  '/:hash',
  validateTxHash,
  asyncHandler(async (req, res) =>
    res.json({
      success: true,
      data: await getTransactionDetails(req.params.hash),
    })
  )
);

export default router;
