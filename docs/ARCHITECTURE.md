# Architecture Documentation

## Deployment Architectures

### Local Development Architecture

The application uses a traditional client-server architecture for local development:

1. **Express Server** (`server.js`)

   - Handles API requests
   - Manages middleware
   - Serves static files
   - Provides development utilities

2. **Client Application**
   - Static file serving
   - Direct API communication
   - Real-time updates
   - UI rendering

### Production Architecture (Vercel)

In production, the application uses a serverless architecture:

1. **Serverless Functions**

   - API routes as individual functions
   - Automatic scaling
   - Edge network distribution
   - Optimized performance

2. **Static Site**
   - Pre-rendered HTML
   - Client-side JavaScript
   - CSS and assets
   - CDN distribution

## Frontend Architecture

### Core Modules

1. **Main Module** (`main.js`)

   - Application initialization
   - Event coordination
   - State management
   - Route handling
   - Auto-refresh logic

2. **API Client** (`api.js`)

   - Centralized API communication
   - Error handling
   - Response normalization
   - Request formatting
   - Type validation

3. **Details Module** (`details.js`)

   - Block/transaction details
   - UTXO tracking
   - Navigation handling
   - Data visualization
   - Copy functionality

4. **Transaction Module** (`transaction.js`)

   - Transaction processing
   - UTXO management
   - Fee calculation
   - Input/output handling
   - Asset tracking

5. **Wallet Module** (`wallet.js`)

   - Address management
   - Balance tracking
   - Transaction history
   - UTXO consolidation
   - Asset management

6. **Utils Module** (`utils.js`)
   - Currency formatting
   - Date handling
   - DOM utilities
   - Validation
   - Error handling
   - UI helpers

### Renderers

Modular UI components for different views:

1. **Block Renderer**

   - Block list
   - Block details
   - Transaction list
   - Navigation

2. **Transaction Renderer**

   - Transaction details
   - UTXO visualization
   - Input/output display
   - Asset information

3. **Address Renderer**

   - Address details
   - Balance display
   - Transaction history
   - UTXO list

4. **Shared Components**
   - Loading states
   - Error messages
   - Copy buttons
   - Pagination
   - Search

## Backend Architecture

### Server Layer

1. **Express Server** (Development)

   ```
   Client Request → Express → Middleware → Routes → Services → Response
   ```

2. **Serverless Functions** (Production)
   ```
   Client Request → Vercel Edge → Serverless Function → Services → Response
   ```

### Service Layer (`services/blockfrost/`)

1. **Core Services**

   - `blocks.js`: Block operations
   - `transactions.js`: Transaction handling
   - `addresses.js`: Address operations
   - `search.js`: Search functionality
   - `utils.js`: Shared utilities
   - `index.js`: Service exports

2. **Utilities**
   - `APIError.js`: Error handling
   - `responseFormatter.js`: Response formatting
   - `logger.js`: Logging system

### Middleware Layer

1. **Request Processing**

   - CORS handling
   - Rate limiting
   - Body parsing
   - Security headers

2. **Error Handling**

   - Error catching
   - Response formatting
   - Logging
   - Client feedback

3. **Validation**
   - Input validation
   - Type checking
   - API key verification
   - Request sanitization

## Data Flow

### Request Flow

```
Client Action → API Client → Server/Serverless → Blockfrost API
     ↓             ↓              ↓                    ↓
  Renderer ← Response Handling ← Error Handling ← API Response
```

### Error Flow

```
Error Source → Error Handler → Logger → Client
     ↓             ↓            ↓         ↓
Error Type → Response Format → Logs → UI Update
```

## Security Implementation

1. **API Security**

   - Rate limiting
   - CORS configuration
   - Security headers
   - Input validation
   - Error sanitization

2. **Data Protection**

   - Type validation
   - Input sanitization
   - Response formatting
   - Error handling
   - Secure headers

3. **Environment Security**
   - API key protection
   - Environment configs
   - Production safeguards
   - Error masking
   - Logging control

## Performance Optimization

1. **Client-Side**

   - Modular rendering
   - Event debouncing
   - DOM optimization
   - Resource cleanup
   - Cache management

2. **Server-Side**

   - Response optimization
   - Error handling
   - Validation efficiency
   - Resource management
   - Connection pooling

3. **Deployment**
   - Edge network
   - CDN distribution
   - Static optimization
   - Cache headers
   - Compression

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
