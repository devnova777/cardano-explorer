# Security Guidelines

## Overview

This document outlines the security measures and best practices implemented in the Cardano Explorer project.

## API Security

### Rate Limiting

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
```

### Security Headers

Using Helmet middleware to set:

- Content-Security-Policy
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

### CORS Configuration

```javascript
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production' ? ['https://your-domain.com'] : '*',
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Accept'],
  })
);
```

## Error Handling

### Custom Error Class

```javascript
export class APIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Production Error Responses

- Stack traces only in development
- Sanitized error messages in production
- Structured error format

## Input Validation

### Block Hash Validation

```javascript
if (!hash || hash.length !== 64) {
  throw new APIError('Invalid block hash', 400);
}
```

### Response Data Validation

```javascript
if (!data.hash || !data.height) {
  throw new APIError('Invalid block data received', 502);
}
```

## Best Practices

### Environment Variables

- Secure API key storage
- Environment-specific configurations
- Sensitive data protection

### Request Logging

```javascript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
```

### API Key Validation

```javascript
export const validateApiConfig = (req, res, next) => {
  if (!process.env.BLOCKFROST_API_KEY) {
    throw new APIError('API configuration is missing', 500);
  }
  next();
};
```

## Security Checklist

### Server-side

- [x] Implement rate limiting
- [x] Set security headers
- [x] Configure CORS
- [x] Validate API keys
- [x] Sanitize error responses
- [x] Log requests
- [x] Validate input data
- [x] Protect sensitive data

### Client-side

- [x] Secure API communication
- [x] Input validation
- [x] Error handling
- [x] XSS prevention
- [x] Content security policy

## Monitoring and Maintenance

### Error Logging

```javascript
console.error(`${new Date().toISOString()} - Error:`, {
  path: req.path,
  statusCode: err.statusCode,
  message: err.message,
  stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
});
```

### Health Checks

- Regular dependency updates
- Security vulnerability scanning
- Performance monitoring
- Error tracking

## Future Security Enhancements

1. **Authentication**

   - User authentication system
   - JWT implementation
   - Session management

2. **Rate Limiting**

   - Dynamic rate limiting
   - User-based limits
   - IP whitelist/blacklist

3. **Monitoring**
   - Security audit logging
   - Automated vulnerability scanning
   - Real-time attack detection
