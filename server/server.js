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

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
