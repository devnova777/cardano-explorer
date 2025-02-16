# Security Guidelines

## Overview

This document outlines the security measures and best practices implemented in the Cardano Explorer project.

## API Security

### Rate Limiting

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
    type: 'rate_limit_exceeded',
  },
});
```

### Security Headers

Using Helmet middleware with strict configuration:

```javascript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'", 'https://cardano-mainnet.blockfrost.io'],
      },
    },
    hsts: process.env.NODE_ENV === 'production',
    referrerPolicy: { policy: 'same-origin' },
  })
);
```

### CORS Configuration

```javascript
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS.split(',')
        : '*',
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: false,
    maxAge: 86400, // 24 hours
  })
);
```

## Error Handling

### Unified Error Class

```javascript
export class APIError extends Error {
  constructor(message, statusCode = 500, type = 'error') {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.type = type;
    Error.captureStackTrace(this, this.constructor);
  }

  static get types() {
    return {
      VALIDATION: 'validation',
      NOT_FOUND: 'not_found',
      TIMEOUT: 'timeout',
      UNAUTHORIZED: 'unauthorized',
      FORBIDDEN: 'forbidden',
    };
  }
}
```

### Production Error Responses

- Stack traces only in development
- Structured error types
- Sanitized error messages
- Consistent error format

## Data Validation

### Input Validation

```javascript
// Hash validation
if (!isValidHash(hash)) {
  throw APIError.validation('Invalid block hash format');
}

// ADA amount validation
if (!isValidAdaAmount(amount)) {
  throw APIError.validation('Invalid ADA amount');
}

// Epoch validation
if (!isValidEpoch(epoch)) {
  throw APIError.validation('Invalid epoch number');
}
```

### Type Checking

```javascript
// DOM element type checking
if (!element || !(element instanceof HTMLElement)) {
  console.warn('Invalid element provided');
  return false;
}

// Function parameter validation
if (typeof handler !== 'function') {
  console.warn('Event handler must be a function');
  return false;
}

// Number validation with BigInt
try {
  const value = BigInt(amount.toString());
} catch {
  throw APIError.validation('Invalid numeric value');
}
```

## Best Practices

### Environment Variables

```javascript
// Required environment variables
const requiredEnvVars = ['BLOCKFROST_API_KEY', 'NODE_ENV', 'ALLOWED_ORIGINS'];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

### Request Logging

```javascript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.url} - ${
        res.statusCode
      } - ${duration}ms`
    );
  });
  next();
});
```

### API Key Validation

```javascript
export const validateApiConfig = (req, res, next) => {
  const apiKey = process.env.BLOCKFROST_API_KEY;
  if (!apiKey) {
    throw new APIError('API configuration is missing', 500);
  }
  if (!/^[0-9a-f]{32}$/.test(apiKey)) {
    throw new APIError('Invalid API key format', 500);
  }
  next();
};
```

## Security Checklist

### Server-side

- [x] Rate limiting with headers
- [x] Strict security headers
- [x] Environment-based CORS
- [x] API key validation
- [x] Error sanitization
- [x] Request logging
- [x] Input validation
- [x] Type checking
- [x] BigInt calculations
- [x] Secure error handling

### Client-side

- [x] Secure API communication
- [x] Input validation
- [x] Type checking
- [x] XSS prevention
- [x] Content security policy
- [x] Safe DOM manipulation
- [x] Error boundaries
- [x] Resource cleanup

## Monitoring and Maintenance

### Error Logging

```javascript
console.error('Request error:', {
  timestamp: new Date().toISOString(),
  path: req.path,
  method: req.method,
  error: {
    name: error.name,
    message: error.message,
    type: error.type,
    status: error.status,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  },
});
```

### Health Checks

- Regular dependency updates
- Security vulnerability scanning
- Performance monitoring
- Error tracking
- Resource usage monitoring
- API health monitoring

## Future Security Enhancements

1. **Authentication System**

   - JWT implementation
   - Session management
   - Role-based access control
   - MFA support

2. **Enhanced Monitoring**

   - Security audit logging
   - Real-time attack detection
   - Automated vulnerability scanning
   - Performance profiling
   - Resource usage alerts

3. **Additional Security**

   - API key rotation
   - Rate limit by user/token
   - Request signing
   - Enhanced validation
   - Security headers customization

4. **Infrastructure**
   - Load balancing
   - DDoS protection
   - Backup systems
   - Failover mechanisms
   - SSL/TLS optimization
