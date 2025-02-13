import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Import custom error handling
import { APIError } from './utils/APIError.js';
import { asyncHandler } from './middleware/asyncHandler.js';
import { errorHandler, validateApiConfig } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = 3001;

// ES Module dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(limiter);
app.use(express.static(rootDir));

// API routes middleware
app.use('/api', validateApiConfig);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.get(
  '/api/block/latest',
  asyncHandler(async (req, res) => {
    const response = await fetch(
      'https://cardano-mainnet.blockfrost.io/api/v0/blocks/latest',
      {
        headers: {
          project_id: process.env.BLOCKFROST_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new APIError(
        `Blockfrost API error: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();

    if (!data.hash || !data.height) {
      throw new APIError('Invalid block data received', 502);
    }

    res.json({
      success: true,
      data: data,
    });
  })
);

// Update the block transactions endpoint in server.js

app.get(
  '/api/block/:hash/transactions',
  asyncHandler(async (req, res) => {
    const { hash } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate block hash format
    if (!/^[0-9a-fA-F]{64}$/.test(hash)) {
      throw new APIError('Invalid block hash format', 400);
    }

    // First get transaction hashes for this block
    const txHashesResponse = await fetch(
      `https://cardano-mainnet.blockfrost.io/api/v0/blocks/${hash}/txs?page=${page}&count=${limit}`,
      {
        headers: {
          project_id: process.env.BLOCKFROST_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!txHashesResponse.ok) {
      throw new APIError(
        `Blockfrost API error: ${txHashesResponse.statusText}`,
        txHashesResponse.status
      );
    }

    const txHashes = await txHashesResponse.json();

    // Get detailed information for each transaction
    const transactionDetails = await Promise.all(
      txHashes.map(async (txHash) => {
        const [txResponse, utxoResponse] = await Promise.all([
          // Get basic transaction info
          fetch(`https://cardano-mainnet.blockfrost.io/api/v0/txs/${txHash}`, {
            headers: {
              project_id: process.env.BLOCKFROST_API_KEY,
              'Content-Type': 'application/json',
            },
          }),
          // Get UTXO information
          fetch(
            `https://cardano-mainnet.blockfrost.io/api/v0/txs/${txHash}/utxos`,
            {
              headers: {
                project_id: process.env.BLOCKFROST_API_KEY,
                'Content-Type': 'application/json',
              },
            }
          ),
        ]);

        if (!txResponse.ok || !utxoResponse.ok) {
          console.error(`Error fetching transaction ${txHash}`);
          return null;
        }

        const [txData, utxoData] = await Promise.all([
          txResponse.json(),
          utxoResponse.json(),
        ]);

        return {
          hash: txHash,
          block_time: txData.block_time,
          fees: txData.fees,
          inputs: utxoData.inputs.length,
          outputs: utxoData.outputs.length,
          input_amount: utxoData.inputs.reduce(
            (sum, input) =>
              sum +
              input.amount.reduce((a, b) => a + parseInt(b.quantity || 0), 0),
            0
          ),
          output_amount: utxoData.outputs.reduce(
            (sum, output) =>
              sum +
              output.amount.reduce((a, b) => a + parseInt(b.quantity || 0), 0),
            0
          ),
        };
      })
    );

    // Filter out any failed transaction fetches
    const validTransactions = transactionDetails.filter((tx) => tx !== null);

    res.json({
      success: true,
      data: {
        transactions: validTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: validTransactions.length,
        },
      },
    });
  })
);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
