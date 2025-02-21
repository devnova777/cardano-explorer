/**
 * Express Server Configuration
 *
 * Main server setup and configuration:
 * - Security middleware (CORS, Helmet, Rate Limiting)
 * - API routes and middleware
 * - Static file serving
 * - Environment-specific behavior
 * - Error handling
 *
 * @module server
 */

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

// Environment Configuration
if (process.env.NODE_ENV !== 'production') dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

const SECURITY_CONFIG = {
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

const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
};

const MIME_TYPES = {
  js: 'application/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  html: 'text/html; charset=utf-8',
};

// Middleware Configuration
app.use(cors());
app.use(express.json());
app.use(helmet(SECURITY_CONFIG));
app.use(rateLimit(RATE_LIMIT_CONFIG));

// API Routes
app.use('/api', validateApiConfig);
app.use('/api/blocks', blockRoutes);
app.use('/api/tx', transactionRoutes);

// Development-only Static File Serving
if (process.env.NODE_ENV !== 'production') {
  const setMimeType = (res, filePath, mimeType) => {
    if (filePath.endsWith(`.${mimeType}`)) {
      res.setHeader('Content-Type', MIME_TYPES[mimeType]);
    }
  };

  app.use(
    '/js',
    express.static(path.join(rootDir, 'public/js'), {
      setHeaders: (res, filePath) => setMimeType(res, filePath, 'js'),
    })
  );

  app.use(
    '/css',
    express.static(path.join(rootDir, 'public/css'), {
      setHeaders: (res, filePath) => setMimeType(res, filePath, 'css'),
    })
  );

  app.use('/images', express.static(path.join(rootDir, 'public/images')));

  app.use(
    express.static(rootDir, {
      setHeaders: (res, filePath) => setMimeType(res, filePath, 'html'),
    })
  );
}

// Error Handling
app.use(errorHandler);

// Development Server Start
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('API Key configured:', !!process.env.BLOCKFROST_API_KEY);
  });
}

export default app;
