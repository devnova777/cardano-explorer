import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  validateApiConfig,
  errorHandler,
} from '../server/middleware/errorHandler.js';
import blockRoutes from '../server/routes/blocks.js';
import transactionRoutes from '../server/routes/transactions.js';

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API validation middleware
app.use('/api', validateApiConfig);

// API routes
app.use('/api/blocks', blockRoutes);
app.use('/api/tx', transactionRoutes);

// Error handling
app.use(errorHandler);

// Export the Express API
export default app;
