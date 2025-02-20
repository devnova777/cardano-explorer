# API Documentation

> For detailed security implementations, see [SECURITY.md](/docs/SECURITY.md)

## Overview

```mermaid
graph TD
    A[Client] --> B[API Gateway]
    B --> C{Endpoints}
    C --> D[Blocks]
    C --> E[Transactions]
    C --> F[Search]
    C --> G[Address]
    D --> H[Latest Block]
    D --> I[Block Details]
    D --> J[Block Transactions]
    E --> K[Transaction Details]
    F --> L[Global Search]
    G --> M[Address Details]
```

## Base URL

```
Development: http://localhost:3001/api
Production: https://your-domain.vercel.app/api
```

## Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Gateway
    participant V as Validation
    participant S as Service
    participant B as Blockfrost

    C->>A: HTTP Request
    A->>V: Validate Request
    V-->>A: Validation Result
    A->>S: Process Request
    S->>B: Fetch Data
    B-->>S: Return Data
    S-->>A: Format Response
    A-->>C: HTTP Response
```

## Authentication

For detailed authentication implementation, see [SECURITY.md](/docs/SECURITY.md#authentication-system).

## Rate Limiting

For detailed rate limiting configuration, see [SECURITY.md](/docs/SECURITY.md#rate-limiting).

Headers returned:

- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time until reset

## Endpoints

### Blocks

#### Get Latest Block

```http
GET /blocks/latest
```

Response:

```json
{
  "success": true,
  "data": {
    "hash": "string",
    "height": "number",
    "slot": "number",
    "epoch": "number",
    "epoch_slot": "number",
    "slot_leader": "string",
    "size": "number",
    "time": "number",
    "tx_count": "number",
    "output": "string",
    "fees": "string",
    "block_vrf": "string",
    "previous_block": "string",
    "next_block": "string",
    "confirmations": "number"
  }
}
```

#### Get Block Details

```http
GET /blocks/:hash
```

Parameters:

- `hash`: Block hash (64 characters)

Response: Same as latest block

#### Get Block by Height

```http
GET /blocks/height/:height
```

Parameters:

- `height`: Block height (number)

Response:

```json
{
  "success": true,
  "data": ["block_hash"]
}
```

#### Get Block Transactions

```http
GET /blocks/:hash/transactions
```

Parameters:

- `hash`: Block hash (64 characters)

Response:

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "hash": "string",
        "block": "string",
        "block_time": "number",
        "inputs": "number",
        "outputs": "number",
        "input_amount": "string",
        "output_amount": "string",
        "fees": "string"
      }
    ]
  }
}
```

### Transactions

#### Get Transaction Details

```http
GET /tx/:hash
```

Parameters:

- `hash`: Transaction hash (64 characters)

Response:

```json
{
  "success": true,
  "data": {
    "hash": "string",
    "block_hash": "string",
    "block_height": "number",
    "block_time": "number",
    "slot": "number",
    "index": "number",
    "output_amount": "string",
    "input_amount": "string",
    "fees": "string",
    "deposit": "string",
    "size": "number",
    "invalid_before": "string",
    "invalid_hereafter": "string",
    "utxos": {
      "inputs": [
        {
          "tx_hash": "string",
          "output_index": "number",
          "amount": "string",
          "address": "string"
        }
      ],
      "outputs": [
        {
          "address": "string",
          "amount": "string",
          "assets": [
            {
              "unit": "string",
              "quantity": "string"
            }
          ]
        }
      ]
    }
  }
}
```

### Search

#### Global Search

```http
GET /blocks/search?q=:query
```

Parameters:

- `q`: Search query (min 3 characters)

Response:

```json
{
  "success": true,
  "data": {
    "type": "string", // "block", "transaction", "address", "stake_address", "pool"
    "result": {
      // Varies based on type
    }
  }
}
```

### Address

#### Get Address Details

```http
GET /blocks/address/:address
```

Parameters:

- `address`: Cardano address

Response:

```json
{
  "success": true,
  "data": {
    "address": "string",
    "amount": "string",
    "stake_address": "string",
    "type": "string",
    "utxos": [
      {
        "tx_hash": "string",
        "output_index": "number",
        "amount": "string",
        "assets": []
      }
    ],
    "transactions": [
      {
        "tx_hash": "string",
        "block_height": "number",
        "block_time": "number",
        "block_hash": "string"
      }
    ]
  }
}
```

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "message": "string",
    "type": "string",
    "status": "number"
  }
}
```

### Error Types

For detailed error handling implementation, see [SECURITY.md](/docs/SECURITY.md#error-handling).

Common status codes:

- 400: Bad Request (invalid input)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Client Utilities

### API Client

```javascript
import {
  getLatestBlock,
  getBlockDetails,
  getBlockTransactions,
  getTransactionDetails,
  search,
} from './api.js';

// Get latest block
const latestBlock = await getLatestBlock();

// Get block details
const block = await getBlockDetails(hashOrHeight);

// Get block transactions
const transactions = await getBlockTransactions(blockHash);

// Get transaction details
const transaction = await getTransactionDetails(txHash);

// Search
const results = await search(query);
```

### Response Handling

```javascript
import { formatSuccess, formatError } from './utils/responseFormatter.js';

// Success response
const success = formatSuccess(data);

// Error response
const error = formatError(new Error('Not found'));

// Paginated response
const paginated = formatPagination(data, {
  currentPage: 1,
  totalPages: 10,
  hasNext: true,
  hasPrevious: false,
  totalItems: 100,
});
```

### Error Handling

```javascript
import { APIError } from './utils/APIError.js';
import { logger } from './utils/logger.js';

try {
  // API operations
} catch (error) {
  logger.error('Operation failed', { error });
  throw new APIError(error.message, error.status);
}
```

## Pagination

When applicable, endpoints support pagination with the following parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response includes pagination metadata:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "hasNext": true,
    "hasPrevious": false,
    "totalItems": 100
  }
}
```

## WebSocket Support

Future enhancement: See [SECURITY.md](/docs/SECURITY.md#future-security-enhancements) for planned WebSocket implementation details.

## API Versioning

Current version: v1
Format: `/api/v1/{endpoint}`

## Additional Resources

- [Security Documentation](/docs/SECURITY.md)
- [Architecture Documentation](/docs/ARCHITECTURE.md)
- [Technical Documentation](/docs/TECHNICAL.md)
