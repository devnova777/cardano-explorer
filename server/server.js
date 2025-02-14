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

// Load env vars in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3001;

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
  console.log('API Key present:', !!process.env.BLOCKFROST_API_KEY);
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

    if (!hash || hash.length !== 64) {
      throw new APIError('Invalid block hash', 400);
    }

    const data = await getTransactionsForBlock(hash);

    if (!data.transactions || data.transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No transactions found for this block',
      });
    }

    res.status(200).json({
      success: true,
      data: data,
    });
  })
);

// Update the blocks endpoint
app.get(
  '/api/blocks',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Get blocks list from Blockfrost
    const blocksResponse = await fetch(
      'https://cardano-mainnet.blockfrost.io/api/v0/blocks/latest',
      {
        headers: {
          project_id: process.env.BLOCKFROST_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!blocksResponse.ok) {
      throw new APIError(
        `Blockfrost API error: ${blocksResponse.statusText}`,
        blocksResponse.status
      );
    }

    const latestBlock = await blocksResponse.json();

    // Get previous blocks
    const blockHashesResponse = await fetch(
      `https://cardano-mainnet.blockfrost.io/api/v0/blocks/${latestBlock.hash}/previous?count=${limit}`,
      {
        headers: {
          project_id: process.env.BLOCKFROST_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!blockHashesResponse.ok) {
      throw new APIError(
        `Failed to fetch block hashes`,
        blockHashesResponse.status
      );
    }

    const blockHashes = await blockHashesResponse.json();

    // Get detailed information for each block
    const blocks = [latestBlock, ...blockHashes];

    // Calculate pagination info
    const totalPages = Math.ceil(latestBlock.height / limit);
    const currentPage = parseInt(page);

    res.json({
      success: true,
      data: {
        blocks,
        pagination: {
          currentPage,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrevious: currentPage > 1,
          totalBlocks: latestBlock.height,
        },
      },
    });
  })
);

// Add this endpoint to get block details
app.get(
  '/api/block/:hash',
  asyncHandler(async (req, res) => {
    const { hash } = req.params;

    if (!hash || hash.length !== 64) {
      throw new APIError('Invalid block hash', 400);
    }

    const response = await fetch(
      `https://cardano-mainnet.blockfrost.io/api/v0/blocks/${hash}`,
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

    const blockData = await response.json();

    res.json({
      success: true,
      data: blockData,
    });
  })
);

// Debug endpoint
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug', (req, res) => {
    res.json({
      envVars: {
        hasApiKey: !!process.env.BLOCKFROST_API_KEY,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  });
}

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

async function getTransactionsForBlock(hash) {
  try {
    // 1. Get block-specific information first
    const blockResponse = await fetch(
      `https://cardano-mainnet.blockfrost.io/api/v0/blocks/${hash}`,
      {
        headers: {
          project_id: process.env.BLOCKFROST_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!blockResponse.ok) {
      throw new APIError(`Failed to fetch block ${hash}`, blockResponse.status);
    }

    const blockData = await blockResponse.json();

    // 2. Get transaction hashes for the block
    const txHashesResponse = await fetch(
      `https://cardano-mainnet.blockfrost.io/api/v0/blocks/${hash}/txs?order=desc`,
      {
        headers: {
          project_id: process.env.BLOCKFROST_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!txHashesResponse.ok) {
      throw new APIError(
        `Failed to fetch transactions for block ${hash}`,
        txHashesResponse.status
      );
    }

    const txHashes = await txHashesResponse.json();

    // 3. Get detailed information for each transaction
    const transactions = await Promise.all(
      txHashes.map(async (txHash) => {
        // Get transaction details including UTXOs
        const [txData, utxoData] = await Promise.all([
          fetch(`https://cardano-mainnet.blockfrost.io/api/v0/txs/${txHash}`, {
            headers: {
              project_id: process.env.BLOCKFROST_API_KEY,
              'Content-Type': 'application/json',
            },
          }).then((res) => res.json()),
          fetch(
            `https://cardano-mainnet.blockfrost.io/api/v0/txs/${txHash}/utxos`,
            {
              headers: {
                project_id: process.env.BLOCKFROST_API_KEY,
                'Content-Type': 'application/json',
              },
            }
          ).then((res) => res.json()),
        ]);

        return {
          hash: txHash,
          block_time: blockData.time, // Use block time for consistency
          inputs: utxoData.inputs.length,
          outputs: utxoData.outputs.length,
          input_amount: utxoData.inputs
            .reduce((sum, input) => {
              const lovelace = input.amount.find((a) => a.unit === 'lovelace');
              return sum + (lovelace ? BigInt(lovelace.quantity) : BigInt(0));
            }, BigInt(0))
            .toString(),
          output_amount: utxoData.outputs
            .reduce((sum, output) => {
              const lovelace = output.amount.find((a) => a.unit === 'lovelace');
              return sum + (lovelace ? BigInt(lovelace.quantity) : BigInt(0));
            }, BigInt(0))
            .toString(),
          fees: txData.fees,
        };
      })
    );

    return { transactions };
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    throw error;
  }
}
