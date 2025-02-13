# Architecture Overview

## System Architecture

### Frontend Architecture

The frontend is built using vanilla JavaScript with a modular architecture:

1. **Main Module** (`main.js`)

   - Entry point of the application
   - Handles initialization and event binding
   - Manages auto-refresh functionality
   - Coordinates between UI and API modules

2. **API Module** (`api.js`)

   - Handles all API communications
   - Encapsulates fetch logic
   - Provides clean interface for data retrieval
   - Handles API-specific error cases

3. **UI Module** (`ui.js`)
   - Manages DOM updates
   - Handles data presentation
   - Manages loading states
   - Handles error display

### Backend Architecture

1. **Server Layer** (`server.js`)

   - Express.js server setup
   - Route definitions
   - Middleware configuration
   - Static file serving

2. **Middleware Layer** (`middleware/`)

   - Error handling (`errorHandler.js`)
   - Async operation handling (`asyncHandler.js`)
   - Request validation
   - Security middleware (rate limiting, CORS, etc.)

3. **Utils Layer** (`utils/`)
   - Custom error classes
   - Helper functions
   - Shared utilities

## Data Flow

1. Client Request Flow:

```
User Action → main.js → api.js → Backend API → Blockfrost API
                                      ↓
User Interface ← ui.js ← main.js ← Response
```

2. Error Handling Flow:

```
Error Occurrence → APIError → ErrorHandler Middleware → Client
                     ↓
               Error Logging
```

## Security Architecture

1. **API Security**

   - Rate limiting per IP
   - API key validation
   - CORS protection
   - HTTP security headers

2. **Error Handling**

   - Custom error classes
   - Centralized error handling
   - Production/Development error responses
   - Error logging

3. **Data Validation**
   - Input validation
   - Response validation
   - Type checking
   - Error boundaries

## Dependencies

### Core Dependencies

- express: Web server framework
- cors: Cross-origin resource sharing
- helmet: Security headers
- express-rate-limit: Rate limiting
- node-fetch: HTTP client
- dotenv: Environment configuration

### Development Dependencies

- nodemon: Development server
- eslint: Code linting
- prettier: Code formatting

## Future Considerations

1. **Scalability**

   - Caching layer for frequent requests
   - Load balancing
   - Database integration for historical data

2. **Monitoring**

   - Error tracking
   - Performance monitoring
   - Usage analytics

3. **Feature Expansion**
   - Transaction details
   - Address tracking
   - Asset information
   - Stake pool data
