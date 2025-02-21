# Security Guidelines

## Overview

This document outlines the security measures, implementation details, and future security roadmap for the Cardano Block Explorer. For API-specific security measures and endpoint documentation, see [API.md](/docs/API.md).

```mermaid
flowchart TD
    A[Request Entry] --> B[Security Layer]
    B --> C{Security Checks}
    C --> D[Rate Limiting]
    C --> E[CORS]
    C --> F[API Key Validation]
    C --> G[Input Validation]
    C --> H[Content Security]
    D & E & F & G & H --> I{All Passed?}
    I -->|Yes| J[Process Request]
    I -->|No| K[Security Error]
    J --> L[Response Sanitization]
    K --> L
    L --> M[Client Response]
```

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
    frameguard: { action: 'deny' },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
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

## Input Validation & Error Handling

### Unified Error Configuration

```javascript
const CONFIG = {
  ENVIRONMENTS: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test',
  },
  STATUS_CODES: {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TIMEOUT: 408,
    CONFLICT: 409,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
  ERROR_TYPES: {
    VALIDATION: 'ValidationError',
    API: 'APIError',
    NETWORK: 'NetworkError',
    DATABASE: 'DatabaseError',
    AUTH: 'AuthenticationError',
  },
  TIMEOUTS: {
    DEFAULT: 30000, // 30 seconds
    API: 15000, // 15 seconds
    DATABASE: 60000, // 60 seconds
    MINIMUM: 1000, // 1 second minimum
    MAXIMUM: 300000, // 5 minutes maximum
  },
};
```

### Error Handling Implementation

```javascript
const errorHandler = (err, req, res, next) => {
  // Track error metrics
  trackErrorMetrics(err, req);

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.removeHeader('X-Powered-By');

  const statusCode =
    err.status ||
    err.statusCode ||
    (err.name === CONFIG.ERROR_TYPES.VALIDATION
      ? CONFIG.STATUS_CODES.BAD_REQUEST
      : CONFIG.STATUS_CODES.INTERNAL_ERROR);

  // Format and send error response
  res.status(statusCode).json(formatErrorResponse(err, req));
};

const formatErrorResponse = (error, req) => {
  const isDevelopment =
    process.env.NODE_ENV === CONFIG.ENVIRONMENTS.DEVELOPMENT;

  return {
    success: false,
    status: error.status,
    error: isDevelopment ? error.message : sanitizeErrorMessage(error.message),
    ...(isDevelopment && {
      path: req.path,
      method: req.method,
      stack: error.stack,
      type: error.name,
    }),
  };
};
```

### Error Sanitization

```javascript
const sanitizeErrorMessage = (message) => {
  if (!message) return 'An error occurred';

  // Remove sensitive information patterns
  return message
    .replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, '[EMAIL]')
    .replace(/\b\d{4}[-]?\d{4}[-]?\d{4}[-]?\d{4}\b/g, '[CARD]')
    .replace(/([0-9a-fA-F]{32}|[0-9a-fA-F]{64})/g, '[HASH]');
};
```

## Security Monitoring

### Performance Monitoring

```javascript
const monitorPerformance = (path, method, duration) => {
  if (duration > CONFIG.MONITORING.SLOW_THRESHOLD) {
    console.warn('Slow request detected:', {
      path,
      method,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  }
};
```

### Error Metrics

```javascript
const trackErrorMetrics = (error, req) => {
  if (process.env.NODE_ENV === CONFIG.ENVIRONMENTS.PRODUCTION) {
    console.warn('Error metrics:', {
      path: req.path,
      method: req.method,
      errorType: error.name,
      status: error.status || error.statusCode,
      timestamp: new Date().toISOString(),
    });
  }
};
```

### Request Validation

```javascript
const validateApiConfig = (req, res, next) => {
  try {
    validateEnvironment();
    next();
  } catch (error) {
    console.error('Configuration error:', error.message);
    res.status(CONFIG.STATUS_CODES.SERVICE_UNAVAILABLE).json({
      success: false,
      error: 'Service configuration error',
      status: CONFIG.STATUS_CODES.SERVICE_UNAVAILABLE,
    });
  }
};

const validateEnvironment = () => {
  const missingVars = CONFIG.REQUIRED_ENV_VARS.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};
```

## Future Security Enhancements

### 1. Authentication System

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Service
    participant S as Server

    C->>A: Request Token
    A->>A: Validate Credentials
    A-->>C: JWT Token
    C->>S: Request + Token
    S->>S: Validate Token
    S-->>C: Protected Resource
```

#### Implementation Plan

```javascript
// JWT Authentication
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    next(new APIError('Authentication failed', 401));
  }
};

// Role-based Authorization
const requireRole = (role) => (req, res, next) => {
  if (!req.user.roles.includes(role)) {
    throw new APIError('Unauthorized', 403);
  }
  next();
};
```

### 2. Enhanced Rate Limiting

```javascript
const advancedRateLimiter = {
  windowMs: 15 * 60 * 1000,
  max: (req) => {
    // Adjust limit based on user role/API key
    return req.user?.role === 'premium' ? 1000 : 100;
  },
  keyGenerator: (req) => {
    // Use combination of IP and user ID if available
    return req.user?.id ? `${req.ip}-${req.user.id}` : req.ip;
  },
  handler: (req, res) => {
    throw new APIError('Rate limit exceeded', 429);
  },
};
```

### 3. API Key Rotation

```javascript
class APIKeyManager {
  constructor() {
    this.keys = new Map();
    this.rotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days
  }

  generateNewKey() {
    const key = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + this.rotationInterval;
    this.keys.set(key, { expiry });
    return { key, expiry };
  }

  rotateKey(oldKey) {
    if (!this.isValidKey(oldKey)) {
      throw new Error('Invalid key');
    }
    return this.generateNewKey();
  }
}
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

## Implementation Timeline

### Phase 1 (Immediate)

- Enhanced rate limiting implementation
- Additional security headers
- Improved input validation
- Extended error logging

### Phase 2 (1-2 Months)

- Authentication system
- Role-based authorization
- Security monitoring dashboard
- Extended logging capabilities

### Phase 3 (2-3 Months)

- API key rotation system
- Advanced rate limiting
- Real-time security monitoring
- Automated security testing.

## Regular Security Practices

### 1. Security Audits

- Weekly dependency vulnerability scans
- Monthly code security reviews
- Quarterly penetration testing
- Annual comprehensive security audit

### 2. Monitoring

- Real-time security event tracking
- Rate limit monitoring
- Error rate tracking
- API usage patterns analysis

### 3. Incident Response

- Clear incident classification
- Defined response procedures
- Communication protocols
- Post-incident analysis

## Best Practices Checklist

### Development

- [ ] Regular dependency updates
- [ ] Security vulnerability scanning
- [ ] Code review with security focus
- [ ] Automated security testing

### Deployment

- [ ] Environment validation
- [ ] Security header verification
- [ ] Rate limit testing
- [ ] Error handling verification

### Monitoring

- [ ] Log analysis
- [ ] Security event tracking
- [ ] Performance monitoring
- [ ] Error rate analysis

## Additional Resources

- [API Documentation](/docs/API.md)
- [Architecture Overview](/docs/ARCHITECTURE.md)
- [Technical Documentation](/docs/TECHNICAL.md)
