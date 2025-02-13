# Architecture Documentation

## System Architecture

### Frontend Architecture

The frontend implements a modular vanilla JavaScript architecture with clear separation of concerns:

1. **Main Module** (`main.js`)
   - Application entry point and initialization
   - Event handling coordination
   - Auto-refresh management (20-second intervals)
   - State management for current block selection
   - Coordination between UI and API modules

2. **API Module** (`api.js`)
   - Centralized API communication layer
   - Endpoints:
     - `/api/block/latest` - Latest block retrieval
     - `/api/block/:hash` - Block details by hash
     - `/api/block/:hash/transactions` - Block transactions
     - `/api/blocks` - Paginated block list
     - `/api/tx/:hash` - Transaction details

3. **UI Module** (`ui.js`)
   - DOM manipulation and updates
   - Component rendering:
     - Block list display
     - Block details view
     - Transaction list
     - Loading states
     - Error handling
   - Utility functions for data formatting
   - Event listener management

### Backend Architecture

1. **Server Layer** (`server.js`)
   - Express.js server configuration
   - Route definitions
   - Middleware setup:
     - CORS
     - Rate limiting
     - Security headers (Helmet)
     - Static file serving

2. **Middleware Layer**
   - Error handling (`errorHandler.js`)
   - Async operation wrapper (`asyncHandler.js`)
   - API configuration validation
   - Request logging

3. **Utils Layer**
   - Custom error class (`APIError.js`)
   - Response formatting
   - Data transformation utilities

## Security Features

1. **API Security**
   - Rate limiting: 100 requests per 15 minutes
   - Secure headers via Helmet
   - CORS configuration
   - API key validation
   - Error sanitization in production

2. **Data Validation**
   - Input validation for block hashes
   - Response data validation
   - Error boundaries
   - Type checking

3. **Error Handling**
   - Custom error class implementation
   - Production/Development error responses
   - Centralized error logging
   - Graceful degradation

## Data Flow

1. **Client Request Flow**
```
User Action → main.js → api.js → Express Server → Blockfrost API
                                      ↓
User Interface ← ui.js ← main.js ← Response
```

2. **Error Flow**
```
Error → APIError → ErrorHandler → Client
         ↓
    Error Logging
```

## Performance Considerations

1. **Frontend**
   - Efficient DOM updates
   - Debounced event handlers
   - Optimized rendering cycles
   - Resource cleanup

2. **Backend**
   - Request caching
   - Rate limiting
   - Efficient error handling
   - Response optimization

## Dependencies

### Production Dependencies
```json
{
  "cors": "^2.8.5",
  "dotenv": "^16.4.7",
  "express": "^4.21.2",
  "express-rate-limit": "^7.4.1",
  "helmet": "^8.0.0",
  "node-fetch": "^3.3.2"
}
```

### Development Dependencies
```json
{
  "nodemon": "^3.0.1"
}
```

## Future Considerations

1. **Scalability**
   - Implementation of caching layer
   - Load balancing strategy
   - Database integration for historical data
   - WebSocket implementation for real-time updates

2. **Monitoring**
   - Error tracking implementation
   - Performance monitoring
   - Usage analytics
   - Health checks

3. **Feature Expansion**
   - Advanced transaction details
   - Address tracking functionality
   - Asset information display
   - Stake pool data integration
   - Search functionality enhancement