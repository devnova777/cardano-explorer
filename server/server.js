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

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') dotenv.config();

// Initialize express
const app = express();

// Setup paths for both local and Vercel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Security configuration
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

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' },
};

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(helmet(securityConfig));
app.use(rateLimit(rateLimitConfig));

// API routes (must come before static file serving)
app.use('/api', validateApiConfig);
app.use('/api/blocks', blockRoutes);
app.use('/api/tx', transactionRoutes);

// Static file serving (only in development)
if (process.env.NODE_ENV !== 'production') {
  // Serve static files with proper MIME types
  app.use(
    '/js',
    express.static(path.join(rootDir, 'public/js'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
          res.setHeader(
            'Content-Type',
            'application/javascript; charset=utf-8'
          );
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

  // Serve HTML files
  app.use(
    express.static(rootDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
      },
    })
  );
}

// Error handler must be last
app.use(errorHandler);

// Start server if in development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('API Key configured:', !!process.env.BLOCKFROST_API_KEY);
  });
}

// Export the Express API
export default app;
