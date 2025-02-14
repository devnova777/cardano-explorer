export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error for debugging
  console.error(`${new Date().toISOString()} - Error:`, {
    path: req.path,
    statusCode: err.statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const validateApiConfig = (req, res, next) => {
  if (!process.env.BLOCKFROST_API_KEY) {
    throw new APIError('API configuration is missing', 500);
  }
  next();
};
