# Architecture Documentation

## System Architecture

### Frontend Architecture

The frontend implements a modular vanilla JavaScript architecture with clear separation of concerns:

1. **Main Module** (`main.js`)

   - Application entry point and initialization
   - Event handling coordination
   - Auto-refresh management (20-second intervals)
   - State management for current block/address selection
   - Coordination between UI and API modules

2. **API Module** (`api.js`)

   - Centralized API communication layer
   - Endpoints:
     - `/api/block/latest` - Latest block retrieval
     - `/api/block/:hash` - Block details by hash
     - `/api/block/:hash/transactions` - Block transactions
     - `/api/address/:address` - Address details and transactions

3. **UI Module** (`ui.js`)

   - DOM manipulation and updates
   - Component rendering:
     - Block list display
     - Block details view
     - Transaction list
     - Address details
     - Loading states with spinners
     - Error/Warning messages
   - Event listener management
   - Smooth transitions

4. **Utils Module** (`utils.js`)

   - Currency formatting and validation:
     - Lovelace/ADA conversion
     - BigInt calculations
     - Number formatting
   - Date formatting and validation:
     - Timestamp formatting
     - Relative time calculation
     - Date range validation
   - DOM utilities:
     - Safe element retrieval
     - Event listener management
     - Element creation
   - UI utilities:
     - Error/Warning display
     - Loading states
     - Content management
     - Visibility transitions

5. **Renderers Module** (`renderers/`)
   - Modular UI components:
     - `search.js` - Search functionality
     - `details.js` - Block/Transaction details
     - `address.js` - Address information

### Backend Architecture

1. **Server Layer** (`server.js`)

   - Express.js server configuration
   - Route definitions
   - Middleware setup:
     - CORS with environment config
     - Rate limiting with headers
     - Security headers (Helmet)
     - Static file serving

2. **Services Layer** (`services/`)

   - Blockfrost service (`blockfrost.js`):
     - API communication
     - Data transformation
     - Error handling

3. **Middleware Layer**

   - Error handling (`errorHandler.js`)
   - Async operation wrapper (`asyncHandler.js`)
   - API configuration validation
   - Request logging
   - Type validation

4. **Utils Layer**
   - Custom error class (`APIError.js`)
   - Response formatting
   - Data transformation
   - Type checking

## Security Features

1. **API Security**

   - Rate limiting with headers
   - Secure headers via Helmet
   - Environment-based CORS
   - API key validation
   - Error sanitization
   - Type checking

2. **Data Validation**

   - Input validation
   - Type checking
   - BigInt for precise calculations
   - Response validation
   - Error boundaries

3. **Error Handling**
   - Unified error class
   - Environment-based responses
   - Structured error types
   - Centralized logging
   - Graceful degradation

## Data Flow

1. **Client Request Flow**

```
User Action → main.js → api.js → Express Server → Blockfrost API
                ↓          ↓           ↓              ↓
             utils.js   renderers   services     API Response
                ↓          ↓           ↓              ↓
             UI Updates ← ui.js ← Error Handling ← Response
```

2. **Error Flow**

```
Error → APIError → ErrorHandler → Client
         ↓            ↓            ↓
    Error Type    Sanitization   Display
         ↓            ↓            ↓
    Logging    Environment    UI Update
```

## Performance Considerations

1. **Frontend**

   - Efficient DOM updates
   - Debounced event handlers
   - Optimized rendering cycles
   - BigInt calculations
   - Smooth transitions
   - Resource cleanup

2. **Backend**
   - Request caching
   - Rate limiting with headers
   - Efficient error handling
   - Response optimization
   - Type validation

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

1. **TypeScript Migration**

   - Type definitions
   - Interface declarations
   - Strict type checking
   - Better IDE support

2. **Testing Implementation**

   - Unit tests
   - Integration tests
   - E2E tests
   - Performance testing

3. **Feature Expansion**

   - Asset information
   - Stake pool integration
   - WebSocket updates
   - Caching layer
   - User authentication

4. **Monitoring**
   - Error tracking
   - Performance metrics
   - Usage analytics
   - Health checks
   - Security auditing
