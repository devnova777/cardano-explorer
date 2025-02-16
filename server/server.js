import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Import routes and middleware
import blockRoutes from './routes/blocks.js';
import { getTransactionDetails } from './services/blockfrost.js';
import { validateApiConfig, errorHandler } from './middleware/errorHandler.js';
import { asyncHandler } from './middleware/asyncHandler.js';

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
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
      },
    },
  })
);
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

// Create a separate router for transactions
const txRouter = express.Router();
txRouter.get(
  '/:hash',
  asyncHandler(async (req, res) => {
    console.log('TX Router hit:', req.params);
    const { hash } = req.params;
    const data = await getTransactionDetails(hash);
    res.json({
      success: true,
      data,
    });
  })
);

// Mount routes
app.use('/api/blocks', blockRoutes);
app.use('/api/tx', txRouter);

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
