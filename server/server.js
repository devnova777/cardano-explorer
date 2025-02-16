import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Import routes
import blockRoutes from './routes/blocks.js';

// Import middleware
import { validateApiConfig } from './middleware/errorHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

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

// Mount routes
app.use('/api/blocks', blockRoutes);

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
