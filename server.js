import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import blockRoutes from './routes/blocks.js';
import transactionRoutes from './routes/transactions.js';
import { validateApiConfig, errorHandler } from './middleware/errorHandler.js';
import { asyncHandler } from './middleware/asyncHandler.js';

if (process.env.NODE_ENV !== 'production') dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

const securityConfig = {
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
};

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
};

const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('API Key present:', !!process.env.BLOCKFROST_API_KEY);
  next();
};

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(helmet(securityConfig));
app.use(rateLimit(rateLimitConfig));

// Configure proper MIME types for static files
app.use(
  '/js',
  express.static(path.join(rootDir, 'public/js'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
    },
  })
);

app.use(
  '/css',
  express.static(path.join(rootDir, 'public/css'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      }
    },
  })
);

app.use('/images', express.static(path.join(rootDir, 'public/images')));

// Serve HTML files from root and pages directory
app.use(
  express.static(rootDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
    },
  })
);

app.use('/api', validateApiConfig);
app.use(requestLogger);

// Route mounting
app.use('/api/blocks', blockRoutes);
app.use('/api/tx', transactionRoutes);

// Development endpoints
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

// Error handler
app.use(errorHandler);

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);

// Export the Express API
export default app;
